import { prisma } from '@repo/database';
import crypto from 'node:crypto';
import { FastifyInstance } from 'fastify';
import { getUser, ensureProjectAccess } from '../utils/auth.js';

export const projectRoutes = async (api: FastifyInstance) => {
  api.get('/session', async (req, reply) => {
    const sid = (req as any).sid;
    const session = await prisma.sessionCounter.findUnique({
      where: { sessionId: sid },
    });
    return session || { sessionId: sid };
  });

  api.get('/session/project/list', async (req, reply) => {
    const userId = await getUser((req as any).sid);
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

    const projects = await prisma.project.findMany({
      where: { users: { some: { id: userId } } },
      orderBy: { createdAt: 'desc' },
    });
    return projects;
  });

  api.post<{ Body: { name: string; description?: string } }>(
    '/session/project/create',
    async (req, reply) => {
      const userId = await getUser((req as any).sid);
      if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

      const { name, description } = req.body;
      if (!name) return reply.status(400).send({ error: 'Name is required' });

      const project = await prisma.project.create({
        data: {
          name,
          description,
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

  api.patch<{ Params: { id: string }; Body: { name?: string; description?: string } }>(
    '/session/project/:id',
    async (req, reply) => {
      const userId = await getUser((req as any).sid);
      if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

      const { id } = req.params;
      const { name, description } = req.body;

      const exists = await prisma.project.findFirst({
        where: { id, users: { some: { id: userId } } },
      });
      if (!exists) return reply.status(404).send({ error: 'Project not found' });

      const project = await prisma.project.update({
        where: { id },
        data: { name, description },
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

  api.post<{ Params: { projectId: string }; Body: { name: string; message?: string } }>(
    '/session/project/:projectId/conditions',
    async (req, reply) => {
      if (!await ensureProjectAccess((req as any).sid, req.params.projectId)) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      return prisma.condition.create({
        data: {
          name: req.body.name,
          message: req.body.message,
          projectId: req.params.projectId,
        },
      });
    }
  );

  api.patch<{ Params: { projectId: string; id: string }; Body: { name: string; message?: string } }>(
    '/session/project/:projectId/conditions/:id',
    async (req, reply) => {
      if (!await ensureProjectAccess((req as any).sid, req.params.projectId)) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      return prisma.condition.update({
        where: { id: req.params.id },
        data: { 
          name: req.body.name,
          message: req.body.message,
        },
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

  api.post<{ Params: { projectId: string }; Body: { name: string; message?: string } }>(
    '/session/project/:projectId/features',
    async (req, reply) => {
      if (!await ensureProjectAccess((req as any).sid, req.params.projectId)) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      return prisma.feature.create({
        data: {
          name: req.body.name,
          message: req.body.message,
          projectId: req.params.projectId,
        },
      });
    }
  );

  api.patch<{ Params: { projectId: string; id: string }; Body: { name?: string; message?: string; status?: any } }>(
    '/session/project/:projectId/features/:id',
    async (req, reply) => {
      if (!await ensureProjectAccess((req as any).sid, req.params.projectId)) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      return prisma.feature.update({
        where: { id: req.params.id },
        data: { 
          name: req.body.name,
          message: req.body.message,
          status: req.body.status, 
        },
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

  api.get<{ Params: { projectId: string; id: string } }>(
    '/session/project/:projectId/features/:id',
    async (req, reply) => {
      if (!await ensureProjectAccess((req as any).sid, req.params.projectId)) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      return prisma.feature.findUnique({
        where: { id: req.params.id },
      });
    }
  );

  // Requirements
  api.get<{ Params: { projectId: string; featureId: string } }>(
    '/session/project/:projectId/features/:featureId/requirements',
    async (req, reply) => {
      if (!await ensureProjectAccess((req as any).sid, req.params.projectId)) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      return prisma.requirement.findMany({
        where: { featureId: req.params.featureId },
        orderBy: { createdAt: 'asc' },
      });
    }
  );

  api.post<{ Params: { projectId: string; featureId: string }; Body: { name: string } }>(
    '/session/project/:projectId/features/:featureId/requirements',
    async (req, reply) => {
      if (!await ensureProjectAccess((req as any).sid, req.params.projectId)) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      return prisma.requirement.create({
        data: {
          name: req.body.name,
          featureId: req.params.featureId,
        },
      });
    }
  );

  api.patch<{ Params: { projectId: string; featureId: string; id: string }; Body: { name?: string; status?: any } }>(
    '/session/project/:projectId/features/:featureId/requirements/:id',
    async (req, reply) => {
      if (!await ensureProjectAccess((req as any).sid, req.params.projectId)) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      return prisma.requirement.update({
        where: { id: req.params.id },
        data: {
          name: req.body.name,
          status: req.body.status,
        },
      });
    }
  );

  api.delete<{ Params: { projectId: string; featureId: string; id: string } }>(
    '/session/project/:projectId/features/:featureId/requirements/:id',
    async (req, reply) => {
      if (!await ensureProjectAccess((req as any).sid, req.params.projectId)) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      await prisma.requirement.delete({ where: { id: req.params.id } });
      return { status: 'ok' };
    }
  );

  // Project Requirements
  api.get<{ Params: { projectId: string } }>(
    '/session/project/:projectId/project-requirements',
    async (req, reply) => {
      if (!await ensureProjectAccess((req as any).sid, req.params.projectId)) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      return prisma.projectRequirement.findMany({
        where: { projectId: req.params.projectId },
        orderBy: { createdAt: 'asc' },
      });
    }
  );

  api.post<{ Params: { projectId: string }; Body: { name: string } }>(
    '/session/project/:projectId/project-requirements',
    async (req, reply) => {
      if (!await ensureProjectAccess((req as any).sid, req.params.projectId)) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      return prisma.projectRequirement.create({
        data: {
          name: req.body.name,
          projectId: req.params.projectId,
        },
      });
    }
  );

  api.patch<{ Params: { projectId: string; id: string }; Body: { name?: string } }>(
    '/session/project/:projectId/project-requirements/:id',
    async (req, reply) => {
      if (!await ensureProjectAccess((req as any).sid, req.params.projectId)) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      return prisma.projectRequirement.update({
        where: { id: req.params.id },
        data: {
          name: req.body.name,
        },
      });
    }
  );

  api.delete<{ Params: { projectId: string; id: string } }>(
    '/session/project/:projectId/project-requirements/:id',
    async (req, reply) => {
      if (!await ensureProjectAccess((req as any).sid, req.params.projectId)) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      await prisma.projectRequirement.delete({ where: { id: req.params.id } });
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
};
