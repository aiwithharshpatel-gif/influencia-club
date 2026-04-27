FROM node:20-bookworm

ARG CACHEBUST=1

# Install network tools and openssl
RUN apt-get update -y && apt-get install -y openssl ca-certificates netcat-traditional

WORKDIR /app

# Copy dependency files
COPY package*.json ./
RUN npm install --legacy-peer-deps --ignore-scripts

# Copy the entire project (including schema_config folder)
COPY . .

# Make start script executable
RUN chmod +x deploy_start.sh

EXPOSE 5000

# Use the startup script
ENTRYPOINT ["./deploy_start.sh"]
