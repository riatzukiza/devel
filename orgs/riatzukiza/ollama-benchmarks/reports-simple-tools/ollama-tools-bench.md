# Ollama Tool Calling Benchmark

| Model | Prompt | Runs | OK | Tool Calls | Success Rate | Mean TPS | Mean Duration (ms) |
|---|---|---|---|---|---|---|---|
| `qwen3:4b` | What is the temperature in New York? Use the get_weather tool. | 1 | 1 | 1.0 | 100.0% | 72.20 | 15958.0 |

## Tool Call Details

This benchmark evaluates each model's ability to understand and use provided tools when prompted.

**Metrics:**
- **Tool Calls**: Average number of tool calls per response
- **Success Rate**: Percentage of successful runs that used tools appropriately
- **TPS**: Tokens per second generation speed
- **Duration**: Total response time including tool processing

