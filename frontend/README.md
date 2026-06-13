# Next Code Base

Frontend project built with Next.js App Router, React 19, and `next-intl`, with feature-based modules and a locally vendored BKS Design System SDK.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Design System SDK](#design-system-sdk)
- [Project Structure](#project-structure)
- [Build and Deployment](#build-and-deployment)
- [Troubleshooting](#troubleshooting)

## Tech Stack

- **Framework**: Next.js `16.2.6` (App Router)
- **Runtime UI**: React `19.2.4`, React DOM `19.2.4`
- **Localization**: `next-intl`
- **Data fetching/state**: `@tanstack/react-query`, `zustand`
- **Forms/validation**: `react-hook-form`, `zod`, `@hookform/resolvers`
- **UI kit**: local vendor `@bks/ds-system-sdk` (mapped to `bks/ds-system-sdk`)
- **Styling**: Tailwind CSS v4 + design-system CSS
- **Testing**: Vitest + Testing Library + Playwright
- **Tooling**: TypeScript, ESLint, Husky, lint-staged

## Prerequisites

- Node.js 20+
- pnpm `10.12.1` (project package manager)

Check versions:

```bash
node -v
pnpm -v
```

## Getting Started

### 1) Install dependencies

```bash
pnpm install
```

### 2) Configure environment

Create or update `.env` at project root.

> This repository currently tracks a `.env` file locally. Keep secrets private and never commit sensitive values.

### 3) Run development server

```bash
pnpm dev
```

App runs at:

- <http://localhost:3000>

### 4) (Optional) Stop port 3000 process quickly

```bash
pnpm kill
```

## Environment Variables

The exact variables depend on your API/auth integrations.

At minimum, ensure your `.env` includes all variables used by:

- API client/config modules
- auth/session modules
- external service integrations

If teammate onboarding, ask for the latest `.env` template from the team before running production-like flows.

## Available Scripts

### Development and build

```bash
pnpm dev
pnpm build
pnpm start
```

### Lint and type checks

```bash
pnpm lint
pnpm exec tsc --noEmit --project tsconfig.lint.json
```

### Unit tests (Vitest)

```bash
pnpm test:unit
pnpm test:unit:watch
pnpm test:unit:ui
pnpm test:unit:coverage
```

### E2E tests (Playwright)

```bash
pnpm test:e2e
pnpm test:e2e:headed
pnpm test:e2e:debug
pnpm test:e2e:ui
pnpm test:e2e:report
```

### Combined test run

```bash
pnpm test:run
```

## Design System SDK

This project consumes a **vendored** SDK source at:

- `bks/ds-system-sdk`

### Sync SDK source from design-system repository

```bash
pnpm pull:ds
```

Script used:

- `scripts/pull-ds-sdk.mjs`

Default behavior:

- Pulls tag `v0.1.18` (unless overridden by env vars)
- Writes SDK source to `bks/ds-system-sdk`

Optional overrides:

```bash
BKS_DS_REF=v0.1.18 pnpm pull:ds
BKS_DS_REPO=<git-url> pnpm pull:ds
BKS_SDK_DEST=bks/ds-system-sdk pnpm pull:ds
```

### How imports work

TypeScript path aliases are configured in `tsconfig.json`:

```json
"@bks/ds-system-sdk": ["./bks/ds-system-sdk/index.ts"],
"@bks/ds-system-sdk/*": ["./bks/ds-system-sdk/*"]
```

Usage example:

```ts
import { Button } from "@bks/ds-system-sdk";
import "@bks/ds-system-sdk/styles.css";
```

Global styles are already imported in `app/layout.tsx`.

## Project Structure

```text
app/                    # Next.js App Router routes/layouts
features/               # Feature-based UI modules (domain-first organization)
shared/                 # Shared components/libs/constants across features
bks/ds-system-sdk/      # Vendored design system SDK source
scripts/                # Utility scripts (SDK sync, API generation)
__tests__/              # Unit/integration test setup and suites
e2e/                    # Playwright tests
docs/                   # Internal docs/playbooks
i18n/                   # next-intl request/configuration
messages/               # Locale message dictionaries
```

## Build and Deployment

Build locally:

```bash
pnpm build
pnpm start
```

`next.config.ts` uses:

- `output: "standalone"`
- `next-intl` plugin via `i18n/request.ts`

This setup is friendly for containerized/Node deployments where standalone output is preferred.

## Troubleshooting

### SDK import/path issues

If you see module resolution errors for `@bks/ds-system-sdk`:

1. Re-sync SDK source:
   ```bash
   pnpm pull:ds
   ```
2. Confirm alias in `tsconfig.json` points to `bks/ds-system-sdk`.
3. Re-run typecheck:
   ```bash
   pnpm exec tsc --noEmit --project tsconfig.lint.json
   ```

### Type check fails after SDK changes

Run:

```bash
pnpm install
pnpm exec tsc --noEmit --project tsconfig.lint.json
```

### Dev server does not start on port 3000

Kill existing process and rerun:

```bash
pnpm kill
pnpm dev
```
