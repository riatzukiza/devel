#!/usr/bin/env python3
from __future__ import annotations

import argparse
import os
from pathlib import Path

import uvicorn


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Serve the Fork Tales site via FastAPI.")
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parent / "dist")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8042)
    parser.add_argument("--reload", action="store_true")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    os.environ["FORK_TALES_SITE_ROOT"] = str(args.root.resolve())
    uvicorn.run(
        "fork_tales_api.app:create_app",
        factory=True,
        host=args.host,
        port=args.port,
        reload=args.reload,
    )


if __name__ == "__main__":
    main()
