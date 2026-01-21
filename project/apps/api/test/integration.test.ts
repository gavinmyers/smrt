import { prisma } from '@repo/database';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';

interface TestUser {
  email: string;
  password?: string;
  id?: string;
}

// Extend global type for test context
declare global {
  var testUser: TestUser;
  var authCookie: string;
}

describe('API Integration Tests', () => {
  let app: FastifyInstance;

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
    global.testUser = { email, password: 'password123', id: body.id };
  });

  it('POST /api/open/user/login should return 200 and user info', async () => {
    const { email, password, id } = global.testUser;

    const response = await app.inject({
      method: 'POST',
      url: '/api/open/user/login',
      payload: { email, password },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.user.id).toBe(id);
    expect(body.user.email).toBe(email);
  });

  it('POST /api/open/user/login should fail with invalid credentials', async () => {
    const { email } = global.testUser;

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
    const { email, password, id } = global.testUser;

    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/open/user/login',
      payload: { email, password },
    });

    const cookies = loginRes.cookies; // access cookies from response
    const sidCookie = cookies.find((c) => c.name === 'sid');

    if (!sidCookie) {
      throw new Error('SID cookie not found in login response');
    }

    const sessionRes = await app.inject({
      method: 'GET',
      url: '/api/session',
      cookies: { sid: sidCookie.value },
    });

    expect(sessionRes.statusCode).toBe(200);
    expect(sessionRes.json().userId).toBe(id);

    // Save cookie for subsequent requests
    global.authCookie = sidCookie.value;
  });

  it('Project Management Flow', async () => {
    const cookie = global.authCookie;
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
    const cookie = global.authCookie;
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
});
