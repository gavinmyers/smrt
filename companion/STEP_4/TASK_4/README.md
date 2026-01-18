STEP_4 / TASK_4 — Verification (no hangs)

Goal
Verify the full stack integration with the database.

### 1. Test API with DB
```powershell
Push-Location project
pnpm --filter api dev
```

### 2. Manual Verification
- `curl.exe http://localhost:3001/info` -> Returns DB-backed info.
- `curl.exe http://localhost:3001/session` -> Increments persistent counter.

### 3. Unified Verification
```powershell
Push-Location project
pnpm verify
Pop-Location
```

### 4. Resetting the Environment
```powershell
Push-Location project
docker compose down -v
docker compose up -d
pnpm exec prisma migrate dev --name init
Pop-Location
```
