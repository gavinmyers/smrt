import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { prisma } from '@repo/database';

export const scrypt = promisify(crypto.scrypt);

/**
 * Gets the User ID associated with a Session ID.
 */
export const getUser = async (sid: string) => {
  const session = await prisma.sessionCounter.findUnique({
    where: { sessionId: sid },
  });
  if (!session?.userId) return null;
  return session.userId;
};

/**
 * Verifies that the user (via Session ID) has access to the given project.
 * Returns the userId if authorized, or null if not.
 */
export const ensureProjectAccess = async (sid: string, projectId: string) => {
  const userId = await getUser(sid);
  if (!userId) return null;
  const project = await prisma.project.findFirst({
    where: { id: projectId, users: { some: { id: userId } } },
  });
  return project ? userId : null;
};
