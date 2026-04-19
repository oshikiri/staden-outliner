# syntax=docker/dockerfile:1.6

FROM oven/bun:1.3.12-bookworm AS base

USER root
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM deps AS dev
ENV NODE_ENV=development \
    STADEN_ROOT=/app/docs
COPY --chown=bun:bun . .
USER bun
EXPOSE 3000
ENTRYPOINT ["bash", "/app/docker/dev-entrypoint.sh"]
