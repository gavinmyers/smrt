STEP_5 / TASK_0 — Add Dockerfiles (api + web) and compose wiring

Goal
Create optimized Dockerfiles for the API and Web apps and wire them together in a single `docker-compose.yml`.

### 1. Create `project/.dockerignore`
Crucial for ensuring a clean build and avoiding process conflicts with host-side `node_modules`.
```text
node_modules
**/node_modules
dist
**/dist
build
**/build
.next
**/.next
.turbo
**/.turbo
.env
**/.env
.git
.companion
companion
*.md
```

### 2. Create `project/apps/api/Dockerfile`
```dockerfile
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

CMD ["sh", "-c", "pnpm exec prisma migrate deploy && node apps/api/dist/server.js"]
```

### 3. Create `project/apps/web/Dockerfile`
```dockerfile
# apps/web/Dockerfile
FROM node:24-alpine AS build

WORKDIR /app
RUN corepack enable

# Copy all workspace files (filtered by .dockerignore)
COPY . .

RUN pnpm install --frozen-lockfile

# build the web app
RUN pnpm --filter web build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
```

### 4. Create `project/nginx.conf`
```nginx
server {
    listen 80;
    server_name localhost;

    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://api:3001/;
    }
}
```

### 5. Update `project/docker-compose.yml`
```yaml
services:
  db:
    image: postgres:16
    container_name: project-db
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app
      POSTGRES_DB: app
    ports:
      - "5432:5432"
    volumes:
      - db_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d app"]
      interval: 5s
      timeout: 3s
      retries: 20

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    container_name: project-api
    environment:
      DATABASE_URL: postgresql://app:app@db:5432/app?schema=public
      WEB_ORIGIN: http://localhost:8080
      NODE_ENV: production
    depends_on:
      db:
        condition: service_healthy
    ports:
      - "3001:3001"

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    container_name: project-web
    depends_on:
      - api
    ports:
      - "127.0.0.1:8080:80"

volumes:
  db_data:
```