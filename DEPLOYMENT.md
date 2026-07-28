# Deploying Arc

Arc runs on Vercel, uses Firebase Authentication for identity, Neon Postgres for application data, and Prisma for the data layer. The application can remain in mock mode locally, but production must use real services.

## 1. Prepare Neon

1. Create a Neon project and database.
2. In the Neon dashboard, open **Connect** and copy both PostgreSQL URLs:
   - Enable pooling and use that URL for `DATABASE_URL`.
   - Use the direct, non-pooled URL for `DIRECT_URL`.
3. Put both values in `.env.local`.
4. Run `pnpm db:migrate --name init` for the first deployment, then use migrations for every schema change. Do not use `db:push` for production schema changes.

## 2. Prepare Firebase

1. Create a Firebase project and add a Web app.
2. Under **Authentication → Sign-in method**, enable Email/Password, Google, and GitHub only if the corresponding buttons should be live.
3. Add `localhost` and the production Vercel domain under **Authentication → Settings → Authorized domains**.
4. In **Project settings → Service accounts**, generate an Admin SDK private key. Copy the service account email and private key into the server-only variables below.

Firebase variables available in the browser must retain the `NEXT_PUBLIC_` prefix. Never expose `FIREBASE_PRIVATE_KEY`, `DATABASE_URL`, `DIRECT_URL`, Redis tokens, or `CRON_SECRET` to the browser.

## 3. Configure environment variables

Copy `.env.local.example` to `.env.local` for development. In Vercel, add the same values under **Project → Settings → Environment Variables** for Production and Preview as appropriate.

```dotenv
DATABASE_URL="pooled Neon URL"
DIRECT_URL="direct Neon URL"

NEXT_PUBLIC_FIREBASE_API_KEY=""
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=""
NEXT_PUBLIC_FIREBASE_PROJECT_ID=""
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=""
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=""
NEXT_PUBLIC_FIREBASE_APP_ID=""

FIREBASE_CLIENT_EMAIL="firebase-adminsdk-...@your-project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""
CRON_SECRET="a-random-secret-at-least-16-characters"

USE_MOCK_DATA=false
```

## 4. Deploy to Vercel

1. Push the repository to GitHub.
2. In Vercel, choose **Add New → Project**, import the repository, and let Vercel detect Next.js.
3. Add all production environment variables before the first deployment.
4. Deploy. Vercel runs `pnpm build` from the lockfile automatically.
5. Add the generated `*.vercel.app` URL and any custom domain to Firebase Authorized domains.
6. Confirm the deployment has `USE_MOCK_DATA=false`, then visit `/login` and complete the normal platform-link flow.

`vercel.json` schedules `/api/cron/sync` every six hours. Vercel sends `CRON_SECRET` as a Bearer token, and the route refreshes stale or failed Codeforces and LeetCode connections in batches.

## 5. Production checks

1. `pnpm lint`
2. `npx tsc --noEmit --pretty false`
3. `pnpm db:migrate deploy`
4. Sign in with each enabled Firebase provider.
5. Link a Codeforces and a LeetCode account, then confirm the dashboard, friends, and compare pages show real values.
6. Confirm `/api/cron/sync` rejects requests without the correct authorization header.

## Local modes

- `USE_MOCK_DATA=true`: UI development with sample data and no external services.
- `USE_MOCK_DATA=false`: real Firebase sessions, Neon data, platform sync, and production API behavior.
