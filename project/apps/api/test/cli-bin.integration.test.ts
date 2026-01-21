import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { prisma } from '@repo/database';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';

describe('CLI Binary Integration Tests', () => {
  let app;
  let projectId;
  let keyId;
  let secret;
  let tempKeyPath;
  const cliDir = path.resolve(process.cwd(), '../../../smrt-cli');

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
    await prisma.$connect();

    // 1. Setup real user/project/key via API injection
    const email = `cli-bin-test-${Date.now()}@test.com`;
    await app.inject({
      method: 'POST',
      url: '/api/open/user/register',
      payload: { email, password: 'pw', name: 'Bin Tester' },
    });

    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/open/user/login',
      payload: { email, password: 'pw' },
    });
    const sid = loginRes.cookies.find((c) => c.name === 'sid').value;

    const projectRes = await app.inject({
      method: 'POST',
      url: '/api/session/project/create',
      headers: { cookie: `sid=${sid}` },
      payload: { name: 'Bin Test Project' },
    });
    projectId = projectRes.json().id;

    const keyRes = await app.inject({
      method: 'POST',
      url: `/api/session/project/${projectId}/keys`,
      headers: { cookie: `sid=${sid}` },
      payload: { name: 'Bin Test Key' },
    });
    const keyData = keyRes.json();
    keyId = keyData.id;
    secret = keyData.secret;

    // 2. Create temp key file
    tempKeyPath = path.join(process.cwd(), `temp-${Date.now()}.key`);
    fs.writeFileSync(
      tempKeyPath,
      JSON.stringify({
        projectId,
        keyId,
        secret,
        apiUrl: `http://127.0.0.1:3003/api/cli/${projectId}/${keyId}`,
      }),
    );
  });

  afterAll(async () => {
    if (fs.existsSync(tempKeyPath)) fs.unlinkSync(tempKeyPath);
    await prisma.$disconnect();
    await app.close();
  });

  const runCli = (script, args = '') => {
    // We point CLI_URL to the test API port (3003)
    const cmd = `node ${path.join(cliDir, script)} --key=${tempKeyPath} ${args}`;
    return execSync(cmd, {
      env: { ...process.env, CLI_URL: 'http://127.0.0.1:3003' },
      encoding: 'utf8',
    });
  };

  it('status.js should validate connection', () => {
    const output = runCli('status.js');
    expect(output).toContain('✅ Connection Validated');
    expect(output).toContain(projectId);
  });

  it('project-info.js should return project metadata', () => {
    const output = runCli('project-info.js');
    expect(output).toContain('Project: Bin Test Project');
    expect(output).toContain(projectId);
  });

  it('Full Condition Workflow', () => {
    // 1. Create
    const createOut = runCli('condition-create.js', '"Bin Condition" "Bin Msg"');
    expect(createOut).toContain('Created condition');
    const conditionId = createOut.match(/\[(.*?)\]/)[1];

    // 2. List
    const listOut = runCli('conditions-list.js');
    expect(listOut).toContain('Bin Condition');
    expect(listOut).toContain(conditionId);

    // 3. Update
    const updateOut = runCli('condition-update.js', `${conditionId} "Updated Name"`);
    expect(updateOut).toContain('Updated condition');

    // 4. Delete
    const deleteOut = runCli('condition-delete.js', conditionId);
    expect(deleteOut).toContain('Deleted condition');
  });

  it('Full Feature Workflow', () => {
    // 1. Create
    const createOut = runCli('feature-create.js', '"Bin Feature"');
    expect(createOut).toContain('Created feature');
    const featureId = createOut.match(/\[(.*?)\]/)[1];

    // 2. List
    const listOut = runCli('features-list.js');
    expect(listOut).toContain('Bin Feature');

    // 3. Complete
    const completeOut = runCli('feature-complete.js', featureId);
    expect(completeOut).toContain('Completed feature');
  });
});
