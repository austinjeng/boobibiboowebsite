#!/usr/bin/env bash
set -euo pipefail

DB_NAME="boobibiboo_test"

echo "Creating test database '$DB_NAME' if it does not exist..."
psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 \
  || psql -U postgres -c "CREATE DATABASE $DB_NAME"

echo "Test database '$DB_NAME' is ready."
