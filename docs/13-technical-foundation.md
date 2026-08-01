# Technical foundation

Status: In progress  
Last updated: July 31, 2026

## Implemented in the first foundation increment

- Next.js 16 App Router with React 19 and strict TypeScript
- Tailwind CSS 4 plus the approved CSS custom-property design tokens
- DM Sans through `next/font`
- Desktop application shell and working routes for Today, Plan, Work, Calendar,
  Insights, and Settings
- First high-fidelity Today implementation using synthetic, non-sensitive data
- Tickets, normal Tasks, Reminders, and Meetings represented independently in
  the foundation view model
- Supabase browser and server client boundaries using `@supabase/ssr`
- Zod validation for public Supabase environment variables
- Initial Supabase migration for profiles, personal workspaces, memberships,
  work schedules, signup provisioning, and RLS
- Local Supabase stack verified on Docker Desktop
- Foundation migration and privacy-safe seed replayed successfully from a clean
  local database
- Generated TypeScript database contract connected to the browser and server
  Supabase clients
- Vitest, Testing Library, and Playwright configuration with initial tests
- Prettier, ESLint, TypeScript, build, and GitHub Actions quality checks
- Baseline security headers and non-indexable product metadata
- `.env.example`, `.nvmrc`, local Supabase config, and privacy-safe empty seed

## Dependency baseline

- Node.js `20.19.3`
- Next.js `16.2.12`
- React and React DOM `19.2.4`
- Supabase JavaScript `2.109.0`
- Supabase SSR `0.12.0`
- Zod `4.4.3`
- Vitest `4.1.10`
- Playwright `1.62.1`

Supabase JavaScript `2.110+` requires Node 22. The compatible versions above
are intentionally pinned until the project runtime is upgraded. PostCSS and
Sharp use explicit security-fixed overrides. `npm audit` must remain clean.

## Foundation boundaries

The current Today data is synthetic and exists only to validate layout,
accessibility, routes, and tests. It is not a mock persistence architecture.
The next increment replaces it through feature-owned queries after
authentication and a local Supabase session are active.

Supabase clients validate their environment only when called, allowing the
visual foundation to build without secrets. Authentication routes must not be
enabled until local or hosted publishable credentials are configured.

Google Calendar variables are reserved but unused. Calendar remains an optional
enhancement and cannot block local planning.

## Next foundation increment

1. Add English sign-in and first-time setup screens.
2. Add Next.js session refresh through the current `proxy.ts` convention.
3. Protect workspace routes and test authorization/RLS behavior.
4. Replace synthetic profile/work schedule values with authenticated data.
5. Establish a hosted development Supabase project only after local behavior is
   reproducible.

Docker Desktop and the local Supabase stack are now operational. This increment
does not require Google Calendar credentials.
