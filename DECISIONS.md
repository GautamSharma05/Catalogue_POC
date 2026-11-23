# Decisions and Assumptions

## Technology choice

I chose a **React web client with TypeScript** and a **Node.js backend with TypeScript**, structured with **NestJS** using **Hexagonal Architecture (Ports & Adapters)**.

This combination provided a rapid path to an interactive browser-based proof of concept while strictly decoupling the client and server into clean, independent applications within an NPM monorepo. The backend exposes catalogue and enquiry capabilities through a RESTful API and OpenAPI/Swagger documentation, ensuring future clients (such as native mobile applications or external services) can consume the same contracts.

Following an initial Express prototype spike to quickly validate data contracts against the Fake Store API, I deliberately evolved the backend onto NestJS. NestJS's native dependency injection container, modular architecture, and declarative filter pipelines make domain boundaries, cross-cutting concerns, and swappable adapter bindings first-class architectural constructs rather than loose conventions.

---

## Assumptions made where the acceptance criteria were unclear

1. **Meaning of “top rated”.** The brief states that "the entrepreneur has chosen five products to be top rated," implying editorial curation. However, the Fake Store API does not provide a curation flag or featured field. For this PoC, I interpreted “top rated” as sorting products by `rating.rate` in descending order, using product `id` as a deterministic tie-breaker:
   - The Home page displays the top five products across the entire catalogue.
   - The Category page displays the top three products in that category, followed by the remaining category items. The threshold of three is a pragmatic UI assumption to create visual hierarchy.
   - This selection policy is strictly isolated inside `CatalogueUseCases` within the domain layer. When true editorial curation or CMS flags are introduced, only the domain use case changes—no Fake Store logic or sorting heuristics ever leak into the client.

2. **Sales inbox.** With no authentication or customer account management required by the brief, I treated the sales inbox as a single centralized recipient configured via the environment variable `SALES_INBOX_EMAIL`, rather than per-user inboxes.

3. **Email delivery under the no-paid-account constraint.** The brief requires customer enquiries to notify a sales inbox, while simultaneously requiring that the reviewer must not need a paid third-party service or account credentials. To satisfy both constraints:
   - I defined an `EmailPort` abstract boundary in the domain layer.
   - Implemented a `ConsoleEmailAdapter` that writes structured logs to stdout and atomically appends JSON lines to a mounted volume file (`tmp/sent-emails.log`).
   - The enquiry flow executes full validation, invokes the email abstraction, and returns an HTTP 201 response. Reviewers can verify delivery with `docker compose exec api cat tmp/sent-emails.log` without requiring API keys for SendGrid or AWS SES.

4. **Category page layout.** I interpreted “top rated products for that category AND additional products” as two distinct, structured sections on a single category page: a featured top-rated section and a secondary section containing all remaining items in that category.

5. **Search matching.** “Text matching” was implemented as a case-insensitive substring match across both product `title` and `description`. To keep scope focused on core requirements, I did not introduce fuzzy phonetic matching, typo tolerance, or full Elasticsearch relevance ranking.

---

## Requirements dropped or simplified, and why

- **Authentication and customer accounts:** Not required by the acceptance criteria. Introducing sessions, JWTs, and user entities would have inflated scope without validating the catalogue's critical browsing and enquiry workflows.
- **Pagination:** The Fake Store catalogue is static and small (20 products). Returning complete category sets is computationally trivial and keeps client navigation snappy. Pagination can be introduced when real database-backed volume requires it.
- **Real third-party email delivery:** Replaced with an inspectable local `ConsoleEmailAdapter` to respect the zero-setup/no-paid-account constraint for reviewers while maintaining the production-ready hexagonal boundary.
- **Real AWS deployment and Infrastructure as Code:** The brief specifies AWS compatibility rather than an active cloud deployment. Both services are fully containerized with production Dockerfiles and contain no cloud-vendor lock-in. To stay disciplined within the PoC time-box, I prioritized code architecture, testing, and Docker Compose orchestration over authoring Terraform/CDK or provisioning AWS infrastructure.
- **Product catalog management / CRUD:** The brief explicitly states product metadata is not yet critical; therefore, the system consumes product data via backend adapters rather than introducing an administrative write CMS.
- **Initial styling approach replaced:** The first UI pass utilized custom CSS (`theme.css`). I later performed an atomic migration to Tailwind CSS v4 and shadcn/ui primitives (Radix UI underneath) to eliminate styling technical debt, establish accessible focus traps and dialog modals, and centralize design tokens.

