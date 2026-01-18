STEP_5 / TASK_2 — Vite dev proxy (local dev parity)

Goal
Configure the Vite development server to proxy `/api` requests to the local API server, maintaining parity with the Docker environment and handling path stripping.

### Implementation
Update `project/apps/web/vite.config.ts`:

```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
```
This ensures that `fetch("/api/health")` during development correctly routes to `http://localhost:3001/health`.