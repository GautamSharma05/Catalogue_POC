# Catalogue PoC

A small product-catalogue proof of concept: customers browse/search products,
view details, and submit an enquiry that emails the sales team.

## Stack choice (per constraint 1)

- **Client:** React, TypeScript, Vite; TanStack Query for server data, Zustand
  for client-only UI state, React Router for URL state; **Tailwind CSS v4 +
  shadcn/ui** for the component/styling layer (Radix UI primitives under
  the hood - Dialog, DropdownMenu, Label, Separator - plus hand-rolled
  Button/Input/Textarea/Card/Badge/Skeleton/Sonner-toast, all copied into
  `src/components/ui/` per shadcn's "you own this code" model rather than
  pulled in as an opaque npm component library).
- **Backend:** NestJS, TypeScript (Express platform under the hood).

**Why a web client:** it lets a reviewer run the whole stack with `docker
compose up` and a browser — no iOS/Android simulator setup — satisfying the
"runnable in under 10 minutes" constraint with the least friction. One
language (TypeScript) across client and backend maximizes velocity.

### Why NestJS, not plain Node/TypeScript (or bare Express)

This PoC started as plain Express and was deliberately rewritten onto NestJS
(via `@nestjs/cli` scaffolding) partway through. Plain Node+TS is a
perfectly fine choice for a lot of services, and wasn't wrong for the
first pass - here's what actually changed the calculus:

- **Dependency injection that makes the port/adapter pattern real, not just
  conventions.** This app's whole swappability story -
  `ProductCatalogPort`/`EmailPort` as abstract classes, `FakeStoreCatalogAdapter`/
  `ConsoleEmailAdapter` as swappable implementations - depends on something
  resolving the right concrete class at runtime. In plain Node/Express,
  that's hand-threading the chosen adapter through every constructor that
  needs it. NestJS's DI container does that resolution automatically from
  `@Inject(ProductCatalogPort)` + a `provide:` binding in one module
  (`CoreModule`) - the pattern is enforced by the framework, not just
  documented in a design doc hoping everyone follows it.
- **Tests that override providers instead of monkey-patching modules.**
  Every controller/service spec in this project uses
  `Test.createTestingModule(...).overrideProvider(...)` to swap in
  `FixtureCatalogAdapter` for the real one. That's a first-class, supported
  pattern in `@nestjs/testing`. The plain-Node equivalent is usually manual
  dependency passing or `vi.mock`-ing a whole module, which works but is
  more fragile as the dependency graph grows.
- **Cross-cutting concerns as a declared concept, not ad-hoc middleware.**
  `DomainExceptionFilter` maps `ValidationError`/`NotFoundError`/
  `CatalogSourceError` to HTTP status codes in one place, applied
  declaratively. In plain Express you'd write middleware for this too, but
  nothing stops two different routes from handling the same error type two
  different ways over time - Nest's filters, pipes, guards, and
  interceptors give every cross-cutting concern one obvious place to live.
- **A real growth path that's configuration, not a bespoke build.** The
  gaps this PoC still has on purpose - API docs, rate limiting, structured
  config validation, auth - are `@nestjs/swagger`, `@nestjs/throttler`,
  `@nestjs/config`, and `@nestjs/passport` away. In plain Node/Express, each
  of those is its own integration decision and its own set of opinions to
  make from scratch.
- **It's what more than one engineer touching this code actually needs.**
  A one-dev PoC can hold its shape through willpower and a design doc.
  NestJS's module/controller/service/provider structure is the same shape
  everywhere, so a second or third engineer can predict where something
  lives without having read every file first - the thing that matters once
  this stops being a solo PoC.

**The honest tradeoff:** NestJS is more framework than a PoC this size
strictly needs. Decorators, modules, and DI tokens are real boilerplate
cost for something that could've stayed three Express route files forever.
That cost is worth paying here because this is explicitly meant to
demonstrate production-shaped patterns (swappable adapters, testable
seams) - for a genuinely disposable one-file script, plain Node/TypeScript
would still be the right call, not NestJS by default.

### Why three different state tools on the frontend

Three kinds of state, three right tools — not three competing state managers:

| State | Tool | Why |
|---|---|---|
| Product/category/search/enquiry data from the API | **TanStack Query** | Server state: needs caching, loading/error states, retries, and staleness — exactly what `useQuery`/`useMutation` are for. Replaces a hand-rolled `useAsync` hook. |
| Current route, search term, category slug, product id | **React Router URL state** | Bookmarkable/shareable by nature; the URL is the source of truth, not a store. |
| "Recently viewed" product ids, "recent searches" terms | **Zustand** (+ `persist` to localStorage) | Client-only UI state with no server representation and no sane URL shape, but needs to survive navigation *and* a page reload. |

### Advanced search (`components/SearchBar.tsx`)

The header search went from "type and press Enter" to a full combobox:

- **Debounced live suggestions** (250ms, 2+ characters) - up to 5 matching
  products with thumbnail/title/price, fetched through the same
  `useSearchProductsQuery` hook and cache as the full `/search` results
  page, so a suggestion already fetched here is instant if the visitor
  lands on the results page for the same term.
- **Recent searches** when the field is focused empty - a small Zustand
  store (`stores/recent-searches.store.ts`), same shape as
  recently-viewed, capped at 5, persisted to localStorage, with a
  per-entry remove button. Only an explicit search *submission* (Enter,
  or "View all results") records a term - clicking a suggested product
  directly does not, since finding it on the first try isn't a search
  worth remembering.