---

## Architecture and how it supports change

### 1. Product data source (Hexagonal Ports & Adapters)
`ProductCatalogPort` defines an abstract contract for retrieving catalogue data. `FakeStoreCatalogAdapter` implements this port, handling external HTTP calls and normalizing third-party responses into domain entities.

This ensures external API schema changes are absorbed strictly at the adapter boundary. Transitioning to a proprietary PostgreSQL database or enterprise ERP involves writing a new adapter; application use cases, domain logic, and HTTP endpoints remain untouched.

### 2. Email provider abstraction
`EmailPort` isolates enquiry processing from external notification infrastructure. `ConsoleEmailAdapter` satisfies the local development and reviewer experience. Transitioning to production simply requires implementing an SES or SendGrid adapter and binding it in NestJS's `CoreModule`.

### 3. Frontend state management & separation of concerns
Rather than dumping all application state into a single monolithic store, the client architecture establishes three distinct, specialized state tiers:
- **Server State (TanStack Query v5):** Manages all remote API queries and mutations. Delivers automatic caching, background re-fetching, request deduplication, and declarative loading/error states for catalogue and enquiry operations.
- **URL / Route State (React Router v6):** Serves as the source of truth for all shareable UI parameters (search queries, active categories, product IDs). Ensures deep linking, browser back/forward buttons, and bookmarking work naturally.
- **Client UI State (Zustand + `localStorage`):** Manages browser-local interactions that have no server representation (recently viewed products, recent search terms). Persisted via Zustand middleware across navigation and page refreshes.

### 4. Presentation and visual identity
Presentational components are strictly separated from API communication and business rules. Brand color variables (`#4f39f6` primary, `#ff7a45` accent) and radius tokens are centralized in `src/styles/globals.css` via Tailwind v4 `@theme inline`. Rebranding or adjusting themes requires editing one CSS file without traversing component JSX trees.

### 5. API boundary & security hardening
Catalogue and enquiry routes live in cohesive NestJS feature modules. Controllers manage input parsing, OpenAPI decorators, and route mapping:
- **Security:** `helmet` sets HTTP security headers on all responses.
- **Rate Limiting:** `@nestjs/throttler` guards write endpoints (`POST /api/enquiries`) with a 5 req/min rate limit to protect the sales inbox from abuse.
- **Error Handling:** `DomainExceptionFilter` translates domain errors (`ValidationError`, `NotFoundError`, `CatalogSourceError`) into structured, semantic HTTP status codes globally.

### 6. Testing strategy & confidence boundaries
- **Domain Use-Case Tests:** Verify core business rules (e.g. top-rated sorting, enquiry validation) in isolation without external dependencies.
- **Adapter Tests:** Verify external API mapping, error handling, and atomic file-log appending.
- **Controller Integration Tests:** Verify NestJS dependency injection, exception filters, and HTTP status codes.
- **Playwright End-to-End Tests:** Exercise complete user journeys (search combobox, category filtering, enquiry dialog modal, and localStorage persistence) against live dev servers.

---

## Trade-offs considered

