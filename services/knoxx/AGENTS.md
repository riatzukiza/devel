# FutureSight KMS Service Stack

Docker Compose stack for multi-tenant knowledge management system.

## Services

| Service | Port | Role |
|---------|------|------|
| ragussy | 8000, 5173 | RAG + inference + doc management |
| shibboleth | 3001 | DSL + labeling workflows |
| km-labels | 3002 | KM label bridge API |
| qdrant | 6333 | Vector database |
| postgres | 5432 | Metadata + label storage |
| redis | 6379 | Caching + job queues |

## Quick Start

```bash
# Create .env from template
cp .env.example .env

# Start stack
./start.sh --build --detach

# Follow logs
./start.sh --logs
```

## Environment Variables

See `.env.example` for all configuration options.

Key variables:
- `RAGUSSY_API_KEY` - API key for Ragussy
- `SHIBBOLETH_API_KEY` - API key for Shibboleth
- `KM_LABELS_API_KEY` - API key for km-labels
- `POSTGRES_USER/PASSWORD/DB` - Database credentials

## Development Mode

```bash
# Mount local code for development
./start.sh --dev --build
```

## License

GPL-3.0-only