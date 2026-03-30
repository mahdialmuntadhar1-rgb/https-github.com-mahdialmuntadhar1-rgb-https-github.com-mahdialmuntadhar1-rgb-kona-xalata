# AUDIT_REPORT.md

Date: 2026-03-30

## Scope audited
- Runtime entrypoints, routing shell, auth/session bootstrapping, and error boundary (`index.tsx`, `App.tsx`).
- Supabase integration and data access (`services/supabase.ts`, `services/api.ts`).
- Directory/listing/detail-adjacent flows across feature components.
- Translations/constants, package/deploy scripts, metadata, migration SQL, and env docs.

## Key findings (before remediation)

### Critical blockers
1. **Category filtering mismatch between frontend and Supabase data.**
   - Frontend emitted category IDs (e.g., `food_drink`) while seeded/current DB values may be human-readable labels (e.g., `Food & Drink`).
   - Result: listing/featured filtering could incorrectly return empty results.

2. **Event tab filtering used stale category keys.**
   - `PersonalizedEvents` used categories like `entertainment`, `food`, `business` that do not match app taxonomy.
   - Result: event tabs appeared broken despite existing rows.

3. **SQL migration had invalid `business_postcards` seed insert values count.**
   - Extra trailing value caused migration/application instability.

4. **RLS policy shape for `users` was unsafe and operationally incorrect.**
   - `users` table had public read policy (data exposure risk), but no explicit self insert/update/read authenticated policies.

### High-priority issues
1. **Hidden fallback behavior for governorate filters.**
   - Social posts/stories would silently fall back to global feed when no matching governorate rows existed.
   - This masked true filtered state and could mislead users.

2. **Rating filter in directory UI was not wired to Supabase query.**
   - UI appeared functional but did not impact query results.

3. **Misleading empty-state copy in postcards section.**
   - Displayed stories empty-state text for postcards.

### Medium-priority cleanup
1. Placeholder image fallback used generic random stock endpoint in critical cards.
2. Existing reports/changelog files needed refresh to reflect current launch state after hardening.

## Findings that are already in good shape
- Supabase-only runtime path is in place (`services/supabase.ts`, `services/api.ts`).
- No Firebase code/dependency paths detected.
- `.env.example` exists and reflects required Supabase client vars.
- Scripts for preflight/deploy verification exist and are focused.
