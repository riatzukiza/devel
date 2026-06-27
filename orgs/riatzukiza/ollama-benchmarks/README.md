# Ollama Benchmarks

A comprehensive benchmarking suite for evaluating Ollama models with text generation and tool calling capabilities.

## ✨ Key Features

- **🔄 Real-time Streaming**: Watch results appear as each request completes
- **💾 Session Management**: Resume interrupted benchmarks without data loss  
- **📊 Cumulative Results**: Multiple runs build better statistics
- **🚀 High Performance**: Native Clojure execution for reliability
- **📈 Advanced Analytics**: Comprehensive aggregation and reporting

## 🔥 Quick Start

```bash
# Install dependencies and run basic benchmark
clj -M -m bench-ollama --config config.dev.edn --out-dir reports -n 3

# Aggregate all results for analysis  
clj -M -m aggregate-reports aggregated-reports
```

## Requirements

- **Clojure** (JDK 17+ required)
- **Ollama server** running locally or at specified endpoint  
- **Models** pulled in Ollama (e.g., `ollama pull llama3`)

### Installation

```bash
# Install Clojure (if not already installed)
curl -L -O https://github.com/clojure/brew-install/releases/latest/download/linux-install.sh
chmod +x linux-install.sh
sudo ./linux-install.sh

# Or using package manager
sudo apt install clojure  # Ubuntu/Debian
brew install clojure          # macOS
```

## Setup

1. Clone this repository
2. Install Clojure (see Installation section above)
3. Configure your models and prompts in `config.edn`
4. Run the benchmark

## Configuration

Edit `config.edn` for full benchmarks or use `config.dev.edn` for quick testing:

```clojure
{:endpoint "http://localhost:11434"  ; Ollama server URL
 :models   ["qwen3:4b" "llama3.2:latest" "gemma3:latest"]   ; Models to benchmark
 :prompts  ["Hello world"            ; Prompts to test
             "Explain babashka in two sentences."
             "Write a simple Python function to calculate factorial."]}
```

### Quick Development Testing
For faster testing, use `config.dev.edn` which includes only 2 models and 2 prompts:

```bash
clj -M -m bench-ollama --config config.dev.edn --out-dir reports-dev -n 2
```

## PM2

To run the default benchmark suites via PM2:

```bash
pm2 start ecosystem.config.cjs
```

Dev watch mode:

```bash
pm2 start ecosystem.dev.config.cjs
```

Logs:

- `logs/pm2/basic.out.log` / `logs/pm2/basic.err.log`
- `logs/pm2/tools.out.log` / `logs/pm2/tools.err.log`
- `logs/pm2/tool-calling.out.log` / `logs/pm2/tool-calling.err.log`
- `logs/pm2/dev.out.log` / `logs/pm2/dev.err.log`

## Usage

### Regular Text Generation Benchmarks

```bash
# Quick development testing (2 models, 2 prompts)
clj -M -m bench-ollama --config config.dev.edn --out-dir reports-dev -n 2

# Full benchmark testing (10 models, 10 prompts)
clj -M -m bench-ollama --config config.edn --out-dir reports -n 3

# Custom number of runs per (model, prompt) combo
clj -M -m bench-ollama --config config.edn --out-dir reports -n 5
```

### Session Management & Cumulative Runs

```bash
# Start new session (auto-generates session ID)
clj -M -m bench-ollama --config config.edn --out-dir reports -n 3

# Resume existing session and add more runs
clj -M -m bench-ollama --config config.edn --out-dir reports -n 2 --session-id session-xxx --resume

# Resume with specific session ID
clj -M -m bench-ollama --config config.edn --out-dir reports -n 1 --session-id my-custom-session --resume
```

**Key Features:**
- **Real-time Streaming**: Results appear immediately as each request completes
- **Session Persistence**: All results saved to `session-{id}-metadata.json`
- **Recovery**: Resume interrupted sessions without losing data
- **Cumulative**: Multiple runs append to same session for better statistics

### Tool Calling Benchmarks

