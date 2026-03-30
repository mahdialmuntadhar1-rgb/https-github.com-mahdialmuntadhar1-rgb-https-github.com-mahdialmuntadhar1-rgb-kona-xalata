# TODO_LAUNCH_BLOCKERS.md

Date: 2026-03-30

## Critical blockers
- [x] Fix category filtering/schema mismatch by supporting canonical category IDs and legacy human-readable labels in Supabase queries.
- [x] Fix event tab category mapping to valid taxonomy keys used in data.
- [x] Fix invalid SQL seed insert for `business_postcards` in migration.
- [x] Replace unsafe `users` public-read policy with authenticated self-access policies.

## High-priority fixes
- [x] Remove hidden governorate fallback behavior in social posts (home feed) and stories.
- [x] Wire directory minimum rating filter into Supabase query.
- [x] Correct postcards empty-state messaging.

## Medium-priority cleanup
- [x] Replace generic random placeholder image fallback in listing/featured cards with stable assets/URLs.
- [x] Refresh audit/final/handoff/changelog docs to match real post-fix repository state.

## Manual credential/dashboard tasks
- [ ] Set production `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in hosting.
- [ ] Ensure Supabase Auth redirect URLs include the production domain.
- [ ] Confirm RLS and migration are applied in production project before go-live.
