import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import pg from 'pg';

/**
 * A simple in-memory fallback for local development when no database is available.
 */
class MemoryDB {
  private sessions = new Map<string, { visits: number }>();
  private projects = new Map<
    string,
    { id: string; name: string; createdAt: Date; updatedAt: Date }
  >();

  sessionCounter = {
    // ... (existing upsert and deleteMany)
    upsert: async ({
      where,
      create,
      update,
    }: {
      where: { sessionId: string };
      create: { sessionId: string; visits: number };
      update: { visits: { increment: number } };
    }) => {
      const sid = where.sessionId;
      let session = this.sessions.get(sid);
      if (!session) {
        session = { visits: create.visits };
        this.sessions.set(sid, session);
      } else {
        session.visits += update.visits.increment || 0;
      }
      return { visits: session.visits };
    },
    deleteMany: async ({ where }: { where?: { sessionId: string } }) => {
      if (where?.sessionId) {
        this.sessions.delete(where.sessionId);
      } else {
        this.sessions.clear();
      }
      return { count: 1 };
    },
  };

  project = {
    findMany: async () => Array.from(this.projects.values()),
    create: async ({ data }: { data: { name: string } }) => {
      const id = crypto.randomUUID();
      const project = {
        id,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.projects.set(id, project);
      return project;
    },
    delete: async ({ where }: { where: { id: string } }) => {
      const project = this.projects.get(where.id);
      this.projects.delete(where.id);
      return project;
    },
  };

  // Add other models as needed for dev
  applicationInfo = {
    findMany: async () => [],
    create: async ({ data }: { data: { name: string } }) => ({
      id: 1,
      ...data,
    }),
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
    return new MemoryDB() as unknown as PrismaClient;
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
