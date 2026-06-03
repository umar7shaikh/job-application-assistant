# Deploying to Vercel

This is an npm-workspace monorepo. The deployable app is `apps/web` (Next.js 16).
Locally it runs on an embedded PGlite database; **in production you must use a
managed Postgres** because Vercel's serverless filesystem is ephemeral and not
shared between invocations — PGlite data would vanish.

## 1. Create a Postgres database

Use **Neon** (recommended) or **Supabase** — both are standard Postgres and work
with no code changes.

- **Neon:** create a project, then copy the **pooled** connection string (the host
  contains `-pooler`). You also get a direct (non-pooled) string for migrations.
- **Supabase:** Project → Connect → copy the **Transaction pooler** string
  (port `6543`) for the app, and the **Session/Direct** string (port `5432`) for
  migrations.

## 2. Generate the app secrets

```bash
# SESSION_SECRET
node -e "const c=require('crypto');console.log(c.randomBytes(48).toString('base64'))"
# SECRETS_KEY (must be 32 bytes)
node -e "const c=require('crypto');console.log(c.randomBytes(32).toString('base64'))"
```

## 3. Apply the database schema (one-time, and after any schema change)

Run migrations against your new database **before** the first deploy. Use the
**direct / session** connection string (DDL through a transaction pooler can be
flaky):

```bash
# from the repo root
DATABASE_URL="postgresql://...:5432/...   (direct connection)" npm run db:migrate
```

Windows PowerShell:

```powershell
$env:DATABASE_URL="postgresql://...:5432/..."; npm run db:migrate
```

## 4. Import the project on Vercel

1. Push this repo to GitHub/GitLab and **New Project** on Vercel.
2. **Root Directory:** set to `apps/web`. Vercel auto-detects Next.js and installs
   the workspace from the repo-root lockfile (keep "Include files outside root"
   enabled — it's automatic for detected monorepos).
3. Build & Output settings: leave as the Next.js defaults (`next build`).

## 5. Set environment variables (Vercel → Settings → Environment Variables)

| Variable           | Required | Value                                                        |
| ------------------ | -------- | ------------------------------------------------------------ |
| `SESSION_SECRET`   | yes      | from step 2                                                  |
| `SECRETS_KEY`      | yes      | from step 2 (32-byte base64)                                 |
| `DATABASE_URL`     | yes      | the **pooled** connection string from step 1                 |
| `DATABASE_POOL_MAX`| no       | max connections per instance (default `5`)                   |

Add them to **Production** (and Preview, if you want preview deploys to work).

## 6. Deploy

Trigger a deploy. Visit the URL, sign up, and add your BYO API keys (Apify /
RapidAPI / AI) in **Settings** — those are per-user and encrypted at rest with
`SECRETS_KEY`, not set as environment variables.

## Notes

- **Secrets rotation:** changing `SECRETS_KEY` makes existing encrypted user keys
  undecryptable. Changing `SESSION_SECRET` logs everyone out. Set them once.
- **Schema changes:** run `npm run db:generate` to create a migration, commit the
  generated SQL under `packages/db/drizzle/`, then re-run step 3 against prod.
- **Long Apify scrapes** are still synchronous (see `PROJECT_SPEC.md` §3). They run
  within the serverless function timeout; very large scrapes may need the async +
  webhook approach noted in the spec.
- The browser extension (`apps/extension`) is loaded separately by each user and is
  not part of the Vercel deploy.
