STEP_2 / TASK_2 — Unit tests with Vitest (web app)

Goal
Set up a testing environment using Vitest and React Testing Library to ensure component reliability.

Commands
```powershell
Push-Location .\project
pnpm --filter web add -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom
Pop-Location
```

Files to Create/Modify

### 1. Create `project/apps/web/src/App.test.tsx`
Add a smoke test to verify the `App` component renders correctly.

### 2. Update `project/apps/web/package.json`
Add test scripts to the `web` application.

Verification
Run the tests to ensure everything is configured correctly.
```powershell
Push-Location .\project
pnpm --filter web test
Pop-Location
```

Record
Add to .companion/APPLICATION.md:
Unit testing established for the web app using Vitest and React Testing Library.