```bash
# Tool calling evaluation with default tools (schema only)
clj -M -m bench-tools --config config.tools.edn --tools tools.clj --out-dir reports-tools -n 2

# Tool calling with custom config and tools
clj -M -m bench-tools --config my-config.edn --tools my-tools.clj --out-dir results -n 3

# Advanced tool evaluation with implementations (def-tool format)
clj -M -m bench-tool-calling --model qwen3:4b --tools my_bench_tools.clj --out-dir reports-tool-calling -n 1

# Legacy tool evaluation (deprecated)
clj -M -m bench-tool-eval --config config.tool_eval.edn --tools tools_with_impl.clj --out-dir reports-tool-eval -n 2

# Help
clj -M -m bench-ollama --help
clj -M -m bench-tools --help
clj -M -m bench-tool-calling --help
```

## Output

The benchmark scripts generate multiple files:

### Session Files
- `session-{id}-metadata.json` - Session metadata with cumulative results and state

### Benchmark Results  
- `ollama-bench-{session-id}.json` - Raw JSON data with all runs and metrics
- `ollama-bench-{session-id}.edn` - Same data in EDN format for Clojure consumption  
- `ollama-bench-{session-id}.md` - Human-readable markdown report with summary table

### Real-time Output
During execution, you'll see:
- Individual request results as they complete (session ID, model, run number, metrics)
- Progress summaries for each model/prompt combination  
- Session start/end notifications with completion statistics

### Migration from Babashka

The benchmark suite has been migrated from Babashka to Clojure proper for:
- **Better Performance**: Native JVM execution for long-running benchmarks
- **Enhanced Session Management**: Robust state persistence and recovery
- **Improved Error Handling**: Better exception handling and debugging
- **Cross-platform Compatibility**: Works anywhere Java runs

**Breaking Changes:**
- All commands now use `clj -M` instead of `bb`
- Session files use JSON instead of EDN for metadata
- Some CLI argument formats updated (see examples above)

### Report Formats

#### Regular Text Generation (`ollama-bench.md`)
| Model | Prompt | Runs | OK | Mean TPS | Mean Duration (ms) |
|---|---|---|---|---|---|
| `llama3` | Hello world | 3 | 3 | 0.00 | 1250.0 |
| `llama3` | Explain babashka in two sentences. | 3 | 3 | 0.00 | 2100.0 |

#### Tool Calling (`ollama-tools-bench.md`)
| Model | Prompt | Runs | OK | Tool Calls | Success Rate | Mean TPS | Mean Duration (ms) |
|---|---|---|---|---|---|---|---|
| `qwen3:4b` | What's the weather in Tokyo? | 3 | 3 | 1.0 | 100.0% | 45.2 | 3200.0 |
| `qwen3:4b` | Send email to team about deadline | 3 | 3 | 1.0 | 100.0% | 38.7 | 4100.0 |

#### Tool Evaluation with Implementations (`ollama-tool-eval-bench.md`)
| Model | Prompt | Runs | OK | Tools Valid | Tools Exec | Success Rate | Mean TPS | Mean Duration (ms) |
|---|---|---|---|---|---|---|---|---|
| `qwen3:4b` | Calculate age for someone born in 1990 | 3 | 3 | 3 | 3 | 100.0% | 52.1 | 2800.0 |
| `qwen3:4b` | Create a Python script for factorial | 3 | 3 | 2 | 2 | 66.7% | 41.3 | 3500.0 |

### Example Report

| Model | Prompt | Runs | OK | Mean TPS | Mean Duration (ms) |
|---|---|---|---|---|---|
| `llama3` | Hello world | 3 | 3 | 0.00 | 1250.0 |
| `llama3` | Explain babashka in two sentences. | 3 | 3 | 0.00 | 2100.0 |

## Metrics

Each run captures:
- **Duration**: Total response time in milliseconds
- **Metrics**: Ollama's internal metrics (eval_count, eval_duration)
- **TPS**: Tokens per second (when available)
- **Success**: Whether the API call succeeded

