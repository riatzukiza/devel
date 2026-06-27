from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

import httpx

from .retrieval import CorpusIndex
from .schemas import ChatHistoryTurn, ChatResponse, Citation, StatusResponse
from .settings import Settings

logger = logging.getLogger(__name__)

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


class SiteContentError(RuntimeError):
    pass


class ForkTalesService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self._site_root = settings.site_root
        self._library = self._load_json(self.settings.content_root / "library.json")
        self._corpus = self._load_json(self.settings.content_root / "corpus.json")
        self._index = CorpusIndex(self._corpus)
        self._docs_by_id = {item["id"]: item for item in self._library.get("docs", [])}
        self._audio_by_id = {item["id"]: item for item in self._library.get("audio", [])}
        self._http = httpx.AsyncClient(timeout=self.settings.fork_tales_timeout_seconds)

    async def aclose(self) -> None:
        await self._http.aclose()

    def status(self) -> StatusResponse:
        return StatusResponse(
            model=self.settings.fork_tales_model,
            provider=self.settings.provider_name,
            proxyConfigured=self.settings.provider_configured,
            counts=self._library.get("counts", {}),
            generatedAt=self._library.get("generatedAt"),
        )

    async def chat(self, message: str, history: list[ChatHistoryTurn]) -> ChatResponse:
        chunks = self._index.search(message, top_k=self.settings.fork_tales_search_top_k)
        citations = self._citations_from_chunks(chunks)
        if self.settings.provider_configured:
            try:
                answer = await self._chat_live(message, citations, history)
                return ChatResponse(answer=answer, citations=citations, fallback=False)
            except Exception as exc:  # noqa: BLE001
                logger.exception("fork tales provider request failed")
                answer = self._fallback_answer(message=message, citations=citations, error=str(exc))
                return ChatResponse(answer=answer, citations=citations, fallback=True)
        return ChatResponse(answer=self._fallback_answer(message=message, citations=citations, error=None), citations=citations, fallback=True)

    def _load_json(self, path: Path) -> dict[str, Any] | list[dict[str, Any]]:
        if not path.exists():
            raise SiteContentError(f"Missing site content: {path}")
        return json.loads(path.read_text(encoding="utf-8"))

    def _citations_from_chunks(self, chunks: list[dict[str, Any]]) -> list[Citation]:
        citations: list[Citation] = []
        seen: set[str] = set()
        for chunk in chunks:
            ref_id = str(chunk.get("refId"))
            if ref_id in seen:
                continue
            seen.add(ref_id)
            ref_type = str(chunk.get("refType"))
            source = self._docs_by_id.get(ref_id) if ref_type == "doc" else self._audio_by_id.get(ref_id)
            if not source:
                continue
            citations.append(
                Citation(
                    id=ref_id,
                    refType=ref_type if ref_type == "audio" else "doc",
                    kind=source.get("kind"),
                    title=str(source.get("title", ref_id)),
                    excerpt=chunk.get("text"),
                    sourcePath=source.get("sourcePath"),
                    mediaUrl=source.get("mediaUrl"),
                    relatedDocIds=list(source.get("relatedDocIds", [])),
                )
            )
            if len(citations) >= 6:
                break
        return citations

    async def _chat_live(self, message: str, citations: list[Citation], history: list[ChatHistoryTurn]) -> str:
        payload = {
            "model": self.settings.fork_tales_model,
            "temperature": self.settings.fork_tales_temperature,
            "max_tokens": self.settings.fork_tales_max_tokens,
            "messages": self._build_messages(message, citations, history),
        }
        response = await self._http.post(
            self.settings.chat_completions_url,
            json=payload,
            headers={
                "Authorization": f"Bearer {self.settings.provider_api_key}",
                "Content-Type": "application/json",
            },
        )
        if response.status_code >= 400:
            raise RuntimeError(f"provider HTTP {response.status_code}: {response.text}")
        raw = response.json()
        choices = raw.get("choices") or []
        if not choices:
            raise RuntimeError("provider returned no choices")
        content = self._extract_content(choices[0].get("message", {}).get("content"))
        if not content:
            raise RuntimeError("provider returned empty content")
        return content

    def _build_messages(self, message: str, citations: list[Citation], history: list[ChatHistoryTurn]) -> list[dict[str, str]]:
        context_lines: list[str] = []
        for citation in citations:
            context_lines.append(f"TITLE: {citation.title}")
            context_lines.append(f"TYPE: {citation.refType} / {citation.kind}")
            context_lines.append(f"SOURCE: {citation.sourcePath}")
            context_lines.append(f"EXCERPT: {citation.excerpt}")
            context_lines.append("")

        messages: list[dict[str, str]] = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "system",
                "content": "Context follows. Treat it as the entire trustworthy slice of the world for this answer.\n\n" + "\n".join(context_lines),
            },
        ]
        for turn in history[-self.settings.fork_tales_max_history_turns :]:
            messages.append({"role": turn.role, "content": turn.content})
        messages.append({"role": "user", "content": message.strip()})
        return messages

    def _extract_content(self, content: Any) -> str | None:
        if isinstance(content, str):
            cleaned = content.strip()
            return cleaned or None
        if isinstance(content, list):
            text_parts: list[str] = []
            for item in content:
                if not isinstance(item, dict):
                    continue
                if item.get("type") == "text" and isinstance(item.get("text"), str):
                    text_parts.append(item["text"].strip())
            cleaned = "\n".join(part for part in text_parts if part)
            return cleaned or None
        return None

    def _fallback_answer(self, *, message: str, citations: list[Citation], error: str | None) -> str:
        if not citations:
            return (
                "The thread can hear you, but the current slice is too thin to answer honestly. "
                "Try naming a chapter, character, lyric, or track.\n\n"
                "Open next: Chapter 02 — Just Another Day."
            )
        lead = citations[0]
        response = [
            f"I can answer from the current shard: **{lead.title}**.",
            lead.excerpt or "",
        ]
        if len(citations) > 1:
            response.append("Adjacent signals:")
            for citation in citations[1:4]:
                response.append(f"- {citation.title}")
        if error:
            response.append(f"(The live oracle route glitched, so this is a local stitched answer: {error})")
        response.append(f"Open next: {lead.title}.")
        return "\n\n".join(part for part in response if part)
