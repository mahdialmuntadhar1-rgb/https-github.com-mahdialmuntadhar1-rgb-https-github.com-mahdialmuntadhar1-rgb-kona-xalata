# Phase 8 Final Verification (2026-03-27)

## Checklist

- [x] App builds (`npm run build` passed).
- [x] Type-check/lint gate runs (`npm run lint` passed).
- [x] Env vars referenced are documented in `README.md` (`GEMINI_API_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
- [ ] Firebase fully removed or isolated.
  - **Result:** Not removed and not isolated. Active runtime imports and usage remain in `firebase.ts`, `App.tsx`, `services/api.ts`, and UI components.
- [ ] Supabase auth/data paths wired.
  - **Result:** Missing dependency in visible codebase. `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are only checked in `scripts/preflight.sh`; no Supabase client, imports, auth flow, or data path are present.
- [ ] Worker status resolved.
  - **Result:** Missing dependency in visible codebase. No Worker source/config/deploy file is present.
- [ ] Tests run.
  - **Result:** Missing dependency in visible codebase. No `test` script exists in `package.json`.

## Known risks

1. **Backend mismatch risk:** Verification script enforces Supabase env vars, but app code still relies on Firebase for auth/data.
2. **Launch blocker for Supabase migration:** There is no visible Supabase client wiring.
3. **No automated test suite:** Regressions may escape build/type checks.
4. **Bundle size risk:** Build reports a chunk larger than 500 kB.

## Launch-readiness verdict

**Verdict: NOT launch-ready** for a Supabase-targeted release.

The current repository builds successfully, but the required migration checks fail: Firebase remains active, Supabase data/auth wiring is not visible, Worker artifacts are not visible, and no tests are configured.

## Remaining manual tasks

1. Implement and validate Supabase client/auth/data integration (or remove Supabase preflight requirement if not intended).
2. Remove Firebase runtime usage or isolate it behind a clearly documented compatibility boundary.
3. Add Worker code/configuration and deployment verification (or explicitly remove Worker requirement from release criteria).
4. Add at least smoke/integration tests and a `test` script in `package.json`.
5. Address large bundle warning (code-splitting/manual chunks).
