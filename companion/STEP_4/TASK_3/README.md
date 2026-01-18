STEP_4 / TASK_3 — Wire API to DB

Goal
Replace in-memory session tracking and static info with persistent data using Prisma and direct cookie management.

### 1. Add Database Dependency to API
The API must explicitly depend on the database workspace package.
```powershell
Push-Location project
pnpm --filter api add "@repo/database@workspace:*"
Pop-Location
```

### 2. Update API Build Configuration
Update `project/apps/api/package.json` to externalize the database package during the build:
```json
"scripts": {
  "build": "pnpm exec tsup src/server.ts --format esm --dts --clean --external @repo/database"
}
```

### 3. Implementation Details

#### GET /session (DB-backed)
Use the `sid` cookie to track and increment visits in the database.

```typescript
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

  const row = await prisma.sessionCounter.upsert({
    where: { sessionId: sid },
    create: { sessionId: sid, visits: 1 },
    update: { visits: { increment: 1 } },
    select: { visits: true },
  });

  return { hasSession: true, sessionId: sid, visits: row.visits };
});
```

#### POST /session/reset
Delete the session data from the database and clear the cookie.
```typescript
app.post("/session/reset", async (req, reply) => {
  const sid = req.cookies.sid;
  if (sid) {
    await prisma.sessionCounter.deleteMany({ where: { sessionId: sid } });
  }

  reply.clearCookie("sid", { path: "/" });
  reply.status(204).send();
});
```
