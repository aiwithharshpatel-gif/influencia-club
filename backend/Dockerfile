FROM node:20-bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates netcat-openbsd openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY --chown=node:node . .
RUN npx prisma generate --schema=./schema_config/prod.prisma \
    && chmod +x deploy_start.sh

ENV NODE_ENV=production
EXPOSE 5000

USER node
ENTRYPOINT ["./deploy_start.sh"]
