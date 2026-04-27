#!/bin/sh
set -e

echo "Senior Entrypoint: Starting resilience checks..."

# Wait for DB
until nc -z db 3306; do
  echo "Waiting for database network on 'db:3306'..."
  sleep 2
done

echo "Database network is up. Waiting 10s for MySQL ready state..."
sleep 10

echo "Generating Prisma Client from NEW schema location..."
npx prisma generate --schema=./db_schema/schema_prod.prisma

echo "Pushing schema to database..."
npx prisma db push --accept-data-loss --schema=./db_schema/schema_prod.prisma

echo "Starting Application..."
exec node src/app.js
