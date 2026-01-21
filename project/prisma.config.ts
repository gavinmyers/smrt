import * as fs from 'node:fs';
import * as dotenv from 'dotenv';
import { defineConfig } from 'prisma/config';

// Prefer .env.db for maintenance if it exists
if (fs.existsSync('.env.db')) {
  dotenv.config({ path: '.env.db' });
} else {
  // Load base env first
  dotenv.config({ path: '.env' });
  // Then try to load specific env and its secrets
  const currentEnv = process.env.NODE_ENV || 'local';
  const envFile = `.env.${currentEnv}`;
  const secretsFile = `${envFile}.secrets`;

  if (fs.existsSync(envFile)) dotenv.config({ path: envFile, override: true });
  if (fs.existsSync(secretsFile))
    dotenv.config({ path: secretsFile, override: true });
}

const isDocker =
  fs.existsSync('/.dockerenv') || process.env.IS_DOCKER === 'true';
const dbUrl =
  (isDocker ? process.env.DATABASE_URL : process.env.LOCAL_DATABASE_URL) ||
  process.env.DATABASE_URL;

export default defineConfig({
  schema: 'packages/database/prisma/schema.prisma',
  datasource: {
    url: dbUrl,
  },
});
