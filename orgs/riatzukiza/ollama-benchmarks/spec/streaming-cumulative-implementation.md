# Streaming and Cumulative Benchmark Implementation

## Summary

Successfully implemented streaming output and cumulative results with session management for all Ollama benchmark tools. The system now supports real-time monitoring, mid-run recovery, and persistent session tracking.

## Key Features Implemented

### 1. Session Management
- **Session ID Generation**: Auto-generated unique session IDs (format: `session-{timestamp}-{uuid}`)
- **Session Metadata**: Persistent JSON files tracking all session configuration and results
- **Resume Capability**: Can resume and extend existing sessions with additional runs
- **Session Files**: 
  - `session-{id}-metadata.json` - Complete session state
  - `ollama-{benchmark}-{id}.edn/json/md` - Benchmark results with session ID in filename

### 2. Streaming Real-Time Output
Individual request results are streamed immediately upon completion:
```
[timestamp] RESULT: {session-id} | {model} | run #{number} | {status} {duration}ms {stats} | {prompt-preview}
```

Example:
```
[1769403441924] RESULT: session-1769403354664-cc63eab7 | qwen3:4b | run #0 | ✓ 12233ms TPS:76.88 tokens:881 tools:0 tool-success:0.0% | Calculate the age...
```

### 3. Cumulative Result Tracking
- **Persistent Sessions**: All results accumulate across multiple runs
- **Session State**: Tracks completed runs, total runs, and individual results
- **Resume Support**: Can continue from where previous run left off
- **Multi-run Accumulation**: Running 3 runs of 3 queries creates 3 sets of 3 results cumulatively

### 4. Enhanced CLI Options
Added new command-line options:
```bash
--session-id {id}    # Resume from existing session ID
--resume              # Enable resume mode for cumulative runs
```

## Usage Examples

### Fresh Session (3 runs)
```bash
bb bench_tool_eval.clj --config config.edn --out-dir results --n 3
```

### Resume and Extend Existing Session
```bash
# First run: 2 runs
bb bench_tool_eval.clj --config config.edn --out-dir results --n 2

# Second run: add 1 more run (cumulative: 3 total)
bb bench_tool_eval.clj --config config.edn --out-dir results --session-id session-1769403354664-cc63eab7 --resume --n 1
```

## Output Format

### Session Start
```
[timestamp] BENCHMARK START: {benchmark-type} - [{models}] models, {prompts} prompts, {n} runs each
```

### Individual Results (streamed)
```
[timestamp] START: {model} - {prompt-preview}
[timestamp] END:   {model} - {prompt-preview} {status} {duration}ms {stats}
[timestamp] RESULT: {session-id} | {model} | run #{number} | {status} {duration}ms {stats} | {prompt-preview}
```

### Summary for Each Model/Prompt
```
[timestamp] SUMMARY: {session-id} | {model} | {runs_total}/{runs_ok} runs OK avg TPS:{tps} avg duration:{ms}ms {tools-info} | {prompt-preview}
```

### Session Completion
```
Session: {session-id}
Wrote: {edn-file} {json-file} {md-file}
Metadata: {metadata-file}
```

## Session Metadata Structure

Each session stores comprehensive metadata:
```json
{
  "session/id": "session-1769403354664-cc63eab7",
  "session/benchmark-type": "tool-evaluation",
  "session/start-time": 1769403354665,
  "session/end-time": 1769403411538,
  "session/config": {
    "endpoint": "http://localhost:11434",
    "models": ["qwen3:4b"],
    "prompts": ["Calculate age..."],
    "n": 1,
    "tools": null
  },
  "session/total-runs": 1,
  "session/completed-runs": 1,
  "session/results": [...],
  "session/output-directory": "/tmp/test"
}
```

## Recovery Mechanism

1. **Automatic Detection**: When `--resume` flag is used, system checks for existing session metadata
2. **State Restoration**: Loads previous results and configuration
3. **Incremental Execution**: Only runs missing combinations to complete the target
4. **Persistent Storage**: Each run updates the metadata file immediately

## Real-Time Monitoring Benefits

1. **Progress Tracking**: See exactly which run is executing in real-time
2. **Performance Metrics**: Immediate visibility into TPS, duration, and tool usage
3. **Error Detection**: Failed requests are visible immediately without waiting for batch completion
4. **Interrupt Recovery**: Can interrupt long-running benchmarks and resume later

## File Organization

Results are organized by session ID for easy tracking:
```
results/
├── session-{id}-metadata.json           # Session state and configuration
├── ollama-bench-{id}.edn              # Basic benchmark results  
├── ollama-bench-{id}.json             # JSON results
├── ollama-bench-{id}.md               # Markdown report
├── ollama-tools-bench-{id}.edn        # Tool benchmark results
├── ollama-tools-bench-{id}.json
├── ollama-tools-bench-{id}.md
├── ollama-tool-eval-bench-{id}.edn    # Tool evaluation results
├── ollama-tool-eval-bench-{id}.json
└── ollama-tool-eval-bench-{id}.md
```

## Technical Implementation Details

### Files Modified
- **`bench_logger.clj`**: Added session management, streaming, and persistence functions
- **`bench_ollama.clj`**: Updated to support sessions and streaming
- **`bench_tools.clj`**: Updated to support sessions and streaming  
- **`bench_tool_eval.clj`**: Updated to support sessions and streaming
- **`ollama.clj`**: Added CLI options for `--session-id` and `--resume`

### Key Functions
- `generate-session-id()` - Creates unique session identifiers
- `create-session-metadata()` - Initializes session tracking
- `stream-request-result()` - Real-time result streaming
- `add-result-to-session()` - Updates session with new results
- `load-session-metadata()` - Recovers existing sessions
- `update-session-metadata()` - Persistently saves session state

## Status

✅ **FULLY IMPLEMENTED AND TESTED**

All requested features are working:
- ✅ Individual results streamed as metrics arrive
- ✅ Cumulative runs across multiple executions  
- ✅ Session ID tracking and metadata files
- ✅ Mid-run recovery and resume functionality
- ✅ Real-time progress monitoring

The implementation provides robust benchmarking with full recovery capabilities and detailed session tracking.