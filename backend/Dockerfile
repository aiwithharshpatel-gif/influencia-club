FROM node:20-bookworm

# Install necessary system libraries
RUN apt-get update -y && apt-get install -y openssl ca-certificates

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (ignoring scripts to avoid build-time generation)
RUN npm install --legacy-peer-deps --ignore-scripts

# Copy the entire project
COPY . .

EXPOSE 5000

# RUNTIME GENERATION: 
# We generate the client when the container starts on the VPS.
# This bypasses all build-time restrictions and memory limits.
CMD npx prisma generate && npx prisma migrate deploy && node src/app.js
