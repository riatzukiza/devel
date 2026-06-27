# Ollama benchmark


| Model             | Prompt                                                                            | Runs | OK  | Mean TPS | Mean Duration (ms) |
| ----------------- | --------------------------------------------------------------------------------- | ---- | --- | -------- | ------------------ |
| `qwen3:4b`        | Hello world                                                                       | 2    | 2   | 77.07    | 10116.0            |
| `qwen3:4b`        | Explain babashka in two sentences.                                                | 2    | 2   | 75.04    | 19045.0            |
| `qwen3:4b`        | Write a simple Python function to calculate factorial.                            | 2    | 2   | 70.43    | 50090.0            |
| `qwen3:4b`        | What are the main differences between functional and object-oriented programming? | 2    | 2   | 72.91    | 30836.5            |
| `llama3.2:latest` | Hello world                                                                       | 2    | 2   | 88.63    | 2724.5             |
| `llama3.2:latest` | Explain babashka in two sentences.                                                | 2    | 2   | 101.57   | 1139.0             |
| `llama3.2:latest` | Write a simple Python function to calculate factorial.                            | 2    | 2   | 101.33   | 2142.5             |
| `llama3.2:latest` | What are the main differences between functional and object-oriented programming? | 2    | 2   | 99.40    | 5821.5             |
| `gemma3:latest`   | Hello world                                                                       | 2    | 2   | 73.42    | 13635.0            |
| `gemma3:latest`   | Explain babashka in two sentences.                                                | 2    | 2   | 75.45    | 1268.0             |
| `gemma3:latest`   | Write a simple Python function to calculate factorial.                            | 2    | 2   | 73.08    | 8450.0             |
| `gemma3:latest`   | What are the main differences between functional and object-oriented programming? | 2    | 2   | 72.28    | 15119.5            |
|                   |                                                                                   |      |     |          |                    |

