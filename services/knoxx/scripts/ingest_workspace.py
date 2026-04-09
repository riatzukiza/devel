#!/usr/bin/env python3
"""
Comprehensive workspace ingestor for futuresight-kms.

Indexes ALL of devel: code, docs, configs into Qdrant collections
for RAG-based search and retrieval.

Collections:
- devel_docs: Documentation (README, docs/, specs/)
- devel_code: Source code (.py, .ts, .tsx, .js, .jsx, .clj, .cljs)
- devel_config: Configs (.yaml, .yml, .toml, .edn, .json)

Usage:
    python ingest_workspace.py ~/devel --all
    python ingest_workspace.py ~/devel --code-only
    python ingest_workspace.py ~/devel --docs-only
"""

import argparse
import asyncio
import hashlib
import json
import os
import re
import sys
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Optional

import httpx

# Configuration
DEFAULT_RAGUSSY_URL = os.getenv("RAGUSSY_URL", "http://localhost:8000")
DEFAULT_QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
CHUNK_SIZE = 1500  # characters
CHUNK_OVERLAP = 200
MAX_FILE_SIZE = 500_000  # 500KB max per file

# File type classifications
DOC_EXTENSIONS = {".md", ".rst", ".txt", ".adoc"}
CODE_EXTENSIONS = {".py", ".ts", ".tsx", ".js", ".jsx", ".clj", ".cljs", ".lisp", ".scm", ".rkt"}
CONFIG_EXTENSIONS = {".yaml", ".yml", ".toml", ".edn", ".json", ".ini", ".cfg"}
IMPORTANT_JSON_PATTERNS = {"package.json", "tsconfig.json", "pyproject.toml", "Cargo.toml", "deps.edn", "shadow-cljs.edn"}

# Skip patterns
SKIP_DIRS = {
    "node_modules", ".git", "dist", ".next", "__pycache__", ".venv", "venv",
    "target", ".pio", "coverage", ".pytest_cache", ".mypy_cache", "build",
    ".gradle", ".idea", ".vscode", ".vs", "vendor", "fixtures", "__fixtures__",
    "test-fixtures", "test_fixtures", "example-results", "examples", "samples"
}

SKIP_FILES = {
    "package-lock.json", "pnpm-lock.yaml", "yarn.lock", "Cargo.lock",
    "poetry.lock", "composer.lock", "Gemfile.lock", "flake.lock",
    ".DS_Store", ".env", ".env.local", ".env.example"
}

SKIP_PATTERNS = [
    r"\.min\.js$", r"\.min\.css$", r"\.d\.ts$",
    r"\.test\.", r"\.spec\.", r"_test\.", r"_spec\.",
    r"__tests__", r"__mocks__",
]


@dataclass
class IngestStats:
    """Track ingestion statistics."""
    files_scanned: int = 0
    files_skipped: int = 0
    files_ingested: int = 0
    chunks_created: int = 0
    errors: list[str] = field(default_factory=list)
    by_extension: dict[str, int] = field(default_factory=dict)
    by_collection: dict[str, int] = field(default_factory=dict)


def should_skip(path: Path) -> bool:
    """Check if a path should be skipped."""
    # Check directory components
    for part in path.parts:
        if part in SKIP_DIRS:
            return True
        if part.startswith("."):
            return True
    
    # Check filename
    if path.name in SKIP_FILES:
        return True
    
    # Check patterns
    path_str = str(path)
    for pattern in SKIP_PATTERNS:
        if re.search(pattern, path_str):
            return True
    
    return False


def is_important_json(path: Path) -> bool:
    """Check if JSON file is important enough to index."""
    if path.name in IMPORTANT_JSON_PATTERNS:
        return True
    # Check for small config-like JSON files
    try:
        if path.stat().st_size < 50_000:  # 50KB
            return True
    except:
        pass
    return False


def get_collection(path: Path) -> Optional[str]:
    """Determine which collection a file belongs to."""
    ext = path.suffix.lower()
    
    if ext in DOC_EXTENSIONS:
        return "devel_docs"
    elif ext in CODE_EXTENSIONS:
        return "devel_code"
    elif ext in CONFIG_EXTENSIONS:
        if ext == ".json" and not is_important_json(path):
            return None  # Skip most JSON files
        return "devel_config"
    
    return None


