<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/accadf3d-012c-4037-9b18-c758fba3ddf9

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set required environment variables in `.env.local`:
   - `GEMINI_API_KEY` (used by AI generation paths)
   - `VITE_SUPABASE_URL` (required by `scripts/preflight.sh`)
   - `VITE_SUPABASE_ANON_KEY` (required by `scripts/preflight.sh`)
3. Run the app:
   `npm run dev`

## Verification scripts

- `./scripts/preflight.sh` checks that Supabase env vars are present, then runs lint + build.
- `./scripts/verify-deploy.sh` runs lint + build and scans built assets for forbidden legacy strings.
