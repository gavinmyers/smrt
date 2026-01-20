import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import Fastify from 'fastify';
import { authRoutes } from './routes/auth.js';
import { projectRoutes } from './routes/projects.js';
import { cliRoutes } from './routes/cli.js';
import { sessionHook } from './hooks/session.js';

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
