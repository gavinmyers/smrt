import { prisma } from '@repo/database';
import crypto from 'node:crypto';
import { FastifyInstance } from 'fastify';

export const cliRoutes = async (api: FastifyInstance) => {
  api.get<{ Params: { projectId: string; keyId: string }; Headers: { 'x-cli-secret': string } }>(
    '/:projectId/:keyId/check',
    async (req, reply) => {
      const { projectId, keyId } = req.params;
      const secret = req.headers['x-cli-secret'];

      if (!secret) {
        return reply.status(401).send({ error: 'Missing x-cli-secret header' });
      }

      // 1. Fetch Key (and verify Project ownership)
      const key = await prisma.key.findFirst({
        where: { id: keyId, projectId },
        include: { hash: true },
      });

      if (!key || !key.hash) {
        // Return 404 to avoid leaking existence? Or 401?
        // Test expects 404 for wrong project/key.
        return reply.status(404).send({ error: 'Key not found' });
      }

      // 2. Validate Secret
      // The secret provided is the raw token (sk_...). We need to hash it and compare.
      const hash = crypto.createHash('sha256').update(secret).digest('hex');

      if (hash !== key.hash.hash) {
        return reply.status(401).send({ error: 'Invalid secret' });
      }

      // 3. Success
      return {
        validated: true,
        projectId: key.projectId,
        keyId: key.id,
      };
    }
  );

  api.post<{ Params: { projectId: string; keyId: string }; Body: { name: string; message?: string }; Headers: { 'x-cli-secret': string } }>(
    '/:projectId/:keyId/condition',
    async (req, reply) => {
      const { projectId, keyId } = req.params;
      const secret = req.headers['x-cli-secret'];

      if (!secret) {
        return reply.status(401).send({ error: 'Missing x-cli-secret header' });
      }

      // 1. Fetch and Validate Key
      const key = await prisma.key.findFirst({
        where: { id: keyId, projectId },
        include: { hash: true },
      });

      if (!key || !key.hash) {
        return reply.status(404).send({ error: 'Key not found' });
      }

      const hash = crypto.createHash('sha256').update(secret).digest('hex');
      if (hash !== key.hash.hash) {
        return reply.status(401).send({ error: 'Invalid secret' });
      }

      // 2. Create Condition
      const { name, message } = req.body;
      if (!name) return reply.status(400).send({ error: 'Name is required' });

      const condition = await prisma.condition.create({
        data: {
          name,
          message,
          projectId,
        },
      });

      return condition;
    }
  );

  api.post<{ Params: { projectId: string; keyId: string }; Body: { name: string; message?: string }; Headers: { 'x-cli-secret': string } }>(
    '/:projectId/:keyId/feature',
    async (req, reply) => {
      const { projectId, keyId } = req.params;
      const secret = req.headers['x-cli-secret'];

      if (!secret) {
        return reply.status(401).send({ error: 'Missing x-cli-secret header' });
      }

      // 1. Fetch and Validate Key
      const key = await prisma.key.findFirst({
        where: { id: keyId, projectId },
        include: { hash: true },
      });

      if (!key || !key.hash) {
        return reply.status(404).send({ error: 'Key not found' });
      }

      const hash = crypto.createHash('sha256').update(secret).digest('hex');
      if (hash !== key.hash.hash) {
        return reply.status(401).send({ error: 'Invalid secret' });
      }

      // 2. Create Feature
      const { name, message } = req.body;
      if (!name) return reply.status(400).send({ error: 'Name is required' });

      const feature = await prisma.feature.create({
        data: {
          name,
          message,
          projectId,
        },
      });

      return feature;
    }
  );
};
