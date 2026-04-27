FROM node:20-slim

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

# Copy ALL files first to ensure schema and package files are present
COPY . .

# Install dependencies
RUN npm install --legacy-peer-deps

# Generate Prisma Client explicitly pointing to the schema
RUN npx prisma generate --schema=./prisma/schema.prisma

EXPOSE 5000

# Start the application
CMD ["node", "src/app.js"]
