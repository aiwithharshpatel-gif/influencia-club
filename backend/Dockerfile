FROM node:20-bookworm

RUN apt-get update -y && apt-get install -y openssl ca-certificates netcat-traditional

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps --ignore-scripts

COPY . .

EXPOSE 5000

# STARTUP STRATEGY:
# 1. Wait for DB network
# 2. Wait extra for MySQL startup
# 3. Generate Client
# 4. FORCE Sync Schema (db push) - More reliable for first-time VPS
# 5. Start app
CMD until nc -z db 3306; do echo "Waiting for database network..."; sleep 2; done && \
    echo "Database network ready, waiting 10s for MySQL startup..." && \
    sleep 10 && \
    npx prisma generate && \
    npx prisma db push --accept-data-loss && \
    node src/app.js
