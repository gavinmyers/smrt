import * as fs from 'node:fs';
import * as dotenv from 'dotenv';
import { defineConfig } from 'prisma/config';

// Prefer .env.db for maintenance if it exists
if (fs.existsSync('.env.db')) {
  dotenv.config({ path: '.env.db' });
} else {
  dotenv.config({ path: '.env' });
}

export default defineConfig({
  schema: 'packages/database/prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
