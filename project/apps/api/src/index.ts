import crypto from 'node:crypto';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import { prisma } from '@repo/database';
import Fastify from 'fastify';

const app = Fastify({ logger: true, trustProxy: true });

// Register plugins
await app.register(cors, {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
});

await app.register(cookie, {
  secret: process.env.COOKIE_SECRET || 'dev-secret-at-least-32-chars-long-and-secure',
});

// Endpoints
app.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

app.get('/info', async () => {
  return {
    service: 'api',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  };
});

app.get('/session', async (req, reply) => {
  let sid = req.cookies.sid;

  if (!sid) {
    sid = crypto.randomUUID();
    reply.setCookie('sid', sid, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
    });
  }

  const row = await prisma.sessionCounter.upsert({
    where: { sessionId: sid },
    create: { sessionId: sid, visits: 1 },
    update: { visits: { increment: 1 } },
    select: { visits: true },
  });

  return { hasSession: true, sessionId: sid, visits: row.visits };
});

app.post('/session/reset', async (req, reply) => {
  const sid = req.cookies.sid;
  if (sid) {
    await prisma.sessionCounter.deleteMany({ where: { sessionId: sid } });
  }

  reply.clearCookie('sid', { path: '/' });
  reply.status(204).send();
});

const start = async () => {
  try {
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl === 'memory') {
      app.log.info('Running with IN-MEMORY database fallback');
    } else {
      app.log.info(`Connecting to database at ${dbUrl?.split('@')[1] || 'unknown'}`);
      await prisma.$connect();
      app.log.info('Database connection successful');
    }

    const port = Number(process.env.PORT) || 3001;
    const host = process.env.HOST || '0.0.0.0';
    await app.listen({ port, host });
  } catch (err) {
    app.log.error('Failed to start server:');
    app.log.error(err);
    process.exit(1);
  }
};

start();