import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import pg from 'pg';

/**
 * A simple in-memory fallback for local development when no database is available.
 */
class MemoryDB {
  private sessions = new Map<string, { visits: number }>();
  
  sessionCounter = {
    upsert: async ({ where, create, update }: any) => {
      const sid = where.sessionId;
      let session = this.sessions.get(sid);
      if (!session) {
        session = { visits: create.visits };
        this.sessions.set(sid, session);
      } else {
        session.visits += (update.visits.increment || 0);
      }
      return { visits: session.visits };
    },
    deleteMany: async ({ where }: any) => {
      if (where?.sessionId) {
        this.sessions.delete(where.sessionId);
      } else {
        this.sessions.clear();
      }
      return { count: 1 };
    }
  };

  // Add other models as needed for dev
  applicationInfo = {
    findMany: async () => [],
    create: async ({ data }: any) => ({ id: 1, ...data }),
  };

  $connect = async () => {};
  $disconnect = async () => {};
}

const createClient = () => {
  const url = process.env.DATABASE_URL;
  
  // Strictly opt-in: only use MemoryDB if explicitly requested via env
  if (url === 'memory') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('In-memory database is not allowed in production');
    }
    console.log('Using in-memory database fallback (local dev only)');
    return new MemoryDB() as any;
  }

  if (!url) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const pool = new pg.Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter, log: ['error', 'warn'] });
};

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export * from '@prisma/client';