### Tool Calling Specific Metrics

In addition to the above metrics, tool calling benchmarks include:
- **Tool Calls**: Number of tool calls made per response
- **Success Rate**: Percentage of runs that successfully used tools when prompted
- **Tool Analysis**: Detailed breakdown of tool usage patterns

### Tool Evaluation with Implementations Metrics

The tool evaluation benchmark (`bench_tool_eval.clj`) includes enhanced metrics:
- **Tool Execution**: Actual execution of tool implementations with real data processing
- **Exec Success**: Percentage of tool executions that completed successfully
- **Tool Results**: Actual results from tool implementations (mock data for benchmarking)
- **End-to-End Testing**: Full pipeline from tool selection to execution to result handling

## Tool Definitions

### Legacy Format (`tools.clj`)

The `tools.clj` file contains 8 example tools:
- `calculate_age`: Calculate age from birth year
- `get_weather`: Get weather for a location
- `create_file`: Create files with specified content
- `send_email`: Send emails with priority levels
- `query_database`: SQL database queries
- `generate_code`: Code generation in multiple languages
- `analyze_sentiment`: Text sentiment analysis
- `convert_currency`: Currency conversion

### Modern Format (`my_bench_tools.clj`)

The `my_bench_tools.clj` file uses the new `def-tool` macro system that provides:

**✅ Tool Definitions**: JSON schema for each tool
**✅ Implementations**: Actual working functions that get executed
**✅ Test Cases**: Optional benchmark cases with expected tool+arguments
**✅ Registry System**: Dynamic loading and validation

**Available Tools:**
- `get_temperature`: Weather lookup with city parameter
- `calculate_age`: Age calculation with optional current year
- `create_file`: File creation with directory support  
- `send_email`: Email sending with priority levels
- `query_database`: Mock database queries with filtering
- `generate_code`: Code generation for Python, JavaScript, Java
- `analyze_sentiment`: Text sentiment analysis with word counting
- `convert_currency`: Currency conversion with mock rates

**Key Features:**
- **Agent Loop**: Multi-turn conversations until tool calls stop
- **Validation**: Checks tool call structure and required arguments  
- **Execution**: Actually runs tool implementations with real data
- **Scoring**: Metrics for validity, execution, and expectation matching

You can create custom tools using the `def-tool` macro:

```clojure
(ns my.tools
  (:require [ollama.tools :refer [def-tool]]))

(def-tool my_custom_tool
  {:description "My custom tool"
   :parameters {:type :object
                :required [:input]
                :properties {:input {:type :string :description "Input parameter"}}}}
  [{:keys [input]}]
  {:result (str "Processed: " input)})
```

This enables testing both the model's tool selection abilities AND the actual tool implementations.

### Report Aggregation

Generate a comprehensive report aggregating all benchmark results:

```bash
# Aggregate all reports from reports/ directories
clj -M -m aggregate-reports aggregated-reports

# Specify custom output directory
clj -M -m aggregate-reports my-aggregated-reports
```

This creates:
- `all-reports.json` - Combined raw data from all report directories
- `model-stats.json` - Model performance statistics across all tests  
- `comprehensive-report.md` - Human-readable analysis with rankings and insights

### Session-Based Analysis

The aggregation system now works with session-based results:
- Each session contains cumulative runs across multiple executions
- Results are organized by model/prompt combinations
- Statistical significance improves with more data points
- Supports interrupted/restarted benchmark workflows

## Dependencies

### Clojure Dependencies
Dependencies are managed through `deps.edn`:
- `org.clojure/clojure` - Core Clojure runtime
- `clj-http/clj-http` - HTTP client for API requests
- `cheshire/cheshire` - JSON parsing and generation
- `org.clojure/tools.cli` - Command-line argument parsing
- `org.clojure/tools.logging` - Logging framework

### Session Management
- Session metadata stored in JSON format for cross-platform compatibility
- Real-time result streaming during benchmark execution
- Automatic session recovery from interruptions