| Decision | Why it was chosen for this PoC | Trade-off / Limitation |
|---|---|---|
| **Fake Store API behind backend adapter** | Immediate access to realistic product data while preventing direct client coupling. | External API availability and latency remain beyond local control. |
| **React Web Client** | Fastest path to an interactive, responsive experience runnable in any standard browser. | Does not provide native mobile device features. |
| **NestJS with Dependency Injection** | First-class IoC container enforces Hexagonal Architecture; easy fixture swapping in tests. | Higher boilerplate and decorator overhead compared to minimal Express scripts. |
| **Local Email Log Adapter** | Demonstrates the full enquiry flow with zero paid accounts or external setup for reviewers. | Output is written to local file logs (`tmp/sent-emails.log`) rather than delivering actual emails. |
| **Three-Tier Frontend State** | Keeps server data caching, URL bookmarkability, and client persistence cleanly decoupled. | Developers must understand state boundaries rather than dumping all state in one store. |
| **Tailwind v4 + shadcn/ui** | Production-grade accessibility (Radix UI), consistent design tokens, and rapid UI development. | Adds utility class conventions and external dependency surface area. |
| **No Database Persistence** | Keeps reviewer setup immediate (<10 mins) with zero migrations or container database overhead. | Enquiries and catalogue items are not durable across application resets. |
| **In-Memory Rate Limiting** | Protects write endpoints (`POST /api/enquiries`) without requiring an external Redis cache. | Rate-limit counters reset on container restart and do not coordinate across multiple replicas. |
| **Containerized without live AWS deployment** | Avoids spending time-box on cloud infrastructure, networking, and DNS provisioning. | Production AWS scaling, secrets management, and VPC networking remain unverified in staging. |

---

## AWS compatibility

The application is structured to be cloud-agnostic and container-ready:
- Packaged with multi-stage production Dockerfiles.
- Configured entirely through runtime environment variables (`ConfigService`).
- Contains no proprietary cloud SDKs or local disk dependencies that preclude running in containerized environments.

This makes the repository directly deployable to AWS using **AWS ECS (Fargate)** or **AWS EKS** fronted by an Application Load Balancer (ALB). 

*Note:* I did not deploy the application to live AWS infrastructure or author Terraform/CDK scripts within this time-box. Thus, the solution is accurately characterized as **containerized and architected for AWS deployment**, rather than a verified live cloud deployment.

---

## What I would do next with another day

If granted additional time to evolve this from a proof of concept to a production-grade application, I would prioritize:

1. **Durable Persistence Layer:** Introduce PostgreSQL with Prisma or TypeORM, defining normalized schemas for products, categories, and customer enquiries.
2. **Production Email Integration:** Author an Amazon SES or SendGrid adapter for `EmailPort`, backed by an asynchronous message queue (e.g. AWS SQS or BullMQ) for retry resilience.
3. **Distributed Rate Limiting & Caching:** Back `@nestjs/throttler` and TanStack Query with Redis to coordinate rate limits and cache responses across distributed container replicas.
4. **Editorial Product Curation:** Introduce an admin portal or CMS hook to allow manual curation of featured products instead of relying solely on computed rating algorithms.
5. **Pagination & Fuzzy Search:** Implement cursor-based pagination for large product catalogues and integrate full-text/fuzzy search (e.g. PostgreSQL `tsvector` or Elasticsearch).
6. **Infrastructure as Code (IaC):** Write modular Terraform or AWS CDK to provision VPCs, ECS Fargate clusters, RDS PostgreSQL, ALB, and automated CI/CD deployment pipelines.

---

## Time spent

The total time spent was approximately **4 hours 20 minutes**. While exceeding the initial 2–3 hour baseline, the additional time was a deliberate investment in enterprise architecture (NestJS Hexagonal refactor), accessibility/UI design system migration (Tailwind v4 + shadcn/ui), and comprehensive Playwright E2E testing.

| Phase | Time | Key activities |
|---|---:|---|
| **Planning & Specification** | ~40 min | Requirement extraction, domain modeling, stack selection, and workstream planning |
| **Core Implementation & Refactoring** | ~2 hr 30 min | NestJS API, Hexagonal ports/adapters, React client, and shadcn/ui migration |
| **Automated Testing** | ~35 min | Unit tests, adapter integration tests, and Playwright E2E test suites |
| **Review, Visual QA & Documentation** | ~35 min | Viewport visual QA, responsive layout fixes, Docker verification, and architecture documentation |
| **Total** | **~4 hr 20 min** | |
