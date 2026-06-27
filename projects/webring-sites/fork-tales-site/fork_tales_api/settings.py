from __future__ import annotations

import re
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ROOT = Path(__file__).resolve().parent.parent


def pick_first(*values: str | None) -> str | None:
    for value in values:
        if value and value.strip():
            return value.strip()
    return None


def normalize_chat_url(base_url: str) -> str:
    trimmed = base_url.rstrip("/")
    if trimmed.endswith("/v1/chat/completions") or trimmed.endswith("/chat/completions"):
        return trimmed
    if trimmed.endswith("/v1"):
        return f"{trimmed}/chat/completions"
    if re.search(r"/v\d+$", trimmed):
        return f"{trimmed}/chat/completions"
    return f"{trimmed}/v1/chat/completions"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=PROJECT_ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    fork_tales_site_root: Path = PROJECT_ROOT / "dist"
    fork_tales_model: str = "glm-5-turbo"
    fork_tales_timeout_seconds: float = 45.0
    fork_tales_search_top_k: int = 8
    fork_tales_max_history_turns: int = 6
    fork_tales_temperature: float = 0.88
    fork_tales_max_tokens: int = 650

    open_hax_openai_proxy_url: str | None = None
    zai_base_url: str | None = None
    zhipu_base_url: str | None = None
    openai_base_url: str | None = None

    open_hax_openai_proxy_auth_token: str | None = None
    zai_api_key: str | None = None
    zhipu_api_key: str | None = None
    proxy_auth_token: str | None = None
    openai_api_key: str | None = None

    @property
    def site_root(self) -> Path:
        return self.fork_tales_site_root.resolve()

    @property
    def content_root(self) -> Path:
        return self.site_root / "content"

    @property
    def provider_base_url(self) -> str | None:
        return pick_first(
            self.zai_base_url,
            self.zhipu_base_url,
            self.open_hax_openai_proxy_url,
            self.openai_base_url,
        )

    @property
    def provider_api_key(self) -> str | None:
        return pick_first(
            self.zai_api_key,
            self.zhipu_api_key,
            self.open_hax_openai_proxy_auth_token,
            self.proxy_auth_token,
            self.openai_api_key,
        )

    @property
    def chat_completions_url(self) -> str | None:
        if not self.provider_base_url:
            return None
        return normalize_chat_url(self.provider_base_url)

    @property
    def provider_name(self) -> str:
        base_url = (self.provider_base_url or "").lower()
        if "z.ai" in base_url:
            return "zai"
        if base_url:
            return "openai-compatible"
        return "offline"

    @property
    def provider_configured(self) -> bool:
        return bool(self.provider_base_url and self.provider_api_key)
