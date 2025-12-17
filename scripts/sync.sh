#!/usr/bin/env bash
set -euo pipefail

banner() {
  echo
  echo "=============================="
  echo "$1"
  echo "=============================="
}

banner "[SYNC] Checking branch and working tree"
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "Current branch: $CURRENT_BRANCH"

if [[ "$CURRENT_BRANCH" != "main" ]]; then
  echo "[SYNC] You must be on 'main' branch to sync."
  exit 1
fi

if [[ -n $(git status --porcelain) ]]; then
  echo "[SYNC] Working tree is not clean. Please commit, stash, or discard changes before syncing."
  git status
  exit 1
fi

banner "[SYNC] Fetching and pulling latest changes"
git fetch
git pull

banner "[SYNC] Installing root dependencies"
npm install

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

if [ -n "$FRONTEND_DIR" ]; then
  banner "[SYNC] Installing frontend dependencies ($FRONTEND_DIR)"
  cd "$FRONTEND_DIR" && npm install && cd ..
fi
if [ -d "server" ] && [ -f "server/package.json" ]; then
  banner "[SYNC] Installing server dependencies"
  cd server && npm install && cd ..
fi

banner "[SYNC] Clearing safe caches (expo, metro, node_modules/.cache)"
rm -rf node_modules/.cache || true
if [ -n "$FRONTEND_DIR" ] && [ -d "$FRONTEND_DIR/node_modules/.cache" ]; then
  rm -rf "$FRONTEND_DIR/node_modules/.cache" || true
fi
if [ -d "server/node_modules/.cache" ]; then
  rm -rf server/node_modules/.cache || true
fi

banner "[SYNC] Done. To start development, run:"
echo "./scripts/dev.sh"
