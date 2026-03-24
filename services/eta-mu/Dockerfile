# Eta-Mu truth workbench with auth/webhook support
# Build: docker build -t openhax/eta-mu:compose -f services/eta-mu/Dockerfile .
# Run:   docker compose -f services/eta-mu/compose.yaml up -d

FROM node:22-bookworm-slim AS build

WORKDIR /app

# Copy package files first for better caching
COPY packages/eta-mu-docs/package.json ./packages/eta-mu-docs/
COPY packages/eta-mu-truth/package.json ./packages/eta-mu-truth/
COPY services/eta-mu-truth-workbench/package.json ./services/eta-mu-truth-workbench/

# Install dependencies
WORKDIR /app/services/eta-mu-truth-workbench
RUN npm install

# Copy source code
COPY packages/eta-mu-docs/ ../../packages/eta-mu-docs/
COPY packages/eta-mu-truth/ ../../packages/eta-mu-truth/
COPY services/eta-mu-truth-workbench/ ./

# Build (already JS, just need to copy)
FROM node:22-bookworm-slim

WORKDIR /app
ENV NODE_ENV=production

# Copy built artifacts
COPY --from=build /app/services/eta-mu-truth-workbench/package.json ./package.json
COPY --from=build /app/services/eta-mu-truth-workbench/node_modules ./node_modules
COPY --from=build /app/services/eta-mu-truth-workbench/src ./src
COPY --from=build /app/services/eta-mu-truth-workbench/ui ./ui

# Create vault directory for persistence
RUN mkdir -p /app/vault

EXPOSE 8790

CMD ["node", "src/index.js"]