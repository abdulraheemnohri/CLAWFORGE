# Multi-stage build for ClawForge AI v1
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Copy monorepo configuration files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json ./
COPY packages/ ./packages/
COPY apps/server/package.json ./apps/server/
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source codes
COPY apps/ ./apps/

# Build all packages and applications
RUN pnpm run build

# Runner stage
FROM node:22-alpine AS runner
WORKDIR /app

# Copy built artifacts and dependencies
COPY --from=base /app /app

EXPOSE 3777
EXPOSE 5173

ENV NODE_ENV=production
ENV SERVER_PORT=3777
ENV SERVER_HOST=0.0.0.0

CMD ["node", "apps/server/dist/index.js"]
