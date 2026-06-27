FROM node:20-slim

WORKDIR /app

COPY package.json ./
COPY tsconfig.json ./

RUN mkdir -p node_modules/@workspace
RUN ln -sf /app/node_modules/@workspace/graph-weaver-aco /app/node_modules/@workspace/graph-weaver-aco 2>/dev/null || true

COPY dist/ ./dist/

EXPOSE 9000

CMD ["node", "dist/main.js"]
