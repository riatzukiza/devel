# Comprehensive Ollama Benchmark Report

Generated: 2026-01-26T06:59:43.616697921Z

## Summary

This report aggregates findings from all benchmark reports across different test types.

### Overall Model Performance

| Model | Total Runs | Successful | Success Rate | Mean TPS | Mean Duration (ms) | Report Types |
|---|---|---|---|---|---|

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
