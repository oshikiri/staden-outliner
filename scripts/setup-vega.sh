#!/usr/bin/env bash
set -euo pipefail

mkdir -p public/

curl -fsSL https://cdn.jsdelivr.net/npm/vega@6 -o public/vega.js
curl -fsSL https://cdn.jsdelivr.net/npm/vega-lite@5 -o public/vega-lite.js
curl -fsSL https://cdn.jsdelivr.net/npm/vega-embed@6 -o public/vega-embed.js
