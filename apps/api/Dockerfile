FROM node:24-alpine AS build
WORKDIR /app


COPY package.json package-lock.json* .npmrc* ./
COPY apps/api/package.json apps/api/package.json


RUN npm ci --workspace=apps/api

# 1b. Copy source and compile.
COPY apps/api apps/api
RUN npm run build --workspace=apps/api

# 1c. Prune devDependencies so only production deps remain.
#     This avoids a second full install stage entirely.
RUN npm prune --workspace=apps/api --omit=dev

# ============================================================
# Stage 2 — lean production image
# ============================================================
FROM node:24-alpine

# Security: run as a non-root user. Alpine's `addgroup`/`adduser`
# are lightweight BusyBox applets — no extra packages needed.
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app/apps/api

# npm workspaces hoists dependencies into the repo-root node_modules.
# Copying it one level above WORKDIR lets Node's module resolution
# (which walks up parent dirs) find everything transparently.
COPY --from=build --chown=appuser:appgroup /app/node_modules /app/node_modules
COPY --from=build --chown=appuser:appgroup /app/apps/api/dist ./dist
COPY --chown=appuser:appgroup apps/api/package.json ./package.json

# Must exist and be writable before ConsoleEmailAdapter's first append.
# docker-compose.yml mounts a named volume over this path, but a bare
# `docker run` (no compose, no volume) still needs the dir to exist.
RUN mkdir -p tmp && chown appuser:appgroup tmp

ENV NODE_ENV=production
EXPOSE 3000
STOPSIGNAL SIGTERM

USER appuser

CMD ["node", "dist/main.js"]
