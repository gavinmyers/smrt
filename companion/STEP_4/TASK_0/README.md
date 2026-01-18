STEP_4 / TASK_0 — Add Postgres + Prisma package (Prisma 7)

Goal
Initialize the database package and install Prisma 7 dependencies, including the required Postgres adapter.

### 1. Install Prisma 7 + Postgres Adapter
```powershell
Push-Location project
pnpm add -D -w prisma dotenv
pnpm add -w @prisma/client @prisma/adapter-pg pg
pnpm add -D -w @types/pg
Pop-Location
```

### 2. Create Database Package
Create `project/packages/database/package.json`:
```json
{
  "name": "@repo/database",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  },
  "dependencies": {
    "@prisma/client": "^7.2.0",
    "@prisma/adapter-pg": "^7.2.0",
    "pg": "^8.13.3"
  },
  "scripts": {
    "generate": "prisma generate",
    "migrate": "prisma migrate dev",
    "studio": "prisma studio"
  }
}
```

Create `project/packages/database/src/index.ts`:
```typescript
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  (() => {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter, log: ["error", "warn"] });
  })();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```