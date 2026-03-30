from __future__ import annotations

import json
from pathlib import Path

from fastapi.testclient import TestClient

from fork_tales_api.app import create_app
from fork_tales_api.settings import normalize_chat_url


def write_fixture_site(root: Path) -> None:
    content = root / "content"
    content.mkdir(parents=True, exist_ok=True)
    (root / "index.html").write_text("<html><body><h1>fork//tales</h1></body></html>", encoding="utf-8")
    (root / "app.js").write_text("console.log('fork tales');", encoding="utf-8")
    (root / "styles.css").write_text("body { background: #000; }", encoding="utf-8")
    library = {
        "generatedAt": "2026-03-24T00:00:00Z",
        "counts": {"docs": 1, "visibleDocs": 1, "audio": 1, "playlists": 0, "gallery": 0, "corpusChunks": 2},
        "docs": [
            {
                "id": "doc-1",
                "title": "Gates of Truth",
                "kind": "chapter",
                "visible": True,
                "sourcePath": "story/gates.md",
                "html": "<p>The gate hums.</p>",
                "text": "The gate hums at midnight and answers only to witnesses.",
                "excerpt": "The gate hums at midnight.",
            }
        ],
        "audio": [
            {
                "id": "audio-1",
                "title": "Witness Choir",
                "kind": "track",
                "collection": "choir",
                "collectionTitle": "Choir Deck",
                "mediaUrl": "/media/witness.mp3",
                "artUrl": None,
                "lyricsText": "Witness the gate.",
                "lyricsHtml": "<p>Witness the gate.</p>",
                "excerpt": "Witness the gate.",
                "tags": ["witness"],
                "sourcePath": "audio/witness.mp3",
                "relatedDocIds": ["doc-1"],
            }
        ],
        "playlists": [],
        "gallery": [],
        "featured": {},
        "prompts": [],
        "roster": [],
    }
    corpus = [
        {
            "id": "chunk-doc-1-0",
            "refId": "doc-1",
            "refType": "doc",
            "title": "Gates of Truth",
            "kind": "chapter",
            "sourcePath": "story/gates.md",
            "text": "The gate hums at midnight and answers only to witnesses.",
        },
        {
            "id": "chunk-audio-1-0",
            "refId": "audio-1",
            "refType": "audio",
            "title": "Witness Choir",
            "kind": "track",
            "sourcePath": "audio/witness.mp3",
            "text": "Witness the gate.",
        },
    ]
    (content / "library.json").write_text(json.dumps(library), encoding="utf-8")
    (content / "corpus.json").write_text(json.dumps(corpus), encoding="utf-8")


def test_normalize_chat_url_handles_zai() -> None:
    assert normalize_chat_url("https://api.z.ai/api/paas/v4") == "https://api.z.ai/api/paas/v4/chat/completions"
    assert normalize_chat_url("https://api.openai.com/v1") == "https://api.openai.com/v1/chat/completions"


def test_status_and_chat_fallback(tmp_path: Path, monkeypatch) -> None:
    write_fixture_site(tmp_path)
    monkeypatch.setenv("FORK_TALES_SITE_ROOT", str(tmp_path))
    monkeypatch.setenv("ZAI_API_KEY", "")
    monkeypatch.setenv("ZAI_BASE_URL", "")
    monkeypatch.setenv("OPEN_HAX_OPENAI_PROXY_AUTH_TOKEN", "")
    monkeypatch.setenv("OPEN_HAX_OPENAI_PROXY_URL", "")

    app = create_app()
    with TestClient(app) as client:
        status = client.get("/api/status")
        assert status.status_code == 200
        payload = status.json()
        assert payload["model"] == "glm-5-turbo"
        assert payload["proxyConfigured"] is False

        chat = client.post("/api/chat", json={"message": "What does the gate do?", "history": []})
        assert chat.status_code == 200
        chat_payload = chat.json()
        assert chat_payload["ok"] is True
        assert chat_payload["fallback"] is True
        assert chat_payload["citations"][0]["title"] == "Gates of Truth"


def test_static_shell_serves(tmp_path: Path, monkeypatch) -> None:
    write_fixture_site(tmp_path)
    monkeypatch.setenv("FORK_TALES_SITE_ROOT", str(tmp_path))
    app = create_app()
    with TestClient(app) as client:
        response = client.get("/")
        assert response.status_code == 200
        assert "fork//tales" in response.text.lower()
