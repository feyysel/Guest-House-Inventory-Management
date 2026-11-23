# HavenStay Guest House Management

Next.js 16 + Prisma 7 + PostgreSQL app for managing rooms, reservations, guests, payments, reports, staff accounts, and guest-house settings.

## Requirements

- Node.js 22+ (the seed script uses native TypeScript stripping)
- PostgreSQL 14+ (a pooled connection string is fine)
- Docker (optional, only for the local Redis cache)

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local` (or `.env`) from `.env.example` and set at least:

   ```bash
   DATABASE_URL="postgresql://user:password@host:5432/guesthouse?schema=public"
   SESSION_SECRET="a-random-string-of-at-least-32-characters"
   ```

   Generate a secret with:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

   Never commit real credentials. `.env*` is gitignored; only `.env.example` is tracked.

3. Apply migrations and seed the initial rooms and staff accounts:

   ```bash
   npx prisma migrate deploy
   npm run seed
   ```

   The seed reads `.env.local` and `.env`. Override the default demo emails/passwords with the `SEED_*` variables in `.env.example` before seeding. The seeded passwords are applied on first creation only; change them from the Users page afterwards.

4. Start the app:

   ```bash
   npm run dev
   ```

   Open http://localhost:3000 and sign in with the seeded admin account. Demo account shortcuts appear only in development.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | TypeScript check |
| `npm test` | Unit tests for billing, permissions, and password hashing |
| `npm run seed` | Seed rooms and staff accounts |
| `npx prisma migrate deploy` | Apply committed migrations (production) |
| `npx prisma migrate dev` | Create a migration during development |
| `npm run redis:up` / `npm run redis:down` | Optional local Redis cache via Docker |

## Redis cache (optional)

Redis is only a cache. Leave `REDIS_URL` unset to run without it; every read then goes straight to PostgreSQL. To start the bundled Redis container, run `npm run redis:up` and set `REDIS_URL=redis://127.0.0.1:6379`.

The Docker configuration binds Redis to localhost only. Do not publish it to a public interface in production.

## Deployment / multiple clients

This build is single-tenant: one guest house, one database, one settings record. For separate clients, deploy one instance per client with its own PostgreSQL database and its own `DATABASE_URL` and `SESSION_SECRET`. Databases are independent; run `npx prisma migrate deploy` and `npm run seed` once for each new client database. There are no cross-database links or foreign keys.

Before going live:

- Set a unique `SESSION_SECRET` of at least 32 characters for every deployment. Production refuses to start without it.
- Replace the seeded demo passwords and remove/disable unused staff accounts.
- Apply migrations with `prisma migrate deploy` rather than `migrate dev`.
- Use HTTPS so the secure session cookie is sent.
- Back up the database; the Docker Redis volume is cache-only and contains no authoritative data.

## Roles

- **Administrator** – full access, including staff accounts and deletions.
- **Manager** – daily operations, payments, reports, and settings.
- **Receptionist** – rooms, reservations, guests, and payments.
