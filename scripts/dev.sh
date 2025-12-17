#!/usr/bin/env bash
set -euo pipefail

echo ""
echo "========================================"
echo "Commito: dev"
echo "========================================"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

SERVER_PORT="${SERVER_PORT:-5000}"

echo ""
echo "Starting backend..."
( cd server && npm run dev ) &
SERVER_PID=$!

cleanup() {
  echo ""
  echo "Stopping backend (pid $SERVER_PID)..."
  kill "$SERVER_PID" >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo ""
echo "Waiting for backend /api/health..."
for i in {1..40}; do
  if curl -s "http://localhost:${SERVER_PORT}/api/health" >/dev/null 2>&1; then
    echo "Backend is up."
    break
  fi
  sleep 0.5
done

echo ""
echo "Starting Expo (clear cache)..."
cd client
npx expo start -c
