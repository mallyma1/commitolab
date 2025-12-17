#!/usr/bin/env bash
set -euo pipefail

echo ""
echo "========================================"
echo "Commito: sync"
echo "========================================"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "ERROR: Not inside a git repo."
  exit 1
fi

branch="$(git branch --show-current)"
echo "Branch: $branch"

if [[ -n "$(git status --porcelain)" ]]; then
  echo ""
  echo "ERROR: Working tree not clean."
  echo "Run: git status"
  echo "Commit or discard changes, then rerun."
  exit 1
fi

echo ""
echo "Fetching latest..."
git fetch --all --prune

echo ""
echo "Pulling latest..."
git pull

echo ""
echo "Installing root deps..."
npm install

if [[ -d "server" ]]; then
  echo ""
  echo "Installing server deps..."
  (cd server && npm install)
fi

if [[ -d "client" ]]; then
  echo ""
  echo "Installing client deps..."
  (cd client && npm install)
fi

echo ""
echo "Clearing Expo/Metro caches..."
rm -rf node_modules/.cache || true
rm -rf client/node_modules/.cache || true

echo ""
echo "Done."
echo "Next: ./scripts/dev.sh"
echo ""
