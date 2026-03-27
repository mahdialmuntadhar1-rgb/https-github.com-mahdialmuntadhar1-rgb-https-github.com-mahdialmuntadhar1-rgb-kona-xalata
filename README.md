# Iraq Compass Frontend

React + Vite frontend for Iraq Compass.

> **Migration status (2026-03-27):**
> Supabase-oriented deployment checks exist, but runtime auth/data code still uses Firebase.
> Firebase runtime/config files must remain until Supabase replacement is verified end-to-end.

## Setup

### Prerequisites

- Node.js 20+
- npm 10+

### Install and run

```bash
npm install
npm run dev
```

### Build

```bash
npm run build
```

## Environment variables

Environment variables verified in this repo:

- `GEMINI_API_KEY` (loaded in `vite.config.ts`)
- `VITE_SUPABASE_URL` (required by `scripts/preflight.sh`)
- `VITE_SUPABASE_ANON_KEY` (required by `scripts/preflight.sh`)

Current Firebase runtime config is loaded from `firebase-applet-config.json` via `firebase.ts`.

## Authentication

- Current runtime auth: Firebase Auth (`firebase.ts`, `App.tsx`, `components/AuthModal.tsx`).
- Supabase auth runtime is not yet present in this repo.

## Database

- Current runtime database path: Firestore (`services/api.ts`).
- Firestore rules are defined in `firestore.rules`.
- Supabase schema/RLS status doc: `docs/schema-and-rls.md`.

## Deployment

### Preflight

```bash
./scripts/preflight.sh
```

Checks Supabase env vars, then runs lint and build.

### Verify deploy artifact

```bash
./scripts/verify-deploy.sh
```

Runs lint/build and scans built assets for forbidden legacy strings.

## Testing

```bash
npm run lint
npm run build
./scripts/preflight.sh
./scripts/verify-deploy.sh
```

## Scope

- **In scope:** code and docs in this repository.
- **Out of scope:** external deployment projects, Supabase dashboard-managed resources, and other repos not versioned here.

## Migration docs

- `docs/schema-and-rls.md`
- `docs/migration-summary.md`
