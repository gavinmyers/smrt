# refactor: Secure Multi-User Project Isolation

## Goal
Implement a namespaced API structure (`/api/open`, `/api/session`, `/api/cli`) with mandatory session/CLI key authorization and "locked-down" hash storage for users and keys.

## Phase 1: API Namespace Restructuring
- [x] Group existing routes into prefixes: `/api/open`, `/api/session`, `/api/cli`.
- [x] Implement `onRequest` hooks for `/api/session` and `/api/cli` to enforce authorization.
- [x] Add `/api/open/user/login` and `/api/open/user/register`.

## Phase 2: Database Layer (Locked-Down Hashes)
- [x] Update `schema.prisma` with `User`, `UserHash`, `Key`, `KeyHash`.
- [x] Implement `addUserHash` / `validateUserHash` / `addKeyHash` / `validateKeyHash` in `@repo/database`.
- [x] Update `MemoryDB` for local parity.

## Phase 3: Access Control Logic
- [x] Update `GET /api/session/project/list` to filter by assigned `userId`.
- [x] Ensure all sub-resources (Conditions, Features, Keys) are scoped to the project.

## Phase 4: Frontend & Test Alignment
- [x] Update `apps/web/src/api.ts` to new namespaces.
- [x] Update E2E tests to established sessions before checking projects.
- [x] Verify all 15+ gradual testing levels.

## Phase 5: Auth UI & Mandatory Registration
- [ ] Implement Login/Register main page in `apps/web`.
- [ ] Gate main application content behind a valid session.
- [ ] Update all E2E tests to follow a mandatory "register -> login" flow.
- [ ] Verify that protected endpoints correctly return 401/403 without a session.

## Phase 6: Real DB Local Dev & Self-Healing API
- [ ] Create `docker-compose.local.yml` for standalone local DB.
- [ ] Update `.env.local` to point to local Docker DB.
- [ ] Remove `MemoryDB` and custom extensions from `@repo/database`.
- [ ] Implement self-healing startup in `apps/api`:
    - [ ] Infinite/persistent retry loop for DB connection.
    - [ ] Automatic `prisma db push` synchronization on startup.
- [ ] Move User/Key hashing logic from DB package into API routes.
- [ ] Update `pnpm run dev` to ensure Docker DB is up.

---

## Current Status
- [x] Initial Task Planning
- [x] Restructuring API routes into namespaces (/api/open, /api/session, /api/cli)
- [x] Implement robust `onRequest` hooks for session validation
- [x] Update frontend `api.ts` to new paths
- [x] Update E2E and Gradual tests to handle new namespaces and login flows
- [x] Correct proxy configurations (Vite & Nginx) for namespaced paths
- [x] Fixed build pipeline dependencies (Database generation before API build)
- [x] Resolved "first request" session race condition
- [x] All 15 gradual testing levels PASSED.
- [x] Auth UI implemented and verified.
- [x] Moving local dev to real PostgreSQL with self-healing API.
- [x] Include `apiUrl` in generated key response for CLI one-stop config.
