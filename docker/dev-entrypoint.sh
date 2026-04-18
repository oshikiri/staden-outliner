#!/usr/bin/env bash
set -euo pipefail

STAMP_FILE="node_modules/.package-lock-stamp"

if [ ! -d node_modules ] || [ ! -f "$STAMP_FILE" ] || [ package-lock.json -nt "$STAMP_FILE" ]; then
  npm ci --no-audit --no-fund
  touch "$STAMP_FILE"
fi

if [ "$#" -eq 0 ]; then
  set -- npm run dev:web
fi

exec "$@"
