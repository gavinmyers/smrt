# Main Roadmap

This directory contains the step-by-step guide for building the application.

## PowerShell Requirements

When executing shell commands in a PowerShell environment:
- **Avoid standard `curl`**: It is an alias for `Invoke-WebRequest` and may cause interactive prompts.
- **Use `curl.exe`**: For standard `curl` behavior.
- **Use `Invoke-RestMethod`**: For native PowerShell API interactions.
- **Use `-UseBasicParsing`**: When using `Invoke-WebRequest` to avoid Internet Explorer dependencies.

## Steps

### [STEP_0: Environment Setup](./STEP_0/TASK_0/README.md)
- **TASK_0**: Overview of Approach & Environment Setup.

### [STEP_1: Repository Structure](./STEP_1/TASK_0/README.md)
- **TASK_0**: Git Repository Validity & Currency Check.
- **TASK_1**: Template workspace correctness (project/ layout).
- **TASK_2**: Template instantiation smoke test.

### [STEP_2: Frontend Foundation](./STEP_2/TASK_0/README.md)
- **TASK_0**: Scaffold the project workspace (Vite + React).
- **TASK_1**: Add Material UI to the web app.
- **TASK_2**: Unit tests with Vitest.
- **TASK_3**: E2E tests with Playwright (Foundation).

### [STEP_3: Backend & Orchestration](./STEP_3/TASK_0/README.md)

- **TASK_0**: Vertical slice baseline (API health/info + session).

- **TASK_1**: One-command dev for web + api (Turborepo).

- **TASK_2**: Unified Verification (CI/AI-safe).



### [STEP_4: Database Integration](./STEP_4/TASK_0/README.md)



- **TASK_0**: Add Postgres + Prisma package.



- **TASK_1**: Add Docker Compose Postgres + env.



- **TASK_2**: Prisma schema + first migration.



- **TASK_3**: Wire API to DB.



- **TASK_4**: Verification.







### [STEP_5: Containerization](./STEP_5/TASK_0/README.md)



- **TASK_0**: Add Dockerfiles and compose wiring.



- **TASK_1**: Update UI for relative API calls.



- **TASK_2**: Configure Vite dev proxy.



- **TASK_3**: Final verification.




