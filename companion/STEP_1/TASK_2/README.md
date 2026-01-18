STEP_1 / TASK_2 — Template instantiation smoke test
Purpose

Prove a user can:

copy project/ into a new directory

treat it as a real project

install dependencies successfully

This simulates creating a real project from the template.

Run (from template repo root)
# 1) Create a temporary instantiation target
$dest = "..\_new-project-smoke"
if (Test-Path $dest) { Remove-Item -Recurse -Force $dest }
New-Item -ItemType Directory -Force $dest | Out-Null

# 2) Copy project workspace into new project root
Copy-Item -Recurse -Force .\project\* $dest

# 3) Initialize git in the new project
Push-Location $dest
git init

# 4) Install deps and verify workspace
pnpm install
pnpm -r list --depth -1

# 5) Optional: quick boot check
# pnpm dev
# pnpm build

Pop-Location

Verify

pnpm install succeeds

Workspace packages resolve

Optional dev/build does not immediately fail

Cleanup (required)
Remove-Item -Recurse -Force ..\_new-project-smoke

Record

Add to .companion/APPLICATION.md:

Template instantiation verified via copy of project/; temporary test project removed.