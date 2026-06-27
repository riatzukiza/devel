## Development

```bash
# Install dependencies
pnpm install:all

# Start development servers (frontend on :8700, backend on :8787)
pnpm dev

# Build for production
pnpm build

# Start production backend
pnpm start
```

## Environment Setup

1. Copy `services/agentd/.env.example` to `services/agentd/.env`
2. Fill in your GitHub token and repo details:
   - `GITHUB_TOKEN`: Your personal GitHub access token
   - `REPO_PATH`: Local path to your target repository
   - `REPO_SLUG`: GitHub repo slug (e.g., "owner/repo")
3. Ensure the target repo is accessible locally at `REPO_PATH`

## Testing

Both frontend and backend build successfully:
- Frontend: `npx shadow-cljs compile app` ✅
- Backend: `pnpm build` ✅
- Backend API responds (requires valid GitHub token) ✅

## Documentation

- Backend (TypeScript): `pnpm docs:ts` → outputs to `docs/agentd-api`
- Frontend (ClojureScript): `pnpm docs:cljs` → outputs to `docs/opencode-reactant-api`
- Run both: `pnpm docs`

## Architecture

- Frontend: Reagent app connects via WebSocket to receive live events
- Backend: Node daemon handles GitHub API, git operations, and event broadcasting
- Events: Normalized event stream for UI updates and agent triggers