def chunk_text(text: str, source: str, metadata: dict) -> list[dict]:
    """Split text into overlapping chunks with metadata."""
    if len(text) < 100:  # Skip very short files
        return []
    
    chunks = []
    start = 0
    chunk_num = 0
    
    while start < len(text):
        end = start + CHUNK_SIZE
        
        # Try to break at sentence or line boundary
        if end < len(text):
            # Look for good break points
            for break_char in ["\n\n", "\n", ". ", " ", ""]:
                last_break = text.rfind(break_char, start, end + 100)
                if last_break > start + CHUNK_SIZE // 2:
                    end = last_break + len(break_char)
                    break
        
        chunk_text = text[start:end].strip()
        if chunk_text:
            chunk_id = hashlib.md5(f"{source}:{chunk_num}".encode()).hexdigest()[:12]
            chunks.append({
                "id": chunk_id,
                "text": chunk_text,
                "source": source,
                "metadata": {
                    **metadata,
                    "chunk_num": chunk_num,
                    "char_start": start,
                    "char_end": end,
                }
            })
            chunk_num += 1
        
        start = end - CHUNK_OVERLAP if end < len(text) else len(text)
    
    return chunks


def extract_file_metadata(path: Path) -> dict:
    """Extract metadata from file path."""
    parts = path.parts
    
    # Detect project/package
    project = "unknown"
    for i, part in enumerate(parts):
        if part in ["packages", "services", "orgs", "specs", "docs"] and i + 1 < len(parts):
            project = parts[i + 1]
            break
    
    # Detect language
    ext = path.suffix.lower()
    lang_map = {
        ".py": "python", ".ts": "typescript", ".tsx": "typescript",
        ".js": "javascript", ".jsx": "javascript",
        ".clj": "clojure", ".cljs": "clojure", ".edn": "clojure",
        ".md": "markdown", ".yaml": "yaml", ".yml": "yaml",
        ".toml": "toml", ".json": "json", ".lisp": "lisp"
    }
    language = lang_map.get(ext, "unknown")
    
    # Detect category
    category = "misc"
    path_str = str(path).lower()
    if "test" in path_str or "spec" in path_str:
        category = "test"
    elif "doc" in path_str or "readme" in path_str:
        category = "docs"
    elif "config" in path_str or "settings" in path_str:
        category = "config"
    elif "src" in path_str or "lib" in path_str:
        category = "source"
    
    return {
        "project": project,
        "language": language,
        "category": category,
        "extension": ext,
        "filename": path.name,
    }


async def ingest_file(
    path: Path,
    client: httpx.AsyncClient,
    stats: IngestStats,
    dry_run: bool = False,
) -> None:
    """Ingest a single file."""
    stats.files_scanned += 1
    
    if should_skip(path):
        stats.files_skipped += 1
        return
    
    # Check file size
    try:
        file_size = path.stat().st_size
        if file_size > MAX_FILE_SIZE:
            stats.files_skipped += 1
            return
    except:
        stats.errors.append(f"Cannot stat: {path}")
        return
    
    # Determine collection
    collection = get_collection(path)
    if not collection:
        stats.files_skipped += 1
        return
    
    # Read file content
    try:
        content = path.read_text(encoding="utf-8", errors="replace")
    except Exception as e:
        stats.errors.append(f"Cannot read {path}: {e}")
        return
    
    # Extract metadata
    metadata = extract_file_metadata(path)
    source = str(path.relative_to(Path.home()))
    
    # Chunk the content
    chunks = chunk_text(content, source, metadata)
    if not chunks:
        stats.files_skipped += 1
        return
    
    # Track stats
    ext = path.suffix.lower()
    stats.by_extension[ext] = stats.by_extension.get(ext, 0) + 1
    stats.by_collection[collection] = stats.by_collection.get(collection, 0) + len(chunks)
    
    if dry_run:
        stats.files_ingested += 1
        stats.chunks_created += len(chunks)
        return
    
    # Ingest via Ragussy API
    try:
        response = await client.post(
            f"{DEFAULT_RAGUSSY_URL}/api/rag/ingest/chunks",
            json={
                "chunks": chunks,
                "collection": collection,
            },
            timeout=60.0,
        )
        
        if response.status_code == 200:
            stats.files_ingested += 1
            stats.chunks_created += len(chunks)
        else:
            stats.errors.append(f"API error for {path}: {response.status_code}")
    except Exception as e:
        stats.errors.append(f"Failed to ingest {path}: {e}")


