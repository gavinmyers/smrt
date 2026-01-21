import crypto from 'node:crypto';
import { prisma } from '@repo/database';
import type { FastifyInstance } from 'fastify';
import type { AuthenticatedRequest } from '../types.js';

/**
 * Global Session Hook
 * Ensures every request has a Session ID (SID).
 * If a SID is missing, it creates one and upserts it into the DB.
 */
export const sessionHook = async (app: FastifyInstance) => {
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
    (req as unknown as AuthenticatedRequest).sid = sid;
    req.log.debug(
      `[Session] SID: ${sid} (New: ${isNew}) for ${req.method} ${req.url}`,
    );

    // Ensure session entry exists in DB
    await prisma.sessionCounter.upsert({
      where: { sessionId: sid },
      create: { sessionId: sid, visits: 1 },
      update: { visits: { increment: 1 } },
    });
  });
};
