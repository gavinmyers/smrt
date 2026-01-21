import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import Fastify from 'fastify';
import { sessionHook } from './hooks/session.js';
import { authRoutes } from './routes/auth.js';
import { cliRoutes } from './routes/cli.js';
import { projectRoutes } from './routes/projects.js';

export const buildApp = async () => {
  const { LOG_LEVEL, CORS_ORIGIN, COOKIE_SECRET } = process.env;

  if (!LOG_LEVEL || !CORS_ORIGIN || !COOKIE_SECRET) {
    throw new Error('Missing required environment variables: LOG_LEVEL, CORS_ORIGIN, or COOKIE_SECRET');
  }

  const app = Fastify({
    logger: {
      level: LOG_LEVEL,
    },
    trustProxy: true,
  });

  // Register plugins
  await app.register(cors, {
    origin: CORS_ORIGIN,
    credentials: true,
  });

  await app.register(cookie, {
    secret: COOKIE_SECRET,
  });

  // Global Session Initialization
  await sessionHook(app);

  // --- NAMESPACES ---

  // Auth & Health
  app.register(authRoutes, { prefix: '/api/open' });

  // Project Management
  app.register(projectRoutes, { prefix: '/api' });

  // CLI
  app.register(cliRoutes, { prefix: '/api/cli' });

  return app;
};
