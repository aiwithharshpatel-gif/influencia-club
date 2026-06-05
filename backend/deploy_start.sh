#!/bin/sh
set -eu

echo "Waiting for MySQL..."
until nc -z database 3306; do
  sleep 2
done

echo "Applying database migrations..."
npx prisma migrate deploy --schema=./schema_config/prod.prisma

echo "Starting Influenzia Club API..."
exec node src/app.js
