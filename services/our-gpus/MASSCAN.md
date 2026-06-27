# Masscan configuration for our-gpus

Masscan is an alternative to Shodan for discovering Ollama servers. It actively scans public IP ranges for open port 11434, offering fresh data at the cost of network egress and scan time.

## Tor mode
The `docker-compose.tor.yml` overlay routes HTTP probe traffic through `privoxy -> tor`, but raw `masscan` traffic is intentionally blocked in that mode.

Reason: `masscan` uses raw packet sockets and cannot be honestly treated as Tor-relayed HTTP/TCP client traffic. The overlay prefers failing closed over silently leaking direct egress.

## Scan strategies
The API now supports two scan strategies on `POST /api/masscan`:

- `masscan`: raw packet scan, requires direct egress, always passes `--exclude-file`
- `tor`: HTTP/Tor discovery scan, expands the target into allowed hosts after exclusions and probes them through the Tor relay stack

Both strategies refuse to run if the exclusion file is missing or empty.

The runtime now supports layered exclusions via `OUR_GPUS_EXCLUDE_FILES`, which defaults to:

```bash
/app/excludes.conf,/app/excludes.generated.conf
```

Refresh the generated layer from AWS, GCP, and Cloudflare with:

```bash
cd /home/err/devel/orgs/shuv/our-gpus
uv run python cli/refresh_dynamic_excludes.py \
  --output /home/err/devel/services/our-gpus/excludes.generated.conf
```

## Files

| File | Purpose |
|------|---------|
| `masscan.conf` | Base masscan configuration |
| `excludes.conf` | Ranges to never scan (RFC 5735, abuse complaints, military, edu) |
| `run-masscan.sh` | Wrapper script with usage helpers |

## Quick start

```bash
cd /home/err/devel/services/our-gpus

# Scan a specific range (requires sudo for raw sockets)
sudo ./run-masscan.sh 192.168.0.0/16

# Lower rate to reduce network impact
sudo ./run-masscan.sh --rate 50000 10.0.0.0/8
```

## Scanning the full internet

```bash
# WARNING: High bandwidth and rate required
# Only run with appropriate network consent/authorization
sudo ./run-masscan.sh --rate 200000 0.0.0.0/0
```

## Ingest results

Masscan outputs JSON in greppable format. Convert to ip:port format:

```bash
# Extract ip:port pairs from JSON (greppable format is one object per line)
jq -r '.ip + ":" + (.ports[].port | tostring)' masscan-results/scan-results.json \
  > results.txt
```

## Excludes

The `excludes.conf` file contains:
- **RFC 5735 special-use addresses** (private, loopback, link-local)
- **Abuse complaint ranges** (companies that complained about port scans)
- **US military/government** (DoD ranges 6.x, 7.x, 11.x, etc.)
- **UK Janet research network** (academic exclusion list)

These exclusions are loaded automatically by `run-masscan.sh`.

## Rate considerations

| Rate | Bandwidth | Est. full-internet time |
|------|-----------|------------------------|
| 50,000 | ~50 Mbps | 6+ hours |
| 100,000 | ~100 Mbps | 3+ hours |
| 200,000 | ~200 Mbps | ~90 minutes |

Start with a limited range at low rate before attempting large scans.

## Comparing with Shodan

| Aspect | Masscan | Shodan |
|--------|---------|--------|
| Freshness | Real-time | Indexed historically |
| Coverage | Configurable | Pre-indexed |
| Cost | Bandwidth only | API credits |
| Legal | Requires authorization | Passive collection |
| Speed | Hours for full scan | Instant queries |
