#!/usr/bin/env bash
# Rebuild the PostgreSQL database: drop, create, migrate.
# Requires a PostgreSQL superuser (e.g. postgres). Set POSTGRES_USER and optionally PGPASSWORD.
#
# Usage (from project root or backend):
#   ./backend/scripts/rebuild_db.sh
# Or with explicit user:
#   POSTGRES_USER=postgres PGPASSWORD=yourpassword ./backend/scripts/rebuild_db.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DB_NAME="${DB_NAME:-customer_management_db}"
DB_USER="${DB_USER:-cms_user}"
# User that can DROP/CREATE database (often postgres)
SUPERUSER="${POSTGRES_USER:-postgres}"
HOST="${PGHOST:-localhost}"
PORT="${PGPORT:-5432}"

echo "Dropping database: $DB_NAME"
psql -h "$HOST" -p "$PORT" -U "$SUPERUSER" -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"

echo "Creating database: $DB_NAME (owner: $DB_USER)"
psql -h "$HOST" -p "$PORT" -U "$SUPERUSER" -d postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

echo "Running migrations..."
cd "$BACKEND_DIR"
python3 manage.py migrate

echo "Done. Database rebuilt."
