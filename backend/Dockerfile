FROM node:20-slim

# Install OpenSSL and CA Certificates
RUN apt-get update -y && apt-get install -y openssl ca-certificates

WORKDIR /app

# Copy only package files first
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (including devDependencies like prisma)
RUN npm install --legacy-peer-deps

# Generate Prisma Client
RUN npx prisma generate

# NOW copy the rest of the source code
COPY . .

EXPOSE 5000

CMD ["node", "src/app.js"]
