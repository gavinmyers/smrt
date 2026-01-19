import crypto from 'node:crypto';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import { prisma } from '@repo/database';
import Fastify from 'fastify';

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
  trustProxy: true,
});

// Register plugins
await app.register(cors, {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
});

await app.register(cookie, {
  secret:
    process.env.COOKIE_SECRET || 'dev-secret-at-least-32-chars-long-and-secure',
});

// Global Session Initialization (Middleware for all requests to ensure SID exists)
app.addHook('onRequest', async (req, reply) => {
  let sid = req.cookies.sid;
  const isNew = !sid;
  if (!sid) {
    sid = crypto.randomUUID();
    reply.setCookie('sid', sid, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
    });
  }

  // Attach sid to request object so endpoints can use it even if it's not in cookies yet
  (req as any).sid = sid;
  app.log.debug(`[Session] SID: ${sid} (New: ${isNew}) for ${req.method} ${req.url}`);

  // Ensure session entry exists in DB
  await prisma.sessionCounter.upsert({
    where: { sessionId: sid },
    create: { sessionId: sid, visits: 1 },
    update: { visits: { increment: 1 } },
  });
});

import { promisify } from 'node:util';

const scrypt = promisify(crypto.scrypt);

// --- NAMESPACES ---

app.register(async (api) => {
  api.post<{ Body: { email: string; password: string; name?: string } }>(
    '/user/register',
    async (req, reply) => {
      const { email, password, name } = req.body;

      if (!email || !password) {
        return reply.status(400).send({ error: 'Email and password are required' });
      }

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return reply.status(409).send({ error: 'User already exists' });
      }

      const salt = crypto.randomBytes(16).toString('hex');
      const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
      const hash = `${salt}:${derivedKey.toString('hex')}`;

      const user = await prisma.user.create({
        data: {
          email,
          name,
          hash: {
            create: {
              hash,
            },
          },
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
      });

      return reply.status(201).send(user);
    }
  );
}, { prefix: '/api/open' });

const start = async () => {
  try {
    app.log.info('Connecting to database...');
    await prisma.$connect();
    app.log.info('Database connection successful');

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
