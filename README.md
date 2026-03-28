<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Iraq Compass (Supabase-only)

This app now uses **Supabase only** for:
- Authentication (`supabase.auth`)
- Database/data access (`public` schema tables)
- Realtime post updates (`postgres_changes` subscription)

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Create `.env.local` with:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY` (required by AI-assisted components)
3. Run the app:
   `npm run dev`

## Supabase bootstrap

- Supabase client initialization lives in `services/supabase.ts`.
- Main data access and auth profile sync live in `services/api.ts`.
- Database bootstrap migration is `supabase/migrations/20260328_bootstrap_public_tables.sql`.

Apply migrations with your standard Supabase workflow before first deploy.
