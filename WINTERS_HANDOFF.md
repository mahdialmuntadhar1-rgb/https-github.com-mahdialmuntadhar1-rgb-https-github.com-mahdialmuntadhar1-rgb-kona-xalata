# WINTERS_HANDOFF.md

1. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in production hosting environment.
2. Apply `supabase/migrations/20260328_bootstrap_public_tables.sql` to the production Supabase project.
3. Confirm Supabase Auth redirect URLs include the final production domain.
4. Redeploy production.
5. Smoke test: business listing, search, governorate/category/rating filters, events tabs, postcards modal/details, and pagination/load-more.
6. Confirm production domain behavior (no auth redirect mismatch, no data-access policy errors).
