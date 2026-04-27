FROM node:20

RUN apt-get update -y && apt-get install -y openssl ca-certificates

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install --legacy-peer-deps

# Generate at build time - if this fails, we will know immediately in the logs
RUN npx prisma generate

COPY . .

EXPOSE 5000

# Combined start command
CMD npx prisma db push --accept-data-loss && node src/app.js
