import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../src/index.js';
import { prisma } from '@repo/database';

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
  });

  it('GET /api/session should return session info', async () => {
     const response = await app.inject({
      method: 'GET',
      url: '/api/session',
    });
    
    expect(response.statusCode).toBe(200);
    expect(response.json().sessionId).toBeDefined();
  });
});
