STEP_3 / TASK_0 — Vertical slice baseline (API health/info + session + UI status)

Goal
Create a Fastify API in `apps/api` and update the `web` application to display health, info, and session status, proving UI-to-API connectivity with reliable cookie-based sessions.

1. Create the API app
- Initialize `apps/api` with Fastify, CORS, and Cookie plugins.
- Define `/health`, `/info`, and `/session` endpoints.

### Server Configuration
Important: Use `trustProxy: true` when running behind Nginx.

```typescript
const app = Fastify({ logger: true, trustProxy: true });
```

### Session Implementation (Direct Cookie)
To ensure reliability across Docker and local development, we use direct cookie management via `@fastify/cookie`.

```typescript
import crypto from "node:crypto";
import cookie from "@fastify/cookie";

await app.register(cookie, {
  secret: "dev-secret-at-least-32-chars-long",
});

app.get("/session", async (req, reply) => {
  let sid = req.cookies.sid;

  if (!sid) {
    sid = crypto.randomUUID();
    reply.setCookie("sid", sid, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    });
  }

  // Baseline uses in-memory/static tracking (DB added in STEP_4)
  return { hasSession: true, sessionId: sid, visits: 1 };
});
```

2. Update the UI
- Add a tiny API client in `web/src/api.ts`.
- Update `App.tsx` to fetch and display the baseline status from the API.

Verification (Manual)
1. Start the API in one terminal:
   ```powershell
   Push-Location .\project
   pnpm --filter api dev
   ```
2. Start the UI in another terminal:
   ```powershell
   Push-Location .\project
   pnpm --filter web dev
   ```
3. Open the UI and verify that `/session` returns a stable `sessionId`.

Record
Add to .companion/APPLICATION.md:
Vertical slice baseline established: Fastify API provides health/info/session endpoints; React UI consumes them with full cookie support.
