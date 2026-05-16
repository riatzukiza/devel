#!/usr/bin/env python3
"""Benchmark TTFT and TPS for llama.cpp server."""

import json
import time
import statistics
import urllib.request
import sys

# Configuration
# Direct: http://127.0.0.1:8082/v1/chat/completions
# Proxx:  http://127.0.0.1:8789/v1/chat/completions
URL = "http://127.0.0.1:8789/v1/chat/completions"
MODEL = "gemma4-e4b"
MAX_TOKENS = 256
N_RUNS = 5

# A prompt that generates a substantial response reliably
PROMPT = "Write a detailed 5-paragraph essay about the history of artificial intelligence, from its early beginnings to modern deep learning. Include key figures, milestones, and breakthrough moments."


def benchmark_run(run_num):
    """Run a single benchmark iteration."""
    payload = {
        "model": MODEL,
        "messages": [{"role": "user", "content": PROMPT}],
        "max_tokens": MAX_TOKENS,
        "stream": True,
        "temperature": 0.7,
    }

    import os
    api_key = os.environ.get("PROXX_API_KEY", "")
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    req = urllib.request.Request(
        URL,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST",
    )

    start_time = time.perf_counter()
    first_token_time = None
    token_count = 0
    content_chunks = []

    response = urllib.request.urlopen(req, timeout=120)

    for line in response:
        line = line.decode("utf-8").strip()
        if not line or not line.startswith("data: "):
            continue

        data_str = line[6:]  # Remove "data: " prefix
        if data_str == "[DONE]":
            break

        try:
            data = json.loads(data_str)
        except json.JSONDecodeError:
            continue

        choices = data.get("choices", [])
        if not choices:
            continue

        delta = choices[0].get("delta", {})
        content = delta.get("content") or delta.get("reasoning_content", "")

        if content:
            if first_token_time is None:
                first_token_time = time.perf_counter()
            token_count += 1
            content_chunks.append(content)

    end_time = time.perf_counter()

    ttft = first_token_time - start_time if first_token_time else 0
    total_time = end_time - start_time
    generation_time = end_time - first_token_time if first_token_time else 0

    # Raw TPS: tokens / generation time only (after first token)
    raw_tps = token_count / generation_time if generation_time > 0 else 0

    # Effective TPS: tokens / total time (including TTFT)
    effective_tps = token_count / total_time if total_time > 0 else 0

    print(f"  Run {run_num}: TTFT={ttft:.3f}s, Tokens={token_count}, "
          f"Total={total_time:.3f}s, Raw TPS={raw_tps:.1f}, "
          f"Effective TPS={effective_tps:.1f}")

    return {
        "ttft": ttft,
        "token_count": token_count,
        "total_time": total_time,
        "generation_time": generation_time,
        "raw_tps": raw_tps,
        "effective_tps": effective_tps,
    }


def main():
    print(f"Benchmarking {MODEL} at {URL}")
    print(f"Prompt: {PROMPT[:80]}...")
    print(f"Max tokens: {MAX_TOKENS}, Runs: {N_RUNS}")
    print()

    results = []
    for i in range(1, N_RUNS + 1):
        try:
            result = benchmark_run(i)
            results.append(result)
        except Exception as e:
            print(f"  Run {i} failed: {e}")
            continue
        # Small delay between runs
        if i < N_RUNS:
            time.sleep(1)

    if not results:
        print("No successful runs!")
        sys.exit(1)

    print()
    print("=" * 60)
    print("SUMMARY")
    print("=" * 60)

    ttfts = [r["ttft"] for r in results]
    raw_tps_values = [r["raw_tps"] for r in results]
    effective_tps_values = [r["effective_tps"] for r in results]
    token_counts = [r["token_count"] for r in results]

    print(f"  TTFT (Time To First Token):")
    print(f"    Mean: {statistics.mean(ttfts):.3f}s")
    print(f"    Min:  {min(ttfts):.3f}s")
    print(f"    Max:  {max(ttfts):.3f}s")
    print(f"    Std:  {statistics.stdev(ttfts):.3f}s" if len(ttfts) > 1 else "")

    print(f"\n  Raw TPS (tokens/sec, excluding TTFT):")
    print(f"    Mean: {statistics.mean(raw_tps_values):.1f}")
    print(f"    Min:  {min(raw_tps_values):.1f}")
    print(f"    Max:  {max(raw_tps_values):.1f}")
    if len(raw_tps_values) > 1:
        print(f"    Std:  {statistics.stdev(raw_tps_values):.1f}")

    print(f"\n  Effective TPS (tokens/sec, including TTFT):")
    print(f"    Mean: {statistics.mean(effective_tps_values):.1f}")
    print(f"    Min:  {min(effective_tps_values):.1f}")
    print(f"    Max:  {max(effective_tps_values):.1f}")
    if len(effective_tps_values) > 1:
        print(f"    Std:  {statistics.stdev(effective_tps_values):.1f}")

    print(f"\n  Tokens generated per run:")
    print(f"    Mean: {statistics.mean(token_counts):.0f}")
    print(f"    Min:  {min(token_counts)}")
    print(f"    Max:  {max(token_counts)}")

    # JSON output for easy parsing
    summary = {
        "model": MODEL,
        "runs": N_RUNS,
        "ttft_ms": round(statistics.mean(ttfts) * 1000, 1),
        "ttft_std_ms": round(statistics.stdev(ttfts) * 1000, 1) if len(ttfts) > 1 else 0,
        "raw_tps": round(statistics.mean(raw_tps_values), 1),
        "raw_tps_std": round(statistics.stdev(raw_tps_values), 1) if len(raw_tps_values) > 1 else 0,
        "effective_tps": round(statistics.mean(effective_tps_values), 1),
        "effective_tps_std": round(statistics.stdev(effective_tps_values), 1) if len(effective_tps_values) > 1 else 0,
        "avg_tokens": round(statistics.mean(token_counts)),
    }
    print(f"\n  JSON: {json.dumps(summary)}")


if __name__ == "__main__":
    main()
