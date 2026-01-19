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
      const sid = (req as any).sid;
      const session = await prisma.sessionCounter.findUnique({
        where: { sessionId: sid },
      });
      return session || { sessionId: sid };
    });

    // --- Project Routes ---

    // Middleware-like check for user
    const getUser = async (sid: string) => {
      const session = await prisma.sessionCounter.findUnique({
        where: { sessionId: sid },
      });
      if (!session?.userId) return null;
      return session.userId;
    };

    api.get('/session/project/list', async (req, reply) => {
      const userId = await getUser((req as any).sid);
      if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

      const projects = await prisma.project.findMany({
        where: { users: { some: { id: userId } } },
        orderBy: { createdAt: 'desc' },
      });
      return projects;
    });

    api.post<{ Body: { name: string } }>(
      '/session/project/create',
      async (req, reply) => {
        const userId = await getUser((req as any).sid);
        if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

        const { name } = req.body;
        if (!name) return reply.status(400).send({ error: 'Name is required' });

        const project = await prisma.project.create({
          data: {
            name,
            users: { connect: { id: userId } },
          },
        });
        return project;
      }
    );

    api.get<{ Params: { id: string } }>(
      '/session/project/:id',
      async (req, reply) => {
        const userId = await getUser((req as any).sid);
        if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

        const { id } = req.params;
        const project = await prisma.project.findFirst({
          where: { id, users: { some: { id: userId } } },
        });

        if (!project) return reply.status(404).send({ error: 'Project not found' });
        return project;
      }
    );

    api.patch<{ Params: { id: string }; Body: { name: string } }>(
      '/session/project/:id',
      async (req, reply) => {
        const userId = await getUser((req as any).sid);
        if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

        const { id } = req.params;
        const { name } = req.body;

        const exists = await prisma.project.findFirst({
          where: { id, users: { some: { id: userId } } },
        });
        if (!exists) return reply.status(404).send({ error: 'Project not found' });

        const project = await prisma.project.update({
          where: { id },
          data: { name },
        });
        return project;
      }
    );

    api.delete<{ Params: { id: string } }>(
      '/session/project/:id',
      async (req, reply) => {
        const userId = await getUser((req as any).sid);
        if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

        const { id } = req.params;
        
        const exists = await prisma.project.findFirst({
          where: { id, users: { some: { id: userId } } },
        });
        if (!exists) return reply.status(404).send({ error: 'Project not found' });

        await prisma.project.delete({ where: { id } });
        return { status: 'ok' };
      }
    );
    // --- Sub-Resources (Conditions, Features, Keys) ---

    // Helper to verify project access
    const ensureProjectAccess = async (sid: string, projectId: string) => {
      const userId = await getUser(sid);
      if (!userId) return null;
      const project = await prisma.project.findFirst({
        where: { id: projectId, users: { some: { id: userId } } },
      });
      return project ? userId : null;
    };

    // Conditions
    api.get<{ Params: { projectId: string } }>(
      '/session/project/:projectId/conditions',
      async (req, reply) => {
        if (!await ensureProjectAccess((req as any).sid, req.params.projectId)) {
          return reply.status(401).send({ error: 'Unauthorized' });
        }
        return prisma.condition.findMany({
          where: { projectId: req.params.projectId },
          orderBy: { createdAt: 'desc' },
        });
      }
    );

    api.post<{ Params: { projectId: string }; Body: { name: string } }>(
      '/session/project/:projectId/conditions',
      async (req, reply) => {
        if (!await ensureProjectAccess((req as any).sid, req.params.projectId)) {
          return reply.status(401).send({ error: 'Unauthorized' });
        }
        return prisma.condition.create({
          data: {
            name: req.body.name,
            projectId: req.params.projectId,
          },
        });
      }
    );

    api.patch<{ Params: { projectId: string; id: string }; Body: { name: string } }>(
      '/session/project/:projectId/conditions/:id',
      async (req, reply) => {
        if (!await ensureProjectAccess((req as any).sid, req.params.projectId)) {
          return reply.status(401).send({ error: 'Unauthorized' });
        }
        return prisma.condition.update({
          where: { id: req.params.id },
          data: { name: req.body.name },
        });
      }
    );

    api.delete<{ Params: { projectId: string; id: string } }>(
      '/session/project/:projectId/conditions/:id',
      async (req, reply) => {
        if (!await ensureProjectAccess((req as any).sid, req.params.projectId)) {
          return reply.status(401).send({ error: 'Unauthorized' });
        }
        await prisma.condition.delete({ where: { id: req.params.id } });
        return { status: 'ok' };
      }
    );

    // Features
    api.get<{ Params: { projectId: string } }>(
      '/session/project/:projectId/features',
      async (req, reply) => {
        if (!await ensureProjectAccess((req as any).sid, req.params.projectId)) {
          return reply.status(401).send({ error: 'Unauthorized' });
        }
        return prisma.feature.findMany({
          where: { projectId: req.params.projectId },
          orderBy: { createdAt: 'desc' },
        });
      }
    );

    api.post<{ Params: { projectId: string }; Body: { name: string } }>(
      '/session/project/:projectId/features',
      async (req, reply) => {
        if (!await ensureProjectAccess((req as any).sid, req.params.projectId)) {
          return reply.status(401).send({ error: 'Unauthorized' });
        }
        return prisma.feature.create({
          data: {
            name: req.body.name,
            projectId: req.params.projectId,
          },
        });
      }
    );

    api.patch<{ Params: { projectId: string; id: string }; Body: { name: string } }>(
      '/session/project/:projectId/features/:id',
      async (req, reply) => {
        if (!await ensureProjectAccess((req as any).sid, req.params.projectId)) {
          return reply.status(401).send({ error: 'Unauthorized' });
        }
        return prisma.feature.update({
          where: { id: req.params.id },
          data: { name: req.body.name },
        });
      }
    );

    api.delete<{ Params: { projectId: string; id: string } }>(
      '/session/project/:projectId/features/:id',
      async (req, reply) => {
        if (!await ensureProjectAccess((req as any).sid, req.params.projectId)) {
          return reply.status(401).send({ error: 'Unauthorized' });
        }
        await prisma.feature.delete({ where: { id: req.params.id } });
        return { status: 'ok' };
      }
    );

    // Keys
    api.get<{ Params: { projectId: string } }>(
      '/session/project/:projectId/keys',
      async (req, reply) => {
        if (!await ensureProjectAccess((req as any).sid, req.params.projectId)) {
          return reply.status(401).send({ error: 'Unauthorized' });
        }
        return prisma.key.findMany({
          where: { projectId: req.params.projectId },
          orderBy: { createdAt: 'desc' },
        });
      }
    );

    api.post<{ Params: { projectId: string }; Body: { name: string } }>(
      '/session/project/:projectId/keys',
      async (req, reply) => {
        if (!await ensureProjectAccess((req as any).sid, req.params.projectId)) {
          return reply.status(401).send({ error: 'Unauthorized' });
        }
        
        // Generate a random key
        const keyString = `sk_${crypto.randomBytes(24).toString('hex')}`;
        const hash = crypto.createHash('sha256').update(keyString).digest('hex');

        // Create Key record and KeyHash
        const key = await prisma.key.create({
          data: {
            name: req.body.name,
            projectId: req.params.projectId,
            hash: {
              create: {
                hash,
              },
            },
          },
        });
        
        // Return the key string ONLY once
        return { ...key, token: keyString };
      }
    );

    api.delete<{ Params: { projectId: string; id: string } }>(
      '/session/project/:projectId/keys/:id',
      async (req, reply) => {
        if (!await ensureProjectAccess((req as any).sid, req.params.projectId)) {
          return reply.status(401).send({ error: 'Unauthorized' });
        }
        await prisma.key.delete({ where: { id: req.params.id } });
        return { status: 'ok' };
      }
    );
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
