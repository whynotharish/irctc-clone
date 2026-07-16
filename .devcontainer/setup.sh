#!/bin/bash
set -e

echo "Setting up IRCTC clone dev environment..."

cat > /workspace/server/.env << 'ENV'
PORT=4000
DATABASE_URL=postgres://postgres:postgres@postgres:5432/irctc_clone
REDIS_URL=redis://redis:6379
SEAT_LOCK_TTL_SECONDS=300
ENV

echo "Installing backend deps..."
cd /workspace/server && npm install

echo "Installing frontend deps..."
cd /workspace/client && npm install

echo "Waiting for Postgres to be ready..."
until nc -z postgres 5432; do sleep 1; done

echo "Seeding database..."
cd /workspace/server && npm run seed

echo "Done. Run 'npm run dev' in server/ and client/ (separate terminals)."
