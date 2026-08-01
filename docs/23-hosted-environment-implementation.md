# Hosted environment implementation

Status: Phase 7.5D in progress  
Last updated: August 1, 2026

## Outcome

North Haven is prepared for a private Vercel deployment backed by a separate
hosted Supabase project. Local development remains available and the owner's
existing Netlify deployment is not changed.

The repository pins Node.js 24 for local development, GitHub Actions, and
Vercel. GitHub Actions now proves the authenticated workflow against a clean
Docker-backed Supabase stack on every change. Playwright can also target a
hosted URL without starting a local Next.js server and removes the workspace and
auth user it creates.

Deleting a personal Auth user now deletes its sole-owner workspace before the
profile cascade. Daily Plan and Work Log relationships use complete delete
cascades so this teardown is atomic; normal in-app work deletion remains
recoverable archival.

## Environment boundaries

Use three distinct boundaries:

1. Local development: local Supabase, local Google callback, synthetic data.
2. Hosted verification: hosted Supabase plus Vercel, synthetic acceptance data
   only.
3. Personal production workspace: the owner's real work data after acceptance.

The hosted acceptance run must happen before entering customer information. Do
not seed `supabase/demo/insights_demo.sql` into the hosted project.

## Supabase project

Create a hosted project in a personal or Tokki Supabase organization:

- Project name: `North Haven Development`
- Region: choose the region closest to the Vercel function region and the owner
  in Guatemala; keep both services in the same broad geography when possible
- Plan: Free is sufficient for the private acceptance environment
- Database password: generated and stored in a password manager, never in Git
  or chat

After signing the CLI in locally, link this repository and apply migrations:

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push --dry-run
npx supabase db push
```

The dry run must list only reviewed files from `supabase/migrations/`. Do not
make production schema changes manually in the Dashboard; every change remains
reproducible through migrations.

## Vercel project

Import `SunnySideUp-webdev/north-haven` into the owner's Tokki Vercel team:

- Project name: `north-haven`
- Framework preset: Next.js
- Root directory: repository root
- Build command: Next.js default
- Node.js: `24.x`, also enforced by `package.json` and `.nvmrc`

Connect the production branch to `main`. Preview deployments may be used for UI
review, but Google OAuth is validated on the stable production deployment
because Google requires an exact redirect URI.

## Protected environment variables

Configure these names in Vercel; values stay in the provider dashboards and
must never be pasted into documentation, issue comments, screenshots, or chat:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_CALENDAR_CLIENT_ID`
- `GOOGLE_CALENDAR_CLIENT_SECRET`
- `GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEY`

`NEXT_PUBLIC_APP_URL` is the exact stable HTTPS production origin without a
trailing slash. Public Supabase variables may be exposed to the browser by
design; the service-role key and all Google values are server-only.

## Redirect configuration

In Supabase Auth URL Configuration:

- Site URL: the exact stable Vercel production origin
- Redirect URL: `<production-origin>/auth/callback`
- Redirect URL: `<production-origin>/auth/update-password`
- Local callbacks may remain allow-listed for `http://127.0.0.1:3000`
- Add a Vercel preview wildcard only after confirming the actual Vercel team
  slug; do not guess it from the display name

In the Google OAuth web client:

- Authorized JavaScript origin: the stable Vercel production origin
- Authorized redirect URI:
  `<production-origin>/api/google-calendar/callback`

The Google Calendar account remains independent from the email used to sign in
to North Haven. Production OAuth must retain read-only Calendar scopes.

## Hosted acceptance run

Set the hosted environment values only in the current terminal or an approved
secret store, then run:

```bash
PLAYWRIGHT_BASE_URL=https://<production-origin> \
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co \
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key> \
SUPABASE_SERVICE_ROLE_KEY=<service-role-key> \
npm run test:e2e:hosted
```

Do not paste the command with real values into chat or commit it to a shell
script. The test creates a uniquely named synthetic account, verifies account
setup, Settings, backup restoration, lifecycle recovery, planning, End of Day,
Insights, and PDF/CSV export, then deletes the generated workspace and user.

After the automated run:

1. Confirm no `north-haven-*@example.com` auth user remains.
2. Verify password recovery through the hosted email path.
3. Connect the corporate Google account and run one read-only sync.
4. Download and restore a synthetic workspace backup once.
5. Delete the synthetic workspace before entering personal work data.

## Exit criteria

Phase 7.5D is complete when:

- remote migrations apply cleanly from the repository
- Vercel builds the production branch on Node.js 24
- email/password setup and session restoration work over HTTPS
- the hosted browser acceptance path passes and cleans up after itself
- password recovery works through hosted email delivery
- Google Calendar connects through the exact production callback with read-only
  access
- no secrets or synthetic acceptance users remain in the repository
