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
- English email/password sign-in, account creation, generic password recovery,
  password update, and sign-out flows
- First-time setup for display name, IANA time zone, workdays, and working hours
- Transactional personal setup function with an explicit completion timestamp
- Next.js 16 `proxy.ts` session refresh using verified Supabase claims
- Protected workspace routes and guest-only authentication routes
- Authenticated display name in the application shell
- Local browser coverage for account creation, setup, sign-out, and sign-in
- Two-user integration coverage proving RLS workspace isolation
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

Supabase clients validate their environment only when called. Authentication
routes are active locally and require a configured URL plus publishable key.

Google Calendar variables are reserved but unused. Calendar remains an optional
enhancement and cannot block local planning.

## Work Inventory increment completed

The first Phase 4 vertical slice now uses the foundation successfully. It adds
the unified work-item schema, RLS, generated database types, Server Actions,
real inventory and detail screens, and tested create/edit flows. The exact
implementation is recorded in `docs/14-work-inventory-implementation.md`.

## Remaining foundation hardening

1. Replace the remaining synthetic Today schedule values with authenticated
   data.
2. Establish a hosted development Supabase project and protected environment
   variables before deployment.
3. Exercise email delivery and password recovery against the hosted development
   environment.
4. Document and test backup and migration recovery procedures.

Docker Desktop and the local Supabase stack are now operational. This increment
does not require Google Calendar credentials.
