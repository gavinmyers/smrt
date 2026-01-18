STEP_3 / TASK_2 — Unified Verification (CI/AI-safe)

Goal
Establish a single command (`pnpm verify`) that proves the project is healthy end-to-end without leaving any processes running.

### Key Decisions
- **Playwright `webServer`**: Native orchestration of API and UI servers during E2E tests to ensure clean startup and shutdown.
- **Biome Linting**: Configured to ignore build artifacts and focus on source code errors.
- **Deterministic Pipeline**: Sequential execution of linting, unit tests, build, and E2E tests.

### Configuration

#### 1. Playwright Orchestration (`project/playwright.config.ts`)
```typescript
webServer: [
  {
    command: "pnpm --filter api start",
    url: "http://localhost:3001/health",
    reuseExistingServer: false,
    timeout: 60_000,
  },
  {
    command: "pnpm --filter web preview",
    url: "http://localhost:4173",
    reuseExistingServer: false,
    timeout: 60_000,
  },
],
```

#### 2. Root Scripts (`project/package.json`)
```json
{
  "scripts": {
    "lint": "biome check .",
    "test": "pnpm --filter web test",
    "build": "turbo run build",
    "e2e": "pnpm exec playwright test",
    "verify": "pnpm lint && pnpm test && pnpm build && pnpm e2e"
  }
}
```

### Baseline Verification
The project health can be verified using a single command that orchestrates all quality checks.

**Command:**
```powershell
Push-Location .\project
pnpm verify
Pop-Location
```

**Expected Results:**
- **Exits cleanly**: The process terminates with exit code 0 on success.
- **No dev servers left running**: Playwright kills all orchestrated servers upon completion.
- **No interactive report server**: Configured with `reporter: "list"` to avoid hanging.

Record
Add to .companion/APPLICATION.md:
Verification pipeline completed: `pnpm verify` runs lint, unit tests, build, and E2E tests, using Playwright's `webServer` for clean orchestration.