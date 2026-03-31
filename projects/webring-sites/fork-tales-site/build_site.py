#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import re
import shutil
import unicodedata
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

import markdown

PROJECT_ROOT = Path(__file__).resolve().parent
SRC_ROOT = PROJECT_ROOT / "src"
DIST_ROOT = PROJECT_ROOT / "dist"
CONTENT_ROOT = DIST_ROOT / "content"
MEDIA_ROOT = DIST_ROOT / "media"

FORK_ROOT = Path("/home/err/devel/orgs/octave-commons/fork_tales")
MUSIC_ROOT = Path("/home/err/Music")

RELEVANT_MUSIC_DIRS = [
    MUSIC_ROOT / "fork_tax",
    MUSIC_ROOT / "operators",
    MUSIC_ROOT / "protestant_presence",
    MUSIC_ROOT / "mycelial_presence",
    MUSIC_ROOT / "heresy_between",
]
PLAYLIST_DIR = MUSIC_ROOT / "playlists"

CURATED_DOC_PATTERNS = (
    "ARTIFACT_*.md",
    "DIALOG_*.md",
    "GATES_OF_TRUTH*.md",
    "gates_of_truth*.md",
    "NEW_LYRICS_*.md",
    "world_map*.md",
)

SUSPICIOUS_AUDIO_TOKENS = (
    "sandbox",
    "mnt_data",
    "prompt",
    "zip",
    "package-lock",
    "opencode agent",
    "deep research",
)

TECHNICAL_DOC_MARKERS = {
    "README",
    "SIMULATION_WORKFLOW",
    "MODEL_BENCH_RUNNER",
    "WHISPER_BENCHMARK",
    "WEB_GRAPH_WEAVER",
    "SCATTERED_TASKS_INVENTORY",
    "AGENTS",
    "LICENSE",
    "MANIFEST",
    "CONTRIBUTING",
    "SMART_GATEWAY",
    "DOCUMENTATION",
    "DEPLOYMENT GUIDE",
}

FEATURED_IMAGE_KEYWORDS = [
    "cover",
    "storyboard",
    "witness",
    "fork_tax",
    "fork tax",
    "mage",
    "anchor",
    "particle",
    "absence",
    "fnord",
    "thread",
    "glitch",
]

ROSTER = [
    {"name": "Ritsu / 莉津律宗利都", "role": "motion / witness drift"},
    {"name": "Patch", "role": "mapping overlays / structure gossip"},
    {"name": "Null", "role": "variance hunter / silhouette logic"},
    {"name": "Duct", "role": "audit cadence / left-flank gravity"},
    {"name": "Sei", "role": "rail control / standards whisper"},
    {"name": "Truth", "role": "the thing that resolves"},
    {"name": "Axiom", "role": "what remains after the atmosphere burns off"},
    {"name": "Cephalon", "role": "the witness that keeps its own counsel"},
]

PROMPTS = [
    "What does the gate want from us?",
    "Which song should I play if I want the night to answer back?",
    "Tell me who Ritsu, Patch, Null, Duct, and Sei are.",
    "Show me the fracture line between receipt and myth.",
]

CHUNK_SIZE = 900
CHUNK_OVERLAP = 140
AUDIO_EXT_PRIORITY = {".mp3": 3, ".wav": 2, ".mp4": 1}
IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".webp", ".gif"}
TEXT_EXTS = {".md", ".txt"}
AUDIO_EXTS = {".mp3", ".wav", ".mp4"}

MARKDOWN_EXTENSIONS = ["extra", "sane_lists", "nl2br", "fenced_code"]


@dataclass
class CopiedAsset:
    source: Path
    relative_url: str
    dest: Path


