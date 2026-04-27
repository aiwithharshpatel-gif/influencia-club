FROM node:20

# Install OpenSSL
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

# Copy package files
COPY package*.json ./
# Copy prisma folder
COPY prisma ./prisma/

# Install ALL dependencies
RUN npm install --legacy-peer-deps

# Generate Prisma Client using the local binary directly
RUN ./node_modules/.bin/prisma generate --schema=./prisma/schema.prisma

# Copy the rest of the app
COPY . .

EXPOSE 5000

CMD ["node", "src/app.js"]
