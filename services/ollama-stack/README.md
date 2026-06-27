# Ollama Stack

Container-owned Ollama runtime exposed on host loopback.

Goals:

- keep `ollama` CLI usable on the host
- move the long-running server out of the host systemd daemon and into Docker
- reuse the existing model store in `/usr/share/ollama/.ollama`

Typical cutover:

```bash
sudo systemctl disable --now ollama
pnpm docker:stack up ollama
ollama ls
ollama ps
```

Non-disruptive dry run on another port:

```bash
OLLAMA_PORT=11435 pnpm docker:stack up ollama
OLLAMA_HOST=http://127.0.0.1:11435 ollama ls
```

The host `ollama` CLI already speaks HTTP to a local server, so once the container owns `127.0.0.1:11434`, the CLI continues to work without aliasing or wrappers.

This stack also publishes the service name `ollama` on the shared external Docker network `ai-infra`, so other containerized stacks can use `http://ollama:11434` instead of `host.docker.internal`.
