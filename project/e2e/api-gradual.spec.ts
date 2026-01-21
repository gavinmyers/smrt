import { expect, test } from '@playwright/test';

test.describe('API Gradual Integration', () => {
  const baseURL = process.env.API_URL;
  if (!baseURL) {
    throw new Error('API_URL environment variable is required');
  }

  test('Level 3: Infrastructure - Health Check', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/open/status/health`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.status).toBe('ok');
  });

  test('Level 4: Isolated Logic - API Sentinel (No DB)', async ({
    request,
  }) => {
    const response = await request.get(`${baseURL}/api/open/health/api`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.sentinel).toBe('SMRT-V1-READY');
  });

  test('Level 5: Database Integration - DB Sentinel', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/open/health/db`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.sentinel).toBe('SMRT-V1-READY');
  });

  test('Level 11: API Key Lifecycle and Secret Isolation', async ({
    request,
  }) => {
    // 1. Create and Login
    const user = { email: `key-${Date.now()}@test.com`, password: 'pw' };
    await request.post(`${baseURL}/api/open/user/register`, {
      data: { ...user, name: 'Key User' },
    });
    await request.post(`${baseURL}/api/open/user/login`, { data: user });

    // 2. Create a dummy project
    const projectRes = await request.post(
      `${baseURL}/api/session/project/create`,
      { data: { name: 'Key Test Project' } },
    );
    const project = await projectRes.json();
    const projectId = project.id;

    // 3. Create a key
    const createRes = await request.post(
      `${baseURL}/api/session/project/${projectId}/keys`,
      { data: { name: 'Test Key' } },
    );
    expect(createRes.ok()).toBeTruthy();
    const keyBlob = await createRes.json();

    expect(keyBlob.secret).toBeDefined();
    expect(keyBlob.keyId).toBeDefined();
    expect(keyBlob.projectId).toBe(projectId);
    expect(keyBlob.apiUrl).toContain('/api/cli');

    // 4. List keys - verify secret is NOT returned
    const listRes = await request.get(
      `${baseURL}/api/session/project/${projectId}/keys`,
    );
    const keys = await listRes.json();
    const foundKey = keys.find((k: any) => k.id === keyBlob.keyId);

    expect(foundKey).toBeDefined();
    expect(foundKey.keyHash).toBeUndefined();
    expect((foundKey as any).secret).toBeUndefined();

    // 5. Cleanup
    await request.delete(`${baseURL}/api/session/project/${projectId}`);
  });
});
