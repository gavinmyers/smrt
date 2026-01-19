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
    expect(body.id).toBe(id);
    expect(body.email).toBe(email);
    
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
});
