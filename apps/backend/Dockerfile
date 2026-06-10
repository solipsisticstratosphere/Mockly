# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /workspace

# Copy workspace manifests
COPY package*.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/backend/package.json ./apps/backend/

# Install all deps (including devDeps for build)
RUN npm ci

# Copy source
COPY packages/shared ./packages/shared
COPY apps/backend/src ./apps/backend/src
COPY apps/backend/tsconfig.json ./apps/backend/tsconfig.json

# Build shared then backend
RUN npm run build -w @mockly/shared && npm run build -w @mockly/backend

# Stage 2: Runtime
FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/backend/package.json ./apps/backend/

RUN npm ci --omit=dev --workspace=@mockly/backend --workspace=@mockly/shared

COPY --from=builder /workspace/apps/backend/dist ./apps/backend/dist
COPY --from=builder /workspace/packages/shared/dist ./packages/shared/dist

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

USER node
CMD ["node", "apps/backend/dist/index.js"]
