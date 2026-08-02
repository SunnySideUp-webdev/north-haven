# Hosted environment implementation

Status: Phase 7.5D deployed; authenticated acceptance in progress
Last updated: August 1, 2026

## Outcome

North Haven now has a separate hosted Supabase project and a production Vercel
deployment at `https://north-haven-steel.vercel.app`. Local development remains
available and the owner's existing Netlify deployment is not changed.

`North Haven Development` was created in the Tokki organization on the Free
plan in East US (North Virginia). The repository is linked through the Supabase
CLI, all 19 reviewed migrations were applied successfully, and a subsequent
remote dry run reports that the database is up to date. No demo seed or customer
data was applied.

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

The hosted project uses:

- Organization: `Tokki`
- Project name: `North Haven Development`
- Region: East US (North Virginia)
- Plan: Free
- Database password: generated and stored in a password manager, never in Git
  or chat

The project was linked and migrated using:

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

The Tokki Vercel project is connected to the GitHub `main` branch. Its stable
production domain is `https://north-haven-steel.vercel.app`; generated deployment
URLs are not used for OAuth configuration.

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

Use the Supabase key named `default` with type `publishable` for
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Use the legacy key named `service_role`
for `SUPABASE_SERVICE_ROLE_KEY`; do not substitute a modern `sb_secret_...` key
unless the server integration has first been migrated and verified against all
admin endpoints. Each Vercel variable must receive its own value. A deployment
where all variables accidentally share the same placeholder will build but
authentication will fail at runtime.

## Redirect configuration

In Supabase Auth URL Configuration:

- Site URL: the exact stable Vercel production origin
- Redirect URL: `<production-origin>/auth/callback?next=/setup`
- Redirect URL: `<production-origin>/auth/callback?next=/update-password`
- Local callbacks may remain allow-listed for `http://127.0.0.1:3000`
- Add a Vercel preview wildcard only after confirming the actual Vercel team
  slug; do not guess it from the display name

In the Google OAuth web client:

- Authorized JavaScript origin: the stable Vercel production origin
- Authorized redirect URI:
  `<production-origin>/api/google-calendar/callback`

The Google Calendar account remains independent from the email used to sign in
to North Haven. Production OAuth must retain read-only Calendar scopes.

## Hosted Auth email allowance

Supabase's built-in email provider currently allows two Auth emails per hour,
shared project-wide by signup, recovery, and email-change requests. When that
allowance is exhausted, signup returns `over_email_send_rate_limit` with HTTP
429. North Haven translates that code into an actionable message asking the
user to wait up to one hour; repeated retries do not help the allowance refill.

Plan the first acceptance run across separate windows: owner signup first,
password recovery later, and any synthetic signup only when another email is
available. Custom SMTP is required if the project eventually needs a higher
email allowance. The current limit and configuration options are documented in
the official Supabase Auth rate-limit guide:
`https://supabase.com/docs/guides/auth/rate-limits`.

The August 1 production diagnosis confirmed that direct hosted Auth and the
signup provisioning trigger work. No diagnostic Auth users remained afterward;
the observed owner signup error was the temporary email allowance, not invalid
credentials or a failed migration.

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
