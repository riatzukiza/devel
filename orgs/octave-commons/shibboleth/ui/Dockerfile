## UI image intentionally avoids the official `node:*` base image.
## Some environments block Docker Hub pulls for large images; using the
## same base as the control-plane makes the stack more reproducible.
ARG BASE_IMAGE=clojure:temurin-21-tools-deps-bookworm
FROM ${BASE_IMAGE}

WORKDIR /app

RUN if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then \
      apt-get update \
        && apt-get install -y --no-install-recommends nodejs npm \
        && rm -rf /var/lib/apt/lists/*; \
    else \
      echo "node/npm already present; skipping apt-get install"; \
    fi

COPY package.json package-lock.json* /app/
RUN npm install

COPY . /app/

EXPOSE 5197

CMD ["npm","run","dev","--","--host","0.0.0.0"]
