import { prisma } from '@repo/database';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';

describe('CLI CRUD Integration Tests', () => {
  let app: FastifyInstance;
  let projectId: string;
  let keyId: string;
  let secret: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
    await prisma.$connect();

    // Setup: Create User, Project, and Key
    const email = `cli-crud-${Date.now()}@example.com`;
    await app.inject({
      method: 'POST',
      url: '/api/open/user/register',
      payload: { email, password: 'password123', name: 'CLI CRUD Tester' },
    });

    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/open/user/login',
      payload: { email, password: 'password123' },
    });
    const sidCookie = loginRes.cookies.find(
      (c: { name: string }) => c.name === 'sid',
    );
    if (!sidCookie) throw new Error('SID cookie not found');
    const headers = { cookie: `sid=${sidCookie.value}` };

    const projectRes = await app.inject({
      method: 'POST',
      url: '/api/session/project/create',
      headers,
      payload: { name: 'CLI CRUD Project' },
    });
    projectId = projectRes.json().id;

    const keyRes = await app.inject({
      method: 'POST',
      url: `/api/session/project/${projectId}/keys`,
      headers,
      payload: { name: 'CLI CRUD Key' },
    });
    const keyData = keyRes.json();
    keyId = keyData.id;
    secret = keyData.secret;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('should list conditions via CLI', async () => {
    // First create one
    await app.inject({
      method: 'POST',
      url: `/api/cli/${projectId}/${keyId}/condition`,
      headers: { 'x-cli-secret': secret },
      payload: { name: 'List Me', message: 'test' },
    });

    const res = await app.inject({
      method: 'GET',
      url: `/api/cli/${projectId}/${keyId}/conditions`,
      headers: { 'x-cli-secret': secret },
    });

    // Expecting failure initially as route doesn't exist
    expect(res.statusCode).toBe(200);
    const data = res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0].name).toBe('List Me');
  });

  it('should update a condition via CLI', async () => {
    // Create
    const createRes = await app.inject({
      method: 'POST',
      url: `/api/cli/${projectId}/${keyId}/condition`,
      headers: { 'x-cli-secret': secret },
      payload: { name: 'Update Me', message: 'original' },
    });
    const id = createRes.json().id;

    // Update
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/cli/${projectId}/${keyId}/condition/${id}`,
      headers: { 'x-cli-secret': secret },
      payload: { message: 'updated' },
    });

    expect(res.statusCode).toBe(200);
    const data = res.json();
    expect(data.message).toBe('updated');
  });

  it('should delete a condition via CLI', async () => {
    // Create
    const createRes = await app.inject({
      method: 'POST',
      url: `/api/cli/${projectId}/${keyId}/condition`,
      headers: { 'x-cli-secret': secret },
      payload: { name: 'Delete Me' },
    });
    const id = createRes.json().id;

    // Delete
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/cli/${projectId}/${keyId}/condition/${id}`,
      headers: { 'x-cli-secret': secret },
    });

    expect(res.statusCode).toBe(200);

    // Verify gone
    const listRes = await app.inject({
      method: 'GET',
      url: `/api/cli/${projectId}/${keyId}/conditions`,
      headers: { 'x-cli-secret': secret },
    });
    const list = listRes.json();
    expect(list.find((c: { id: string }) => c.id === id)).toBeUndefined();
  });

  // --- Features ---

  it('should list features via CLI', async () => {
    // First create one
    await app.inject({
      method: 'POST',
      url: `/api/cli/${projectId}/${keyId}/feature`,
      headers: { 'x-cli-secret': secret },
      payload: { name: 'List Me Feat', message: 'test' },
    });

    const res = await app.inject({
      method: 'GET',
      url: `/api/cli/${projectId}/${keyId}/features`,
      headers: { 'x-cli-secret': secret },
    });

    expect(res.statusCode).toBe(200);
    const data = res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data[0].name).toBe('List Me Feat');
  });

  it('should update a feature via CLI', async () => {
    // Create
    const createRes = await app.inject({
      method: 'POST',
      url: `/api/cli/${projectId}/${keyId}/feature`,
      headers: { 'x-cli-secret': secret },
      payload: { name: 'Update Me Feat', message: 'original' },
    });
    const id = createRes.json().id;

    // Update
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/cli/${projectId}/${keyId}/feature/${id}`,
      headers: { 'x-cli-secret': secret },
      payload: { message: 'updated' },
    });

    expect(res.statusCode).toBe(200);
    const data = res.json();
    expect(data.message).toBe('updated');
  });

  it('should delete a feature via CLI', async () => {
    // Create
    const createRes = await app.inject({
      method: 'POST',
      url: `/api/cli/${projectId}/${keyId}/feature`,
      headers: { 'x-cli-secret': secret },
      payload: { name: 'Delete Me Feat' },
    });
    const id = createRes.json().id;

    // Delete
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/cli/${projectId}/${keyId}/feature/${id}`,
      headers: { 'x-cli-secret': secret },
    });

    expect(res.statusCode).toBe(200);

    // Verify gone
    const listRes = await app.inject({
      method: 'GET',
      url: `/api/cli/${projectId}/${keyId}/features`,
      headers: { 'x-cli-secret': secret },
    });
    const list = listRes.json();
    expect(list.find((f: { id: string }) => f.id === id)).toBeUndefined();
  });
});
