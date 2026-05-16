#!/usr/bin/env python3
"""Idle-TTL wrapper/proxy for llama.cpp server.

The wrapper keeps the public OpenAI-compatible port stable, starts llama-server on
first request, and terminates it after an idle TTL so the chat model leaves VRAM.
It is intentionally stdlib-only for the llama.cpp CUDA image.
"""

from __future__ import annotations

import json
import os
import signal
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Iterable

PUBLIC_HOST = os.getenv("LLAMACPP_PROXY_HOST", "0.0.0.0")
PUBLIC_PORT = int(os.getenv("LLAMACPP_PUBLIC_PORT", "8080"))
CHILD_HOST = os.getenv("LLAMACPP_WRAPPED_HOST", "127.0.0.1")
CHILD_PORT = int(os.getenv("LLAMACPP_WRAPPED_PORT", "18080"))
TTL_SECONDS = float(os.getenv("LLAMACPP_CHAT_TTL_SECONDS", os.getenv("MODEL_TTL_SECONDS", "300")))
TTL_CHECK_SECONDS = float(os.getenv("LLAMACPP_CHAT_TTL_CHECK_SECONDS", str(min(30.0, max(1.0, TTL_SECONDS / 10.0)))))
STARTUP_TIMEOUT_SECONDS = float(os.getenv("LLAMACPP_STARTUP_TIMEOUT_SECONDS", "300"))
UPSTREAM_TIMEOUT_SECONDS = float(os.getenv("LLAMACPP_UPSTREAM_TIMEOUT_SECONDS", "900"))
RUN_SCRIPT = os.getenv("LLAMACPP_RUN_SCRIPT", "/opt/llamacpp-stack/run-chat-server.sh")

HOP_BY_HOP_HEADERS = {
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailers",
    "transfer-encoding",
    "upgrade",
}

state_lock = threading.RLock()
child: subprocess.Popen[bytes] | None = None
last_used_at = 0.0
active_requests = 0
shutting_down = False


def now() -> float:
    return time.monotonic()


def child_running_locked() -> bool:
    global child
    if child is None:
        return False
    if child.poll() is None:
        return True
    print(f"[llamacpp-ttl] child exited code={child.returncode}", flush=True)
    child = None
    return False


def child_base_url() -> str:
    return f"http://{CHILD_HOST}:{CHILD_PORT}"


def start_child_locked() -> None:
    global child, last_used_at
    if child_running_locked():
        last_used_at = now()
        return

    env = os.environ.copy()
    env["LLAMACPP_SERVER_PORT"] = str(CHILD_PORT)
    env.setdefault("LLAMACPP_CHAT_MMPROJ", "mmproj-BF16.gguf")
    print(
        f"[llamacpp-ttl] starting llama-server child on {CHILD_HOST}:{CHILD_PORT} ttl={TTL_SECONDS:.1f}s",
        flush=True,
    )
    child = subprocess.Popen(["/bin/sh", RUN_SCRIPT], env=env)
    last_used_at = now()


def wait_for_child_ready() -> None:
    deadline = time.time() + STARTUP_TIMEOUT_SECONDS
    url = f"{child_base_url()}/health"
    last_error: Exception | None = None
    while time.time() < deadline:
        with state_lock:
            if not child_running_locked():
                start_child_locked()
        try:
            with urllib.request.urlopen(url, timeout=2) as response:
                if 200 <= response.status < 500:
                    return
        except Exception as exc:  # noqa: BLE001 - report last readiness error.
            last_error = exc
        time.sleep(1)
    raise TimeoutError(f"llama-server did not become ready within {STARTUP_TIMEOUT_SECONDS:.1f}s: {last_error}")


def terminate_child_locked(reason: str) -> bool:
    global child
    if not child_running_locked():
        return False
    assert child is not None
    proc = child
    print(f"[llamacpp-ttl] stopping child pid={proc.pid} ({reason})", flush=True)
    proc.terminate()
    try:
        proc.wait(timeout=20)
    except subprocess.TimeoutExpired:
        print(f"[llamacpp-ttl] child pid={proc.pid} did not exit; killing", flush=True)
        proc.kill()
        proc.wait(timeout=20)
    child = None
    return True


def ttl_loop() -> None:
    if TTL_SECONDS <= 0:
        print("[llamacpp-ttl] TTL disabled", flush=True)
        return
    print(f"[llamacpp-ttl] TTL enabled: {TTL_SECONDS:.1f}s", flush=True)
    while not shutting_down:
        time.sleep(TTL_CHECK_SECONDS)
        with state_lock:
            if active_requests > 0 or not child_running_locked() or last_used_at <= 0:
                continue
            idle = now() - last_used_at
            if idle >= TTL_SECONDS:
                terminate_child_locked(f"idle TTL {idle:.1f}s")


def response_json(handler: BaseHTTPRequestHandler, status: int, payload: dict) -> None:
    body = json.dumps(payload).encode("utf-8")
    handler.send_response(status)
    handler.send_header("content-type", "application/json")
    handler.send_header("content-length", str(len(body)))
    handler.send_header("connection", "close")
    handler.end_headers()
    handler.wfile.write(body)
    handler.close_connection = True


