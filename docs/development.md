# Local Development Guide

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | >= 20 | [nodejs.org](https://nodejs.org) |
| pnpm | >= 9 | `npm install -g pnpm` |
| Docker Desktop | latest | [docker.com](https://www.docker.com/products/docker-desktop/) |

---

## First-time Setup

### 1. Clone and install

```bash
git clone https://github.com/Silence7e/exchange_demo.git
cd exchange_demo
pnpm install
```

### 2. Start infrastructure (PostgreSQL + Redis)

```bash
docker compose up -d
```

Verify containers are running:

```bash
docker compose ps
```

Both `exchange_demo-postgres-1` and `exchange_demo-redis-1` should show `running`.

### 3. Configure environment files

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

The defaults work out of the box with Docker Compose — no edits needed for local development.

**API** (`apps/api/.env`):

```env
DATABASE_URL=postgresql://exchange:exchange@localhost:5432/exchange
REDIS_URL=redis://localhost:6379
JWT_SECRET=change-me-in-production
PORT=4000
CORS_ORIGIN=http://localhost:3000
COOKIE_SECURE=false
```

**Web** (`apps/web/.env.local`):

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:4000/ws
```

### 4. Build shared package

The `@exchange/shared` package must be compiled before the API or Web can start:

```bash
pnpm --filter @exchange/shared build
```

### 5. Run database migrations and seed

```bash
cd apps/api
pnpm prisma migrate dev    # apply schema to local DB
pnpm prisma:seed           # insert demo trading pairs and a test account
cd ../..
```

Seed creates a demo account you can use immediately:

| Field | Value |
|-------|-------|
| Email | `demo@example.com` |
| Password | `password123` |

### 6. Start all services

From the repository root:

```bash
pnpm dev
```

This starts API and Web in watch mode via Turborepo.

| Service | URL |
|---------|-----|
| Web | http://localhost:3000 |
| API | http://localhost:4000/api/v1 |
| Swagger | http://localhost:4000/api/docs |
| WebSocket | ws://localhost:4000/ws |

---

## Daily Development Workflow

### Working on the API only

```bash
pnpm --filter @exchange/api dev
```

Hot-reload is enabled via `nest start --watch`. The Web does not need to be running.

### Working on the Web only

```bash
pnpm --filter @exchange/web dev
```

Requires the API to be running (either locally or pointed at the Vercel deployment via `.env.local`).

### Working on the shared package

After editing files in `packages/shared/src/`:

```bash
pnpm --filter @exchange/shared build
```

Then restart the API dev server (it does not pick up shared changes automatically).

If you want automatic recompilation of shared while developing:

```bash
# Terminal 1
pnpm --filter @exchange/shared dev   # tsc --watch

# Terminal 2
pnpm --filter @exchange/api dev

# Terminal 3
pnpm --filter @exchange/web dev
```

---

## Database Operations

### Create a new migration (after editing schema.prisma)

```bash
cd apps/api
pnpm prisma migrate dev --name <migration-name>
```

Example:

```bash
pnpm prisma migrate dev --name add-user-avatar
```

This creates a migration file in `apps/api/prisma/migrations/` and applies it.

### Apply existing migrations (after pulling changes)

```bash
cd apps/api
pnpm prisma migrate dev
```

### Open Prisma Studio (GUI for the database)

```bash
cd apps/api
pnpm prisma studio
```

Opens at http://localhost:5555.

### Reset the database (drop all data and re-migrate)

```bash
cd apps/api
pnpm prisma migrate reset   # WARNING: deletes all data
pnpm prisma:seed
```

---

## Useful Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all services in watch mode |
| `pnpm build` | Build all packages and apps |
| `pnpm typecheck` | Type-check all packages |
| `pnpm lint` | Lint all packages |
| `docker compose up -d` | Start PostgreSQL and Redis |
| `docker compose down` | Stop containers (data preserved) |
| `docker compose down -v` | Stop containers and delete data volumes |

---

## Troubleshooting

### `Cannot connect to database`

1. Check Docker is running: `docker compose ps`
2. If containers are stopped: `docker compose up -d`
3. Verify the port is not in use: `lsof -i :5432`

### `Cannot find module '@exchange/shared'`

The shared package has not been built yet. Run:

```bash
pnpm --filter @exchange/shared build
```

### Port already in use

API defaults to port 4000, Web to port 3000.

```bash
# Find the process using port 4000
lsof -i :4000

# Kill it (replace PID with the actual process ID)
kill -9 <PID>
```

Or change the port in `apps/api/.env`:

```env
PORT=4001
```

And update the Web's `.env.local` to match:

```env
NEXT_PUBLIC_API_URL=http://localhost:4001/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:4001/ws
```

### Changes to `packages/shared` not reflected

The API does not hot-reload shared package changes. After rebuilding shared,
restart the API dev server (`Ctrl+C` then `pnpm --filter @exchange/api dev`).

### `prisma migrate dev` fails with "connection refused"

Ensure the Docker containers are running before running migrations:

```bash
docker compose up -d
cd apps/api
pnpm prisma migrate dev
```

### JWT errors / authentication not working

Make sure `apps/api/.env` has a `JWT_SECRET` set. Any non-empty string works
locally:

```env
JWT_SECRET=any-local-dev-secret
```
