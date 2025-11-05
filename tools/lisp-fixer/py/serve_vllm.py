#!/usr/bin/env python3
# GPL-3.0-only
import argparse

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--model", required=True, help="HF model id")
    p.add_argument("--adapters", help="LoRA adapters path")
    args = p.parse_args()
    
    print("vLLM inference server stub - implement with structured decoding")
    print(f"Model: {args.model}")
    if args.adapters:
        print(f"Adapters: {args.adapters}")

if __name__ == "__main__":
    main()