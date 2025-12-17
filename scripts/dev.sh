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

# Detect frontend dir (look for package.json with expo dep and app.json)
FRONTEND_DIR=""
for d in . */; do
  if [ -f "$d/package.json" ] && [ -f "$d/app.json" ]; then
    if grep -q 'expo' "$d/package.json"; then
      FRONTEND_DIR="${d%/}"
      break
    fi
  fi
done
if [ -z "$FRONTEND_DIR" ]; then
  echo "[DEV] ERROR: Could not find frontend folder with Expo. Ensure package.json and app.json exist."
  exit 1
fi

# Detect backend start command
BACKEND_CMD=""
if [ -f "server/package.json" ]; then
  if grep -q '"dev"' server/package.json; then
    BACKEND_CMD="cd server && npm run dev"
  elif grep -q '"start"' server/package.json; then
    BACKEND_CMD="cd server && npm start"
  fi
fi
if [ -z "$BACKEND_CMD" ] && [ -f "start-server.sh" ]; then
  BACKEND_CMD="./start-server.sh"
fi
if [ -z "$BACKEND_CMD" ]; then
  echo "[DEV] ERROR: Could not find backend start command."
  exit 1
fi

echo "[DEV] Using FRONTEND_DIR: $FRONTEND_DIR"
echo "[DEV] Backend start command: $BACKEND_CMD"

banner "[DEV] Checking backend port 5000"
check_port 5000

banner "[DEV] Starting backend"
eval "$BACKEND_CMD &"
BACKEND_PID=$!

banner "[DEV] Waiting for backend health..."
for i in {1..20}; do
  sleep 1
  if curl -s http://localhost:5000/api/health | grep 'ok' >/dev/null; then
    echo "[DEV] Backend is healthy."
    break
  fi
  if [ $i -eq 20 ]; then
    echo "[DEV] Backend did not become healthy in time."
    kill $BACKEND_PID
    exit 1
  fi
  echo "[DEV] Waiting... ($i)"
done

banner "[DEV] Checking frontend port 8081"
check_port 8081

banner "[DEV] Starting Expo (frontend) with cache clear"
cd "$FRONTEND_DIR" && npx expo start -c
