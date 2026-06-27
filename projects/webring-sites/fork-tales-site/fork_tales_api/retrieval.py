from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any

from rank_bm25 import BM25Okapi

TOKEN_RE = re.compile(r"[\w\-一-龯ぁ-ゟァ-ヿ]+", re.UNICODE)


def tokenize(text: str) -> list[str]:
    return [token.lower() for token in TOKEN_RE.findall(text) if len(token) > 1]


@dataclass(frozen=True)
class IndexedChunk:
    raw: dict[str, Any]
    tokens: list[str]
    token_set: set[str]
    title_tokens: set[str]
    lower_title: str
    lower_text: str


class CorpusIndex:
    def __init__(self, chunks: list[dict[str, Any]]) -> None:
        self.records: list[IndexedChunk] = []
        token_matrix: list[list[str]] = []
        for chunk in chunks:
            text = str(chunk.get("text", ""))
            title = str(chunk.get("title", ""))
            tokens = tokenize(text)
            token_matrix.append(tokens or ["_"])
            self.records.append(
                IndexedChunk(
                    raw=chunk,
                    tokens=tokens,
                    token_set=set(tokens),
                    title_tokens=set(tokenize(title)),
                    lower_title=title.lower(),
                    lower_text=text.lower(),
                )
            )
        self.bm25 = BM25Okapi(token_matrix or [["_"]])

    def search(self, query: str, top_k: int = 8) -> list[dict[str, Any]]:
        query_tokens = tokenize(query)
        if not query_tokens:
            return []

        phrase = query.lower().strip()
        scores = self.bm25.get_scores(query_tokens)
        ranked: list[tuple[float, dict[str, Any]]] = []
        for score, record in zip(scores, self.records, strict=True):
            total = float(score)
            if phrase and phrase in record.lower_title:
                total += 6.5
            elif phrase and phrase in record.lower_text:
                total += 3.0
            total += 0.15 * len(set(query_tokens) & record.token_set)
            total += 0.2 * len(set(query_tokens) & record.title_tokens)
            if total > 0:
                ranked.append((total, record.raw))
        ranked.sort(key=lambda item: item[0], reverse=True)
        return [raw for _, raw in ranked[:top_k]]
