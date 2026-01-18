STEP_3 / TASK_1 — One-command dev for web + api

Goal
Enable a single command (`pnpm dev`) to start both the API and the UI using Turborepo.

1. Install Turbo
- Add `turbo` as a dev dependency to the workspace root.

2. Configure Turbo
- Create `turbo.json` to define the orchestration for `dev` and `build` tasks.

3. Update Root Scripts and Package Manager
- Add the `packageManager` field (e.g., `"packageManager": "pnpm@10.28.0"`) to the root `package.json`.
- Modify the root `package.json` to use `turbo` for the `dev` and `build` scripts.

Verification (Manual)
Run the following command and verify that both the API (port 3001) and Web (port 5173) start in parallel.
```powershell
Push-Location .\project
pnpm dev
Pop-Location
```

Record
Add to .companion/APPLICATION.md:
Turborepo integrated: Single-command dev environment (`pnpm dev`) now starts both API and Web apps in parallel.