class AssetCopier:
    def __init__(self, media_root: Path) -> None:
        self.media_root = media_root
        self._by_source: dict[Path, CopiedAsset] = {}
        self._used_paths: set[Path] = set()

    def copy(self, source: Path, bucket: str, preferred_slug: str | None = None) -> str:
        source = source.resolve()
        if source in self._by_source:
            return self._by_source[source].relative_url

        ext = source.suffix.lower()
        base_slug = preferred_slug or slugify(source.stem)
        subdir = self.media_root / bucket
        subdir.mkdir(parents=True, exist_ok=True)
        dest = subdir / f"{base_slug}{ext}"
        counter = 2
        while dest in self._used_paths or dest.exists():
            if dest.exists() and file_sha256(dest) == file_sha256(source):
                break
            dest = subdir / f"{base_slug}-{counter}{ext}"
            counter += 1
        if not dest.exists():
            shutil.copy2(source, dest)
        self._used_paths.add(dest)
        relative_url = dest.relative_to(DIST_ROOT).as_posix()
        copied = CopiedAsset(source=source, relative_url=relative_url, dest=dest)
        self._by_source[source] = copied
        return relative_url


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_fallback = normalized.encode("ascii", "ignore").decode("ascii")
    candidate = ascii_fallback or normalized
    candidate = candidate.lower()
    candidate = re.sub(r"[‘’“”'\"]+", "", candidate)
    candidate = re.sub(r"[^\w\s.-]+", "-", candidate, flags=re.UNICODE)
    candidate = re.sub(r"[\s_.]+", "-", candidate)
    candidate = re.sub(r"-+", "-", candidate).strip("-")
    if candidate:
        return candidate[:96]
    return hashlib.sha1(value.encode("utf-8")).hexdigest()[:12]


def normalize_variant_stem(stem: str) -> str:
    value = unicodedata.normalize("NFKC", stem).strip()
    value = re.sub(r"\(\d+\)$", "", value).strip()
    value = value.replace("…", "...")
    return value


