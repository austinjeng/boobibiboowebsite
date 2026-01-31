#!/usr/bin/env bash
set -euo pipefail

DB_NAME="boobibiboo_test"

echo "Dropping test database '$DB_NAME'..."
psql -U postgres -c "DROP DATABASE IF EXISTS $DB_NAME"

echo "Test database '$DB_NAME' dropped."
