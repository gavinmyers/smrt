import crypto from 'node:crypto';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import { prisma } from '@repo/database';
import Fastify from 'fastify';

const app = Fastify({ logger: true, trustProxy: true });

// Register plugins
await app.register(cors, {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
});

await app.register(cookie, {
  secret: process.env.COOKIE_SECRET || 'dev-secret-at-least-32-chars-long-and-secure',
});

// Endpoints
// ... (omitting health, info, session routes for brevity)

const start = async () => {
  try {
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl === 'memory') {
      app.log.info('Running with IN-MEMORY database fallback');
    } else {
      app.log.info(`Connecting to database at ${dbUrl?.split('@')[1] || 'unknown'}`);
      await prisma.$connect();
      app.log.info('Database connection successful');
    }

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
