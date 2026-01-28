#!/bin/bash
set -e

# Configuration
VOLUME_NAME="smrt-prod_smrt_db_prod_data"
# Absolute path for target
TARGET_DIR="/media/gavin/storage1tb/containers/smrt/database"
PROJECT_DIR="$(dirname "$0")"/project

echo "Starting migration for SMRT database..."

# 1. Stop the services
# We must run from the project dir so it finds .env.prod etc.
cd "$PROJECT_DIR"
echo "Stopping containers (running in $(pwd))..."

# Load environment variables for substitution in docker-compose.yml
if [ -f .env.prod ]; then
  echo "Loading .env.prod..."
  set -a
  source .env.prod
  set +a
fi

if [ -f .env.prod.secrets ]; then
  echo "Loading .env.prod.secrets..."
  set -a
  source .env.prod.secrets
  set +a
fi

docker compose -f docker-compose.prod.yml down

# 2. Prepare target directory
echo "Ensuring target directory exists: $TARGET_DIR"
mkdir -p "$TARGET_DIR"

# 3. Migrate data using a temporary container
echo "Copying data from volume '$VOLUME_NAME' to '$TARGET_DIR'"...
# We mount the named volume to /source and the host target to /target
docker run --rm \
  -v "$VOLUME_NAME":/source \
  -v "$TARGET_DIR":/target \
  alpine sh -c "cp -av /source/. /target/"

echo "Data copy complete."

# 4. Fix permissions (Optional: Postgres usually runs as 999:999 or 70)
# We use a temporary postgres container to chown the data directory to ensure it's correct for the postgres user
echo "Setting permissions..."
docker run --rm \
  -v "$TARGET_DIR":/var/lib/postgresql/data \
  postgres:17-alpine chown -R 70:70 /var/lib/postgresql/data

echo "Migration script finished."
echo "You can now start the services with: cd $PROJECT_DIR && docker compose -f docker-compose.prod.yml up -d"
