# Schema and RLS status (Supabase migration)

This document is intentionally limited to what is verifiable in this repository on **2026-03-27**.

## What is present in this repo

- Firestore security rules exist in `firestore.rules`.
- Runtime data access uses Firebase/Firestore APIs in `services/api.ts`.
- Deployment preflight expects Supabase env vars in `scripts/preflight.sh`.

## Firestore collections currently visible in code/rules

The following collections are directly visible in this repository:

- `test` (`test/connection`) 
- `users`
- `posts`
- `businesses`
- `likes`
- `business_postcards`
- `deals`
- `stories`
- `events`

## Supabase schema / RLS: missing source of truth in this repo

A concrete Supabase SQL schema or migration folder is **not present** in this repository.

Because that source is missing, this repo cannot authoritatively define:

- final Supabase table names and column types,
- final foreign keys and indexes,
- exact RLS SQL policies.

## Required dependency to complete this doc

To finalize schema + RLS documentation without guesswork, add one of the following to this repo (or link the authoritative external source):

1. Supabase SQL migration files (for example `supabase/migrations/*.sql`), or
2. A versioned schema export and policy SQL from the target Supabase project.

## Verification gate before removing Firebase config

Do **not** remove Firebase runtime/config files until all conditions are met:

1. No Firebase imports remain in runtime code paths.
2. Supabase auth/session flow is live and verified.
3. Runtime reads/writes are moved from Firestore to Supabase.
4. Authoritative Supabase schema + RLS artifacts are available and reviewed.
5. Lint/build/deploy checks pass in this repo.
