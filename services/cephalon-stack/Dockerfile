FROM node:22-bookworm-slim

ENV PNPM_HOME=/pnpm
ENV PATH=/pnpm:${PATH}

RUN apt-get update \
  && apt-get install -y --no-install-recommends bash ca-certificates git procps python3 \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@10.14.0 --activate && pnpm add -g pm2

WORKDIR /app

COPY ecosystem.container.config.cjs /app/ecosystem.container.config.cjs
COPY entrypoint.sh /app/entrypoint.sh

RUN chmod +x /app/entrypoint.sh

CMD ["/app/entrypoint.sh"]
