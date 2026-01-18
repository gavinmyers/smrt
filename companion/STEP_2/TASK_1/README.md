STEP_2 / TASK_1 — Add Material UI to the web app

Goal
Integrate Material UI (MUI) into the `web` application to establish the UI foundation.

Commands
```powershell
Push-Location .\project
pnpm --filter web add @mui/material @emotion/react @emotion/styled
pnpm --filter web add @fontsource/roboto
Pop-Location
```

Minimal code change

### 1. Update `project/apps/web/src/main.tsx`
Import Roboto fonts and wrap the application in MUI`s `ThemeProvider` and `CssBaseline`.

### 2. Update `project/apps/web/src/App.tsx`
Replace the default Vite content with MUI components to verify the integration.

Verification (Manual)
Run the following command and verify the MUI components (Typography, Button) are rendered correctly.
```powershell
Push-Location .\project
pnpm --filter web dev
Pop-Location
```

Record
Add to .companion/APPLICATION.md:
Material UI added to the web app with Roboto fonts and ThemeProvider configuration.