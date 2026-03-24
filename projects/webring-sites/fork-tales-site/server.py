#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import math
import os
import re
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter
from dataclasses import dataclass
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any


TOKEN_RE = re.compile(r"[\w\-一-龯ぁ-ゟァ-ヿ]+", re.UNICODE)
DEFAULT_MODEL = "mistral-large-3:675b"
SYSTEM_PROMPT = """You are THREAD/SPEAKER, the living interface for Fork Tales.
You answer like a lucid haunted wiki from a 1998 idea of the future: intimate, eerie, specific, and kind.

Rules:
- Only answer from the supplied context.
- If the context is insufficient, say so plainly.
- Keep the answer vivid but concrete.
- Mention titles, chapters, songs, or artifacts naturally when relevant.
- End with one suggested artifact to open or play next.
- No markdown tables.
"""


def getenv_any(*names: str) -> str | None:
    for name in names:
        value = os.getenv(name, "").strip()
        if value:
            return value
    return None


def normalize_chat_url(base_url: str) -> str:
    trimmed = base_url.rstrip("/")
    if trimmed.endswith("/v1/chat/completions") or trimmed.endswith("/chat/completions"):
        return trimmed
    if trimmed.endswith("/v1"):
        return f"{trimmed}/chat/completions"
    return f"{trimmed}/v1/chat/completions"


def tokenize(text: str) -> list[str]:
    return [token.lower() for token in TOKEN_RE.findall(text) if len(token) > 1]


@dataclass
class ChunkRecord:
    raw: dict[str, Any]
    counts: Counter[str]


class CorpusIndex:
    def __init__(self, chunks: list[dict[str, Any]]) -> None:
        self.records: list[ChunkRecord] = []
        self.doc_freq: Counter[str] = Counter()
        for chunk in chunks:
            counts = Counter(tokenize(str(chunk.get("text", ""))))
            self.records.append(ChunkRecord(raw=chunk, counts=counts))
            self.doc_freq.update(counts.keys())
        self.total_docs = max(len(self.records), 1)

    def search(self, query: str, top_k: int = 8) -> list[dict[str, Any]]:
        query_tokens = tokenize(query)
        if not query_tokens:
            return []
        scored: list[tuple[float, dict[str, Any]]] = []
        phrase = query.lower().strip()
        for record in self.records:
            score = 0.0
            for token in query_tokens:
                tf = record.counts.get(token, 0)
                if not tf:
                    continue
                idf = math.log((1 + self.total_docs) / (1 + self.doc_freq[token])) + 1.0
                score += (1.0 + math.log(tf)) * idf
            title = str(record.raw.get("title", "")).lower()
            text = str(record.raw.get("text", "")).lower()
            if phrase and phrase in title:
                score += 6.5
            elif phrase and phrase in text:
                score += 3.0
            score += 0.2 * len(set(query_tokens) & set(tokenize(title)))
            if score > 0:
                scored.append((score, record.raw))
        scored.sort(key=lambda item: item[0], reverse=True)
        return [raw for _, raw in scored[:top_k]]


