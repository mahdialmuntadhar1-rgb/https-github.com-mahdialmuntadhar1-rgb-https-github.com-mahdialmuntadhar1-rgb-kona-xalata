# CHANGELOG_CODEX_FINALIZATION.md

Date: 2026-03-30

## services/api.ts
- Added category normalization map and resolver to align frontend category IDs with Supabase data variants. *(blocker fix)*
- Added `rating` filter support in `getBusinesses` and connected it to query constraints. *(blocker fix / hardening)*
- Improved city search matching from prefix-only to contains search (`%term%`) for practical discovery behavior. *(hardening)*

## components/BusinessDirectory.tsx
- Wired minimum rating filter into API request payload.
- Replaced unrealistic distance fallback display with city-aware fallback text.
- Replaced random placeholder image endpoint with stable fallback URL.
*(blocker fix / cleanup)*

## components/PersonalizedEvents.tsx
- Corrected tab-to-category mapping to real app taxonomy (`events_entertainment`, `food_drink`, `business_services`).
*(blocker fix)*

## App.tsx
- Removed hidden fallback to unfiltered posts when governorate-specific results are empty.
*(hardening / integrity fix)*

## components/CommunityStories.tsx
- Removed hidden fallback to unfiltered stories for governorate filtering.
*(hardening / integrity fix)*

## components/PostcardsSection.tsx
- Replaced incorrect stories empty-state copy with directory/postcards-appropriate empty-state copy.
*(cleanup / launch prep)*

## components/FeaturedBusinesses.tsx
- Replaced random placeholder image endpoint with stable fallback URL.
*(cleanup)*

## supabase/migrations/20260328_bootstrap_public_tables.sql
- Replaced `users` public-read policy with authenticated self-access policies (read/insert/update own profile).
- Added authenticated insert policy for posts.
- Added authenticated insert/update policies for business postcards.
- Fixed invalid seed insert payload in `business_postcards` seed block.
*(blocker fix / security hardening / launch prep)*

## AUDIT_REPORT.md
- Rewritten with current deep-audit findings and post-remediation status.
*(launch prep)*

## TODO_LAUNCH_BLOCKERS.md
- Rewritten with grouped blockers/fixes and remaining manual tasks.
*(launch prep)*

## FINAL_REPORT.md
- Rewritten with readiness estimate, completed fixes, remaining blockers, and exact next action.
*(launch prep)*

## WINTERS_HANDOFF.md
- Rewritten to only include minimal manual deployment tasks.
*(launch prep)*