async def scan_and_ingest(
    root: Path,
    stats: IngestStats,
    dry_run: bool = False,
    filter_type: Optional[str] = None,
) -> None:
    """Scan directory tree and ingest files."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        tasks = []
        
        for path in root.rglob("*"):
            if not path.is_file():
                continue
            
            # Apply type filter
            if filter_type:
                collection = get_collection(path)
                if filter_type == "docs" and collection != "devel_docs":
                    continue
                elif filter_type == "code" and collection != "devel_code":
                    continue
                elif filter_type == "config" and collection != "devel_config":
                    continue
            
            # Batch tasks
            tasks.append(ingest_file(path, client, stats, dry_run))
            
            # Process in batches to avoid overwhelming the API
            if len(tasks) >= 100:
                await asyncio.gather(*tasks)
                tasks = []
        
        # Process remaining
        if tasks:
            await asyncio.gather(*tasks)


def print_stats(stats: IngestStats) -> None:
    """Print ingestion statistics."""
    print("\n" + "=" * 60)
    print("INGESTION SUMMARY")
    print("=" * 60)
    print(f"Files scanned:   {stats.files_scanned:,}")
    print(f"Files skipped:   {stats.files_skipped:,}")
    print(f"Files ingested:  {stats.files_ingested:,}")
    print(f"Chunks created:  {stats.chunks_created:,}")
    
    print("\nBy extension:")
    for ext, count in sorted(stats.by_extension.items(), key=lambda x: -x[1])[:15]:
        print(f"  {ext or 'no ext'}: {count:,}")
    
    print("\nBy collection:")
    for collection, count in stats.by_collection.items():
        print(f"  {collection}: {count:,} chunks")
    
    if stats.errors:
        print(f"\nErrors ({len(stats.errors)}):")
        for error in stats.errors[:10]:
            print(f"  - {error}")
        if len(stats.errors) > 10:
            print(f"  ... and {len(stats.errors) - 10} more")


async def main():
    parser = argparse.ArgumentParser(description="Ingest workspace into Qdrant")
    parser.add_argument("root", type=Path, help="Root directory to scan")
    parser.add_argument("--dry-run", action="store_true", help="Scan without ingesting")
    parser.add_argument("--all", action="store_true", help="Ingest all file types")
    parser.add_argument("--docs-only", action="store_true", help="Only documentation")
    parser.add_argument("--code-only", action="store_true", help="Only source code")
    parser.add_argument("--config-only", action="store_true", help="Only config files")
    parser.add_argument("--ragussy-url", default=DEFAULT_RAGUSSY_URL, help="Ragussy API URL")
    
    args = parser.parse_args()
    
    if not args.root.is_dir():
        print(f"Error: {args.root} is not a directory")
        sys.exit(1)
    
    # Determine filter
    filter_type = None
    if args.docs_only:
        filter_type = "docs"
    elif args.code_only:
        filter_type = "code"
    elif args.config_only:
        filter_type = "config"
    
    print(f"Scanning {args.root}...")
    print(f"Mode: {'dry run' if args.dry_run else 'ingest'}")
    print(f"Filter: {filter_type or 'all'}")
    
    stats = IngestStats()
    
    start_time = datetime.now()
    await scan_and_ingest(args.root, stats, args.dry_run, filter_type)
    elapsed = datetime.now() - start_time
    
    print_stats(stats)
    print(f"\nElapsed: {elapsed}")


if __name__ == "__main__":
    asyncio.run(main())