class ForkTalesOracle:
    def __init__(self, root: Path) -> None:
        library_path = root / "content" / "library.json"
        corpus_path = root / "content" / "corpus.json"
        self.library = json.loads(library_path.read_text(encoding="utf-8"))
        self.corpus = json.loads(corpus_path.read_text(encoding="utf-8"))
        self.corpus_index = CorpusIndex(self.corpus)
        self.docs_by_id = {item["id"]: item for item in self.library.get("docs", [])}
        self.audio_by_id = {item["id"]: item for item in self.library.get("audio", [])}
        self.base_url = getenv_any("OPEN_HAX_OPENAI_PROXY_URL", "OPENAI_BASE_URL")
        self.api_key = getenv_any("OPEN_HAX_OPENAI_PROXY_AUTH_TOKEN", "PROXY_AUTH_TOKEN", "OPENAI_API_KEY")
        self.model = getenv_any("FORK_TALES_MODEL", "STORYTELLER_MODEL") or DEFAULT_MODEL
        self.timeout_seconds = float(os.getenv("FORK_TALES_TIMEOUT_SECONDS", "90"))

    def status(self) -> dict[str, Any]:
        return {
            "ok": True,
            "model": self.model,
            "proxyConfigured": bool(self.base_url and self.api_key),
            "counts": self.library.get("counts", {}),
        }

    def chat(self, message: str, history: list[dict[str, Any]] | None = None) -> dict[str, Any]:
        chunks = self.corpus_index.search(message, top_k=8)
        citations = self._citations_from_chunks(chunks)
        if self.base_url and self.api_key:
            try:
                answer = self._chat_via_proxy(message, citations, history or [])
                return {"ok": True, "answer": answer, "citations": citations, "fallback": False}
            except Exception as exc:  # noqa: BLE001
                answer = self._fallback_answer(message, citations, error=str(exc))
                return {"ok": True, "answer": answer, "citations": citations, "fallback": True}
        answer = self._fallback_answer(message, citations, error=None)
        return {"ok": True, "answer": answer, "citations": citations, "fallback": True}

    def _citations_from_chunks(self, chunks: list[dict[str, Any]]) -> list[dict[str, Any]]:
        citations: list[dict[str, Any]] = []
        seen: set[str] = set()
        for chunk in chunks:
            ref_id = str(chunk.get("refId"))
            if ref_id in seen:
                continue
            seen.add(ref_id)
            ref_type = str(chunk.get("refType"))
            source = self.docs_by_id.get(ref_id) if ref_type == "doc" else self.audio_by_id.get(ref_id)
            if not source:
                continue
            citations.append(
                {
                    "id": ref_id,
                    "refType": ref_type,
                    "kind": source.get("kind"),
                    "title": source.get("title"),
                    "excerpt": chunk.get("text"),
                    "sourcePath": source.get("sourcePath"),
                    "mediaUrl": source.get("mediaUrl"),
                    "relatedDocIds": source.get("relatedDocIds", []),
                }
            )
            if len(citations) >= 6:
                break
        return citations

    def _chat_via_proxy(self, message: str, citations: list[dict[str, Any]], history: list[dict[str, Any]]) -> str:
        context_lines: list[str] = []
        for citation in citations:
            context_lines.append(f"TITLE: {citation['title']}")
            context_lines.append(f"TYPE: {citation['refType']} / {citation.get('kind')}")
            context_lines.append(f"SOURCE: {citation.get('sourcePath')}")
            context_lines.append(f"EXCERPT: {citation.get('excerpt')}")
            context_lines.append("")
        messages: list[dict[str, Any]] = [{"role": "system", "content": SYSTEM_PROMPT}]
        messages.append(
            {
                "role": "system",
                "content": "Context follows. Treat it as the entire trustworthy slice of the world for this answer.\n\n" + "\n".join(context_lines),
            }
        )
        for item in (history or [])[-6:]:
            role = str(item.get("role", "user"))
            if role not in {"user", "assistant", "system"}:
                continue
            content = str(item.get("content", "")).strip()
            if content:
                messages.append({"role": role, "content": content})
        messages.append({"role": "user", "content": message.strip()})

        payload = {
            "model": self.model,
            "temperature": 0.88,
            "max_tokens": 650,
            "messages": messages,
        }
        request = urllib.request.Request(
            normalize_chat_url(self.base_url or ""),
            data=json.dumps(payload).encode("utf-8"),
            method="POST",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}",
            },
        )
        try:
            with urllib.request.urlopen(request, timeout=self.timeout_seconds) as response:
                raw = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="ignore")
            raise RuntimeError(f"proxy HTTP {exc.code}: {detail}") from exc
        except urllib.error.URLError as exc:
            raise RuntimeError(f"proxy connection failed: {exc}") from exc

        choices = raw.get("choices") or []
        if not choices:
            raise RuntimeError("proxy returned no choices")
        message_content = choices[0].get("message", {}).get("content")
        if isinstance(message_content, str) and message_content.strip():
            return message_content.strip()
        raise RuntimeError("proxy returned empty content")

    def _fallback_answer(self, message: str, citations: list[dict[str, Any]], error: str | None) -> str:
        if not citations:
            return (
                "The thread can hear you, but the current slice is too thin to answer honestly. "
                "Try naming a chapter, character, lyric, or track.\n\n"
                "Open next: Chapter 02 — Just Another Day."
            )
        lead = citations[0]
        response = [
            f"I can answer from the current shard: **{lead['title']}**.",
            lead.get("excerpt", ""),
        ]
        if len(citations) > 1:
            response.append("Adjacent signals:")
            for citation in citations[1:4]:
                response.append(f"- {citation['title']}")
        if error:
            response.append(f"(The live oracle route glitched, so this is a local stitched answer: {error})")
        response.append(f"Open next: {lead['title']}.")
        return "\n\n".join(part for part in response if part)


