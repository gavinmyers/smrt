import { prisma } from '@repo/database';
import { buildApp } from './app.js';
import { pathToFileURL } from 'url';

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const start = async () => {
    const app = await buildApp();
    try {
      app.log.info('Connecting to database...');
      await prisma.$connect();
      app.log.info('Database connection successful');

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
}
