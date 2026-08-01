# North Haven

North Haven is a calm, personal, desktop-first workday planner. It separates a
large work inventory from the small, deliberate plan that deserves attention
today.

> Open North Haven and know what to do next in less than ten seconds.

The interface is English. Product documentation and collaboration may be in
Spanish.

## Current phase

The core Phase 4 Work Inventory experience and the first persistent Phase 5
Daily Planning slice are implemented. The repository contains the Next.js
application shell, approved visual tokens, an initial Today implementation,
Supabase authentication, private workspace provisioning, first-time setup, and
the first production-shaped Tickets, Tasks, and Reminders vertical slice.

The Today screen currently uses synthetic foundation data. No customer data,
production credentials, or Google tokens are present.

## Local setup

Requirements:

- Node.js 20.19.3, recorded in `.nvmrc`
- npm
- Docker-compatible runtime only when starting the local Supabase stack

Install and run the interface:

```bash
nvm use
npm install
npm run dev
```

Open `http://127.0.0.1:3000`. The root route sends signed-out visitors to Sign
in and authenticated users to Setup or Today.

Copy `.env.example` to `.env.local` and replace the placeholders with local or
hosted project values. Never commit `.env.local`.

Run the local database and reproduce its schema with:

```bash
npm run db:start
npm run db:reset
npm run db:types
```

`db:types` regenerates the checked-in TypeScript database contract after a
schema migration changes.

With the local stack running, the opt-in database and browser authentication
checks are:

```bash
npm run test:integration:local
npm run test:e2e:local
```

## Verification commands

```bash
npm run format
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
npm audit
```

Playwright needs its Chromium binary once per machine:

```bash
npx playwright install chromium
```

## Project structure

```text
src/
  app/                    Routes and layouts
  features/               Domain-owned UI, rules, and tests
  server/                 Server-only auth and database boundaries
  shared/                 Reusable UI, content, and validation
supabase/
  migrations/             Reviewed SQL migrations and RLS policies
  seed.sql                 Synthetic local data only
tests/e2e/                 Browser-level workflows
docs/                     Canonical product and technical specifications
design/                   Approved wireframes and high-fidelity references
```

## Security baseline

- Supabase SSR sessions will use cookies and PKCE.
- Every exposed business table requires RLS.
- Service-role and Google secrets stay server-only.
- Customer content must never appear in URLs, logs, analytics, or errors.
- Generated report files will be streamed with private/no-store behavior.
- The initial dependency audit passes with zero known vulnerabilities.

Supabase JavaScript is pinned to `2.109.0` with SSR `0.12.0` because the next
release line requires Node 22. PostCSS and Sharp use security-fixed overrides.
Reassess these pins when the project moves to Node 22.

## Documentation

- [Project handoff](HANDOFF.md)
- [Product foundation](docs/01-product-foundation.md)
- [Information architecture](docs/02-information-architecture.md)
- [UX specification](docs/03-ux-specification.md)
- [Data model](docs/04-data-model.md)
- [Technical architecture](docs/05-technical-architecture.md)
- [Roadmap](docs/06-roadmap.md)
- [English interface content](docs/07-content-design.md)
- [Decision log](docs/08-decision-log.md)
- [Low-fidelity review](docs/09-low-fidelity-wireframes.md)
- [Visual system](docs/10-visual-system.md)
- [Interaction states](docs/11-interaction-states.md)
- [Reporting and exports](docs/12-reporting-and-exports.md)
- [Technical foundation](docs/13-technical-foundation.md)
- [Work Inventory implementation](docs/14-work-inventory-implementation.md)
- [Daily Planning implementation](docs/15-daily-planning-implementation.md)
