#!/usr/bin/env python3
# GPL-3.0-only
import argparse
import json
import os
from pathlib import Path

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--model", required=True, help="HF model id")
    p.add_argument("--train", required=True, help="train.jsonl")
    p.add_argument("--val", required=True, help="val.jsonl")
    p.add_argument("--out", required=True, help="output dir")
    args = p.parse_args()

    os.makedirs(args.out, exist_ok=True)
    print("QLoRA training stub - implement with transformers/peft")
    print(f"Model: {args.model}")
    print(f"Train: {args.train}")
    print(f"Val: {args.val}")
    print(f"Out: {args.out}")

if __name__ == "__main__":
    main()