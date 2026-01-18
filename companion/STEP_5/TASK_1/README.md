STEP_5 / TASK_1 — Make the UI call /api/*

Goal
Update the web application to use relative API paths to ensure compatibility with both the Nginx proxy in Docker and the Vite proxy in development.

### Implementation
Modify `project/apps/web/src/api.ts`:
- Change `API_BASE` to `/api`.
- Ensure all fetch calls use this relative base.
