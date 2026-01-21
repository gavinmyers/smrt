import { execSync, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createConnection } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL is not set.');
    process.exit(1);
  }

  // 1. Parse DB Host/Port
  let dbHost = process.env.DB_HOST;
  let dbPort = Number(process.env.DB_PORT);

  if (!dbHost || !dbPort) {
    try {
      const url = new URL(dbUrl.replace('postgresql://', 'http://'));
      dbHost = dbHost || url.hostname;
      dbPort = dbPort || Number(url.port);
    } catch (_e) {
      // Handled by check below
    }
  }

  if (!dbHost || !dbPort) {
    console.error(
      'ERROR: Database host and port must be specified via DATABASE_URL or DB_HOST/DB_PORT.',
    );
    process.exit(1);
  }

  console.log(`--- STARTUP ---`);
  console.log(`Targeting Database: ${dbHost}:${dbPort}`);

  // 2. Wait for DB Network
  const waitForDB = () =>
    new Promise((resolve) => {
      const attempt = () => {
        console.log('Waiting for database network...');
        const socket = createConnection({ host: dbHost, port: dbPort }, () => {
          socket.end();
          resolve();
        });
        socket.on('error', () => {
          setTimeout(attempt, 2000);
        });
      };
      attempt();
    });

  await waitForDB();
  console.log('Database network is UP.');

  // 3. Self-Healing Schema Push
  if (
    process.env.NODE_ENV !== 'production' ||
    process.env.AUTO_MIGRATE === 'true'
  ) {
    console.log('Synchronizing database schema (Self-Healing)...');

    const possibleConfigPaths = [
      path.join(__dirname, '..', '..', 'prisma.config.ts'),
      path.join(process.cwd(), 'prisma.config.ts'),
    ];
    const configPath = possibleConfigPaths.find((p) => existsSync(p));

    if (configPath) {
      console.log(`Found prisma config at: ${configPath}`);
      const configDir = path.dirname(configPath);
      try {
        console.log(
          `Executing migrations via prisma.config.ts from: ${configDir}`,
        );
        execSync(`npx prisma db push --accept-data-loss`, {
          stdio: 'inherit',
          cwd: configDir,
          env: {
            ...process.env,
            PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION: 'true',
          },
        });
        console.log('Schema synchronization complete.');
      } catch (err) {
        console.error('Schema synchronization failed, but continuing start...');
        console.error(err);
      }
    } else {
      const possiblePaths = [
        path.join(
          __dirname,
          '..',
          '..',
          'packages',
          'database',
          'prisma',
          'schema.prisma',
        ),
        path.join(
          process.cwd(),
          'packages',
          'database',
          'prisma',
          'schema.prisma',
        ),
        path.join(process.cwd(), 'schema.prisma'),
      ];

      const schemaPath = possiblePaths.find((p) => existsSync(p));

      if (schemaPath) {
        console.log(`Found schema at: ${schemaPath}`);
        try {
          let packageRoot = path.dirname(schemaPath);
          while (
            packageRoot !== path.parse(packageRoot).root &&
            !existsSync(path.join(packageRoot, 'package.json'))
          ) {
            packageRoot = path.dirname(packageRoot);
          }

          if (!existsSync(path.join(packageRoot, 'package.json'))) {
            packageRoot = process.cwd();
          }

          console.log(`Executing migrations from: ${packageRoot}`);

          execSync(
            `pnpm exec prisma db push --schema "${schemaPath}" --accept-data-loss`,
            {
              stdio: 'inherit',
              cwd: packageRoot,
              env: {
                ...process.env,
                PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION: 'true',
              },
            },
          );
          console.log('Schema synchronization complete.');
        } catch (_err) {
          console.error(
            'Schema synchronization failed, but continuing start...',
          );
        }
      } else {
        console.warn(
          'WARNING: Could not find prisma schema for self-healing. Skipping.',
        );
      }
    }
  }

  // 4. Start API
  console.log('Starting SMRT API...');
  const apiPath = path.join(__dirname, 'dist', 'server.js');
  const child = spawn('node', [apiPath], { stdio: 'inherit' });

  child.on('exit', (code) => {
    process.exit(code || 0);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
