import { test, expect } from '@playwright/test';

test.describe('CLI Gradual Integration', () => {
  const baseURL = `http://localhost:${process.env.PORT || '3001'}`;

  test('Level 12: CLI Check Endpoint Security', async ({ request }) => {
    // 1. Setup User, Session, Project and Key
    const user = { email: `cli-${Date.now()}@test.com`, password: 'pw' };
    await request.post(`${baseURL}/api/open/user/register`, { data: { ...user, name: 'CLI User' } });
    await request.post(`${baseURL}/api/open/user/login`, { data: user });

    const projectRes = await request.post(`${baseURL}/api/session/project/create`, { data: { name: 'CLI Test Project' } });
    const project = await projectRes.json();
    const projectId = project.id;

    const keyRes = await request.post(`${baseURL}/api/session/project/${projectId}/keys`, { data: { name: 'CLI Key' } });
    const keyBlob = await keyRes.json();
    const keyId = keyBlob.keyId;
    const secret = keyBlob.secret;

    // 2. Validate with CORRECT secret
    const validRes = await request.get(`${baseURL}/api/cli/${projectId}/${keyId}/check`, {
      headers: { 'x-cli-secret': secret }
    });
    expect(validRes.ok()).toBeTruthy();
    const validData = await validRes.json();
    expect(validData.validated).toBe(true);
    expect(validData.project.id).toBe(projectId);

    // 3. FAIL: Wrong secret
    const invalidSecretRes = await request.get(`${baseURL}/api/cli/${projectId}/${keyId}/check`, {
      headers: { 'x-cli-secret': 'wrong-secret' }
    });
    expect(invalidSecretRes.status()).toBe(401);

    // 4. FAIL: Wrong project ID (Leakage Test)
    // Create another project (User stays the same, assigned to this new project too)
    const project2Res = await request.post(`${baseURL}/api/session/project/create`, { data: { name: 'Other Project' } });
    const project2 = await project2Res.json();
    const projectId2 = project2.id;

    const wrongProjectRes = await request.get(`${baseURL}/api/cli/${projectId2}/${keyId}/check`, {
      headers: { 'x-cli-secret': secret }
    });
    // Should fail because the key belongs to projectId, not projectId2
    expect(wrongProjectRes.status()).toBe(404);

    // 5. FAIL: Wrong key ID
    const wrongKeyRes = await request.get(`${baseURL}/api/cli/${projectId}/bad-key-id/check`, {
      headers: { 'x-cli-secret': secret }
    });
    expect(wrongKeyRes.status()).toBe(404);

    // 6. FAIL: Missing header
    const missingHeaderRes = await request.get(`${baseURL}/api/cli/${projectId}/${keyId}/check`);
    expect(missingHeaderRes.status()).toBe(401);

    // 7. Cleanup
    await request.delete(`${baseURL}/api/session/project/${projectId}`);
    await request.delete(`${baseURL}/api/session/project/${projectId2}`);
  });
});
