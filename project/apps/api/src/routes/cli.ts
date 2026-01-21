import crypto from 'node:crypto';
import { prisma } from '@repo/database';
import type { FastifyInstance } from 'fastify';

async function validateKey(projectId: string, keyId: string, secret?: string) {
  if (!secret) return { error: 'Missing x-cli-secret header', status: 401 };

  const key = await prisma.key.findFirst({
    where: { id: keyId, projectId },
    include: { hash: true },
  });

  if (!key || !key.hash) {
    return { error: 'Key not found', status: 404 };
  }

  const hash = crypto.createHash('sha256').update(secret).digest('hex');
  if (hash !== key.hash.hash) {
    return { error: 'Invalid secret', status: 401 };
  }

  return { key };
}

export const cliRoutes = async (api: FastifyInstance) => {
  api.get<{
    Params: { projectId: string; keyId: string };
    Headers: { 'x-cli-secret': string };
  }>('/:projectId/:keyId/check', async (req, reply) => {
    const { projectId, keyId } = req.params;
    const secret = req.headers['x-cli-secret'];

    const result = await validateKey(projectId, keyId, secret);
    if (result.error)
      return reply.status(result.status).send({ error: result.error });

    return {
      validated: true,
      project: { id: result.key!.projectId },
      keyId: result.key!.id,
    };
  });

  api.get<{
    Params: { projectId: string; keyId: string };
    Headers: { 'x-cli-secret': string };
  }>('/:projectId/:keyId', async (req, reply) => {
    const { projectId, keyId } = req.params;
    const secret = req.headers['x-cli-secret'];

    const result = await validateKey(projectId, keyId, secret);
    if (result.error)
      return reply.status(result.status).send({ error: result.error });

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    return project;
  });

  api.patch<{
    Params: { projectId: string; keyId: string };
    Body: { name?: string; description?: string };
    Headers: { 'x-cli-secret': string };
  }>('/:projectId/:keyId', async (req, reply) => {
    const { projectId, keyId } = req.params;
    const secret = req.headers['x-cli-secret'];

    const result = await validateKey(projectId, keyId, secret);
    if (result.error)
      return reply.status(result.status).send({ error: result.error });

    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        name: req.body.name,
        description: req.body.description,
      },
    });

    return project;
  });

  // --- Conditions ---

  api.get<{
    Params: { projectId: string; keyId: string };
    Headers: { 'x-cli-secret': string };
  }>('/:projectId/:keyId/conditions', async (req, reply) => {
    const { projectId, keyId } = req.params;
    const secret = req.headers['x-cli-secret'];

    const result = await validateKey(projectId, keyId, secret);
    if (result.error)
      return reply.status(result.status).send({ error: result.error });

    const conditions = await prisma.condition.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    return conditions;
  });

  api.post<{
    Params: { projectId: string; keyId: string };
    Body: { name: string; message?: string };
    Headers: { 'x-cli-secret': string };
  }>('/:projectId/:keyId/condition', async (req, reply) => {
    const { projectId, keyId } = req.params;
    const secret = req.headers['x-cli-secret'];

    const result = await validateKey(projectId, keyId, secret);
    if (result.error)
      return reply.status(result.status).send({ error: result.error });

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
  });

  api.patch<{
    Params: { projectId: string; keyId: string; id: string };
    Body: { name?: string; message?: string };
    Headers: { 'x-cli-secret': string };
  }>('/:projectId/:keyId/condition/:id', async (req, reply) => {
    const { projectId, keyId, id } = req.params;
    const secret = req.headers['x-cli-secret'];

    const result = await validateKey(projectId, keyId, secret);
    if (result.error)
      return reply.status(result.status).send({ error: result.error });

    // Ensure condition belongs to project
    const exists = await prisma.condition.findFirst({
      where: { id, projectId },
    });
    if (!exists)
      return reply.status(404).send({ error: 'Condition not found' });

    const condition = await prisma.condition.update({
      where: { id },
      data: {
        name: req.body.name,
        message: req.body.message,
      },
    });

    return condition;
  });

  api.delete<{
    Params: { projectId: string; keyId: string; id: string };
    Headers: { 'x-cli-secret': string };
  }>('/:projectId/:keyId/condition/:id', async (req, reply) => {
    const { projectId, keyId, id } = req.params;
    const secret = req.headers['x-cli-secret'];

    const result = await validateKey(projectId, keyId, secret);
    if (result.error)
      return reply.status(result.status).send({ error: result.error });

    const exists = await prisma.condition.findFirst({
      where: { id, projectId },
    });
    if (!exists)
      return reply.status(404).send({ error: 'Condition not found' });

    await prisma.condition.delete({ where: { id } });

    return { status: 'ok' };
  });

  // --- Features ---

  api.get<{
    Params: { projectId: string; keyId: string };
    Headers: { 'x-cli-secret': string };
  }>('/:projectId/:keyId/features', async (req, reply) => {
    const { projectId, keyId } = req.params;
    const secret = req.headers['x-cli-secret'];

    const result = await validateKey(projectId, keyId, secret);
    if (result.error)
      return reply.status(result.status).send({ error: result.error });

    const features = await prisma.feature.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    return features;
  });

  api.post<{
    Params: { projectId: string; keyId: string };
    Body: { name: string; message?: string };
    Headers: { 'x-cli-secret': string };
  }>('/:projectId/:keyId/feature', async (req, reply) => {
    const { projectId, keyId } = req.params;
    const secret = req.headers['x-cli-secret'];

    const result = await validateKey(projectId, keyId, secret);
    if (result.error)
      return reply.status(result.status).send({ error: result.error });

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
  });

  api.patch<{
    Params: { projectId: string; keyId: string; id: string };
    Body: { name?: string; message?: string; status?: any };
    Headers: { 'x-cli-secret': string };
  }>('/:projectId/:keyId/feature/:id', async (req, reply) => {
    const { projectId, keyId, id } = req.params;
    const secret = req.headers['x-cli-secret'];

    const result = await validateKey(projectId, keyId, secret);
    if (result.error)
      return reply.status(result.status).send({ error: result.error });

    const exists = await prisma.feature.findFirst({
      where: { id, projectId },
    });
    if (!exists) return reply.status(404).send({ error: 'Feature not found' });

    const feature = await prisma.feature.update({
      where: { id },
      data: {
        name: req.body.name,
        message: req.body.message,
        status: req.body.status,
      },
    });

    return feature;
  });

  api.delete<{
    Params: { projectId: string; keyId: string; id: string };
    Headers: { 'x-cli-secret': string };
  }>('/:projectId/:keyId/feature/:id', async (req, reply) => {
    const { projectId, keyId, id } = req.params;
    const secret = req.headers['x-cli-secret'];

    const result = await validateKey(projectId, keyId, secret);
    if (result.error)
      return reply.status(result.status).send({ error: result.error });

    const exists = await prisma.feature.findFirst({
      where: { id, projectId },
    });
    if (!exists) return reply.status(404).send({ error: 'Feature not found' });

    await prisma.feature.delete({ where: { id } });

    return { status: 'ok' };
  });

  // --- Requirements ---

  api.get<{
    Params: { projectId: string; keyId: string; featureId: string };
    Headers: { 'x-cli-secret': string };
  }>(
    '/:projectId/:keyId/feature/:featureId/requirements',
    async (req, reply) => {
      const { projectId, keyId, featureId } = req.params;
      const secret = req.headers['x-cli-secret'];

      const result = await validateKey(projectId, keyId, secret);
      if (result.error)
        return reply.status(result.status).send({ error: result.error });

      const requirements = await prisma.requirement.findMany({
        where: { featureId },
        orderBy: { createdAt: 'asc' },
      });

      return requirements;
    },
  );

  api.post<{
    Params: { projectId: string; keyId: string; featureId: string };
    Body: { name: string };
    Headers: { 'x-cli-secret': string };
  }>(
    '/:projectId/:keyId/feature/:featureId/requirement',
    async (req, reply) => {
      const { projectId, keyId, featureId } = req.params;
      const secret = req.headers['x-cli-secret'];

      const result = await validateKey(projectId, keyId, secret);
      if (result.error)
        return reply.status(result.status).send({ error: result.error });

      const { name } = req.body;
      if (!name) return reply.status(400).send({ error: 'Name is required' });

      const requirement = await prisma.requirement.create({
        data: {
          name,
          featureId,
        },
      });

      return requirement;
    },
  );

  api.patch<{
    Params: { projectId: string; keyId: string; featureId: string; id: string };
    Body: { name?: string; status?: any };
    Headers: { 'x-cli-secret': string };
  }>(
    '/:projectId/:keyId/feature/:featureId/requirement/:id',
    async (req, reply) => {
      const { projectId, keyId, featureId, id } = req.params;
      const secret = req.headers['x-cli-secret'];

      const result = await validateKey(projectId, keyId, secret);
      if (result.error)
        return reply.status(result.status).send({ error: result.error });

      const requirement = await prisma.requirement.update({
        where: { id },
        data: {
          name: req.body.name,
          status: req.body.status,
        },
      });

      return requirement;
    },
  );

  api.delete<{
    Params: { projectId: string; keyId: string; featureId: string; id: string };
    Headers: { 'x-cli-secret': string };
  }>(
    '/:projectId/:keyId/feature/:featureId/requirement/:id',
    async (req, reply) => {
      const { projectId, keyId, featureId, id } = req.params;
      const secret = req.headers['x-cli-secret'];

      const result = await validateKey(projectId, keyId, secret);
      if (result.error)
        return reply.status(result.status).send({ error: result.error });

      await prisma.requirement.delete({ where: { id: req.params.id } });

      return { status: 'ok' };
    },
  );

  // --- Project Requirements ---

  api.get<{
    Params: { projectId: string; keyId: string };
    Headers: { 'x-cli-secret': string };
  }>('/:projectId/:keyId/project-requirements', async (req, reply) => {
    const { projectId, keyId } = req.params;
    const secret = req.headers['x-cli-secret'];

    const result = await validateKey(projectId, keyId, secret);
    if (result.error)
      return reply.status(result.status).send({ error: result.error });

    const requirements = await prisma.projectRequirement.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });

    return requirements;
  });

  api.post<{
    Params: { projectId: string; keyId: string };
    Body: { name: string };
    Headers: { 'x-cli-secret': string };
  }>('/:projectId/:keyId/project-requirement', async (req, reply) => {
    const { projectId, keyId } = req.params;
    const secret = req.headers['x-cli-secret'];

    const result = await validateKey(projectId, keyId, secret);
    if (result.error)
      return reply.status(result.status).send({ error: result.error });

    const { name } = req.body;
    if (!name) return reply.status(400).send({ error: 'Name is required' });

    const requirement = await prisma.projectRequirement.create({
      data: {
        name,
        projectId,
      },
    });

    return requirement;
  });

  api.patch<{
    Params: { projectId: string; keyId: string; id: string };
    Body: { name?: string };
    Headers: { 'x-cli-secret': string };
  }>('/:projectId/:keyId/project-requirement/:id', async (req, reply) => {
    const { projectId, keyId, id } = req.params;
    const secret = req.headers['x-cli-secret'];

    const result = await validateKey(projectId, keyId, secret);
    if (result.error)
      return reply.status(result.status).send({ error: result.error });

    const requirement = await prisma.projectRequirement.update({
      where: { id },
      data: {
        name: req.body.name,
      },
    });

    return requirement;
  });

  api.delete<{
    Params: { projectId: string; keyId: string; id: string };
    Headers: { 'x-cli-secret': string };
  }>('/:projectId/:keyId/project-requirement/:id', async (req, reply) => {
    const { projectId, keyId, id } = req.params;
    const secret = req.headers['x-cli-secret'];

    const result = await validateKey(projectId, keyId, secret);
    if (result.error)
      return reply.status(result.status).send({ error: result.error });

    await prisma.projectRequirement.delete({ where: { id } });

    return { status: 'ok' };
  });
};
