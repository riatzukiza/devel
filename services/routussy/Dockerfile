# Routussy proxy - standalone dev instance
FROM oven/bun:1.3-alpine

WORKDIR /app

# Copy package files first for caching
COPY orgs/ussyverse/routussy/package.json orgs/ussyverse/routussy/bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile --production

# Copy source
COPY orgs/ussyverse/routussy/src ./src
COPY orgs/ussyverse/routussy/tsconfig.json ./

# Build for production (bun can run ts directly, but let's typecheck)
RUN bun run typecheck || true

# Create data directory
RUN mkdir -p /app/data

EXPOSE 3010

# Run the proxy-only entry point
CMD ["bun", "run", "src/proxy-only.ts"]
