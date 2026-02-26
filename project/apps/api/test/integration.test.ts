import { prisma } from '@repo/database';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';

describe('API Integration Tests', () => {
  let app;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('GET /api/open/status/health should return 200', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/open/status/health',
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
  });

  it('POST /api/open/user/register should create a user', async () => {
    const email = `test-${Date.now()}@example.com`;
    const response = await app.inject({
      method: 'POST',
      url: '/api/open/user/register',
      payload: {
        email,
        password: 'password123',
        name: 'Integration Test User',
      },
    });
    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.email).toBe(email);
    expect(body.id).toBeDefined();

    // Store for login test
    (global as any).testUser = { email, password: 'password123', id: body.id };
  });

  it('POST /api/open/user/login should return 200 and user info', async () => {
    const { email, password, id } = (global as any).testUser;

    const response = await app.inject({
      method: 'POST',
      url: '/api/open/user/login',
      payload: { email, password },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.user.id).toBe(id);
    expect(body.user.email).toBe(email);

    // Verify session was updated (requires mocking/checking DB directly or relying on cookie persistence in `inject` which is tricky without a cookie jar.
    // Ideally we check the DB directly here since we have prisma access)
    // Note: app.inject doesn't automatically persist cookies between requests unless we handle them.
    // However, the `sid` logic in `index.ts` creates a NEW session if no cookie is sent.
    // To test session linking properly in `inject`, we need to capture the cookie.
  });

  it('POST /api/open/user/login should fail with invalid credentials', async () => {
    const { email } = (global as any).testUser;

    const response = await app.inject({
      method: 'POST',
      url: '/api/open/user/login',
      payload: { email, password: 'wrongpassword' },
    });

    expect(response.statusCode).toBe(401);
  });

  it('GET /api/session should return session info', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/session',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().sessionId).toBeDefined();
  });

  it('GET /api/session should return userId after login', async () => {
    const { email, password, id } = (global as any).testUser;

    // Login again to ensure session is linked (in case previous tests messed state, though they shouldn't have)
    // Note: In a real integration test with cookies, we wouldn't need to re-login if the cookie jar was persisted.
    // Here we are just verifying the API behavior assuming the same 'sid' logic applies or we are testing the logic flow.
    // However, since `app.inject` resets cookies per request unless chained or managed, the 'sid' generated in this request
    // will be NEW and NOT linked to the user.
    //
    // FIX: We need to simulate the flow within a single session or manually link the new session.
    // Since we can't easily share cookie state across `it` blocks with standard `app.inject` without a lot of boilerplate,
    // let's do a self-contained test for this scenario.

    // 1. Create a user (or use existing)
    // 2. Login
    // 3. Get Session -> Check userId

    // Actually, let's just use the `onResponse` or cookie parsing to get the SID from the login response
    // and pass it to the session request.

    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/open/user/login',
      payload: { email, password },
    });

    const cookies = loginRes.cookies; // access cookies from response
    const sidCookie = cookies.find((c: any) => c.name === 'sid');

    const sessionRes = await app.inject({
      method: 'GET',
      url: '/api/session',
      cookies: { sid: sidCookie.value },
    });

    expect(sessionRes.statusCode).toBe(200);
    expect(sessionRes.json().userId).toBe(id);

    // Save cookie for subsequent requests
    (global as any).authCookie = sidCookie.value;
  });

  it('Project Management Flow', async () => {
    const cookie = (global as any).authCookie;
    const headers = { cookie: `sid=${cookie}` };

    // 1. Create Project
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/session/project/create',
      headers,
      payload: { name: 'Test Project' },
    });
    expect(createRes.statusCode).toBe(200);
    const project = createRes.json();
    expect(project.id).toBeDefined();
    expect(project.name).toBe('Test Project');

    // 2. List Projects
    const listRes = await app.inject({
      method: 'GET',
      url: '/api/session/project/list',
      headers,
    });
    expect(listRes.statusCode).toBe(200);
    const projects = listRes.json();
    expect(projects).toHaveLength(1);
    expect(projects[0].id).toBe(project.id);

    // 3. Add Condition
    const condRes = await app.inject({
      method: 'POST',
      url: `/api/session/project/${project.id}/conditions`,
      headers,
      payload: { name: 'Is Beta User' },
    });
    expect(condRes.statusCode).toBe(200);
    expect(condRes.json().projectId).toBe(project.id);

    // 4. Add Feature
    const featRes = await app.inject({
      method: 'POST',
      url: `/api/session/project/${project.id}/features`,
      headers,
      payload: { name: 'Dark Mode' },
    });
    expect(featRes.statusCode).toBe(200);

    // 5. Add Key
    const keyRes = await app.inject({
      method: 'POST',
      url: `/api/session/project/${project.id}/keys`,
      headers,
      payload: { name: 'Dev Key' },
    });
    expect(keyRes.statusCode).toBe(200);
    expect(keyRes.json().secret).toBeDefined(); // Secret should be returned on creation
  });

  it('Project Management Flow with Description', async () => {
    const cookie = (global as any).authCookie;
    const headers = { cookie: `sid=${cookie}` };

    // 1. Create Project with Description
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/session/project/create',
      headers,
      payload: {
        name: 'Described Project',
        description: 'A project with goals.',
      },
    });
    expect(createRes.statusCode).toBe(200);
    const project = createRes.json();
    expect(project.description).toBe('A project with goals.');

    // 2. Update Description
    const updateRes = await app.inject({
      method: 'PATCH',
      url: `/api/session/project/${project.id}`,
      headers,
      payload: { description: 'Updated goals.' },
    });
    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.json().description).toBe('Updated goals.');
  });

  it('Discussion CRUD and message CRUD via session API', async () => {
    const cookie = (global as any).authCookie;
    const headers = { cookie: `sid=${cookie}` };

    const projectRes = await app.inject({
      method: 'POST',
      url: '/api/session/project/create',
      headers,
      payload: { name: 'Discussion Session Project' },
    });
    const project = projectRes.json();

    const createDiscussionRes = await app.inject({
      method: 'POST',
      url: `/api/session/project/${project.id}/discussions`,
      headers,
      payload: { name: 'Agent Coordination' },
    });
    expect(createDiscussionRes.statusCode).toBe(200);
    const discussion = createDiscussionRes.json();
    expect(discussion.name).toBe('Agent Coordination');

    const listDiscussionsRes = await app.inject({
      method: 'GET',
      url: `/api/session/project/${project.id}/discussions`,
      headers,
    });
    expect(listDiscussionsRes.statusCode).toBe(200);
    expect(
      listDiscussionsRes.json().some((d: any) => d.id === discussion.id),
    ).toBe(true);

    const createMessageRes = await app.inject({
      method: 'POST',
      url: `/api/session/project/${project.id}/discussions/${discussion.id}/messages`,
      headers,
      payload: { body: 'First session-authored message' },
    });
    expect(createMessageRes.statusCode).toBe(200);
    const message = createMessageRes.json();
    expect(message.body).toBe('First session-authored message');
    expect(message.authorName).toBeDefined();

    const updateMessageRes = await app.inject({
      method: 'PATCH',
      url: `/api/session/project/${project.id}/discussions/${discussion.id}/messages/${message.id}`,
      headers,
      payload: { body: 'Edited session-authored message' },
    });
    expect(updateMessageRes.statusCode).toBe(200);
    expect(updateMessageRes.json().body).toBe('Edited session-authored message');

    const listMessagesRes = await app.inject({
      method: 'GET',
      url: `/api/session/project/${project.id}/discussions/${discussion.id}/messages`,
      headers,
    });
    expect(listMessagesRes.statusCode).toBe(200);
    expect(
      listMessagesRes.json().find((m: any) => m.id === message.id)?.body,
    ).toBe('Edited session-authored message');

    const deleteMessageRes = await app.inject({
      method: 'DELETE',
      url: `/api/session/project/${project.id}/discussions/${discussion.id}/messages/${message.id}`,
      headers,
    });
    expect(deleteMessageRes.statusCode).toBe(200);

    const deleteDiscussionRes = await app.inject({
      method: 'DELETE',
      url: `/api/session/project/${project.id}/discussions/${discussion.id}`,
      headers,
    });
    expect(deleteDiscussionRes.statusCode).toBe(200);
  });
});
