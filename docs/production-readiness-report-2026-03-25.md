# Iraq Compass — Production Readiness Deep Report

Date: 2026-03-25 (UTC)

## Executive assessment

- **Estimated production launch readiness: 68%**
- **Estimated probability of a smooth initial launch (without major incident): 64%**

This estimate is based on repository-only evidence across security, backend integrity, infrastructure, testing, and operational readiness.

## What is now improved in this pass

1. **User provisioning moved to trusted backend path**
   - Added callable Cloud Function `ensureUserProfile` that provisions user documents from authenticated context.
   - Frontend `api.login` now calls the backend function instead of creating user docs directly in the client.

2. **Firestore user-write hardening**
   - User document **client-side create is disabled**.
   - User updates by owner now enforce immutable `role` and `businessId` fields.

3. **Deploy topology codified**
   - Added `firebase.json` to define hosting, functions source, and Firestore rules/index deployment.

4. **Composite index definitions codified**
   - Added `firestore.indexes.json` for known query patterns:
     - `businesses`: `category + name`
     - `business_postcards`: `governorate + updatedAt(desc)`

## Scorecard by domain

| Domain | Weight | Status | Score | Notes |
|---|---:|---:|---:|---|
| Security & authz | 25% | Improving | 70 | Admin claims model exists, but claims lifecycle automation still missing. |
| Backend reliability | 20% | Partial | 65 | Callable endpoints exist with auth + rate limit, but no durable/global rate limiting. |
| Data model & DB | 15% | Partial | 70 | Rules and indexes now versioned, but no migration/backfill controls. |
| Frontend quality | 10% | Partial | 60 | Good UX baseline; still includes fallback mock data and limited production error UX. |
| Testing & QA | 15% | Weak | 45 | Minimal automated tests, mostly rate-limit unit coverage in functions only. |
| DevOps/Release ops | 15% | Weak/Partial | 55 | Deploy config now present; CI/CD, env separation, and rollback/monitoring are still missing. |

## Critical gaps still blocking true production readiness

1. **No environment separation strategy in repo**
   - Missing explicit dev/staging/prod project alias strategy (e.g., `.firebaserc` aliases).

2. **No admin-claims assignment workflow**
   - Rules check `request.auth.token.admin`, but no in-repo claim issuance/revocation automation.

3. **Insufficient test depth**
   - No Firestore rules emulator test suite for auth matrix.
   - No end-to-end smoke suite for auth, posting, and AI flows.

4. **Operational readiness gap**
   - No deployment pipeline, preflight checks, release gates, or rollback runbook captured.

5. **Observability gap**
   - No structured app telemetry, alerting thresholds, SLO tracking, or incident dashboarding.

## Recommended launch gates (minimum)

Before launch, complete these minimum gates:

1. Add Firebase multi-environment aliasing and deployment guardrails.
2. Implement admin claim management endpoint/runbook.
3. Add emulator-backed security rules tests for users/posts/postcards.
4. Add one CI pipeline for lint + build + tests + deploy approval.
5. Instrument error/availability monitoring and alerting.

## Confidence and interpretation

- **68% readiness** means the product can likely be demoed and soft-launched to a controlled audience.
- It is **not yet high-confidence production grade** for broad public traffic without elevated operational risk.

