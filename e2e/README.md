# E2E tests (Playwright)

Runs against the real dev stack (NestJS API + Vite dev server), not Docker
Compose, for faster local iteration. Playwright starts both servers itself
(`webServer` config) and tears them down after the run.

## One-time setup

```bash
npm install
npx playwright install chromium
```

## Running

```bash
npm run test:e2e
```

## What's covered

- `tests/home.spec.ts` — featured products grid (5 items), navigation to detail
- `tests/search.spec.ts` — search with matches, search with zero matches
- `tests/product-detail.spec.ts` — 404 on unknown id, happy path on a known id
- `tests/enquiry.spec.ts` — full submit flow (thank-you), native email validation blocks a bad submission
- `tests/recently-viewed.spec.ts` — Zustand-backed "recently viewed" list survives client navigation and a full page reload (localStorage)

## Notes

- Tests hit the real Fake Store API (fakestoreapi.com) through our backend —
  consistent with the rest of this PoC's "no mocked third-party" approach,
  but it does mean these tests need network access and will be slower/less
  deterministic than the unit/integration suites. If fakestoreapi.com is
  down, these will fail; the unit suites (`npm test`) do not depend on it
  (they use `FixtureCatalogAdapter`/mocked `api-client`).
- `workers: 1` and `fullyParallel: false` are deliberate: each test already
  gets its own isolated browser context (so `localStorage` doesn't leak
  between tests), but a single dev-mode Nest process is fine for this
  PoC's purposes and keeps output easy to read run-to-run - not a
  correctness requirement, just a simplicity choice.
