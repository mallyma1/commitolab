#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

# Load env if present. Prefer .env.local, fallback to .env.production
if [ -f ".env.local" ]; then
  export $(grep -v '^#' .env.local | xargs) || true
elif [ -f ".env.production" ]; then
  export $(grep -v '^#' .env.production | xargs) || true
fi

npm run server:build

PORT="${PORT:-5050}"
BIND_HOST="${BIND_HOST:-127.0.0.1}"
NODE_ENV="${NODE_ENV:-development}"

echo "Starting server on ${BIND_HOST}:${PORT}..."
node server_dist/index.js
