FROM ghcr.io/anomalyco/build/bun-node:24.04

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates git openssh-client procps python3 ripgrep \
  && rm -rf /var/lib/apt/lists/*

RUN npm install -g pm2

WORKDIR /workspace

COPY entrypoint.sh /usr/local/bin/opencode-stack-entrypoint
COPY gateway.mjs /usr/local/lib/opencode-stack/gateway.mjs
COPY ecosystem.container.config.cjs /app/ecosystem.container.config.cjs

RUN chmod +x /usr/local/bin/opencode-stack-entrypoint

CMD ["/usr/local/bin/opencode-stack-entrypoint"]
