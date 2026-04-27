FROM node:20

# Install system dependencies
RUN apt-get update -y && apt-get install -y openssl ca-certificates

WORKDIR /app

# Install Prisma CLI globally so it's always available
RUN npm install -g prisma@5.10.0 --legacy-peer-deps

# Copy only package files
COPY package*.json ./

# Install project dependencies
RUN npm install --legacy-peer-deps

# Copy prisma schema
COPY prisma ./prisma/

# Use a dummy URL for generation
ENV DATABASE_URL="mysql://root:root@localhost:3306/db"

# Generate with verbose logging to catch the exact error
RUN prisma generate --schema=./prisma/schema.prisma

# Copy remaining source code
COPY . .

EXPOSE 5000

CMD ["node", "src/app.js"]
