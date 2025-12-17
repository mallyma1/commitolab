#!/usr/bin/env bash
set -euo pipefail

banner() {
  echo
  echo "=============================="
  echo "$1"
  echo "=============================="
}

check_port() {
  local port=$1
  if lsof -i :$port >/dev/null 2>&1; then
    echo "[DEV] Port $port is in use by:"
    lsof -i :$port
    echo "To stop: kill the listed PID(s) or close the process."
    exit 1
  fi
}

FRONTEND_DIR="."
BACKEND_CMD="./start-server-local.sh"
BACKEND_PORT="${BACKEND_PORT:-5050}"

echo "[DEV] Using FRONTEND_DIR: $FRONTEND_DIR"
echo "[DEV] Backend start command: $BACKEND_CMD"
echo "[DEV] Backend port: $BACKEND_PORT"

banner "[DEV] Checking backend port ${BACKEND_PORT}"
check_port "$BACKEND_PORT"

banner "[DEV] Starting backend"
PORT="$BACKEND_PORT" eval "$BACKEND_CMD &"
BACKEND_PID=$!

banner "[DEV] Waiting for backend health..."
for i in {1..25}; do
  sleep 1
  if curl -s "http://localhost:${BACKEND_PORT}/api/health" >/dev/null 2>&1; then
    echo "[DEV] Backend is healthy."
    break
  fi
  if [ $i -eq 25 ]; then
    echo "[DEV] Backend did not become healthy in time."
    kill $BACKEND_PID >/dev/null 2>&1 || true
    exit 1
  fi
  echo "[DEV] Waiting... ($i)"
done

banner "[DEV] Starting Expo (frontend) with cache clear"
cd "$FRONTEND_DIR"
npx expo start -c
