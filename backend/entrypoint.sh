#!/bin/sh
set -e

echo "Senior Entrypoint: Starting isolation build..."

# Wait for DB
until nc -z db 3306; do
  echo "Waiting for database..."
  sleep 2
done

# Give MySQL time to settle
sleep 10

echo "Generating Prisma Client from ROOT schema..."
npx prisma generate --schema=./schema.prisma

echo "Syncing Database..."
npx prisma db push --accept-data-loss --schema=./schema.prisma

echo "Starting App..."
exec node src/app.js
