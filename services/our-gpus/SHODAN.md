# Shodan query pack for our-gpus

This service can ingest a plain text file with one `ip:port` pair per line.
That is the simplest handoff format to ask for from Shodan because `cli/ingest_json.py --auto-detect` accepts it directly.

## Recommended exact queries

### 1. High-recall seed query
Use this first if the goal is to find as many candidate Ollama hosts as possible:

```text
port:11434
```

Why: Ollama's default API port is `11434`, and the app already knows how to probe candidates and classify non-Ollama hits.

### 2. Higher-precision candidate query
Use this if Shodan has indexed recognizable Ollama HTTP content:

```text
port:11434 http.html:"Ollama"
```

### 3. Alternate precision query
Use this if the HTML query is too sparse but title matching works better in the account/region:

```text
port:11434 http.title:"Ollama"
```

## Exact CLI commands

### Download raw Shodan results
```bash
shodan download our-gpus-port11434 'port:11434'
shodan download our-gpus-ollama-html 'port:11434 http.html:"Ollama"'
shodan download our-gpus-ollama-title 'port:11434 http.title:"Ollama"'
```

### Convert to the ingestable `ip:port` format
```bash
shodan parse --fields ip_str,port --separator : our-gpus-port11434.json.gz > our-gpus-port11434.txt
shodan parse --fields ip_str,port --separator : our-gpus-ollama-html.json.gz > our-gpus-ollama-html.txt
shodan parse --fields ip_str,port --separator : our-gpus-ollama-title.json.gz > our-gpus-ollama-title.txt
```

## Local ingest

Drop any of the generated `*.txt` files into:

```text
services/our-gpus/imports/
```

Then ingest from the service directory:

```bash
cd /home/err/devel/services/our-gpus
docker compose exec api \
  python /workspace/source/cli/ingest_json.py /workspace/imports/our-gpus-port11434.txt --auto-detect
```

You can then probe the discovered hosts:

```bash
docker compose exec api \
  python /workspace/source/cli/rescan_hosts.py --all --concurrency 50
```

## Notes
- `port:11434` is the safest baseline query because it does not depend on Shodan having captured a specific page body or title.
- The higher-precision queries are useful when you want fewer false positives before probing.
- Keeping the raw `*.json.gz` export is still valuable even if the first ingest uses only `ip:port` lines.

## References
- Shodan search syntax: `filter:value` query model and quoting rules.
- Shodan parse workflow: `shodan parse --fields ... --separator ... <file.json.gz>`.
- Ollama default API base URL and default port `11434`.