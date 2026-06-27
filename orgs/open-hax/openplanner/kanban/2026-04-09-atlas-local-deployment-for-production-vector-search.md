---
uuid: "orgs-open-hax-openplanner-kanban-orgs-open-hax-openplanner-specs-2026-04-09-atlas-local-deployment-for-production-vector-search-md"
title: "Atlas Local Deployment for Production Vector Search"
status: incoming
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:42.618Z"
source: "orgs/open-hax/openplanner/specs/2026-04-09-atlas-local-deployment-for-production-vector-search.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/specs/2026-04-09-atlas-local-deployment-for-production-vector-search.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/kanban/2026-04-09-atlas-local-deployment-for-production-vector-search.md`

# Atlas Local Deployment for Production Vector Search

Date: 2026-04-09
Status: implemented
Priority: P6 (post-core-product-stability)
Parent: `knowledge-ops-mongodb-vector-unification.md`

## Purpose

Enable native `$vectorSearch` and `$listSearchIndexes` in production deployments where GPU/NPU acceleration is not available. The current Community Search (`mongodb-community-server` + `mongodb-community-search`) container composition does not include the AtlasCLI control plane wiring required for index management commands.

## Problem statement

### Current state

- Local development uses `mongodb/mongodb-community-server:8.2.0` + `mongodb/mongodb-community-search:0.55.0`
- Transport layer is fixed: mongod ↔ mongot communicate via gRPC (`useGrpcForSearch: true`)
- `createSearchIndexes` and `$listSearchIndexes` fail with: "Using Atlas Search Database Commands... requires additional configuration. Please connect to Atlas or an AtlasCLI local deployment to enable."
- `$vectorSearch` executes but returns empty hits because no vector index exists
- Production deployments typically cannot rely on local GPU/NPU for vexx fallback

### Gap

The Community Search Docker image runs mongot but lacks the AtlasCLI local deployment bootstrap that enables:
- Search index management commands
- Native vector search index creation
- `$vectorSearch` with real index backing

## Goals

1. Enable native MongoDB `$vectorSearch` in production without GPU/NPU dependency
2. Support `createSearchIndexes` and `$listSearchIndexes` for operational index management
3. Maintain fallback to vexx/JS cosine scan for local development where GPU/NPU is available
4. Preserve the existing MongoDB data model and collection structure

## Non-goals

- Replacing the entire local dev stack with AtlasCLI immediately
- Requiring Atlas cloud account for local development
- Removing vexx as an optional acceleration layer

## Design

### Option A: AtlasCLI Local Deployment (Recommended)

Replace the separate `mongodb-community-server` + `mongodb-community-search` containers with `mongodb/mongodb-atlas-local` image for production deployments.

**Pros:**
- Official MongoDB approach for local Atlas Search/Vector Search
- Full `createSearchIndexes` and `$listSearchIndexes` support
- No separate mongot container orchestration
- Consistent with MongoDB's documented local development path

**Cons:**
- Different container image from current local dev
- Requires migration planning for existing MongoDB data volumes
- Less control over individual mongot version

**Implementation:**
```yaml
# docker-compose.production.yml
services:
  mongodb:
    image: mongodb/mongodb-atlas-local:latest
    ports:
      - "27017:27017"
    environment:
      - MONGODB_INITDB_ROOT_USERNAME=${MONGODB_ROOT_USERNAME}
      - MONGODB_INITDB_ROOT_PASSWORD=${MONGODB_ROOT_PASSWORD}
    volumes:
      - openplanner-atlas-data:/data/db
```

### Option B: AtlasCLI Sidecar for Index Management

Add an AtlasCLI sidecar container that bootstraps the local deployment wiring alongside the existing Community containers.

**Pros:**
- Preserves current container composition
- Incremental migration path

**Cons:**
- More complex orchestration
- Less documented/supported pattern
- May still have compatibility issues between Community and AtlasCLI components

### Option C: Hybrid Architecture

- Local development: Continue with Community Search + vexx fallback
- Production: Deploy AtlasCLI local or Atlas cloud

**Pros:**
- No immediate change to local dev workflow
- Production gets full vector search capability

**Cons:**
- Two different vector search paths to maintain
- Local dev cannot test production vector search behavior

## Recommended path

**Short-term (current):** Continue with Community Search + vexx/JS fallback for local development. Document the limitation clearly.

**Medium-term:** Create a parallel AtlasCLI local deployment profile for production-like testing.

**Long-term:** Migrate production deployments to `mongodb/mongodb-atlas-local` or Atlas cloud.

## Stories

### S1: Document current vector search limitation (1 SP)

Update README and deployment docs to clarify:
- Community Search containers do not support `createSearchIndexes`
- `$vectorSearch` requires AtlasCLI local or Atlas cloud
- vexx/JS fallback is the current vector similarity path

**Acceptance:**
- `docs/deployment/vector-search.md` exists with clear limitation statement
- `services/openplanner/README.md` mentions the constraint

### S2: Add AtlasCLI local deployment profile (3 SP)

Create a Docker Compose profile for AtlasCLI local deployment alongside the existing Community profile.

**Acceptance:**
- `docker-compose.atlas.yml` exists with `mongodb/mongodb-atlas-local` configuration
- `createSearchIndexes` succeeds against AtlasCLI local deployment
- `$vectorSearch` returns real hits from indexed embeddings

### S3: Create vector search index bootstrap script (2 SP)

Add a script that creates the `embedding_vector` index on `graph_node_embeddings.embedding` when running against AtlasCLI local.

**Acceptance:**
- `scripts/create-vector-index.ts` exists
- Creates index with correct dimensions (1024) and similarity (cosine)
- Idempotent: running twice does not fail

### S4: Production deployment runbook (2 SP)

Document the production deployment path for AtlasCLI local or Atlas cloud, including:
- Container image selection
- Volume migration from Community to Atlas local
- Index creation procedures
- Monitoring and health checks

**Acceptance:**
- `docs/deployment/production-vector-search.md` exists
- Covers both AtlasCLI local and Atlas cloud options

### S5: CI smoke test for Atlas local (2 SP)

Add a CI job that tests vector search against AtlasCLI local deployment.

**Acceptance:**
- `.github/workflows/test-atlas-vector-search.yml` exists
- Tests `createSearchIndexes` and `$vectorSearch` end-to-end
- Runs on PRs that modify vector-related code

## Definition of done

- Production deployments can use native `$vectorSearch` without GPU/NPU dependency
- Index management commands (`createSearchIndexes`, `$listSearchIndexes`) work
- Documentation clearly distinguishes local dev vs production vector search paths
- CI validates both Community (fallback) and Atlas local (native) vector search

## Affected files

### New
- `docs/deployment/vector-search.md`
- `docs/deployment/production-vector-search.md`
- `scripts/create-vector-index.ts`
- `services/openplanner/docker-compose.atlas.yml`
- `.github/workflows/test-atlas-vector-search.yml`

### Existing touch points
- `services/openplanner/docker-compose.yml` (add profile comments)
- `services/openplanner/README.md`
- `orgs/open-hax/openplanner/README.md`

## References

- MongoDB Atlas CLI local deployment: https://www.mongodb.com/docs/atlas/cli/current/atlas-cli-deploy-local/
- `mongodb/mongodb-atlas-local` Docker image: https://hub.docker.com/r/mongodb/mongodb-atlas-local
- `knowledge-ops-mongodb-vector-unification.md` (upstream spec)