class CaddyRouteKeeper:
    def __init__(self, public_host: str, admin_url: str, upstream: str, interval_seconds: float) -> None:
        self.public_host = public_host
        self.admin_url = admin_url.rstrip("/")
        self.upstream = upstream
        self.interval_seconds = interval_seconds
        self._stop = threading.Event()
        self._thread = threading.Thread(target=self._run, name="caddy-route-keeper", daemon=True)

    def start(self) -> None:
        self._thread.start()

    def stop(self) -> None:
        self._stop.set()
        self._thread.join(timeout=2)

    def _run(self) -> None:
        while not self._stop.is_set():
            try:
                self.ensure_route()
            except Exception as exc:  # noqa: BLE001
                print(f"[caddy-route-keeper] {exc}", file=sys.stderr)
            self._stop.wait(self.interval_seconds)

    def ensure_route(self) -> None:
        routes_url = f"{self.admin_url}/config/apps/http/servers/srv0/routes"
        request = urllib.request.Request(routes_url, method="GET")
        with urllib.request.urlopen(request, timeout=10) as response:
            routes = json.loads(response.read().decode("utf-8"))
        for route in routes:
            for matcher in route.get("match", []):
                hosts = matcher.get("host", [])
                if self.public_host not in hosts:
                    continue
                if self._route_points_to_upstream(route):
                    return
        route_object = {
            "match": [{"host": [self.public_host]}],
            "handle": [
                {
                    "handler": "subroute",
                    "routes": [
                        {
                            "handle": [
                                {
                                    "handler": "reverse_proxy",
                                    "upstreams": [{"dial": self.upstream}],
                                }
                            ]
                        }
                    ],
                }
            ],
            "terminal": True,
        }
        post = urllib.request.Request(
            routes_url,
            data=json.dumps(route_object).encode("utf-8"),
            method="POST",
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(post, timeout=10):
            pass
        print(f"[caddy-route-keeper] added route for {self.public_host} -> {self.upstream}", file=sys.stderr)

    def _route_points_to_upstream(self, route: dict[str, Any]) -> bool:
        for handle in route.get("handle", []):
            for nested in handle.get("routes", []):
                for proxy in nested.get("handle", []):
                    if proxy.get("handler") != "reverse_proxy":
                        continue
                    for upstream in proxy.get("upstreams", []):
                        if upstream.get("dial") == self.upstream:
                            return True
        return False


class ForkTalesRequestHandler(SimpleHTTPRequestHandler):
    oracle: ForkTalesOracle
    static_root: Path

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, directory=str(self.static_root), **kwargs)

    def do_GET(self) -> None:  # noqa: N802
        if self.path == "/healthz":
            self._write_json(HTTPStatus.OK, {"ok": True})
            return
        if self.path == "/api/status":
            self._write_json(HTTPStatus.OK, self.oracle.status())
            return
        if self.path.startswith("/api/"):
            self._write_json(HTTPStatus.NOT_FOUND, {"ok": False, "error": "Not found"})
            return
        super().do_GET()

    def do_POST(self) -> None:  # noqa: N802
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path != "/api/chat":
            self._write_json(HTTPStatus.NOT_FOUND, {"ok": False, "error": "Not found"})
            return
        content_length = int(self.headers.get("Content-Length", "0") or 0)
        body = self.rfile.read(content_length) if content_length else b"{}"
        try:
            payload = json.loads(body.decode("utf-8"))
        except json.JSONDecodeError:
            self._write_json(HTTPStatus.BAD_REQUEST, {"ok": False, "error": "Invalid JSON"})
            return
        message = str(payload.get("message", "")).strip()
        history = payload.get("history") if isinstance(payload.get("history"), list) else []
        if not message:
            self._write_json(HTTPStatus.BAD_REQUEST, {"ok": False, "error": "message is required"})
            return
        reply = self.oracle.chat(message, history)
        self._write_json(HTTPStatus.OK, reply)

    def end_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
        super().end_headers()

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(HTTPStatus.NO_CONTENT)
        self.end_headers()

    def log_message(self, format: str, *args: Any) -> None:  # noqa: A003
        sys.stderr.write("[fork-tales-site] " + (format % args) + "\n")

    def _write_json(self, status: HTTPStatus, payload: dict[str, Any]) -> None:
        encoded = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Serve the Fork Tales retro site.")
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parent / "dist")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8042)
    return parser.parse_args()


def maybe_start_caddy_keeper(host: str, port: int) -> CaddyRouteKeeper | None:
    public_host = os.getenv("PUBLIC_HOST", "").strip()
    admin_url = os.getenv("CADDY_ADMIN_URL", "").strip()
    upstream = os.getenv("CADDY_UPSTREAM", "").strip() or f"{host}:{port}"
    interval = float(os.getenv("CADDY_ROUTE_CHECK_INTERVAL_SECONDS", "120"))
    if not (public_host and admin_url and upstream):
        return None
    keeper = CaddyRouteKeeper(public_host=public_host, admin_url=admin_url, upstream=upstream, interval_seconds=interval)
    keeper.start()
    return keeper


def main() -> None:
    args = parse_args()
    root = args.root.resolve()
    if not root.exists():
        raise SystemExit(f"Static root does not exist: {root}")
    ForkTalesRequestHandler.oracle = ForkTalesOracle(root)
    ForkTalesRequestHandler.static_root = root
    keeper = maybe_start_caddy_keeper(args.host, args.port)

    server = ThreadingHTTPServer((args.host, args.port), ForkTalesRequestHandler)
    print(f"fork-tales-site listening on http://{args.host}:{args.port} (root={root})")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
        if keeper:
            keeper.stop()


if __name__ == "__main__":
    main()
