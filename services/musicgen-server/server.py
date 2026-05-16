#!/usr/bin/env python3
"""Simple MusicGen server for text-to-audio generation."""

import asyncio
import base64
import io
import os
import time
import wave
from contextlib import suppress

from aiohttp import web

try:
    import torch
    from transformers import AutoProcessor, MusicgenForConditionalGeneration
    MODEL_LOADED = False
    model = None
    processor = None
    device = "cuda" if torch.cuda.is_available() else "cpu"
except ImportError:
    torch = None
    MODEL_LOADED = False
    model = None
    processor = None
    device = "cpu"


def env_float(name: str, default: float) -> float:
    value = os.getenv(name)
    if value is None or value.strip() == "":
        return default
    try:
        return float(value)
    except ValueError:
        return default


MODEL_TTL_SECONDS = env_float("MUSICGEN_MODEL_TTL_SECONDS", env_float("MODEL_TTL_SECONDS", 300.0))
MODEL_TTL_CHECK_SECONDS = env_float("MUSICGEN_MODEL_TTL_CHECK_SECONDS", min(30.0, max(1.0, MODEL_TTL_SECONDS / 10.0)))
_model_lock = asyncio.Lock()
_active_generations = 0
_last_model_used_at = 0.0


async def _load_model_locked():
    """Load the MusicGen model. Caller must hold _model_lock."""
    global model, processor, MODEL_LOADED, _last_model_used_at
    if MODEL_LOADED:
        return

    print(f"Loading MusicGen model on {device}...")
    processor = AutoProcessor.from_pretrained("facebook/musicgen-small")
    model = MusicgenForConditionalGeneration.from_pretrained("facebook/musicgen-small")
    model = model.to(device)
    MODEL_LOADED = True
    _last_model_used_at = time.monotonic()
    print("Model loaded!")


async def load_model():
    """Load the MusicGen model."""
    async with _model_lock:
        await _load_model_locked()


async def begin_generation():
    """Load/pin the model for one generation so the TTL task cannot unload it."""
    global _active_generations
    async with _model_lock:
        await _load_model_locked()
        _active_generations += 1


async def end_generation():
    """Release one generation slot and mark the model as recently used."""
    global _active_generations, _last_model_used_at
    async with _model_lock:
        _active_generations = max(0, _active_generations - 1)
        _last_model_used_at = time.monotonic()


async def generate_music(request):
    """Generate music from text prompt."""
    try:
        data = await request.json()
        prompt = data.get("prompt", "")
        duration = data.get("duration", 5)

        if not prompt:
            return web.json_response({"error": "prompt required"}, status=400)

        await begin_generation()
        try:
            # Generate
            inputs = processor(
                text=[prompt],
                padding=True,
                return_tensors="pt",
            ).to(device)

            max_new_tokens = int(duration * 50)  # 50 tokens per second

            with torch.no_grad():
                audio_values = model.generate(**inputs, max_new_tokens=max_new_tokens)

            # Convert to wav
            audio_data = audio_values[0, 0].cpu().numpy()
            sampling_rate = model.config.audio_encoder.sampling_rate
        finally:
            await end_generation()

        # Convert to bytes
        audio_bytes = (audio_data * 32767).astype("int16").tobytes()

        # Create WAV
        wav_buffer = io.BytesIO()
        with wave.open(wav_buffer, "wb") as wav_file:
            wav_file.setnchannels(1)
            wav_file.setsampwidth(2)
            wav_file.setframerate(sampling_rate)
            wav_file.writeframes(audio_bytes)

        wav_bytes = wav_buffer.getvalue()

        # Encode as base64
        audio_b64 = base64.b64encode(wav_bytes).decode("utf-8")

        return web.json_response({
            "status": "success",
            "data": {
                "audio": audio_b64,
                "format": "wav",
                "duration": duration,
                "sample_rate": sampling_rate
            }
        })

    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)


async def health(request):
    """Health check endpoint."""
    async with _model_lock:
        idle_seconds = time.monotonic() - _last_model_used_at if MODEL_LOADED and _last_model_used_at else None
        return web.json_response({
            "status": "ok",
            "model_loaded": MODEL_LOADED,
            "device": device,
            "model_ttl_seconds": MODEL_TTL_SECONDS,
            "model_idle_seconds": idle_seconds,
            "active_generations": _active_generations,
        })


async def _unload_model_locked(reason: str = "manual"):
    """Unload model to free GPU memory. Caller must hold _model_lock."""
    global model, processor, MODEL_LOADED, _last_model_used_at
    if model is not None:
        del model
        model = None
    if processor is not None:
        del processor
        processor = None
    if torch is not None and torch.cuda.is_available():
        torch.cuda.empty_cache()
    MODEL_LOADED = False
    _last_model_used_at = 0.0
    print(f"Model unloaded ({reason})")


async def unload_model(reason: str = "manual"):
    """Unload model to free GPU memory."""
    async with _model_lock:
        await _unload_model_locked(reason)


async def unload_handler(request):
    await unload_model("manual")
    return web.json_response({"status": "unloaded"})


async def model_ttl_watchdog():
    """Unload the model after it has been idle for the configured TTL."""
    if MODEL_TTL_SECONDS <= 0:
        print("MusicGen model TTL disabled")
        return

    print(f"MusicGen model TTL enabled: {MODEL_TTL_SECONDS:.1f}s")
    while True:
        await asyncio.sleep(MODEL_TTL_CHECK_SECONDS)
        async with _model_lock:
            if not MODEL_LOADED or _active_generations > 0 or not _last_model_used_at:
                continue
            idle_seconds = time.monotonic() - _last_model_used_at
            if idle_seconds >= MODEL_TTL_SECONDS:
                await _unload_model_locked(f"idle TTL {idle_seconds:.1f}s")


async def start_background_tasks(app):
    app["model_ttl_task"] = asyncio.create_task(model_ttl_watchdog())


async def cleanup_background_tasks(app):
    task = app.get("model_ttl_task")
    if task is None:
        return
    task.cancel()
    with suppress(asyncio.CancelledError):
        await task


async def main():
    app = web.Application()
    app.router.add_post("/generate", generate_music)
    app.router.add_get("/health", health)
    app.router.add_post("/unload", unload_handler)
    app.on_startup.append(start_background_tasks)
    app.on_cleanup.append(cleanup_background_tasks)

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", 8080)
    await site.start()

    print("MusicGen server started on port 8080")

    while True:
        await asyncio.sleep(3600)


if __name__ == "__main__":
    asyncio.run(main())
