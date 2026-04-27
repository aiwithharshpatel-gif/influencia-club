FROM node:20-bookworm

RUN apt-get update -y && apt-get install -y openssl ca-certificates netcat-traditional

WORKDIR /app

# Copy dependency files
COPY package*.json ./
RUN npm install --legacy-peer-deps --ignore-scripts

# Copy the rest of the application
COPY . .

# Make the entrypoint executable
RUN chmod +x entrypoint.sh

EXPOSE 5000

ENTRYPOINT ["./entrypoint.sh"]
