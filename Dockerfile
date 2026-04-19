# syntax=docker/dockerfile:1.6

FROM oven/bun:1.3.12-bookworm AS base

USER root
WORKDIR /app

# Install build/runtime dependencies required by better-sqlite3 and tooling
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
      build-essential \
      python3 \
      sqlite3 \
    && rm -rf /var/lib/apt/lists/*

FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM deps AS dev
ENV NODE_ENV=development \
    STADEN_ROOT=/app/docs
COPY --chown=bun:bun . .
USER bun
EXPOSE 3001 5173
ENTRYPOINT ["bash", "/app/docker/dev-entrypoint.sh"]
