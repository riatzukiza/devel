from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from .schemas import ChatRequest, ChatResponse, StatusResponse
from .service import ForkTalesService
from .settings import Settings


def create_app() -> FastAPI:
    settings = Settings()
    site_root = settings.site_root
    if not site_root.exists():
        raise RuntimeError(f"Static site root does not exist: {site_root}")

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        service = ForkTalesService(settings)
        app.state.settings = settings
        app.state.service = service
        try:
            yield
        finally:
            await service.aclose()

    app = FastAPI(
        title="Fork Tales API",
        default_response_class=JSONResponse,
        lifespan=lifespan,
    )

    @app.get("/healthz")
    async def healthz() -> dict[str, bool]:
        return {"ok": True}

    @app.get("/api/status", response_model=StatusResponse)
    async def status(request: Request) -> StatusResponse:
        service: ForkTalesService = request.app.state.service
        return service.status()

    @app.post("/api/chat", response_model=ChatResponse)
    async def chat(payload: ChatRequest, request: Request) -> ChatResponse:
        service: ForkTalesService = request.app.state.service
        return await service.chat(payload.message, payload.history)

    app.mount("/", StaticFiles(directory=site_root, html=True), name="site")
    return app
