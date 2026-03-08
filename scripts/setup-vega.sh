#!/usr/bin/env bash
set -euo pipefail

mkdir -p public/

fetch_or_stub() {
  local url="$1"
  local output="$2"
  local global_name="$3"

  if curl -fsSL "$url" -o "$output"; then
    return 0
  fi

  cat >"$output" <<STUB
// Auto-generated fallback for offline/test environments.
(function (global) {
  global.${global_name} = global.${global_name} || {};
})(typeof window !== "undefined" ? window : globalThis);
STUB
}

fetch_or_stub "https://cdn.jsdelivr.net/npm/vega@6" "public/vega.js" "vega"
fetch_or_stub "https://cdn.jsdelivr.net/npm/vega-lite@5" "public/vega-lite.js" "vegaLite"
fetch_or_stub "https://cdn.jsdelivr.net/npm/vega-embed@6" "public/vega-embed.js" "vegaEmbed"
