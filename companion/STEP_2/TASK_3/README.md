STEP_2 / TASK_3 — E2E tests with Playwright (Foundation)

Goal
Establish an end-to-end testing framework using Playwright to verify application behavior across browsers.

Commands
```powershell
Push-Location .\project
# Install Playwright to workspace root
pnpm add -D -w playwright
# Install browsers
pnpm exec playwright install
# Initialize Playwright (Non-interactive assumption)
pnpm exec playwright init --lang=typescript --test-dir=e2e --gha=false
Pop-Location
```

Files to Create/Modify

### 1. Create `project/e2e/smoke.spec.ts`
Add a smoke test to verify the web application loads correctly.

### 2. Update `project/package.json`
Add E2E test scripts to the workspace root.

Verification (Manual)
1. Start the web application in one terminal:
   ```powershell
   Push-Location .\project
   pnpm --filter web dev
   ```
2. Run Playwright tests in another terminal:
   ```powershell
   Push-Location .\project
   pnpm exec playwright test
   ```

Record
Add to .companion/APPLICATION.md:
E2E testing established using Playwright; smoke test verified against the dev server.