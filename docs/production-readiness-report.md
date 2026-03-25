# Iraq Compass — Production Readiness Deep Report

Audit date: 2026-03-25 (UTC)

## Executive summary

- **Current production-readiness score:** **68%**
- **Estimated probability of stable launch today (without major incident):** **60%**
- **Estimated probability after implementing the open critical items below:** **85–90%**

Scoring method used in this report:
- Security & access control: 30%
- Reliability & scalability: 25%
- Deployment & environment management: 20%
- Quality assurance: 15%
- Observability & operations: 10%

## What is now production-strong

1. **Authentication and backend AI proxy are in place**
   - Firebase Auth is integrated in the frontend.
   - Gemini calls are routed through Cloud Functions (not directly exposed in the browser).
2. **Server-side rate limiting exists for AI callables**
   - Request throttling per UID is present for AI endpoints.
3. **Firestore rules are present and non-trivial**
   - Rules validate key document shapes and restrict high-risk writes.
4. **Hosting/deploy config is now versioned**
   - `firebase.json` and `firestore.indexes.json` are committed.

## Gaps that still block a confident launch

### Critical (must finish before launch)

1. **Admin claim lifecycle is incomplete**
   - Rules depend on `request.auth.token.admin`, but there is no claim assignment workflow in repo.
   - Required work: add a secure admin-only process/tooling to assign/revoke custom claims.

2. **Rate limiter is in-memory only**
   - Current limiter resets on cold start/instance change and can be bypassed at scale.
   - Required work: move rate limit state to durable shared storage (Firestore/Redis/Memorystore).

3. **No CI gate for build + tests + rules verification**
   - Required work: CI workflow that runs frontend type checks, function tests, and Firestore rules tests.

### High priority (finish in launch week)

1. **Environment separation (dev/staging/prod) not configured**
   - Required work: `.firebaserc` aliases and deployment docs; separate projects.

2. **Observability is minimal**
   - Required work: structured logs, error alerts, uptime checks, dashboard for Functions + Firestore errors.

3. **Pagination and query performance hardening**
   - Required work: cursor pagination and aggregate count strategy for large collections.

### Medium priority (post-launch but soon)

1. **Automated e2e happy-path tests**
2. **Load testing for AI endpoints and hot reads**
3. **Backup/restore runbook and incident response playbook**

## Changes completed in this pass

1. Moved user-profile provisioning to trusted backend callable (`upsertUserProfile`) to reduce client-side role/profile tampering risk.
2. Updated frontend login flow to call backend profile provisioning endpoint.
3. Tightened Firestore `users` rules to admin-write only and self/admin reads.
4. Added `firebase.json` for repeatable deploy topology and rewrites.
5. Added `firestore.indexes.json` for required composite indexes.

## Launch checklist (recommended)

- [ ] Add admin custom-claims management function/process.
- [ ] Add durable distributed rate limiting.
- [ ] Configure `.firebaserc` with `dev/staging/prod` aliases.
- [ ] Add CI checks (frontend lint/build, functions lint/test/build, rules tests).
- [ ] Add alerting for function error-rate spikes.
- [ ] Perform a staging load test and capture baseline SLOs.

## Confidence statement

Given the current code and the hardening completed in this pass, the app is closer to launch-ready but still not fully production-ready. The two most important technical risks are **admin claim lifecycle** and **distributed rate limiting**. Addressing those, plus CI + staging validation, should raise readiness into the high-confidence launch range.
