# Product Catalogue Monorepo

A modular, full-stack product catalogue and enquiry platform built with **TypeScript**, featuring a **NestJS** backend implementing **Hexagonal Architecture (Ports & Adapters)** and a **React** frontend powered by **Vite**, **TanStack Query**, and **Tailwind CSS**.

---

## Tech Stack

### Backend (`apps/api`)
- **Runtime & Framework:** Node.js (>= 20), [NestJS 12](https://nestjs.com/) (Express platform)
- **Architecture:** Hexagonal / Ports & Adapters pattern with native Dependency Injection
- **Security & Reliability:** Helmet (HTTP security headers), Throttler (rate limiting), CORS
- **Validation & Schemas:** Zod
- **API Documentation:** OpenAPI / Swagger (`@nestjs/swagger`)
- **Testing:** Vitest, Supertest

### Frontend (`apps/web`)
- **Framework & Bundler:** React 18, [Vite](https://vitejs.dev/), TypeScript
- **Styling & UI:** Tailwind CSS v4, [shadcn/ui](https://ui.shadcn.com/) (Radix UI primitives), Lucide React icons, Sonner (toasts)
- **State Management:**
  - **Server State:** [TanStack Query v5](https://tanstack.com/query/latest) (caching, deduplication, retry)
  - **URL / Routing State:** React Router v6
  - **Client UI State:** [Zustand](https://github.com/pmndrs/zustand) (persisted to `localStorage`)
- **Testing:** Vitest, React Testing Library, JSDOM

### Tooling & Infrastructure
- **Monorepo:** NPM Workspaces
- **End-to-End Testing:** [Playwright](https://playwright.dev/)
- **Containerization:** Docker, Docker Compose

---

## Architecture & System Design

### Hexagonal Architecture (Ports & Adapters)
The backend enforces separation of concerns by isolating business logic from external drivers and driven dependencies:

- **Domain Ports (`src/domain/ports/`):** Abstract classes defining interfaces for catalogue data retrieval (`ProductCatalogPort`) and enquiry dispatch (`EmailPort`). Abstract classes are used rather than TypeScript interfaces to allow NestJS's DI container to use them directly as injection tokens.
- **Adapters (`src/adapters/`):** Concrete implementations of domain ports.
  - `FakeStoreCatalogAdapter`: Fetches and normalizes data from the external Fake Store API.
  - `ConsoleEmailAdapter`: Appends sent enquiry emails as structured JSON to a local log file (`tmp/sent-emails.log`).
- **Use Cases (`src/domain/use-cases/`):** Framework-agnostic business logic (catalogue filtering, search logic, enquiry processing).
- **Core & Error Handling (`src/core/`):** Central `DomainExceptionFilter` maps core domain errors (`ValidationError`, `NotFoundError`, `CatalogSourceError`) to declarative HTTP response codes.

### Data Flow
```text
[ Browser / Client ]
        │  (HTTP / REST)
        ▼
[ NestJS Controllers ]  <──  DomainExceptionFilter / Rate Limiting (Throttler)
        │
        ▼
[ Domain Use Cases ]
        │
        ▼
[ Domain Ports (Abstract) ]
   ├── ProductCatalogPort  ──► [ FakeStoreCatalogAdapter ]  ──► [ fakestoreapi.com ]
   └── EmailPort           ──► [ ConsoleEmailAdapter ]     ──► [ tmp/sent-emails.log ]
```

> **Note:** The frontend never communicates directly with external third-party APIs. All requests route through the backend gateway.

### Frontend State Strategy
State is decoupled across three specialized layers:

| State Type | Library | Purpose |
|---|---|---|
| **Server State** | TanStack Query v5 | Data synchronization, background re-fetching, caching, and loading/error states for products, categories, and enquiry submissions. |
| **URL State** | React Router v6 | Source of truth for shareable, bookmarkable UI parameters (active search terms, category filters, product IDs). |
| **Client UI State** | Zustand (`persist`) | Ephemeral client-only data that must survive page reloads (e.g. recent searches, recently viewed products). |

---

## Repository Structure

```text
.
├── apps/
│   ├── api/                          # NestJS backend application
│   │   ├── src/
│   │   │   ├── adapters/             # Port implementations (FakeStore, ConsoleEmail)
│   │   │   ├── config/               # App configuration & environment validation
│   │   │   ├── core/                 # Shared providers & DomainExceptionFilter
│   │   │   ├── domain/               # Domain ports and use-cases
│   │   │   ├── health/               # Health check endpoint (/health)
│   │   │   ├── modules/              # Feature modules (Catalogue, Enquiry)
│   │   │   └── main.ts               # Bootstrap, Swagger, CORS, Helmet
│   │   └── Dockerfile
│   └── web/                          # React client application
│       ├── src/
│       │   ├── components/           # UI components and shadcn/ui primitives
│       │   ├── hooks/                # Custom React hooks
│       │   ├── lib/                  # Shared utilities and Axios/Fetch API client
│       │   ├── pages/                # Route view components
│       │   ├── queries/              # TanStack Query custom hooks
│       │   ├── stores/               # Zustand persisted stores
│       │   └── styles/               # Global styles and Tailwind configuration
│       └── Dockerfile
├── e2e/                              # Playwright end-to-end test suite
├── docker-compose.yml                # Multi-service container specification
└── package.json                      # Monorepo root scripts and workspaces
```

---

## Environment Variables

Copy the example environment file at the root before starting:

```bash
cp .env.example .env
```

| Variable | Target | Default | Description |
|---|---|---|---|
| `PORT` | API | `3000` | Port on which the NestJS backend listens. |
| `SALES_INBOX_EMAIL` | API | `sales@example.com` | Destination email for submitted enquiries. |
| `CORS_ORIGIN` | API | `http://localhost:5173` | Allowed CORS origins (`http://localhost:4173` for Docker). |
| `EMAIL_LOG_PATH` | API | `./tmp/sent-emails.log` | File path for enquiry email logs. |
| `VITE_API_BASE_URL` | Web | `http://localhost:3000` | Base URL used by the frontend to contact the API. |

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (>= 20.0.0)
- [npm](https://www.npmjs.com/) (>= 10.0.0)
- [Docker](https://www.docker.com/) & Docker Compose (optional, for containerized run)

---

### Running with Docker Compose (Recommended)

To build and run all services in containers:

```bash
cp .env.example .env
docker compose up --build
```

- **Frontend Client:** [http://localhost:4173](http://localhost:4173)
- **Backend API:** [http://localhost:3000](http://localhost:3000)
- **Swagger Documentation:** [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- **Health Check:** [http://localhost:3000/health](http://localhost:3000/health)

#### Inspecting Mock Email Deliveries
When an enquiry is submitted, the backend writes a JSON log line to the container's volume:

```bash
docker compose exec api cat tmp/sent-emails.log
```

---

### Running Locally for Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start both applications in development mode:**
   ```bash
   npm run dev
   ```
   This runs the API on port `3000` with hot-reload and the Vite dev server on port `5173`.

---

## API Reference

Interactive OpenAPI documentation is hosted at `GET /api/docs`.

| Method | Endpoint | Description | Query / Body Params |
|---|---|---|---|
| `GET` | `/health` | Service health status. | None |
| `GET` | `/api/products/featured` | Top 5 highest-rated products across all categories. | None |
| `GET` | `/api/categories` | List of all distinct category names. | None |
| `GET` | `/api/categories/:slug/products` | Category view partitioned into top-rated and remaining items. | `:slug` (string) |
| `GET` | `/api/products` | Full-text search over product title and description. | `?search=<term>` |
| `GET` | `/api/products/:id` | Detailed information for a single product. | `:id` (integer) |
| `POST` | `/api/enquiries` | Submit product enquiry (throttled to 5 req/min). | `{ productId, name, email, message }` |

---

## Testing

### Unit & Integration Tests (Vitest)

Execute tests across all workspaces:
```bash
npm test
```

Execute tests for a specific workspace:
```bash
# Backend unit & integration tests
npm run test --workspace=apps/api

# Frontend component & store tests
npm run test --workspace=apps/web
```

### End-to-End Tests (Playwright)

End-to-end tests verify end-to-end flows against local dev servers:

```bash
# One-time install of browser binaries
npx playwright install chromium

# Run all Playwright test specs
npm run test:e2e
```

Refer to [`e2e/README.md`](./e2e/README.md) for full coverage details and test configuration.

---

## Available NPM Scripts

Root-level scripts manage the monorepo workspaces:

| Script | Command | Description |
|---|---|---|
| `npm run dev` | `npm run start:dev --workspace=apps/api & npm run dev --workspace=apps/web` | Starts both backend and frontend dev servers. |
| `npm run build` | `npm run build --workspace=apps/api && npm run build --workspace=apps/web` | Compiles API and builds static frontend assets. |
| `npm run lint` | `npm run lint --workspace=apps/api && npm run lint --workspace=apps/web` | Runs TypeScript compiler checks without emitting code. |
| `npm test` | `npm run test --workspace=apps/api && npm run test --workspace=apps/web` | Runs all Vitest test suites. |
| `npm run test:e2e` | `playwright test --config e2e/playwright.config.ts` | Runs Playwright end-to-end tests. |

---

## Additional Documentation

- [`DECISIONS.md`](./DECISIONS.md) — Architectural decisions, trade-offs, and scalability considerations.
- [`e2e/README.md`](./e2e/README.md) — E2E test setup and test suite scenarios.
- [`AI_USAGE.md`](./AI_USAGE.md) — Record of AI tooling and models utilized during development.
