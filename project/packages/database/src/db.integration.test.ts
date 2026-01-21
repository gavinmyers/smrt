import type { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from './index';

describe('Database Integration Tests', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should connect to the database and return the diagnostic sentinel', async () => {
    // This uses the DATABASE_URL from .env.test which points to localhost:5434
    const result = await (prisma as unknown as PrismaClient).$queryRaw<
      { sentinel: string }[]
    >`SELECT 'SMRT-V1-READY' as sentinel`;
    expect(result[0].sentinel).toBe('SMRT-V1-READY');
  });
});
