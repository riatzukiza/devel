#!/usr/bin/env bash
# Full benchmark testing (10 models, 10 prompts)
bb bench_ollama.clj --config config.edn --out-dir reports -n 3
# Tool calling evaluation with default tools (schema only)
bb bench_tools.clj --config config.tools.edn --tools tools.clj --out-dir reports-tools -n 2
# Tool calling with custom config and tools
bb bench_tools.clj --config my-config.edn --tools my-tools.clj --out-dir results -n 3
# Advanced tool evaluation with implementations (def-tool format)
bb bench_tool_calling.clj --model qwen3:4b --tools my_bench_tools.clj --out-dir reports-tool-calling -n 1
