#!/usr/bin/env bash
set -euo pipefail

echo ""
echo "========================================"
echo "Commito: check"
echo "========================================"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo ""
echo "Frontend: typecheck + lint"
cd client
npm run typecheck
npm run lint
cd "$ROOT_DIR"

echo ""
echo "Backend: basic check"
cd server
npm run build || true
cd "$ROOT_DIR"

echo ""
echo "Done."
