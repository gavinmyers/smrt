STEP_4 / TASK_1 — Add Docker Compose Postgres + env

Goal
Set up a local Postgres instance using Docker Compose and configure the connection environment variable.

### 1. Create `project/docker-compose.yml`
```yaml
services:
  db:
    image: postgres:16
    container_name: smrt-db
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: smrt
    ports:
      - "5432:5432"
    volumes:
      - db_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d smrt"]
      interval: 5s
      timeout: 3s
      retries: 20

volumes:
  db_data:
```

### 2. Create `project/.env`
```env
DATABASE_URL="postgresql://user:password@localhost:5432/smrt?schema=public"
```

### 3. Start Database
```powershell
Push-Location project
docker compose up -d
docker compose ps
Pop-Location
```

Verification
Verify that `smrt-db` container is running and healthy.
