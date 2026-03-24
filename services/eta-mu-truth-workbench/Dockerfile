# Eta-Mu truth workbench / crystal site
# Context: workspace root (devel/)
# Build: docker compose -f services/eta-mu/compose.yaml build

FROM node:22-bookworm-slim AS deps

WORKDIR /app/services/eta-mu-truth-workbench
COPY services/eta-mu-truth-workbench/package.json ./package.json
RUN npm install --omit=dev

FROM node:22-bookworm-slim

WORKDIR /app
ENV NODE_ENV=production

COPY packages/eta-mu-docs/index.js packages/eta-mu-docs/index.cjs packages/eta-mu-docs/index.d.ts ./packages/eta-mu-docs/
COPY packages/eta-mu-truth/index.js packages/eta-mu-truth/index.cjs packages/eta-mu-truth/index.d.ts ./packages/eta-mu-truth/
COPY services/eta-mu-truth-workbench/src ./services/eta-mu-truth-workbench/src
COPY services/eta-mu-truth-workbench/ui ./services/eta-mu-truth-workbench/ui
COPY services/eta-mu-truth-workbench/README.md ./services/eta-mu-truth-workbench/README.md
COPY services/eta-mu-truth-workbench/package.json ./services/eta-mu-truth-workbench/package.json
COPY --from=deps /app/services/eta-mu-truth-workbench/node_modules ./services/eta-mu-truth-workbench/node_modules

WORKDIR /app/services/eta-mu-truth-workbench
RUN mkdir -p /app/vault

EXPOSE 8790

CMD ["node", "src/index.js"]
