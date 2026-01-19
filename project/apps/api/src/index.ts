import crypto from 'node:crypto';
import { promisify } from 'node:util';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import { prisma } from '@repo/database';
import Fastify from 'fastify';

const scrypt = promisify(crypto.scrypt);

export const buildApp = async () => {
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

  // --- NAMESPACES ---

  app.register(async (api) => {
    api.get('/status/health', async (req, reply) => {
      return { status: 'ok' };
    });

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

        // Auto-login after register
        await prisma.sessionCounter.update({
          where: { sessionId: (req as any).sid },
          data: { userId: user.id },
        });

        return reply.status(201).send(user);
      }
    );

    api.post<{ Body: { email: string; password: string } }>(
      '/user/login',
      async (req, reply) => {
        const { email, password } = req.body;

        if (!email || !password) {
          return reply.status(400).send({ error: 'Email and password are required' });
        }

        const user = await prisma.user.findUnique({
          where: { email },
          include: { hash: true },
        });

        if (!user || !user.hash) {
          // Use generic error message for security
          return reply.status(401).send({ error: 'Invalid email or password' });
        }

        const [salt, key] = user.hash.hash.split(':');
        const derivedKey = (await scrypt(password, salt, 64)) as Buffer;

        if (key !== derivedKey.toString('hex')) {
          return reply.status(401).send({ error: 'Invalid email or password' });
        }

        // Link session to user
        await prisma.sessionCounter.update({
          where: { sessionId: (req as any).sid },
          data: { userId: user.id },
        });

        const { hash, ...userWithoutHash } = user;
        return reply.send(userWithoutHash);
      }
    );

    api.post('/user/logout', async (req, reply) => {
      await prisma.sessionCounter.update({
        where: { sessionId: (req as any).sid },
        data: { userId: null },
      });
      return reply.send({ status: 'ok' });
    });
  }, { prefix: '/api/open' });

  app.register(async (api) => {
    api.get('/session', async (req, reply) => {
      return { sessionId: (req as any).sid };
    });
  }, { prefix: '/api' });

  return app;
};

// Start server if run directly
import { pathToFileURL } from 'url';

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const start = async () => {
    const app = await buildApp();
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
}
