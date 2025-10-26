#!/bin/bash
set -e

echo "Resetting database..."

# Ждем готовности PostgreSQL
until pg_isready -h postgres -U postgres; do
  echo 'Waiting for PostgreSQL...'
  sleep 2
done

# Сбрасываем базу данных
PGPASSWORD=digitmindreason psql -h postgres -U postgres -d postgres << EOF
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = 'articles'
AND pid <> pg_backend_pid();

DROP DATABASE IF EXISTS articles;
CREATE DATABASE articles;
EOF

echo "Database reset completed"