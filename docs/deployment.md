# Deployment

The app uses standard Next.js Node runtime API routes and can be built on Vercel with `npm run build`. It does not use Edge runtime.

## Local or persistent Node host

Use Node 22.16+ or 24 LTS. Run `npm ci`, copy `.env.example` to `.env`, then `npm run db:init`, `npm run build`, and `npm start`. Keep `prisma/dev.db` on a persistent volume and back it up. Never share one SQLite file across multiple application hosts. The demo is usable without provider credentials.

## Vercel

Local SQLite is not durable across Vercel serverless invocations. Before deploying there, configure a hosted database (for example PostgreSQL), change the Prisma datasource provider and `DATABASE_URL`, and generate and review a migration for that database. The included SQLite migration cannot run against PostgreSQL. Run migrations in a controlled release step; seed fictional data only in demo environments. Do not deploy this SQLite configuration expecting durable data on Vercel.

This MVP intentionally has no authentication. Use a private deployment protected by your host's access controls before adding API credentials or real product information. The per-process hourly generation ceiling (default 20) is useful locally, but is not a distributed spending cap. Set provider account spending limits; add shared rate limiting before scaling. There is no autonomous scheduler or outbound publishing.

Set `ANTHROPIC_API_KEY` and optionally `ANTHROPIC_MODEL` as server secrets. The current default is documented in `.env.example`; verify your account can access the model. No `NEXT_PUBLIC_` variable should contain a secret. Restart/redeploy after environment changes. CoreWeave requires all three documented environment variables and remains disabled otherwise.
