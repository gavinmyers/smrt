import crypto from 'node:crypto';
import { prisma } from '@repo/database';
import type { FastifyInstance } from 'fastify';
import { scrypt } from '../utils/auth.js';

export const authRoutes = async (api: FastifyInstance) => {
  api.get('/status/health', async (_req, _reply) => {
    return { status: 'ok' };
  });

  api.get('/health/api', async (_req, _reply) => {
    return { sentinel: 'SMRT-V1-READY' };
  });

  api.get('/health/db', async (_req, _reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { sentinel: 'SMRT-V1-READY' };
    } catch (e) {
      return _reply.status(500).send({ sentinel: 'OFFLINE', error: (e as any).message });
    }
  });

  api.post<{ Body: { email: string; password: string; name?: string } }>(
    '/user/register',
    async (req, reply) => {
      const { email, password, name } = req.body;

      if (!email || !password) {
        return reply
          .status(400)
          .send({ error: 'Email and password are required' });
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
    },
  );

  api.post<{ Body: { email: string; password: string } }>(
    '/user/login',
    async (req, reply) => {
      const { email, password } = req.body;

      if (!email || !password) {
        return reply
          .status(400)
          .send({ error: 'Email and password are required' });
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
      return reply.send({ success: true, user: userWithoutHash });
    },
  );

  api.post('/user/logout', async (req, reply) => {
    await prisma.sessionCounter.update({
      where: { sessionId: (req as any).sid },
      data: { userId: null },
    });
    return reply.send({ status: 'ok' });
  });
};
