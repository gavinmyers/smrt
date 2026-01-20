import { beforeAll, describe, expect, it } from 'vitest';
import { prisma } from './index';

describe('Database Gradual Integration', () => {
  beforeAll(async () => {
    // Ensure we are not accidentally running against "memory" for these integration tests
    if (process.env.DATABASE_URL === 'memory') {
      throw new Error(
        'Database integration tests must run against a real database, not "memory"',
      );
    }
  });

  describe('Level 1: Infrastructure', () => {
    it('should connect to the database and return the diagnostic sentinel', async () => {
      // This uses the DATABASE_URL from .env.test which points to localhost:5434
      const result = await (prisma as any)
        .$queryRaw`SELECT 'SMRT-V1-READY' as sentinel`;
      expect(result[0].sentinel).toBe('SMRT-V1-READY');
    });
  });

  describe('Level 2: Schema', () => {
    it('should have the Project table accessible', async () => {
      const count = await prisma.project.count();
      expect(typeof count).toBe('number');
    });

    it('should have the Condition table accessible', async () => {
      const count = await prisma.condition.count();
      expect(typeof count).toBe('number');
    });

    it('should have the Feature table accessible', async () => {
      const count = await prisma.feature.count();
      expect(typeof count).toBe('number');
    });

    it('should have the Key table accessible', async () => {
      const count = await prisma.key.count();
      expect(typeof count).toBe('number');
    });
  });
});
