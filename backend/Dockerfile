FROM node:20

# Install system dependencies for Prisma
RUN apt-get update -y && apt-get install -y openssl ca-certificates

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (ignoring scripts to prevent recursion)
RUN npm install --legacy-peer-deps --ignore-scripts

# Copy prisma schema
COPY prisma ./prisma/

# Set a dummy DATABASE_URL just for the generation step
# This prevents Prisma from failing if it tries to validate the string
ENV DATABASE_URL="mysql://root:root@localhost:3306/db"

# Generate Prisma Client
RUN npx prisma generate

# Now copy the rest of the application
COPY . .

EXPOSE 5000

CMD ["node", "src/app.js"]
