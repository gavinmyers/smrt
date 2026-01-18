STEP_4 / TASK_2 — Prisma schema + config + first migration (Prisma 7)

Goal
Define the data model and configure Prisma 7 for migrations using `prisma.config.ts`.

### 1. Create `project/packages/database/prisma/schema.prisma`
Note: In Prisma 7, the `url` property is removed from `datasource`.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

model ApplicationInfo {
  id        Int      @id @default(autoincrement())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model SessionCounter {
  id        Int      @id @default(autoincrement())
  sessionId String   @unique
  visits    Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### 2. Create `project/prisma.config.ts`
This file is required by Prisma 7 for CLI operations like migrations. It uses `dotenv` to load connection strings from `.env`.

```typescript
import { defineConfig } from "prisma/config";
import * as dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  schema: "packages/database/prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
```

### 3. Generate and Migrate
```powershell
Push-Location project
pnpm exec prisma generate
pnpm exec prisma migrate dev --name init
Pop-Location
```
