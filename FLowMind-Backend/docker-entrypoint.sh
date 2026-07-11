#!/bin/sh
set -e

if [ -n "$DATABASE_URL" ]; then
    echo "Waiting for PostgreSQL..."
    DB_HOST=$(echo "$DATABASE_URL" | sed -E 's/.*@([^:]+).*/\1/')
    DB_PORT=$(echo "$DATABASE_URL" | sed -E 's/.*:([0-9]+)\/.*/\1/')
    DB_PORT=${DB_PORT:-5432}

    until nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; do
        sleep 1
    done
    echo "PostgreSQL is ready"

    echo "Running database migrations..."
    alembic upgrade head
    echo "Migrations complete"
fi

exec "$@"
