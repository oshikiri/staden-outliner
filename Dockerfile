# syntax=docker/dockerfile:1.6

FROM node:24-bookworm AS base

USER root
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1 \
    HOST=0.0.0.0

# Install build/runtime dependencies required by better-sqlite3 and tooling
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
      build-essential \
      python3 \
      sqlite3 \
    && rm -rf /var/lib/apt/lists/*

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS dev
ENV NODE_ENV=development \
    STADEN_ROOT=/app/docs
COPY --chown=node:node . .
USER node
EXPOSE 3000
CMD ["bash", "/app/docker/dev-entrypoint.sh"]
