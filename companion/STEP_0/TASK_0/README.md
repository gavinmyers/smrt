# STEP_0/TASK_0: Overview of Approach & Environment Setup

## Goal
Establish the persistent environment and verify agent capabilities to ensure a reliable build process.

## Objectives
- **Environment Initialization**: Ensure the infrastructure for tracking project progress and user context is in place.
- **Persistence**: Use the `.companion` directory to store state that should not be committed to the main repository.
- **Verification**: Confirm the agent's ability to interact with the system, network, and file system accurately.

---

## Task Instructions

> [!IMPORTANT]
> **This task is a persistent setup check. NEVER mark `STEP_0/TASK_0` as complete.** You must read and verify these requirements at the start of every session to ensure the environment is stable.

### 1. Repository Setup
- Verify the existence of a `.gitignore` file. Create it if missing.
- Ensure `.companion/` is added to `.gitignore` to prevent tracking of local agent state.

### 2. Companion State
- Create a `.companion/` directory if it does not exist.
- Initialize `.companion/USER.md`: This file must contain the detected operating system and shell environment (e.g., Windows/PowerShell, macOS/Zsh).
- Initialize `.companion/APPLICATION.md`: This file will serve as the living manifest for the application being built.

### 3. PowerShell Compatibility & Non-Interactive Commands
When working in a PowerShell environment, standard `curl` is often an alias for `Invoke-WebRequest`, which may trigger interactive prompts or slow down execution due to HTML parsing. To ensure non-interactive and efficient execution:
- **Use `curl.exe`**: Explicitly calling the binary (e.g., `curl.exe -I https://google.com`) bypasses the PowerShell alias.
- **Use `Invoke-RestMethod` (alias `irm`)**: Preferred for API interactions as it returns parsed objects and is non-interactive.
- **Use `Invoke-WebRequest -UseBasicParsing`**: If using `IWR`, always include `-UseBasicParsing` to avoid Internet Explorer engine dependencies.

### 4. Capability Proof
- Execute a non-interactive network test (e.g., `curl.exe -I --max-time 5 https://www.google.com` or `Invoke-RestMethod -Uri https://www.google.com -Method Head`) to verify outbound network connectivity.
- Document the result of the network test and the system identification in `.companion/USER.md`.
- Confirm in `.companion/USER.md` that all tool suites (shell, file system, search) are operational for the build process.

### 5. Base Environment Check
Establish a baseline of the local development environment by verifying the existence and versions of core dependencies.
- **Required Commands**:
    - `git --version`
    - `docker --version`
    - `docker compose version`
    - `node -v`
    - `npm -v`
    - `npx -v`
    - `pnpm -v`
    - `pnpm exec prisma -v`
    - `pnpm exec tsx --version`
- **Protocol**:
    - If a tool is missing, report the failure and provide clear installation instructions for the user.
    - If a critical tool (like `node` or `pnpm`) is missing, stop the build process immediately as per the "Stop on Error" mandate.
    - Log all version information in `.companion/USER.md`.
