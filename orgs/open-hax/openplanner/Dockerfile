FROM node:22-trixie-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends openjdk-21-jre-headless \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json tsconfig.json ./
COPY pnpm-workspace.yaml .
COPY pnpm-lock.yaml .
COPY packages/graph/graph-claim-core/package.json ./packages/graph/graph-claim-core/package.json
COPY packages/gardens/publication-components/package.json ./packages/gardens/publication-components/package.json
COPY packages/stores/cache/package.json ./packages/stores/cache/package.json
COPY packages/stores/document-hydration/package.json ./packages/stores/document-hydration/package.json
COPY packages/translations/translation-core/package.json ./packages/translations/translation-core/package.json

RUN corepack enable && corepack prepare pnpm@10 --activate
RUN pnpm install --no-frozen-lockfile

COPY src ./src
COPY packages/graph/graph-claim-core ./packages/graph/graph-claim-core
COPY packages/gardens/publication-components ./packages/gardens/publication-components
COPY packages/stores/cache ./packages/stores/cache
COPY packages/stores/document-hydration ./packages/stores/document-hydration
COPY packages/translations/translation-core ./packages/translations/translation-core
COPY .env.example ./.env.example

RUN pnpm build

# Remove dev dependencies to slim image
RUN CI=true pnpm prune --prod

USER 1000:1000

ENV NODE_ENV=production
ENV OPENPLANNER_HOST=0.0.0.0
ENV OPENPLANNER_PORT=7777

EXPOSE 7777

CMD ["node", "dist/main.js"]
