FROM node:20-bookworm

RUN apt-get update -y && apt-get install -y openssl ca-certificates netcat-traditional

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps --ignore-scripts

COPY . .

# CRITICAL: Delete any old cached prisma folder to force use of backend/schema.prisma
RUN rm -rf ./prisma

RUN chmod +x entrypoint.sh

EXPOSE 5000

ENTRYPOINT ["./entrypoint.sh"]
