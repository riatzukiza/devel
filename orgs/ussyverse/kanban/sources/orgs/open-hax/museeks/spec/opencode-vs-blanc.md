# Parallel Examples: OpenCode vs Blanc

## Task: Create a "Hello World" function in Python

### OpenCode

```bash
# Interactive mode (TUI)
opencode
> /write Create a hello_world.py file with a hello function
```

```bash
# Direct command
opencode run "Create a hello_world.py file with a hello function"
```

```bash
# With specific model
opencode run "Create a hello_world.py file with a hello function" -m ollama/llama3.2
```

```bash
# Continue previous session
opencode --continue
```

```bash
# List/switch sessions
opencode agent list
opencode --session abc123
```

### Blanc (Simple Agent CLI)

```bash
# Start interactive session
blanc
> Create a hello_world.py file with a hello function
```

```bash
# Direct prompt
blanc ask "Create a hello_world.py file with a hello function"
```

```bash
# With model
blanc ask "Create a hello_world.py file with a hello function" --model llama3.2
```

```bash
# Continue session
blanc continue
```

```bash
# List sessions
blanc sessions
blanc sessions --continue abc123
```

---

## Task: Start a New Session with Context

### OpenCode

```bash
# Start with project context
opencode /path/to/project

# TUI mode: automatically loads project context
opencode

# Share session
/share
```

### Blanc

```bash
# Start with directory context
blanc --directory /path/to/project

# Simple mode: just the prompt, no auto-context
blanc
> Create a hello function

# Context is explicit
blanc ask "Create a hello function" --context /path/to/project
```

---

## Task: Multi-turn Conversation

### OpenCode

```bash
opencode
> Write a Python function to add two numbers
> Now make it handle lists of numbers
> Add error handling for non-numeric input
```

```bash
# Programmatic multi-turn
opencode run "Write a Python function to add two numbers"
opencode run "Now make it handle lists of numbers" --continue
opencode run "Add error handling for non-numeric input" --continue
```

### Blanc

```bash
blanc
> Write a Python function to add two numbers
> Now make it handle lists of numbers
> Add error handling for non-numeric input
```

```bash
# Programmatic multi-turn
blanc ask "Write a Python function to add two numbers"
blanc continue --prompt "Now make it handle lists of numbers"
blanc continue --prompt "Add error handling for non-numeric input"
```

---

## Task: Use a Tool (e.g., Run Tests)

### OpenCode

```bash
opencode
> /run Run the tests and fix any failures
```

```bash
# Direct command with tool invocation
opencode run "Run the tests and fix any failures"
```

```bash
# Built-in command
/test
```

### Blanc

```bash
blanc
> Run the tests and fix any failures

# Agent would need to invoke tools explicitly
> /tool run-tests
> /tool execute npm test
```

---

## Key Differences

| Feature | OpenCode | Blanc |
|---------|----------|-------|
| **Complexity** | Full-featured agent with many tools | Dead-simple agent CLI |
| **Session Management** | Multi-session, advanced state management | Simple session start/continue |
| **Tools** | Rich tool ecosystem (git, tests, LSP, etc.) | Basic tool invocation |
| **Context** | Auto-loads project context, LSP | Explicit context passing |
| **Commands** | Custom commands (`/test`, `/init`, `/share`) | Minimal commands |
| **Integration** | IDE extensions, desktop app, terminal | CLI-only |
| **Parallel** | Multi-agent collaboration | Single-agent sessions |

---

## Museeks (Mu) - The Client Layer

Museeks can connect to either backend:

```bash
# Use OpenCode as backend
mu --backend opencode search "hello function"
mu --backend opencode ask "What's in hello_world.py?"

# Use Blanc as backend
mu --backend blanc search "hello function"
mu --backend blanc ask "What's in hello_world.py?"

# Auto-switch based on task
mu search "hello function"  # uses indexed search
mu ask complex-task          # routes to OpenCode (rich tools)
mu ask simple-question      # routes to Blanc (fast, simple)
```
