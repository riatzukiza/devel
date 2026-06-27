FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json ./
COPY index.mjs ./

EXPOSE 8787

CMD ["npm", "start"]
