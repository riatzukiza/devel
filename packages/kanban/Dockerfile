# Lightweight local kanban UI server (independent of Obsidian)
# Build: docker build -t openhax-kanban-ui .
# Run:   docker run --rm -p 8787:8787 -v $(pwd)/../../../../orgs/ussyverse/kanban/tasks:/tasks openhax-kanban-ui

FROM node:22-bookworm-slim AS build

WORKDIR /app

# Install deps (no lockfile in this package; acceptable for dev image)
COPY package.json ./
COPY tsconfig.json ./
COPY src ./src

RUN npm install
RUN npm run build
RUN npm prune --omit=dev

FROM node:22-bookworm-slim

WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

EXPOSE 8787

CMD ["node", "dist/cli.js", "serve", "--tasks-dir", "/tasks", "--host", "0.0.0.0", "--port", "8787"]
