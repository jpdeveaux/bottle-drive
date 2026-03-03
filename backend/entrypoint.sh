#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

# 1. WAIT FOR DATABASE
# We use 'db' because that is the service name in docker-compose.yml
echo "-------------------------------------------------------"
echo "Entrypoint: Waiting for Postgres (db:5432)..."
echo "-------------------------------------------------------"

until nc -z db 5432; do
  echo "Postgres is unavailable - sleeping"
  sleep 1
done

echo "Postgres is UP!"

# 2. PRISMA SCHEMA SYNC
# If NODE_ENV is 'production', we use 'migrate deploy' (Safe/No Data Loss)
# Otherwise, we use 'db push' (Fast/Auto-sync)

if [ "$NODE_ENV" = "production" ]; then
  echo "Mode: PRODUCTION"
  echo "Action: Running 'prisma migrate deploy'..."
  npx prisma migrate deploy
else
  echo "Mode: DEVELOPMENT"
  echo "Action: Running 'prisma db push --accept-data-loss'..."
  # --accept-data-loss allows quick iteration while you are designing the schema
  npx prisma db push --accept-data-loss
  echo "DB Pushed successfully."
fi

# 3. GENERATE CLIENT
# This ensures the Prisma Client matches the current OS/Wasm environment
echo "Action: Generating Prisma Client..."
npx prisma generate

# 4. SEED DATABASE
echo "Action: Seeding Address database..."
npx prisma db seed

# 5. START THE APPLICATION
# 'exec "$@"' takes the CMD from the Dockerfile or Docker Compose 
# and runs it as the main process (PID 1).
echo "-------------------------------------------------------"
echo "Starting Application with command: $@"
echo "-------------------------------------------------------"

exec "$@"