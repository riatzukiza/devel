# Benchmark Logging Implementation

## Summary

Successfully added comprehensive logging to all Ollama benchmark tools to track request lifecycle and performance statistics.

## Files Modified

### New File
- **`bench_logger.clj`** - Centralized logging utilities with functions for:
  - Request start logging with model, prompt preview, and tool count
  - Request end logging with duration, success status, and performance stats
  - Summary logging for each model/prompt combination
  - Benchmark suite start/end logging with overall statistics

### Updated Files
1. **`bench_ollama.clj`** - Regular benchmarking (no tools)
   - Added logging to `run-one` function (bench_ollama.clj:13-38)
   - Added logging to `bench-combo` function (bench_ollama.clj:44-59)
   - Added logging to main entry point (bench_ollama.clj:69-87)

2. **`bench_tools.clj`** - Tool calling benchmarking
   - Added logging to `run-one-tool-call` function (bench_tools.clj:11-52)
   - Added logging to `bench-tool-combo` function (bench_tools.clj:49-70)
   - Added logging to main entry point (bench_tools.clj:106-125)

3. **`bench_tool_eval.clj`** - Tool evaluation benchmarking  
   - Added logging to `run-one-tool-eval` function (bench_tool_eval.clj:274-322)
   - Added logging to `bench-tool-eval-combo` function (bench_tool_eval.clj:319-342)
   - Added logging to main entry point (bench_tool_eval.clj:351-372)

## Logging Output Examples

### Request Start
```
[1769402599404] START: qwen3:4b - Calculate the age of someone born in 1990. Use the calculate...
```

### Request End (with tool execution)
```
[1769402567267] END:   test-model - test prompt ✓ 1234ms TPS:15.50 tokens:150 tools:1 tool-success:100.0%
```

### Summary
```
[timestamp] SUMMARY: qwen3:4b tool-evaluation - 3/3 runs OK avg TPS:15.50 avg duration:1200ms 2 with tools success:100.0% avg tools:0.7
```

### Benchmark Suite
```
[timestamp] BENCHMARK START: tool-evaluation - [qwen3:4b] models, 1 prompts, 3 runs each
[timestamp] BENCHMARK END: tool-evaluation - 3 runs completed in 4500ms (0.67 runs/sec)
```

## Key Features

1. **Timestamp Logging**: All log entries include Unix timestamps for precise timing analysis
2. **Request Tracking**: Each request gets a unique ID for correlation (though not displayed in output)
3. **Prompt Truncation**: Long prompts are truncated to 60 characters for readability
4. **Statistical Highlights**: Key performance metrics are extracted and displayed:
   - Duration in milliseconds
   - Tokens per second (TPS)
   - Token counts  
   - Tool usage statistics
   - Success rates

5. **Multi-level Logging**: 
   - Individual request start/end
   - Per-model/prompt combination summaries
   - Overall benchmark suite statistics

## Status

✅ **COMPLETED** - All logging functionality implemented and tested successfully. The logging works correctly as demonstrated by the test run showing proper start, summary, and request-level logging output.

## Usage

Simply run any benchmark as before - logging is automatically enabled:

```bash
bb bench_ollama.clj --config config.edn --out-dir results --n 5
bb bench_tools.clj --config config.edn --tools tools.edn --out-dir results --n 5  
bb bench_tool_eval.clj --config config.edn --tools tools.edn --out-dir results --n 5
```

All existing functionality is preserved - logging is additive and doesn't interfere with normal benchmark execution or report generation.