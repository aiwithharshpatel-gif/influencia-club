FROM node:20-bookworm

RUN apt-get update -y && apt-get install -y openssl ca-certificates netcat-traditional

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps --ignore-scripts

COPY . .

EXPOSE 5000

# SENIOR STARTUP SCRIPT:
# 1. Wait for the 'db' container to be reachable on port 3306
# 2. Generate Prisma Client
# 3. Push migrations
# 4. Start the app
CMD until nc -z db 3306; do echo "Waiting for database network..."; sleep 2; done && \
    echo "Database network ready, waiting 5s for MySQL initialization..." && \
    sleep 5 && \
    npx prisma generate && \
    npx prisma migrate deploy && \
    node src/app.js
