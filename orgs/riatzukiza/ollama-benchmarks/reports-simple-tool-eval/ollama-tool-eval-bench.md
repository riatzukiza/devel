# Ollama Tool Evaluation Benchmark

| Model | Prompt | Runs | OK | Tools Called | Exec Success | Mean TPS | Mean Duration (ms) |
|---|---|---|---|---|---|---|---|
| `qwen3:4b` | Calculate the age of someone born in 1990. Use the calculate_age tool. | 1 | 1 | 0.0 | 0.0% | 77.18 | 21796.0 |

## Tool Execution Details

This benchmark evaluates each model's ability to not only call tools but also execute them correctly.

**Metrics:**
- **Tools Called**: Average number of tools invoked per response
- **Exec Success**: Percentage of tool executions that completed successfully
- **TPS**: Tokens per second generation speed
- **Duration**: Total response time including tool execution

