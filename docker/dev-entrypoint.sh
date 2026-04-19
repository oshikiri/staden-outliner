#!/usr/bin/env bash
set -euo pipefail

STAMP_FILE="node_modules/.bun-install-stamp"

if [ ! -d node_modules ] || [ ! -f "$STAMP_FILE" ] || [ bun.lock -nt "$STAMP_FILE" ]; then
  bun install --frozen-lockfile
  touch "$STAMP_FILE"
fi

if [ "$#" -eq 0 ]; then
  set -- bun run dev:web
fi

exec "$@"
