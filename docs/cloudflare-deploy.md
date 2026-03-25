# Cloudflare Pages deployment fix (npm ci)

## Root cause fixed in this repo

`npm ci` in Cloudflare Pages requires `package.json` and `package-lock.json` to be in exact sync.
This repository had drift between those files (different package name/version and dependency graph), which causes install to fail during the dependency phase.

This repo is now aligned to the existing lockfile to make `npm ci` deterministic.

---

## A) Dependency sync (safe procedure)

Run these locally whenever dependencies change:

```bash
rm -rf node_modules package-lock.json
npm install
npm ci
```

Then commit:

```bash
git add package.json package-lock.json .nvmrc docs/cloudflare-deploy.md
git commit -m "fix(ci): align npm lockfile and cloudflare pages build config"
```

---

## B) Cloudflare Pages build configuration

Use these exact settings in **Pages → Settings → Builds & deployments**:

- **Root directory:** `/`
- **Install command:** `npm ci`
- **Build command:** `npm run build`
- **Build output directory:** `dist`

If your frontend is in a subfolder (example `app/`), use:

- **Root directory:** `app`
- **Install command:** `npm ci`
- **Build command:** `npm run build`
- **Build output directory:** `dist`

---

## C) Node version pin

Use Node 20 for Pages compatibility:

- `.nvmrc` set to `20`
- `package.json` engines: `"node": ">=20 <23", "npm": ">=10"`

In Cloudflare Pages environment variables set:

- `NODE_VERSION=20`

---

## D) Firebase compatibility for Pages/Workers

For frontend bundles on Pages, use modular Firebase web SDK imports only:

```ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
```

Do **not** include `firebase-admin` in frontend `package.json`; keep admin SDK only in server/functions packages.

---

## Fallback (only if npm ci still blocked)

Temporary fallback install command:

```bash
npm install
```

Tradeoff:

- `npm ci` = reproducible, lockfile-strict, best for production.
- `npm install` = more tolerant, but can drift versions between deployments.

Use `npm install` only as short-term mitigation, then restore `npm ci` after lockfile is fixed and committed.
