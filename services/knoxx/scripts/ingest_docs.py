#!/usr/bin/env python3
"""Ingest documents from a directory into Qdrant via the RAG API."""

import argparse
import os
import sys
from pathlib import Path

import httpx


def discover_files(root: Path, extensions: list[str]) -> list[Path]:
    """Find all files with given extensions under root."""
    files = []
    for ext in extensions:
        for f in root.rglob(f"*{ext}"):
            # Skip Emacs lock files and hidden files
            name = f.name
            if name.startswith(".#") or name.startswith("."):
                continue
            # Skip files in .git directories
            if ".git" in f.parts:
                continue
            files.append(f)
    return sorted(set(files))


def ingest_file(api_base: str, file_path: Path, collection: str, chunk_size: int, chunk_overlap: int) -> dict:
    """Ingest a single file via the RAG API."""
    if not file_path.exists():
        return {"status": "skipped", "reason": "file_not_found"}
    
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
    except Exception as e:
        return {"status": "error", "reason": str(e)}
    
    # Skip empty or tiny files
    if len(content.strip()) < 100:
        return {"status": "skipped", "reason": "too_small"}
    
    resp = httpx.post(
        f"{api_base}/api/rag/ingest/text",
        json={
            "text": content,
            "source": str(file_path),
            "collection": collection,
            "chunk_size": chunk_size,
            "chunk_overlap": chunk_overlap,
        },
        timeout=120.0,
    )
    
    if resp.status_code != 200:
        return {"status": "error", "code": resp.status_code, "detail": resp.text[:200]}
    
    return resp.json()


def main():
    parser = argparse.ArgumentParser(description="Ingest documents into RAG")
    parser.add_argument("directory", type=Path, help="Directory to scan for documents")
    parser.add_argument("--api", default="http://localhost", help="API base URL")
    parser.add_argument("--collection", default="devel_docs", help="Qdrant collection name")
    parser.add_argument("--chunk-size", type=int, default=512, help="Chunk size")
    parser.add_argument("--chunk-overlap", type=int, default=64, help="Chunk overlap")
    parser.add_argument("--ext", nargs="+", default=[".md", ".txt"], help="File extensions to ingest")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be ingested")
    args = parser.parse_args()
    
    if not args.directory.is_dir():
        print(f"Error: {args.directory} is not a directory", file=sys.stderr)
        sys.exit(1)
    
    files = discover_files(args.directory, args.ext)
    print(f"Found {len(files)} files with extensions {args.ext}")
    
    if args.dry_run:
        for f in files[:20]:
            print(f"  {f}")
        if len(files) > 20:
            print(f"  ... and {len(files) - 20} more")
        return
    
    # Ingest files
    success = 0
    skipped = 0
    errors = 0
    
    for i, file_path in enumerate(files):
        print(f"[{i+1}/{len(files)}] Ingesting {file_path.name}...", end=" ", flush=True)
        result = ingest_file(args.api, file_path, args.collection, args.chunk_size, args.chunk_overlap)
        
        if result.get("status") == "success":
            print(f"✓ {result.get('chunks', 0)} chunks")
            success += 1
        elif result.get("status") == "skipped":
            print(f"⊘ {result.get('reason', 'skipped')}")
            skipped += 1
        else:
            print(f"✗ {result.get('detail', 'error')}")
            errors += 1
    
    print(f"\nDone: {success} ingested, {skipped} skipped, {errors} errors")


if __name__ == "__main__":
    main()
