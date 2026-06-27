from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, field_validator


ChatRole = Literal["system", "user", "assistant"]


class ChatHistoryTurn(BaseModel):
    role: ChatRole
    content: str

    @field_validator("content")
    @classmethod
    def validate_content(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("history content must not be empty")
        return cleaned


class ChatRequest(BaseModel):
    message: str
    history: list[ChatHistoryTurn] = Field(default_factory=list)

    @field_validator("message")
    @classmethod
    def validate_message(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("message is required")
        return cleaned


class Citation(BaseModel):
    id: str
    refType: Literal["doc", "audio"]
    kind: str | None = None
    title: str
    excerpt: str | None = None
    sourcePath: str | None = None
    mediaUrl: str | None = None
    relatedDocIds: list[str] = Field(default_factory=list)


class ChatResponse(BaseModel):
    ok: bool = True
    answer: str
    citations: list[Citation] = Field(default_factory=list)
    fallback: bool = False


class StatusResponse(BaseModel):
    ok: bool = True
    model: str
    provider: str
    proxyConfigured: bool
    counts: dict[str, int] = Field(default_factory=dict)
    generatedAt: str | None = None
