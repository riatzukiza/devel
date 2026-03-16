FROM node:22-bookworm-slim

ENV PNPM_HOME=/pnpm
ENV PATH=/pnpm:${PATH}

RUN apt-get update \
  && apt-get install -y --no-install-recommends bash ca-certificates curl git procps python3 ripgrep unzip \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@10.14.0 --activate && pnpm add -g pm2

RUN curl -fsSL https://bun.sh/install | bash

ENV BUN_INSTALL=/root/.bun
ENV PATH=/root/.bun/bin:${PATH}

WORKDIR /app

COPY ecosystem.container.config.cjs /app/ecosystem.container.config.cjs
COPY entrypoint.sh /app/entrypoint.sh

RUN chmod +x /app/entrypoint.sh

CMD ["/app/entrypoint.sh"]