- **Full keyboard navigation** - ArrowUp/ArrowDown cycles suggestions (or
  recent searches) plus a trailing "View all results" row, Enter selects
  the highlighted one or falls through to a normal full-text search,
  Escape closes. Built as a standard ARIA 1.2 combobox (`role="combobox"`,
  `aria-expanded`, `aria-activedescendant`, `role="listbox"`/`"option"`)
  rather than a non-semantic click-only dropdown.
- **Clear button** and click-outside-to-close, same as any standard search UI.

### UI layer: Tailwind + shadcn/ui (full migration from hand-rolled CSS)

The app originally shipped with a single `theme.css` file (50+ custom CSS
variables, hand-written `.card`/`.panel`/`.pill`/etc. classes). That file is
gone - every page and component was rewritten onto Tailwind utility classes
plus shadcn/ui primitives, installed manually per
[ui.shadcn.com/docs/installation/manual](https://ui.shadcn.com/docs/installation/manual)
(the CLI needs registry access this environment's npm config doesn't have,
so the `components.json` + each `src/components/ui/*.tsx` file were written
by hand, following the same source shadcn's own CLI would generate).

What changed because of this:
- **The enquiry form is now a real modal** (`Dialog` from Radix, triggered
  from the product page's "Enquire" button) instead of an inline
  show/hide toggle - focus trap, Escape-to-close, and click-outside all
  come from Radix for free.
- **Toast notifications** (`sonner`) on successful enquiry submission, in
  addition to the existing inline "Thank you" state - a small but genuine
  new capability, not just a re-skin.
- **Every `<button>`/`<input>`/`<textarea>`** across the app now goes
  through the shared `Button`/`Input`/`Textarea` primitives, so focus
  rings, disabled states, and sizing are consistent by construction
  instead of by convention.
- **The brand palette carried over exactly** (`#4f39f6` primary,
  `#ff7a45` accent, `#f5a524` star-rating gold) via Tailwind v4's
  `@theme inline` + CSS variable mapping in `src/styles/globals.css` - this
  is a structural rewrite, not a re-brand.
- A `.dark` variant block exists in `globals.css` (CSS variables defined,
  not yet wired to a toggle) since Tailwind/shadcn's theming model makes
  dark mode close to free once someone wants it - documented as a gap, not
  shipped as a feature nobody asked for.

## Architecture

```
apps/
  api/   NestJS + TypeScript backend
    src/domain/ports/        abstract classes the domain depends on (not implementations) - abstract
                              classes, not interfaces, so NestJS DI can use them as injection tokens
    src/domain/use-cases/     business logic (featured/category/search/detail, enquiry)
    src/adapters/             concrete implementations of the ports (Fake Store, console email)
    src/core/                 CoreModule (shared adapter providers) + DomainExceptionFilter
    src/modules/catalogue/    CatalogueController/Service (browse/search/detail routes)
    src/modules/enquiry/      EnquiryController/Service (POST /api/enquiries)
    src/health/               GET /health
  web/   React + TypeScript frontend
    src/pages/                one page per route
    src/components/           presentational / reusable UI (built on components/ui/)
    src/components/ui/        shadcn/ui primitives (Button, Input, Dialog, DropdownMenu, ...)
    src/queries/               TanStack Query hooks (catalogue reads, enquiry mutation)
    src/stores/                Zustand stores (recently-viewed)
    src/styles/globals.css     Tailwind v4 + the brand color-variable theme
    src/lib/api-client.ts      the ONLY module that talks to the backend
e2e/     Playwright end-to-end tests against the real dev stack
```

All product data flows: **browser -> our API -> FakeStoreCatalogAdapter ->
fakestoreapi.com**. The client never calls the Fake Store API directly
(constraint 2). Swapping the product data source, the email provider, or the
visual theme later means writing a new adapter / CSS, not rewriting the
domain or routes — see `DECISIONS.md` for how this is structured to grow.

## Running locally (reviewer path, <10 minutes)

**Prerequisite:** Docker Desktop (or compatible) running locally.

```bash
cp .env.example .env
docker compose up --build
```

- Backend: http://localhost:3000 (health check: `GET /health`, API docs: `GET /api/docs`)
- Frontend: http://localhost:4173

No account, API key, or paid service is required. The "sales inbox" is a
console/log adapter — every submitted enquiry is also appended as JSON to a
file inside the `api` container's `tmp/` volume so you can inspect it:

```bash
docker compose exec api cat tmp/sent-emails.log
```

## Running locally without Docker (for development)

```bash
npm install
npm run dev     # starts both apps/api (port 3000) and apps/web (port 5173)
```

## Running tests

```bash
npm test                              # unit/integration tests, both apps
npm run test --workspace=apps/api
npm run test --workspace=apps/web
```

### End-to-end tests (Playwright)

```bash
npx playwright install chromium       # one-time browser download
npm run test:e2e
```

Runs against the real dev stack (`npm run dev` servers, started automatically
by Playwright) rather than Docker Compose, hitting the live Fake Store API
through our backend. See [`e2e/README.md`](./e2e/README.md) for what's
covered.

## Project docs

- [`DECISIONS.md`](./DECISIONS.md) — assumptions, dropped/simplified scope, growth path, next steps
- [`AI_USAGE.md`](./AI_USAGE.md) — AI tools/models used and how they were directed
