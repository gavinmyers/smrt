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
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
