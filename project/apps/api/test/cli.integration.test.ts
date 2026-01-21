import { prisma } from '@repo/database';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';

describe('CLI Integration Tests', () => {
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

  it('CLI Authentication Flow', async () => {
    // 1. Setup: Register & Login a User
    const email = `cli-test-${Date.now()}@example.com`;
    const registerRes = await app.inject({
      method: 'POST',
      url: '/api/open/user/register',
      payload: { email, password: 'password123', name: 'CLI Tester' },
    });
    expect(registerRes.statusCode).toBe(201);

    // Get the session cookie
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/open/user/login',
      payload: { email, password: 'password123' },
    });
    const cookies = loginRes.cookies;
    const sidCookie = cookies.find((c: { name: string }) => c.name === 'sid');
    if (!sidCookie) throw new Error('SID cookie not found');

    const headers = { cookie: `sid=${sidCookie.value}` };

    // 2. Create Project
    const projectRes = await app.inject({
      method: 'POST',
      url: '/api/session/project/create',
      headers,
      payload: { name: 'CLI Auth Project' },
    });
    expect(projectRes.statusCode).toBe(200);
    const project = projectRes.json();
    const projectId = project.id;

    // 3. Create Key
    const keyRes = await app.inject({
      method: 'POST',
      url: `/api/session/project/${projectId}/keys`,
      headers,
      payload: { name: 'CLI Key' },
    });
    expect(keyRes.statusCode).toBe(200);
    const keyData = keyRes.json();
    const keyId = keyData.id;
    const secret = keyData.secret;

    expect(keyId).toBeDefined();
    expect(secret).toBeDefined();
    expect(secret).toMatch(/^sk_/);

    // 4. Authenticate as CLI (simulate CLI client)
    // The CLI sends Key ID in URL and Secret in header
    const authRes = await app.inject({
      method: 'GET',
      url: `/api/cli/${projectId}/${keyId}/check`,
      headers: {
        'x-cli-secret': secret,
      },
    });

    expect(authRes.statusCode).toBe(200);
    const authData = authRes.json();
    expect(authData.validated).toBe(true);
    expect(authData.project.id).toBe(projectId);

    // 6. Create Condition via CLI
    const condRes = await app.inject({
      method: 'POST',
      url: `/api/cli/${projectId}/${keyId}/condition`,
      headers: {
        'x-cli-secret': secret,
      },
      payload: {
        name: 'CLI Condition',
        message: 'Reported by CLI tool',
      },
    });

    expect(condRes.statusCode).toBe(200);
    const condData = condRes.json();
    expect(condData.name).toBe('CLI Condition');
    expect(condData.message).toBe('Reported by CLI tool');
    expect(condData.projectId).toBe(projectId);

    // 7. Create Feature via CLI
    const featRes = await app.inject({
      method: 'POST',
      url: `/api/cli/${projectId}/${keyId}/feature`,
      headers: {
        'x-cli-secret': secret,
      },
      payload: {
        name: 'CLI Feature',
        message: 'Requested via CLI',
      },
    });

    expect(featRes.statusCode).toBe(200);
    const featData = featRes.json();
    expect(featData.name).toBe('CLI Feature');
    expect(featData.message).toBe('Requested via CLI');
    expect(featData.projectId).toBe(projectId);

    // 8. Verify Failure with Wrong Secret
    const failRes = await app.inject({
      method: 'GET',
      url: `/api/cli/${projectId}/${keyId}/check`,
      headers: {
        'x-cli-secret': 'sk_wrongtoken12345',
      },
    });
    expect(failRes.statusCode).toBe(401);
  });
});
