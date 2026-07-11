# Arc

**Your coding journey, unified.**

Competitive programming analytics — Codeforces + LeetCode stats, head-to-head compare, friends, and streaks.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, TypeScript, Tailwind, Framer Motion, GSAP, Recharts |
| Auth | Firebase (Google, GitHub, email/password) + `arc-session` cookie |
| Database | **Neon PostgreSQL** + Prisma |
| Cache | Upstash Redis (optional) |

Avatars come from Firebase OAuth profile photos (UI Avatars fallback when none). No external file storage.

## Setup

### Quick start (mock mode — no database required)

Explore the full UI with sample data:

```bash
pnpm install
cp .env.local.example .env.local   # USE_MOCK_DATA=true is already set
pnpm dev
```

Open [http://localhost:3000/dashboard](http://localhost:3000/dashboard) — auth is bypassed when mock mode is on.

### Production setup (Neon + Firebase)

```bash
pnpm install
cp .env.local.example .env.local   # fill Neon + Firebase keys
# Set USE_MOCK_DATA=false
pnpm db:push                       # or db:migrate against Neon
pnpm dev
```

### Neon

1. Create a project at [neon.tech](https://neon.tech)
2. Copy the **pooled** connection string → `DATABASE_URL`
3. Copy the **direct** connection string → `DIRECT_URL`

### Firebase

Enable **Google**, **GitHub**, and **Email/Password** in Firebase Console → Authentication → Sign-in method.

Add your Firebase web config and Admin SDK service account to `.env.local`.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Development server |
| `pnpm build` | Production build |
| `pnpm db:push` | Push schema to Neon |
| `pnpm db:migrate` | Run migrations |
| `pnpm db:studio` | Prisma Studio |

## Local Redis (optional)

For BullMQ sync jobs in dev:

```bash
docker compose up -d redis
```

Postgres in `docker-compose.yml` is optional — production uses Neon.

## Roadmap

See **[ROADMAP.txt](./ROADMAP.txt)** for the full end-to-end blueprint: architecture, phase status, mock vs. real mode, API reference, and remaining tasks for backend integration.
