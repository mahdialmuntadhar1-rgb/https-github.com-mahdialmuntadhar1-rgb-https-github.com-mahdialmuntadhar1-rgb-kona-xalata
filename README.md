<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Iraq Compass (Supabase-only)

This app now uses **Supabase as the only backend** for:
- Auth
- Database reads/writes
- Realtime post updates

Legacy backend dependencies have been removed from runtime code, config, dependencies, and setup.

## Local setup

**Prerequisites:** Node.js 20+.

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env.local` with required variables:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```
3. Run the app:
   ```bash
   npm run dev
   ```

## Build and checks

```bash
npm run lint
npm run build
./scripts/preflight.sh
./scripts/verify-deploy.sh
```

## Supabase architecture notes

- Supabase client initialization: `services/supabase.ts`
- Auth session + app auth state wiring: `App.tsx`
- OAuth sign-in entry point: `components/AuthModal.tsx`
- Main data access layer: `services/api.ts`
- Schema bootstrap migration: `supabase/migrations/20260328_bootstrap_public_tables.sql`
