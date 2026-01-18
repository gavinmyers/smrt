# apps/api/Dockerfile
FROM node:24-alpine

WORKDIR /app

# Enable pnpm
RUN corepack enable

# Copy all workspace files (filtered by .dockerignore)
COPY . .

# Install deps (workspace)
RUN pnpm install --frozen-lockfile

# Build database client + build api
ENV NODE_ENV=production
RUN pnpm exec prisma generate
RUN pnpm --filter api build

EXPOSE 3001

CMD ["sh", "-c", "pnpm exec prisma migrate deploy && node apps/api/dist/index.js"]
