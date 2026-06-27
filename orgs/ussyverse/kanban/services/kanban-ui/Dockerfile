FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json ./
COPY index.mjs ./

EXPOSE 8788

CMD ["npm", "start"]
