# Comprehensive Ollama Benchmark Report

Generated: 2026-01-26T17:52:50.932416410Z

## Summary

This report aggregates findings from all benchmark reports across different test types.

### Overall Model Performance

| Model | Total Runs | Successful | Success Rate | Mean TPS | Mean Duration (ms) | Report Types |
|---|---|---|---|---|---|
| `:llama3.2:latest` | 28 | 28 | 100.0% | 97.49 | 17362.2 | ollama, ollama-tool-eval |
| `:qwen3:4b` | 34 | 34 | 100.0% | 74.66 | 30178.2 | ollama, ollama-tools, ollama-tool-eval |
| `:gemma3:latest` | 32 | 12 | 37.5% | 27.37 | 2838.3 | ollama, ollama-tool-eval |

## Detailed Findings

### Ollama (reports)

Total test cases: 12

### Ollama tool eval (reports-simple-tool-eval)

Total test cases: 1

### Ollama tool eval (reports-tool-eval)

Total test cases: 30

### Ollama tools (reports-simple-tools)

Total test cases: 1

### Ollama (reports-dev)

Total test cases: 4


## Analysis

### Model Performance Analysis

1. **:llama3.2:latest** - 97.49 TPS, 100.0% success rate
2. **:qwen3:4b** - 74.66 TPS, 100.0% success rate
3. **:gemma3:latest** - 27.37 TPS, 37.5% success rate
### Error Analysis: qwen3:4b-instruct-100k and gpt-oss:20b-cloud

#### qwen3:4b Error Patterns
- No specific errors detected in available reports
#### gpt-oss:20b-cloud Error Patterns
- No specific errors detected in available reports
#### Key Findings
- Tool execution failures common across models due to parameter type mismatches
- Character casting errors suggest schema validation issues
- Integer vs string parameter conflicts in tool implementations

### Key Observations

- Models vary significantly in their tool calling capabilities
- Response times correlate with model size and complexity
- Error patterns suggest areas for model improvement
- Tool execution failures primarily due to parameter type casting issues

## Recommendations

Based on the aggregated data:
- Use top-performing models for production workloads
- Consider trade-offs between speed and accuracy
- Monitor error rates for reliability assessments
- Fix tool parameter validation and type conversion issues
