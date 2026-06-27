# OpenPlanner Scripts

Standalone utility scripts for OpenPlanner operations.

## translation-worker.ts

Consumes `translation_jobs` from MongoDB and produces `translation_segments` for the review workflow.

### Usage

```bash
# Install dependencies first
pnpm install

# Run with environment variables
MONGODB_URI=mongodb://localhost:27017 \
MONGODB_DB=openplanner \
MT_PROVIDER_URL=http://localhost:8789 \
MT_PROVIDER_API_KEY=your-key \
MT_PROVIDER_MODEL=gpt-4o-mini \
pnpm translation-worker
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGODB_URI` | `mongodb://localhost:27017` | MongoDB connection URI |
| `MONGODB_DB` | `openplanner` | Database name |
| `MT_PROVIDER_URL` | `http://localhost:8789` | Machine translation service URL |
| `MT_PROVIDER_API_KEY` | - | API key for MT service |
| `MT_PROVIDER_MODEL` | `gpt-4o-mini` | Model to use for translation |
| `TRANSLATION_POLL_MS` | `5000` | Polling interval in milliseconds |
| `TRANSLATION_BATCH_SIZE` | `100` | Maximum segments per document |
| `TRANSLATION_SEGMENT_SIZE` | `500` | Maximum characters per segment |

### How It Works

1. Polls `translation_jobs` collection for documents with `status: "queued"`
2. Fetches document text from `events` collection
3. Splits text into segments respecting sentence boundaries
4. Calls MT service (OpenAI-compatible chat completion API) for each segment
5. Writes translated segments to `translation_segments` collection
6. Updates job status to `complete` or `failed`

### MT Service Compatibility

The worker uses the OpenAI chat completion API format. Any compatible service can be used:

- OpenAI (gpt-4o-mini, gpt-4o, etc.)
- Open Hax proxy (proxx)
- Ollama with OpenAI compatibility
- LibreTranslate with OpenAI compatibility
- Any other OpenAI-compatible endpoint

### Running as a Service

For production, run as a systemd service or Docker container:

```bash
# Docker compose example
docker run -d \
  --name translation-worker \
  -e MONGODB_URI=mongodb://mongo:27017 \
  -e MT_PROVIDER_URL=http://proxx:8789 \
  -e MT_PROVIDER_API_KEY=${OPEN_HAX_OPENAI_PROXY_AUTH_TOKEN} \
  openplanner-worker:latest \
  pnpm translation-worker
```
