# SPACETEETH148 (Supabase-only)

This app now uses **Supabase as the single backend** for:

- Authentication (Google OAuth via Supabase Auth)
- Database reads/writes (businesses, posts, deals, stories, events, users, business_postcards)
- Realtime post updates (Supabase Realtime)

Firebase has been removed from code, config, and setup flow.

## Run locally

### Prerequisites

- Node.js 20+
- A Supabase project

### Required environment variables

Create a `.env.local` (or `.env`) file:

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

> `GEMINI_API_KEY` is still used by the existing AI-driven UI flows.

### Install and start

```bash
npm install
npm run dev
```

## Database bootstrap

Apply the migration in `supabase/migrations/20260328_bootstrap_public_tables.sql` to create and seed the required public tables.

## Architecture notes

- Supabase client initialization: `services/supabase.ts`
- Main data access layer: `services/api.ts`
- Auth/session wiring: `App.tsx` + `components/AuthModal.tsx`
- Deployment verification scripts: `scripts/preflight.sh`, `scripts/verify-deploy.sh`

## Deploy verification

```bash
./scripts/preflight.sh
./scripts/verify-deploy.sh
```