def filtered_headers(headers: Iterable[tuple[str, str]]) -> dict[str, str]:
    result: dict[str, str] = {}
    for key, value in headers:
        lowered = key.lower()
        if lowered in HOP_BY_HOP_HEADERS or lowered == "host" or lowered == "content-length":
            continue
        result[key] = value
    return result


class ProxyHandler(BaseHTTPRequestHandler):
    server_version = "llamacpp-ttl-proxy/1.0"
    protocol_version = "HTTP/1.1"

    def log_message(self, fmt: str, *args: object) -> None:
        print(f"[llamacpp-ttl] {self.address_string()} {fmt % args}", flush=True)

    def do_GET(self) -> None:  # noqa: N802
        if self.path.split("?", 1)[0] == "/health":
            self.handle_health()
            return
        self.proxy_request()

    def do_POST(self) -> None:  # noqa: N802
        path = self.path.split("?", 1)[0]
        if path == "/unload":
            self.handle_unload()
            return
        self.proxy_request()

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.proxy_request()

    def handle_health(self) -> None:
        with state_lock:
            running = child_running_locked()
            idle = (now() - last_used_at) if running and last_used_at else None
            payload = {
                "ok": True,
                "wrapper": "llamacpp-ttl-proxy",
                "child_running": running,
                "child_pid": child.pid if running and child is not None else None,
                "public_port": PUBLIC_PORT,
                "child_port": CHILD_PORT,
                "ttl_seconds": TTL_SECONDS,
                "idle_seconds": idle,
                "active_requests": active_requests,
            }
        response_json(self, 200, payload)

    def handle_unload(self) -> None:
        with state_lock:
            if active_requests > 0:
                response_json(self, 409, {"ok": False, "error": "active requests in flight"})
                return
            stopped = terminate_child_locked("manual unload")
        response_json(self, 200, {"ok": True, "stopped": stopped})

    def read_request_body(self) -> bytes | None:
        raw_length = self.headers.get("content-length")
        if raw_length is None:
            return None
        try:
            length = int(raw_length)
        except ValueError:
            return b""
        if length <= 0:
            return b""
        return self.rfile.read(length)

    def proxy_request(self) -> None:
        global active_requests, last_used_at
        body = self.read_request_body()
        with state_lock:
            active_requests += 1
            try:
                start_child_locked()
            except Exception as exc:  # noqa: BLE001
                active_requests -= 1
                response_json(self, 503, {"error": f"failed to start llama-server: {exc}"})
                return

        try:
            wait_for_child_ready()
            upstream_url = f"{child_base_url()}{self.path}"
            headers = filtered_headers(self.headers.items())
            request = urllib.request.Request(upstream_url, data=body, headers=headers, method=self.command)
            try:
                with urllib.request.urlopen(request, timeout=UPSTREAM_TIMEOUT_SECONDS) as response:
                    self.copy_upstream_response(response.status, response.headers.items(), response.read())
            except urllib.error.HTTPError as exc:
                self.copy_upstream_response(exc.code, exc.headers.items(), exc.read())
            except urllib.error.URLError as exc:
                response_json(self, 503, {"error": f"llama-server request failed: {exc}"})
        finally:
            with state_lock:
                active_requests = max(0, active_requests - 1)
                last_used_at = now()

    def copy_upstream_response(self, status: int, headers: Iterable[tuple[str, str]], body: bytes) -> None:
        self.send_response(status)
        has_content_type = False
        for key, value in headers:
            lowered = key.lower()
            if lowered in HOP_BY_HOP_HEADERS or lowered == "content-length":
                continue
            if lowered == "content-type":
                has_content_type = True
            self.send_header(key, value)
        if not has_content_type:
            self.send_header("content-type", "application/octet-stream")
        self.send_header("content-length", str(len(body)))
        self.send_header("connection", "close")
        self.end_headers()
        self.wfile.write(body)
        self.close_connection = True


def handle_signal(signum: int, _frame: object) -> None:
    global shutting_down
    shutting_down = True
    with state_lock:
        terminate_child_locked(f"signal {signum}")
    raise SystemExit(0)


def main() -> None:
    signal.signal(signal.SIGTERM, handle_signal)
    signal.signal(signal.SIGINT, handle_signal)
    threading.Thread(target=ttl_loop, name="llamacpp-ttl", daemon=True).start()
    server = ThreadingHTTPServer((PUBLIC_HOST, PUBLIC_PORT), ProxyHandler)
    print(f"[llamacpp-ttl] proxy listening on {PUBLIC_HOST}:{PUBLIC_PORT}; child port={CHILD_PORT}", flush=True)
    try:
        server.serve_forever(poll_interval=0.5)
    finally:
        server.server_close()
        with state_lock:
            terminate_child_locked("server shutdown")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # noqa: BLE001
        print(f"[llamacpp-ttl] fatal: {exc}", file=sys.stderr, flush=True)
        raise