def collapse_whitespace(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def first_heading(text: str) -> str | None:
    for line in text.splitlines():
        match = re.match(r"^#{1,3}\s+(.+?)\s*$", line.strip())
        if match:
            return collapse_whitespace(match.group(1))
    return None


def markdown_to_html(text: str) -> str:
    return markdown.markdown(text, extensions=MARKDOWN_EXTENSIONS)


def excerpt(text: str, limit: int = 220) -> str:
    normalized = collapse_whitespace(text)
    if len(normalized) <= limit:
        return normalized
    return normalized[: limit - 1].rstrip() + "…"


def relative_label(path: Path) -> str:
    for root in (FORK_ROOT, MUSIC_ROOT):
        try:
            return path.relative_to(root).as_posix()
        except ValueError:
            continue
    return path.as_posix()


def should_include_doc(path: Path) -> bool:
    upper_name = path.name.upper()
    if any(marker in upper_name for marker in TECHNICAL_DOC_MARKERS):
        return False
    if "/docker-llm-proxy/" in path.as_posix():
        return False
    if "/mcp-lith-nexus/" in path.as_posix():
        return False
    if "/.mypy_cache/" in path.as_posix() or "/node_modules/" in path.as_posix():
        return False
    return True


def doc_kind(path: Path, title: str) -> str:
    lower = f"{path.as_posix()} {title}".lower()
    if "chapter" in lower and "gates of truth" in lower:
        return "chapter"
    if "lyrics" in lower or path.name.startswith("NEW_LYRICS"):
        return "lyric"
    if "announcement" in lower:
        return "announcement"
    if "dialog" in lower:
        return "dialog"
    if "artifact" in lower:
        return "artifact"
    if "world map" in lower:
        return "world-map"
    if "session" in lower or "holographic" in lower:
        return "session"
    if "/notes/" in lower:
        return "note"
    return "document"


def build_doc_entry(
    *,
    identifier: str,
    title: str,
    kind: str,
    text: str,
    source_path: Path,
    visible: bool = True,
    chapter_number: int | None = None,
    source_group: str | None = None,
) -> dict[str, object]:
    html = markdown_to_html(text)
    return {
        "id": identifier,
        "slug": slugify(title),
        "title": title,
        "kind": kind,
        "visible": visible,
        "chapterNumber": chapter_number,
        "sourceGroup": source_group,
        "sourcePath": relative_label(source_path),
        "sourceFileName": source_path.name,
        "html": html,
        "text": text,
        "excerpt": excerpt(text),
    }


def parse_manuscript() -> list[dict[str, object]]:
    manuscript_path = FORK_ROOT / "MANUSCRIPT_FULL.md"
    text = manuscript_path.read_text(encoding="utf-8")
    matches = list(re.finditer(r"^##\s+Chapter\s+(\d+)\s+—\s+(.+?)\s*$", text, flags=re.MULTILINE))
    docs: list[dict[str, object]] = []
    for index, match in enumerate(matches):
        chapter_number = int(match.group(1))
        chapter_title = collapse_whitespace(match.group(2))
        start = match.start()
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        chunk = text[start:end].strip()
        title = f"Chapter {chapter_number:02d} — {chapter_title}"
        docs.append(
            build_doc_entry(
                identifier=f"chapter-{chapter_number:02d}-{slugify(chapter_title)}",
                title=title,
                kind="chapter",
                text=chunk,
                source_path=manuscript_path,
                visible=True,
                chapter_number=chapter_number,
                source_group="manuscript",
            )
        )
    return docs


def collect_docs() -> list[dict[str, object]]:
    docs = parse_manuscript()

    root_files = [
        FORK_ROOT / "LIVE_CHOIR.md",
    ]

    doc_files: list[Path] = []
    for pattern in CURATED_DOC_PATTERNS:
        doc_files.extend(sorted((FORK_ROOT / "docs").glob(pattern)))
    seen_paths: set[Path] = {FORK_ROOT / "MANUSCRIPT_FULL.md"}

    for path in root_files + doc_files:
        if path in seen_paths or not path.exists() or not should_include_doc(path):
            continue
        seen_paths.add(path)
        try:
            raw = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            raw = path.read_text(encoding="utf-8", errors="ignore")
        title = first_heading(raw) or path.stem.replace("_", " ")
        kind = doc_kind(path, title)
        visible = path.suffix.lower() == ".md"
        docs.append(
            build_doc_entry(
                identifier=f"doc-{slugify(path.stem)}-{hashlib.sha1(path.as_posix().encode()).hexdigest()[:6]}",
                title=title,
                kind=kind,
                text=raw,
                source_path=path,
                visible=visible,
                source_group="fork-tales",
            )
        )

    docs.sort(key=lambda item: (
        0 if item["kind"] == "chapter" else 1,
        item.get("chapterNumber") or 999,
        str(item["title"]),
    ))
    return docs


def group_files_by_variant(root: Path) -> dict[str, list[Path]]:
    groups: dict[str, list[Path]] = defaultdict(list)
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        groups[normalize_variant_stem(path.stem)].append(path)
    return groups


def choose_primary_audio(paths: Iterable[Path]) -> Path | None:
    candidates = [path for path in paths if path.suffix.lower() in AUDIO_EXTS]
    if not candidates:
        return None
    return max(candidates, key=lambda path: (AUDIO_EXT_PRIORITY.get(path.suffix.lower(), 0), path.stat().st_size, path.name))


def parse_title_and_tags(sidecar_text: str, fallback_title: str) -> tuple[str, list[str]]:
    title_match = re.search(r"^Title:\s*(.+)$", sidecar_text, flags=re.MULTILINE)
    tags_match = re.search(r"^Tags:\s*(.+)$", sidecar_text, flags=re.MULTILINE)
    title = collapse_whitespace(title_match.group(1)) if title_match else fallback_title
    tags = []
    if tags_match:
        tags = [part.strip() for part in tags_match.group(1).split(",") if part.strip()]
    return title, tags


def include_music_entry(root: Path, variant_key: str, parsed_title: str, sidecar_text: str) -> bool:
    lower_title = f"{variant_key} {parsed_title}".lower()
    if any(token in lower_title for token in SUSPICIOUS_AUDIO_TOKENS):
        return False
    if root.name == "operators":
        if sidecar_text.strip():
            return True
        keep_markers = ("eta_mu", "ημ", "operation mindfuck", "witness", "choir", "mycelial", "world sounds", "lullaby", "lantern", "deep cut", "epic")
        return any(marker in lower_title for marker in keep_markers)
    return True


def select_featured_images(copier: AssetCopier) -> list[dict[str, object]]:
    image_candidates: list[Path] = []
    frag_root = FORK_ROOT / ".fork_Π_ημ_frags"
    if frag_root.exists():
        for path in frag_root.rglob("*"):
            if path.is_file() and path.suffix.lower() in IMAGE_EXTS:
                lower = path.name.lower()
                if any(keyword in lower for keyword in FEATURED_IMAGE_KEYWORDS):
                    image_candidates.append(path)
    for path in sorted((FORK_ROOT / "artifacts").glob("*.png")):
        image_candidates.append(path)

    featured: list[dict[str, object]] = []
    seen: set[str] = set()
    for path in sorted(image_candidates, key=lambda candidate: candidate.name.lower())[:24]:
        key = path.name.lower()
        if key in seen:
            continue
        seen.add(key)
        title = path.stem.replace("_", " ")
        featured.append(
            {
                "id": f"gallery-{slugify(path.stem)}-{hashlib.sha1(path.as_posix().encode()).hexdigest()[:6]}",
                "title": title,
                "imageUrl": copier.copy(path, "images", preferred_slug=f"gallery-{slugify(path.stem)}"),
                "sourcePath": relative_label(path),
                "kind": "gallery",
            }
        )
    return featured


def build_music_entries(docs: list[dict[str, object]], copier: AssetCopier) -> list[dict[str, object]]:
    by_chapter = {doc.get("chapterNumber"): doc for doc in docs if doc.get("chapterNumber")}
    entries: list[dict[str, object]] = []

    # Narrative chapters from the repo.
    for audio_path in sorted((FORK_ROOT / "narrative_audio").glob("*.mp3")):
        match = re.match(r"Chapter_(\d+)_(.+)", audio_path.stem)
        if match:
            chapter_number = int(match.group(1))
            chapter_title = match.group(2).replace("_", " ")
            title = f"Chapter {chapter_number:02d} — {chapter_title}"
            related_doc = by_chapter.get(chapter_number)
            description = related_doc["excerpt"] if related_doc else "Narrative audio fragment from the manuscript stream."
        else:
            chapter_number = None
            title = audio_path.stem.replace("_", " ")
            related_doc = None
            description = "Narrative audio fragment from the manuscript stream."
        entry_id = f"audio-{slugify(title)}-{hashlib.sha1(audio_path.as_posix().encode()).hexdigest()[:6]}"
        entries.append(
            {
                "id": entry_id,
                "title": title,
                "collection": "narrative-audio",
                "collectionTitle": "Narrative Audio",
                "kind": "narrative-audio",
                "mediaUrl": copier.copy(audio_path, "audio/narrative", preferred_slug=slugify(title)),
                "artUrl": None,
                "lyricsText": related_doc["text"] if related_doc else "",
                "lyricsHtml": related_doc["html"] if related_doc else "",
                "excerpt": description,
                "tags": ["narrative", "chapter"],
                "sourcePath": relative_label(audio_path),
                "relatedDocIds": [related_doc["id"]] if related_doc else [],
            }
        )

    # Part64 renders.
    part64_root = FORK_ROOT / "part64"
    for audio_path in sorted(part64_root.glob("*.wav")):
        title = audio_path.stem.replace("_", " ")
        entry_id = f"audio-{slugify(title)}-{hashlib.sha1(audio_path.as_posix().encode()).hexdigest()[:6]}"
        entries.append(
            {
                "id": entry_id,
                "title": title,
                "collection": "part64-renders",
                "collectionTitle": "Part 64 Renders",
                "kind": "render-audio",
                "mediaUrl": copier.copy(audio_path, "audio/part64", preferred_slug=slugify(title)),
                "artUrl": None,
                "lyricsText": "",
                "lyricsHtml": "",
                "excerpt": "Seeded render from ημ — Operation Mindfuck — Part 64.",
                "tags": ["render", "part64"],
                "sourcePath": relative_label(audio_path),
                "relatedDocIds": [],
            }
        )

    # Curated music roots.
    for root in RELEVANT_MUSIC_DIRS:
        if not root.exists():
            continue
        groups = group_files_by_variant(root)
        collection_title = root.name.replace("_", " ").title()
        for variant_key, paths in sorted(groups.items(), key=lambda item: item[0].lower()):
            primary = choose_primary_audio(paths)
            if primary is None:
                continue
            fallback_title = primary.stem.replace("_", " ")
            sidecar_text_path = next((path for path in paths if path.suffix.lower() == ".txt"), None)
            sidecar_text = sidecar_text_path.read_text(encoding="utf-8", errors="ignore") if sidecar_text_path else ""
            parsed_title, tags = parse_title_and_tags(sidecar_text, fallback_title)
            if not include_music_entry(root, variant_key, parsed_title, sidecar_text):
                continue
            art_path = next((path for path in paths if path.suffix.lower() in IMAGE_EXTS), None)
            entry_id = f"audio-{slugify(parsed_title)}-{hashlib.sha1(primary.as_posix().encode()).hexdigest()[:6]}"
            entries.append(
                {
                    "id": entry_id,
                    "title": parsed_title,
                    "collection": slugify(root.name),
                    "collectionTitle": collection_title,
                    "kind": "music",
                    "mediaUrl": copier.copy(primary, f"audio/{slugify(root.name)}", preferred_slug=slugify(parsed_title)),
                    "artUrl": copier.copy(art_path, f"images/{slugify(root.name)}", preferred_slug=slugify(parsed_title)) if art_path else None,
                    "lyricsText": sidecar_text,
                    "lyricsHtml": markdown_to_html(sidecar_text) if sidecar_text else "",
                    "excerpt": excerpt(sidecar_text or f"{parsed_title} from {collection_title}"),
                    "tags": tags,
                    "sourcePath": relative_label(primary),
                    "relatedDocIds": [],
                }
            )
    return entries


def build_playlists(audio_entries: list[dict[str, object]]) -> list[dict[str, object]]:
    audio_by_source = {entry["sourcePath"]: entry for entry in audio_entries}
    normalized_lookup: dict[str, list[str]] = defaultdict(list)
    for entry in audio_entries:
        normalized_lookup[normalize_variant_stem(Path(str(entry["sourcePath"])).stem)].append(str(entry["id"]))

    playlists: list[dict[str, object]] = []
    if not PLAYLIST_DIR.exists():
        return playlists
    for path in sorted(PLAYLIST_DIR.glob("*.m3u")):
        item_ids: list[str] = []
        seen_ids: set[str] = set()
        for raw_line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#"):
                continue
            source_path = Path(line)
            relative = relative_label(source_path)
            entry = audio_by_source.get(relative)
            if entry:
                candidate_ids = [str(entry["id"])]
            else:
                candidate_ids = normalized_lookup.get(normalize_variant_stem(source_path.stem), [])
            for candidate_id in candidate_ids:
                if candidate_id not in seen_ids:
                    seen_ids.add(candidate_id)
                    item_ids.append(candidate_id)
        if item_ids:
            playlists.append(
                {
                    "id": f"playlist-{slugify(path.stem)}",
                    "title": path.stem.replace("_", " "),
                    "itemIds": item_ids,
                }
            )
    return playlists


def link_related_docs(audio_entries: list[dict[str, object]], docs: list[dict[str, object]]) -> None:
    title_tokens: dict[str, set[str]] = {}
    for doc in docs:
        title_tokens[str(doc["id"])] = token_set(str(doc["title"]))

    for entry in audio_entries:
        if entry["relatedDocIds"]:
            continue
        track_tokens = token_set(str(entry["title"]))
        if not track_tokens:
            continue
        candidates: list[tuple[int, str]] = []
        for doc in docs:
            overlap = len(track_tokens & title_tokens[str(doc["id"])] )
            if overlap >= 2:
                candidates.append((overlap, str(doc["id"])))
        candidates.sort(reverse=True)
        entry["relatedDocIds"] = [doc_id for _, doc_id in candidates[:3]]


def token_set(text: str) -> set[str]:
    return {token for token in re.findall(r"[\w\-一-龯ぁ-ゟァ-ヿ]+", text.lower()) if len(token) > 2}


def build_corpus(docs: list[dict[str, object]], audio_entries: list[dict[str, object]]) -> list[dict[str, object]]:
    corpus: list[dict[str, object]] = []
    for doc in docs:
        source_text = str(doc["text"])
        for index, chunk in enumerate(chunk_text(source_text)):
            corpus.append(
                {
                    "id": f"chunk-{doc['id']}-{index}",
                    "refId": doc["id"],
                    "refType": "doc",
                    "title": doc["title"],
                    "kind": doc["kind"],
                    "sourcePath": doc["sourcePath"],
                    "text": chunk,
                }
            )
    for entry in audio_entries:
        base = [str(entry["title"]), str(entry["excerpt"])]
        if entry.get("lyricsText"):
            base.append(str(entry["lyricsText"]))
        combined = "\n\n".join(part for part in base if part)
        for index, chunk in enumerate(chunk_text(combined)):
            corpus.append(
                {
                    "id": f"chunk-{entry['id']}-{index}",
                    "refId": entry["id"],
                    "refType": "audio",
                    "title": entry["title"],
                    "kind": entry["kind"],
                    "sourcePath": entry["sourcePath"],
                    "text": chunk,
                }
            )
    return corpus


def chunk_text(text: str) -> list[str]:
    cleaned = collapse_whitespace(text)
    if not cleaned:
        return []
    chunks: list[str] = []
    start = 0
    while start < len(cleaned):
        end = min(len(cleaned), start + CHUNK_SIZE)
        chunks.append(cleaned[start:end])
        if end == len(cleaned):
            break
        start = max(0, end - CHUNK_OVERLAP)
    return chunks


def featured_selection(docs: list[dict[str, object]], audio_entries: list[dict[str, object]], gallery: list[dict[str, object]]) -> dict[str, object]:
    def first_doc(kind: str) -> str | None:
        for doc in docs:
            if doc["kind"] == kind and doc["visible"]:
                return str(doc["id"])
        return None

    def first_audio(collection: str) -> str | None:
        for item in audio_entries:
            if item["collection"] == collection:
                return str(item["id"])
        return str(audio_entries[0]["id"]) if audio_entries else None

    return {
        "openingDocId": first_doc("announcement") or first_doc("chapter") or (str(docs[0]["id"]) if docs else None),
        "openingAudioId": first_audio("narrative-audio"),
        "featuredDocIds": [doc_id for doc_id in [first_doc("announcement"), first_doc("chapter"), first_doc("lyric"), first_doc("world-map")] if doc_id],
        "featuredAudioIds": [
            audio_id
            for audio_id in [
                first_audio("narrative-audio"),
                first_audio("fork-tax"),
                first_audio("operators"),
                first_audio("mycelial-presence"),
            ]
            if audio_id
        ],
        "featuredGalleryIds": [image["id"] for image in gallery[:8]],
    }


def clean_dist() -> None:
    if DIST_ROOT.exists():
        shutil.rmtree(DIST_ROOT)
    DIST_ROOT.mkdir(parents=True, exist_ok=True)
    CONTENT_ROOT.mkdir(parents=True, exist_ok=True)
    MEDIA_ROOT.mkdir(parents=True, exist_ok=True)


def copy_shell_files() -> None:
    for name in ("index.html", "styles.css", "app.js"):
        shutil.copy2(SRC_ROOT / name, DIST_ROOT / name)


def build() -> None:
    clean_dist()
    copy_shell_files()
    copier = AssetCopier(MEDIA_ROOT)

    docs = collect_docs()
    audio_entries = build_music_entries(docs, copier)
    link_related_docs(audio_entries, docs)
    playlists = build_playlists(audio_entries)
    gallery = select_featured_images(copier)
    corpus = build_corpus(docs, audio_entries)
    featured = featured_selection(docs, audio_entries, gallery)

    site_manifest = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "counts": {
            "docs": len(docs),
            "visibleDocs": sum(1 for doc in docs if doc["visible"]),
            "audio": len(audio_entries),
            "playlists": len(playlists),
            "gallery": len(gallery),
            "corpusChunks": len(corpus),
        },
        "roster": ROSTER,
        "prompts": PROMPTS,
        "featured": featured,
        "docs": docs,
        "audio": audio_entries,
        "playlists": playlists,
        "gallery": gallery,
    }

    (CONTENT_ROOT / "library.json").write_text(json.dumps(site_manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    (CONTENT_ROOT / "corpus.json").write_text(json.dumps(corpus, indent=2, ensure_ascii=False), encoding="utf-8")
    (CONTENT_ROOT / "build.json").write_text(
        json.dumps(
            {
                "generatedAt": site_manifest["generatedAt"],
                "sourceRoots": [FORK_ROOT.as_posix(), *(path.as_posix() for path in RELEVANT_MUSIC_DIRS)],
                "dist": DIST_ROOT.as_posix(),
            },
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )

    print(json.dumps(site_manifest["counts"], indent=2))


if __name__ == "__main__":
    build()
