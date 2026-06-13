# syntax=docker/dockerfile:1

###############################################################################
# base — shared tooling for every stage (dev + production build)
###############################################################################
FROM node:24-slim AS base

# Arguments for permission alignment (defaulting to standard 1000)
ARG USER_ID=1000
ARG GROUP_ID=1000

# Adjust 'node' user UID and GID to match host user
RUN groupmod -g ${GROUP_ID} node && \
    usermod -u ${USER_ID} -g node node

# Enable Corepack and activate the pnpm version pinned in frontend/package.json
RUN corepack enable && corepack prepare pnpm@10.12.1 --activate

# Set working directory
WORKDIR /var/www/html

###############################################################################
# builder — install deps and produce the standalone production build
#
# NODE_ENV is intentionally NOT forced to production here: `next build` already
# runs in production mode internally, but pnpm must install devDependencies
# (typescript, tailwind, types…) for the build to succeed.
###############################################################################
FROM base AS builder

# Install dependencies first so this layer is cached unless the lockfile changes
COPY --chown=node:node frontend/package.json frontend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy the rest of the frontend source.
COPY --chown=node:node frontend/ ./

# Domain-specific public URLs come from build args (docker-compose.prod.yml
# derives them from APP_DOMAIN/API_DOMAIN in the root .env). Set as ENV so they
# take precedence over the committed placeholders in frontend/.env.production.
# Other NEXT_PUBLIC_* constants still come from .env.production.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}

RUN pnpm run build

###############################################################################
# production — minimal runtime serving the standalone output (node server.js)
###############################################################################
FROM node:24-slim AS production

WORKDIR /var/www/html

ENV NODE_ENV=production
ENV PORT=3000
# Listen on all interfaces so nginx (other container) can reach it
ENV HOSTNAME=0.0.0.0

# `output: 'standalone'` bundles only the files needed to run the server
COPY --from=builder /var/www/html/.next/standalone ./
COPY --from=builder /var/www/html/.next/static ./.next/static
COPY --from=builder /var/www/html/public ./public

USER node
EXPOSE 3000
CMD ["node", "server.js"]

###############################################################################
# development — hot-reload dev server. LAST stage on purpose: it is the default
# build target, so the existing `docker compose up` (no target) is unchanged.
###############################################################################
FROM base AS development

USER node
EXPOSE 3000
CMD ["pnpm", "run", "dev"]
