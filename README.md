<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Iraq Compass — Supabase + Cloudflare architecture

This project is now standardized on:

- **Supabase** for database, auth, storage, and realtime
- **Cloudflare Workers** for secure server-side logic and integrations
- **Frontend (Vite + React)** for UX and direct Supabase reads for non-privileged flows

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set required environment variables in `.env.local`:
   - `GEMINI_API_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Run the app:
   `npm run dev`

## Build checks

- Type check: `npm run lint`
- Production build: `npm run build`
- Preflight script (Supabase + Cloudflare assumptions): `./scripts/preflight.sh`
