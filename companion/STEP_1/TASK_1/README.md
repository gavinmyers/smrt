STEP_1 / TASK_1 — Template workspace correctness (project/ is the template output)
Goal

Prove this repo is a template, and the actual app workspace lives in ./project and is self-contained.

Run (copy/paste)

From template repo root:

# 1) Template repo root should NOT be a pnpm workspace root
Test-Path .\package.json
Test-Path .\pnpm-workspace.yaml

# 2) project/ must exist and contain the workspace root
Test-Path .\project
Test-Path .\project\package.json
Test-Path .\project\pnpm-workspace.yaml
Test-Path .\project\apps
Test-Path .\project\packages

# 3) pnpm must resolve packages when run inside project/
Push-Location .\project
pnpm -v
pnpm list -r --depth -1
Pop-Location

Verify (strict)

At template repo root:

package.json is False

pnpm-workspace.yaml is False

Inside project/:

package.json + pnpm-workspace.yaml are True

apps/ and packages/ are True

pnpm list -r --depth -1 lists workspace packages (not “No package found…”)

Record

Add to .companion/APPLICATION.md:

Template validated: repo root is not a workspace; ./project is the workspace root and resolves packages via pnpm.