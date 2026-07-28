# Guest House Manager

A complete guest house management system for small property owners — reservations, front desk,
housekeeping, maintenance, payments, invoicing, expenses and reporting — built as a modern,
responsive, installable (PWA-ready) web application.

> **Development stage: local only.** The whole system runs on one development computer.
> There is deliberately **no** Docker, cloud hosting, VPS, CI/CD, Nginx, Kubernetes or production
> deployment configuration in this repository. The architecture keeps clean seams for those, and they
> are specified in [docs/future-deployment-roadmap.md](docs/future-deployment-roadmap.md) — but they
> are not implemented.

---

## Contents

- [What it does](#what-it-does)
- [Technology](#technology)
- [Repository layout](#repository-layout)
- [Prerequisites](#prerequisites)
- [Quick start](#quick-start)
- [Local URLs](#local-urls)
- [Demo accounts](#demo-accounts)
- [Everyday commands](#everyday-commands)
- [Documentation](#documentation)
- [Build phases and status](#build-phases-and-status)
- [Scope boundaries](#scope-boundaries)

---

## What it does

Sixteen modules, in navigation order:

| # | Module | Purpose |
|---|---|---|
| 1 | Dashboard | Occupancy, arrivals, departures, revenue and alerts at a glance |
| 2 | Reservations | Create, edit, extend, cancel and track bookings from any source |
| 3 | Calendar | Day / week / month and room-timeline views with drag-and-drop |
| 4 | Rooms | Room types, rooms, amenities, status board, blocks |
| 5 | Guests | Guest profiles, documents, preferences, history, VIP and blacklist |
| 6 | Check-In | Guided reservation and walk-in check-in with deposit collection |
| 7 | In-House Guests | Live stays, charges, notes, room changes, extensions |
| 8 | Check-Out | Folio review, final payment or refund, invoice and receipt |
| 9 | Payments | Deposits, payments, split payments, refunds, voids, cashier summary |
| 10 | Housekeeping | Daily task list, assignment, cleaning, inspection |
| 11 | Maintenance | Issue reporting, assignment, room blocking, cost tracking |
| 12 | Expenses | Categorised expenses, receipts, approval workflow |
| 13 | Staff | Staff records, roles, permissions, account management |
| 14 | Reports | Operational, financial and guest reports with CSV / Excel / PDF export |
| 15 | Notifications | In-app and browser notifications for operational events |
| 16 | Settings | Property, rooms, reservations, pricing, payments, documents, security, localisation |

Mobile bottom navigation surfaces Dashboard · Reservations · Calendar · Guests · More.

English and Khmer at launch, with Korean, Vietnamese, Chinese and Thai prepared.

---

## Technology

| Layer | Stack |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, TypeScript (strict), Tailwind CSS, shadcn/ui, React Hook Form + Zod, TanStack Query, Zustand, Recharts, lucide-react, next-intl, date-fns |
| Backend | Spring Boot 3.4, Java 21, Maven (wrapper committed), Spring Web, Spring Security, Spring Data JPA, Bean Validation, MapStruct, JWT access + refresh tokens, OpenAPI / Swagger UI |
| Database | PostgreSQL 15+ with Flyway migrations |
| Files | Local disk at `guesthouse-api/uploads/` behind a `FileStorage` abstraction |
| Documents | Server-side PDF generation (OpenPDF), Excel via Apache POI, CSV via a built-in writer |
| PWA | Hand-written web manifest + service worker, IndexedDB outbox for offline queueing |

Full rationale and the architecture decision records live in [docs/architecture.md](docs/architecture.md).
Every binding technical convention (naming, types, enums, permission keys, error codes, API envelope)
is fixed in **[docs/conventions.md](docs/conventions.md)** — that document wins over all others.

---

## Repository layout

```
guest-house-management/
├── guesthouse-api/      Spring Boot 3 backend (Java 21, Maven wrapper committed)
│   └── uploads/         Local file storage (git-ignored)
├── guesthouse-web/      Next.js 15 frontend (TypeScript)
├── database/            Standalone SQL helpers: create, verify, reset
├── docs/                Product, architecture, database, API and operations documentation
└── README.md
```

---

## Prerequisites

| Software | Minimum | Check with |
|---|---|---|
| Java **JDK** 21 | 21 LTS | `java -version` |
| Maven | 3.9+ *(optional — the repo ships `mvnw`)* | `mvn -version` |
| Node.js | 20+ | `node --version` |
| npm | 10+ | `npm --version` |
| PostgreSQL | 15+ | `psql --version` |
| Git | any recent | `git --version` |

> A **JDK** is required, not a JRE. If `java -version` reports `1.8` or the word `JRE`, install
> Eclipse Temurin 21 and set `JAVA_HOME`. Step-by-step instructions for Windows, macOS and Linux are
> in [docs/local-setup.md](docs/local-setup.md).

---

## Quick start

**1. Create the databases** (PostgreSQL must be running):

```bash
psql -U postgres -f database/01-create-databases.sql
```

**2. Configure the backend** — copy the example and set your local PostgreSQL password:

```bash
cp guesthouse-api/.env.example guesthouse-api/.env
```

**3. Configure the frontend:**

```bash
cp guesthouse-web/.env.local.example guesthouse-web/.env.local
```

**4. Start the backend** (Flyway creates the schema and seeds demo data automatically):

```bash
cd guesthouse-api && ./mvnw spring-boot:run
```

On Windows PowerShell use `.\mvnw.cmd spring-boot:run`.

**5. Start the frontend** in a second terminal:

```bash
cd guesthouse-web && npm install && npm run dev
```

**6. Open** <http://localhost:3000> and sign in with a demo account.

Detailed, machine-by-machine instructions — including installing JDK 21 and PostgreSQL from scratch —
are in [docs/local-setup.md](docs/local-setup.md).

---

## Local URLs

| Service | URL |
|---|---|
| Frontend | <http://localhost:3000> |
| Backend API | <http://localhost:8080/api/v1> |
| Swagger UI | <http://localhost:8080/swagger-ui.html> |
| OpenAPI JSON | <http://localhost:8080/v3/api-docs> |
| Local dev tools (local profile only) | <http://localhost:3000/dev> |
| PostgreSQL | `localhost:5432` / `guesthouse_db` |

CORS is restricted to the single origin configured in `FRONTEND_URL`.

---

## Demo accounts

> ⚠️ **Local development credentials only.** These accounts exist solely in seeded local data. They
> are never created outside the `local` Spring profile and must never be reused anywhere real.

| Role | Email |
|---|---|
| Owner | `owner@guesthouse.local` |
| Manager | `manager@guesthouse.local` |
| Receptionist | `reception@guesthouse.local` |
| Accountant | `accountant@guesthouse.local` |
| Housekeeping | `housekeeping@guesthouse.local` |
| Maintenance | `maintenance@guesthouse.local` |
| Read-only | `readonly@guesthouse.local` |

The shared demo password is printed to the backend console on first start and documented in
[docs/local-setup.md](docs/local-setup.md).

---

## Everyday commands

| Task | Command |
|---|---|
| Run backend | `cd guesthouse-api && ./mvnw spring-boot:run` |
| Backend unit + integration tests | `cd guesthouse-api && ./mvnw verify` |
| Backend package | `cd guesthouse-api && ./mvnw clean package` |
| Run frontend | `cd guesthouse-web && npm run dev` |
| Frontend type check | `cd guesthouse-web && npm run typecheck` |
| Frontend lint | `cd guesthouse-web && npm run lint` |
| Frontend unit/component tests | `cd guesthouse-web && npm test` |
| End-to-end tests | `cd guesthouse-web && npm run e2e` |
| Reset local demo data | `psql -U postgres -d guesthouse_db -f database/99-reset-database.sql` |

---

## Documentation

| Document | What it covers |
|---|---|
| **[conventions.md](docs/conventions.md)** | **Binding technical contract — read first** |
| [source-brief.md](docs/source-brief.md) | The owner's original requirement lists, preserved verbatim |
| [product-requirements.md](docs/product-requirements.md) | Scope, assumptions, roles, feature list, pages, workflows, success criteria |
| [architecture.md](docs/architecture.md) | Local topology, layering, cross-cutting concerns, ADRs |
| [database-design.md](docs/database-design.md) | Full physical schema, constraints, indexes, migration plan |
| [er-diagram.md](docs/er-diagram.md) | Mermaid ER diagrams by subject area |
| [api-design.md](docs/api-design.md) | Complete REST endpoint catalogue, payloads, error codes |
| [permission-matrix.md](docs/permission-matrix.md) | Role × permission matrix and enforcement points |
| [business-rules.md](docs/business-rules.md) | Availability engine, pricing, folio maths, state machines, the 25 core rules |
| [workflows.md](docs/workflows.md) | Mermaid diagrams for every operational workflow |
| [local-setup.md](docs/local-setup.md) | End-to-end machine setup |
| [local-database-setup.md](docs/local-database-setup.md) | PostgreSQL install, roles, backup, reset |
| [backend-setup.md](docs/backend-setup.md) | Backend development guide |
| [frontend-setup.md](docs/frontend-setup.md) | Frontend development guide |
| [testing-guide.md](docs/testing-guide.md) | Test strategy and how to run every suite |
| [pwa-guide.md](docs/pwa-guide.md) | Manifest, service worker, offline model, local testing |
| [troubleshooting.md](docs/troubleshooting.md) | Symptom-oriented problem reference |
| [future-deployment-roadmap.md](docs/future-deployment-roadmap.md) | Everything deliberately deferred |

---

## Build phases and status

| Phase | Scope | Status |
|---|---|---|
| 1 | Planning and architecture | 🟢 |
| 2 | Local project setup | 🟢 |
| 3 | Authentication and authorization | 🟢 |
| 4 | Property and settings | 🟢 |
| 5 | Rooms and rates | 🟢 |
| 6 | Guests and reservations | 🟢 |
| 7 | Front desk | 🟢 |
| 8 | Payments and documents | 🟢 |
| 9 | Operations | 🟢 |
| 10 | Expenses and reports | 🟢 |
| 11 | PWA and mobile | 🟢 |
| 12 | Testing and local stabilization | 🟢 |

🟢 complete · 🟡 in progress · ⚪ not started

There is no deployment phase. See [docs/future-deployment-roadmap.md](docs/future-deployment-roadmap.md).

---

## Scope boundaries

**In scope now:** everything above, running entirely on `localhost` against a locally installed
PostgreSQL, with local file storage, console-logged password-reset links, in-app and browser
notifications, and locally generated PDF / Excel / CSV exports.

**Not in this repository:** Docker, Docker Compose, Kubernetes, Nginx, HTTPS/SSL, cloud databases,
cloud object storage, AWS/Azure/GCP/DigitalOcean, VPS provisioning, production domains, CI/CD
pipelines, production monitoring or backup services, deployment scripts, real email or SMS providers,
third-party push services, OTA channel integrations (Agoda, Booking.com, Airbnb), online payment
gateways, subscription billing and payroll.

Each of those is specified — with the seam in this codebase it will plug into — in
[docs/future-deployment-roadmap.md](docs/future-deployment-roadmap.md).
#   S o t S a m b a n G u e s t H o u s e M S  
 