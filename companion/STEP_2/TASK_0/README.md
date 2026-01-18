STEP_2 / TASK_0 — Scaffold the project workspace

Outcome: project/ becomes a runnable monorepo that installs and starts.

Purpose (tight)

Create a real Node/TypeScript monorepo inside project/ that:

installs cleanly

has at least one runnable app

defines the commands we will rely on later (dev, build)

No DB. No UI yet. Just “it runs”.

Assumptions

You are in the template repo root

project/ exists but is either empty or partially scaffolded

Run (copy/paste, from repo root)
# enter project workspace
Push-Location .\project

# initialize package.json if missing
if (-not (Test-Path package.json)) {
  pnpm init
}

# ensure workspace layout exists
New-Item -ItemType Directory -Force apps | Out-Null
New-Item -ItemType Directory -Force packages | Out-Null

# create a minimal web app (Vite + React + TS)
Push-Location apps
pnpm create vite web -- --template react-ts
Pop-Location

# install workspace deps
pnpm install

Pop-Location

Minimal wiring (required)

Edit project/pnpm-workspace.yaml to:

packages:
  - apps/*
  - packages/*


Edit project/package.json to include root scripts:

{
  "private": true,
  "scripts": {
    "dev": "pnpm -r dev",
    "build": "pnpm -r build"
  }
}


(No tooling yet. Just orchestration.)

Run (verification - Manual)
# In a separate terminal or when prompted:
Push-Location .\project
pnpm dev
Pop-Location

Verify (strict)

pnpm install completes without error

Manual Check: pnpm dev starts the Vite dev server and prints a localhost URL.

This is the first non-negotiable milestone:

A user can clone the template, go into project/, run pnpm install, and see a running app.

Record

Add to .companion/APPLICATION.md:

STEP_2/TASK_0 complete: project workspace scaffolded as a runnable pnpm monorepo with a React + TypeScript app.