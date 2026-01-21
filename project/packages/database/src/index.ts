import * as fs from 'node:fs';
import * as path from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import pg from 'pg';

const loadEnv = () => {
  // If we are in turbo/dotenv-cli, variables are already there.
  // But if run directly (like via Vitest without root injection), we load them.
  if (process.env.DATABASE_URL) return;

  const root = path.resolve(process.cwd(), '../../');
  const baseEnv = path.join(root, '.env');
  dotenv.config({ path: baseEnv });

  const currentEnv = process.env.NODE_ENV || 'local';
  const envFile = path.join(root, `.env.${currentEnv}`);
  const secretsFile = `${envFile}.secrets`;

  if (fs.existsSync(envFile)) dotenv.config({ path: envFile, override: true });
  if (fs.existsSync(secretsFile))
    dotenv.config({ path: secretsFile, override: true });
};

const createClient = () => {
  loadEnv();
  const isDocker =
    process.env.IS_DOCKER === 'true' || fs.existsSync('/.dockerenv');
  const url =
    (isDocker ? process.env.DATABASE_URL : process.env.LOCAL_DATABASE_URL) ||
    process.env.DATABASE_URL;

  if (!url) {
    throw new Error(
      'Neither DATABASE_URL nor LOCAL_DATABASE_URL environment variable is set',
    );
  }

  const pool = new pg.Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);
  const client = new PrismaClient({ adapter, log: ['error', 'warn'] });

  return client;
};

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export * from '@prisma/client';
