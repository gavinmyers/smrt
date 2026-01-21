import { prisma } from '@repo/database';
import { pathToFileURL } from 'node:url';
import { buildApp } from './app.js';

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const start = async () => {
    const app = await buildApp();
    try {
      app.log.info('Connecting to database...');
      await prisma.$connect();
      app.log.info('Database connection successful');

      const port = Number(process.env.PORT);
      const host = process.env.HOST;

      if (!port || !host) {
        throw new Error('PORT and HOST environment variables are required to start the server');
      }

      await app.listen({ port, host });
    } catch (err) {
      app.log.error('Failed to start server:');
      app.log.error(err);
      process.exit(1);
    }
  };
  start();
}
