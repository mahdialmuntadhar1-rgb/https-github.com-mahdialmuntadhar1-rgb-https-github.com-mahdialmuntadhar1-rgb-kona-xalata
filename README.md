<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Iraq Compass Frontend

This repository contains a Vite + React frontend for the Iraq Compass app.

## Architecture

- **Frontend:** Vite + React
- **Hosting/Deployment:** Cloudflare Pages
- **Backend/Data:** Supabase (REST + auth/profile integration points)

This project does **not** use Gemini, Google AI Studio, Firebase, or any AI runtime dependency.

## Local development

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a local environment file (for example `.env.local`) and set:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Run the app:
   ```bash
   npm run dev
   ```

## Deployment (Cloudflare Pages)

Configure Cloudflare Pages with:

- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Environment variables:**
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

### Notes

- This repo is configured for **Cloudflare Pages** deployment.
- Do **not** add Cloudflare Workers deployment config for this app.
- `.wrangler/` artifacts are intentionally ignored and should not be committed.
