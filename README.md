<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Iraq Compass (Supabase + Cloudflare)

This app uses a Supabase-first architecture for authentication, data APIs, and realtime feeds, and is intended to deploy behind Cloudflare.

## Run Locally

**Prerequisites:** Node.js 20+

1. Install dependencies:
   `npm install`
2. Create `.env.local` with required variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_CLOUDFLARE_ACCOUNT_ID` (required for deployment workflows)
   - `VITE_CLOUDFLARE_PROJECT_NAME` (required for deployment workflows)
   - `GEMINI_API_KEY` (if using Gemini features)
3. Run the app:
   `npm run dev`

## Build

`npm run build`

## Architecture

- Auth: Supabase Auth (Google OAuth)
- Data: Supabase Postgres tables via `@supabase/supabase-js`
- Realtime: Supabase channels for social feed updates
- Edge/deploy: Cloudflare
