# Canonical Conventions — Guest House Management System

> **This document is the single source of truth.** Every other document, migration, entity,
> DTO, TypeScript type, translation key and test in this repository must conform to the names,
> enum values, permission keys, error codes and routes defined here.
> If another document disagrees with this one, **this one wins** and the other must be corrected.

Last reviewed: 2026-07-27 · Status: **Phase 1 — Planning & Architecture**

---

## 1. Product identity

| Item | Value |
|---|---|
| Product name | Guest House Manager |
| Repository root | `guest-house-management/` (mapped to `D:\Project\SotSambanGuestHouse`) |
| Backend module | `guesthouse-api` |
| Frontend module | `guesthouse-web` |
| Java base package | `com.guesthouse` |
| Database name (dev) | `guesthouse_db` |
| Database name (test) | `guesthouse_test_db` |
| API base path | `/api/v1` |
| Frontend origin (dev) | `http://localhost:3000` |
| Backend origin (dev) | `http://localhost:8080` |
| Default active profile | `local` |

---

## 2. Technology decisions (pinned)

### Backend

| Concern | Decision |
|---|---|
| Language | Java 21 (LTS), language level 21 |
| Framework | Spring Boot 3.4.x |
| Build | Maven + **Maven Wrapper** (`mvnw` / `mvnw.cmd`) committed, so a global Maven install is optional |
| Web | `spring-boot-starter-web` (blocking MVC, not WebFlux) |
| Persistence | `spring-boot-starter-data-jpa` + Hibernate 6 |
| Migrations | Flyway 10.x + `flyway-database-postgresql` (mandatory separate artifact in Flyway 10) |
| Security | `spring-boot-starter-security`, stateless JWT resource server style filter |
| JWT library | `io.jsonwebtoken:jjwt` (api/impl/jackson) |
| Validation | `spring-boot-starter-validation` (Jakarta Bean Validation) |
| Mapping | MapStruct (annotation processor ordered **after** Lombok) |
| Boilerplate | Lombok — allowed on entities/DTOs/services; **never** `@Data` on JPA entities (use `@Getter/@Setter`) |
| API docs | `springdoc-openapi-starter-webmvc-ui` |
| PDF | OpenPDF (`com.github.librepdf:openpdf`) — pure Java, no external service |
| Excel | Apache POI (`poi-ooxml`) |
| CSV | Manual RFC-4180 writer in `common/export` (no extra dependency) |
| Testing | JUnit 5, Mockito, Spring Boot Test, `spring-security-test`, AssertJ. **No Testcontainers in Phase 1–12** (Docker is out of scope) — integration tests use `guesthouse_test_db` |
| Time source | `java.time.Clock` bean, injected everywhere. **Never** call `LocalDate.now()` / `Instant.now()` directly in business code |

### Frontend

| Concern | Decision |
|---|---|
| Framework | Next.js 15 (App Router), React 19 |
| Language | TypeScript 5.x, `strict: true`, `noUncheckedIndexedAccess: true`, `any` forbidden (ESLint error) |
| Styling | Tailwind CSS + shadcn/ui (Radix primitives), CSS variables for theming |
| Icons | `lucide-react` |
| Forms | `react-hook-form` + `zod` via `@hookform/resolvers` |
| Server state | `@tanstack/react-query` v5 |
| Client state | `zustand` (auth session, UI prefs, offline draft/sync queue only) |
| Charts | `recharts` |
| i18n | `next-intl` |
| Dates | `date-fns` + `date-fns-tz` |
| Tables | `@tanstack/react-table` |
| Toasts | `sonner` |
| PWA | Hand-written `public/manifest.webmanifest` + custom service worker in `public/sw.js` registered from a client component. **No** `next-pwa` (unmaintained against Next 15) |
| Unit/component tests | Vitest + React Testing Library + `jsdom` |
| E2E | Playwright |

> **Rule:** the frontend is a *separate* application. It never talks to PostgreSQL and contains no
> business calculations. Next.js route handlers under `app/api/` are used only for BFF concerns that
> must not reach the browser (currently: nothing beyond a health probe and the offline fallback).

---

## 3. Naming conventions

| Layer | Convention | Example |
|---|---|---|
| DB table | `snake_case`, plural | `reservation_rooms` |
| DB column | `snake_case`, singular | `arrival_date` |
| DB PK | always `id` | `id` |
| DB FK | `<singular_referenced_table>_id` | `room_type_id` |
| DB index | `ix_<table>__<cols>` | `ix_reservations__property_id_arrival_date` |
| DB unique | `uq_<table>__<cols>` | `uq_rooms__property_id_room_number` |
| DB check | `ck_<table>__<rule>` | `ck_reservations__departure_after_arrival` |
| DB FK constraint | `fk_<table>__<referenced_table>` | `fk_rooms__room_types` |
| DB exclusion | `ex_<table>__<rule>` | `ex_reservation_rooms__no_overlap` |
| Flyway file | `V<seq>__<snake_case_description>.sql`, seq is zero-padded 3 digits | `V011__create_reservations.sql` |
| Java entity | `PascalCase`, singular | `ReservationRoom` |
| Java enum constant | `SCREAMING_SNAKE_CASE` | `CHECKED_IN` |
| Java DTO | `<Thing>Request` / `<Thing>Response` / `<Thing>SummaryResponse` | `CreateReservationRequest` |
| Java service | `<Aggregate>Service` (interface-free unless >1 impl) | `ReservationService` |
| Java controller | `<Aggregate>Controller`, thin, no logic | `ReservationController` |
| REST path | `kebab-case`, plural nouns | `/api/v1/room-types` |
| TS type | `PascalCase`, mirrors DTO name | `CreateReservationRequest` |
| TS file | `kebab-case.ts` | `reservation-service.ts` |
| React component file | `kebab-case.tsx`, default export `PascalCase` | `reservation-form.tsx` |
| i18n key | `dot.case`, namespace first | `reservation.status.checkedIn` |
| Permission key | `<module>:<action>` snake_case action | `reservation:cancel` |
| Error code | `SCREAMING_SNAKE_CASE` | `ROOM_NOT_AVAILABLE` |

---

## 4. Common table columns

Every **business** table (anything property-scoped) carries:

```sql
id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
property_id  uuid        NOT NULL REFERENCES properties(id),
created_at   timestamptz NOT NULL DEFAULT now(),
created_by   uuid        NULL REFERENCES users(id),
updated_at   timestamptz NOT NULL DEFAULT now(),
updated_by   uuid        NULL REFERENCES users(id),
deleted_at   timestamptz NULL,
version      bigint      NOT NULL DEFAULT 0
```

Reference/global tables (`users`, `roles`, `permissions`, `role_permissions`, `user_roles`,
`refresh_tokens`, `login_history`, `system_settings`, `amenities` when global) omit `property_id`.

Append-only tables (`audit_logs`, `*_history`, `login_history`, `room_status_history`) omit
`updated_*`, `deleted_at` and `version` — they are never mutated.

### Type rules

| Kind | PostgreSQL | Java |
|---|---|---|
| Surrogate key | `uuid` (default `gen_random_uuid()`) | `java.util.UUID` |
| Money amount | `numeric(14,2)` | `java.math.BigDecimal` — **never** `double`/`float` |
| Percentage / rate | `numeric(9,4)` (e.g. `10.0000` = 10%) | `BigDecimal` |
| Quantity | `numeric(12,3)` | `BigDecimal` |
| Currency code | `char(3)` | `String` |
| Counter / small int | `integer` | `Integer` |
| Instant | `timestamptz` (stored UTC) | `java.time.Instant` / `OffsetDateTime` |
| Business date | `date` (interpreted in property timezone) | `java.time.LocalDate` |
| Clock time of day | `time` | `java.time.LocalTime` |
| Enum | `varchar(40)` + `CHECK (col IN (...))` | Java enum + `@Enumerated(EnumType.STRING)` |
| Free text | `text` | `String` |
| Flexible attributes | `jsonb` | `Map<String,Object>` via converter |
| Boolean | `boolean NOT NULL DEFAULT false` | `boolean` |

> **Enums are stored as `varchar` + `CHECK`, never as PostgreSQL `ENUM` types.** Adding a value must
> be a one-line `ALTER ... DROP CONSTRAINT / ADD CONSTRAINT` migration, not a type mutation.

### Required PostgreSQL extensions

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;    -- gen_random_uuid() on PG < 13 & digest helpers
CREATE EXTENSION IF NOT EXISTS btree_gist;  -- uuid equality inside GiST exclusion constraints
CREATE EXTENSION IF NOT EXISTS pg_trgm;     -- trigram indexes for guest/global search
CREATE EXTENSION IF NOT EXISTS unaccent;    -- accent-insensitive search
```

### Soft delete

`deleted_at IS NULL` means live. All unique constraints on soft-deletable tables are **partial**:

```sql
CREATE UNIQUE INDEX uq_rooms__property_id_room_number
  ON rooms (property_id, room_number) WHERE deleted_at IS NULL;
```

Financial rows (`payments`, `refunds`, `invoices`, `invoice_items`, `receipts`,
`payment_allocations`, `reservation_charges` once its invoice is issued) are **never** soft-deleted
and never hard-deleted — they are `VOIDED` / reversed.

---

## 5. Time & timezone policy

1. All `timestamptz` values are stored in UTC; PostgreSQL session `TimeZone` is `UTC`.
2. Each property has a `timezone` (IANA, default `Asia/Phnom_Penh`) and a `currency`
   (default `USD`).
3. **Business date** ("today", arrival, departure, night, report day, housekeeping day) is always
   computed as `LocalDate.now(propertyZone)` through the injected `Clock`. A stay's nights are
   `[arrival_date, departure_date)` — a half-open range, so `nights = departure - arrival`.
4. `departure_date > arrival_date` is enforced by a CHECK constraint. Same-day stays are modelled
   as a 1-night stay, not a 0-night stay (day-use is out of scope).
5. API request/response instants are ISO-8601 with offset (`2026-07-27T09:00:00+07:00`).
   API dates are plain `yyyy-MM-dd` and carry no offset.
6. The frontend renders dates in the property timezone, never the browser timezone.

---

## 6. Money policy

1. `BigDecimal` end to end, scale 2 for amounts, `RoundingMode.HALF_UP`.
2. All totals are computed **on the backend**. Frontend numbers are display-only and any value the
   client submits as a total is ignored and recomputed.
3. Canonical folio maths (single definition, `common/money/FolioCalculator`):

```
lineNet        = round2(unitPrice * quantity) - lineDiscount
subtotal       = Σ lineNet of non-tax, non-service-charge lines
serviceCharge  = round2(subtotal * serviceChargeRate / 100)
taxableBase    = subtotal + serviceCharge          (service charge is taxable by default)
taxTotal       = round2(taxableBase * taxRate / 100)   per applicable tax
grandTotal     = subtotal + serviceCharge + taxTotal
paidTotal      = Σ COMPLETED inbound payment allocations
refundedTotal  = Σ COMPLETED refunds
balance        = grandTotal - paidTotal + refundedTotal
```

4. `balance > 0` → `UNPAID` (if `paidTotal == 0`) or `PARTIALLY_PAID`; `balance == 0` → `PAID`;
   `balance < 0` → `OVERPAID`.
5. Amounts are `>= 0` by CHECK constraint. Direction is expressed by
   `reservation_charges.charge_type = 'DISCOUNT'` (subtracted) or
   `payments.direction = 'OUTBOUND'` (refund), never by a negative amount.
6. Multi-currency is **out of scope**: every row stores `currency` for future-proofing but the
   system rejects any currency other than the property currency.

---

## 7. Enumerations (canonical value sets)

> Any enum below appears verbatim in: the Java enum, the DB CHECK constraint, the TypeScript union,
> and `messages/en.json` + `messages/km.json` under `enum.<enumName>.<VALUE>`.

### 7.1 Identity & staff

```
Role                 : OWNER | MANAGER | RECEPTIONIST | ACCOUNTANT | HOUSEKEEPING | MAINTENANCE | READONLY
UserStatus           : ACTIVE | INACTIVE | LOCKED | PENDING_ACTIVATION
Department           : MANAGEMENT | FRONT_DESK | HOUSEKEEPING | ACCOUNTING | MAINTENANCE | SECURITY
EmploymentStatus     : ACTIVE | ON_LEAVE | SUSPENDED | TERMINATED
```

### 7.2 Rooms

```
RoomOperationalStatus: AVAILABLE | RESERVED | OCCUPIED | OUT_OF_SERVICE | BLOCKED | UNDER_MAINTENANCE
HousekeepingStatus   : CLEAN | DIRTY | CLEANING | INSPECTED | DO_NOT_DISTURB | CLEANING_REQUESTED | OUT_OF_SERVICE
BedType              : SINGLE | DOUBLE | QUEEN | KING | TWIN | BUNK | SOFA_BED
RoomBlockReason      : MAINTENANCE | RENOVATION | OWNER_USE | DEEP_CLEANING | INSPECTION | OTHER
AmenityCategory      : COMFORT | BATHROOM | ENTERTAINMENT | KITCHEN | OUTDOOR | SERVICE | ACCESSIBILITY | OTHER
```

> **Room status is two orthogonal dimensions**, not one enum. `rooms.operational_status` is driven by
> reservations/blocks; `rooms.housekeeping_status` is driven by housekeeping. The single label the UI
> shows is *derived* — see `docs/business-rules.md` §"Derived room display status". The nine statuses
> the PRD lists map onto that derived label.

### 7.3 Rates

```
RatePlanType         : BASE | SEASONAL | WEEKEND | HOLIDAY | LONG_STAY | CORPORATE | TRAVEL_AGENT | PROMOTIONAL | LAST_MINUTE
RateAdjustmentType   : FIXED_PRICE | FIXED_INCREASE | FIXED_DECREASE | PERCENT_INCREASE | PERCENT_DECREASE
```

### 7.4 Guests

```
Gender               : MALE | FEMALE | OTHER | UNDISCLOSED
IdentificationType   : NATIONAL_ID | PASSPORT | DRIVER_LICENSE | RESIDENCE_CARD | OTHER
GuestDocumentType    : PROFILE_PHOTO | ID_FRONT | ID_BACK | PASSPORT_PAGE | VISA_PAGE | SIGNATURE | OTHER
SmokingPreference    : NON_SMOKING | SMOKING | NO_PREFERENCE
```

### 7.5 Reservations

```
ReservationStatus    : DRAFT | PENDING | CONFIRMED | CHECKED_IN | CHECKED_OUT | CANCELLED | NO_SHOW | WAITING_LIST
ReservationSource    : WALK_IN | PHONE | WEBSITE | FACEBOOK | TELEGRAM | WHATSAPP | AGODA | BOOKING_COM | AIRBNB | TRAVEL_AGENT | CORPORATE | OTHER
ChargeType           : ROOM | EXTRA_BED | EXTRA_PERSON | CLEANING_FEE | SERVICE | SERVICE_CHARGE | TAX | DISCOUNT | DAMAGE | ADJUSTMENT | DEPOSIT
FolioPaymentStatus   : UNPAID | PARTIALLY_PAID | PAID | OVERPAID
```

### 7.6 Payments & documents

```
PaymentMethod        : CASH | CREDIT_CARD | DEBIT_CARD | BANK_TRANSFER | QR_PAYMENT | MOBILE_PAYMENT | TRAVEL_AGENT_CREDIT | CORPORATE_CREDIT | OTHER
PaymentDirection     : INBOUND | OUTBOUND
PaymentKind          : DEPOSIT | PAYMENT | REFUND | ADJUSTMENT
PaymentStatus        : PENDING | COMPLETED | FAILED | VOIDED | REFUNDED | PARTIALLY_REFUNDED
InvoiceType          : PROFORMA | INVOICE | TAX_INVOICE
InvoiceStatus        : DRAFT | ISSUED | PAID | PARTIALLY_PAID | VOIDED
DocumentType         : RESERVATION_CONFIRMATION | REGISTRATION_FORM | DEPOSIT_RECEIPT | PAYMENT_RECEIPT | INVOICE | TAX_INVOICE | FOLIO | REFUND_RECEIPT | CHECKOUT_STATEMENT
```

### 7.7 Operations

```
HousekeepingTaskType : CHECKOUT_CLEANING | STAY_OVER_CLEANING | DEEP_CLEANING | LINEN_CHANGE | ROOM_INSPECTION | GUEST_REQUEST | PUBLIC_AREA_CLEANING
HousekeepingTaskStatus: PENDING | ASSIGNED | IN_PROGRESS | COMPLETED | INSPECTED | CANCELLED
Priority             : LOW | MEDIUM | HIGH | URGENT
MaintenanceStatus    : REPORTED | ASSIGNED | IN_PROGRESS | WAITING_FOR_PARTS | COMPLETED | CANCELLED
MaintenanceCategory  : ELECTRICAL | PLUMBING | AIR_CONDITIONING | FURNITURE | APPLIANCE | STRUCTURAL | NETWORK | SAFETY | PEST_CONTROL | OTHER
ServiceUnit          : PIECE | NIGHT | HOUR | DAY | PERSON | KILOGRAM | TRIP | SET
ExpenseApprovalStatus: DRAFT | SUBMITTED | APPROVED | REJECTED
RecurrenceInterval   : NONE | WEEKLY | MONTHLY | QUARTERLY | YEARLY
```

### 7.8 Notifications & audit

```
NotificationType     : RESERVATION_CREATED | RESERVATION_CANCELLED | ARRIVAL_TODAY | DEPARTURE_TODAY
                     | PAYMENT_OVERDUE | PAYMENT_RECEIVED | PAYMENT_FAILED | CLEANING_COMPLETED
                     | MAINTENANCE_REPORTED | ROOM_BLOCKED | LOW_AVAILABILITY | EXPENSE_PENDING_APPROVAL
                     | TASK_ASSIGNED | STAY_EXTENDED
NotificationChannel  : IN_APP | BROWSER_PUSH | EMAIL | SMS      -- EMAIL/SMS are interface-only stubs in local scope
NotificationSeverity : INFO | SUCCESS | WARNING | CRITICAL
AuditAction          : LOGIN | LOGIN_FAILED | LOGOUT | PASSWORD_CHANGE | PASSWORD_RESET
                     | CREATE | UPDATE | DELETE | STATUS_CHANGE | CANCEL | NO_SHOW
                     | CHECK_IN | CHECK_OUT | ROOM_CHANGE | STAY_EXTEND | STAY_SHORTEN
                     | PAYMENT_CREATE | PAYMENT_VOID | REFUND_CREATE | INVOICE_ISSUE | INVOICE_VOID
                     | EXPENSE_APPROVE | EXPENSE_REJECT | ROOM_BLOCK | ROOM_UNBLOCK
                     | ROLE_CHANGE | PERMISSION_CHANGE | SETTINGS_CHANGE | REPORT_EXPORT | OVERRIDE
SyncQueueStatus      : PENDING | SYNCING | SYNCED | CONFLICT | FAILED
```

---

## 8. Permission catalogue

Format `<module>:<action>`. **Complete list — no permission may be invented outside this table.**
`docs/permission-matrix.md` assigns these to roles; `V0xx__seed_roles_permissions.sql` seeds them.

| Module | Permission keys |
|---|---|
| dashboard | `dashboard:view` |
| property | `property:view`, `property:edit` |
| settings | `settings:view`, `settings:edit` |
| onboarding | `onboarding:manage` |
| staff | `staff:view`, `staff:create`, `staff:edit`, `staff:deactivate`, `staff:reset_password` |
| role | `role:view`, `role:manage` |
| room_type | `room_type:view`, `room_type:create`, `room_type:edit`, `room_type:delete` |
| amenity | `amenity:view`, `amenity:manage` |
| room | `room:view`, `room:create`, `room:edit`, `room:delete`, `room:change_status`, `room:block`, `room:unblock` |
| rate | `rate:view`, `rate:manage` |
| availability | `availability:view` |
| reservation | `reservation:view`, `reservation:create`, `reservation:edit`, `reservation:cancel`, `reservation:no_show`, `reservation:assign_room`, `reservation:change_room`, `reservation:extend`, `reservation:add_charge`, `reservation:override_availability` |
| guest | `guest:view`, `guest:create`, `guest:edit`, `guest:delete`, `guest:view_documents`, `guest:upload_documents`, `guest:merge`, `guest:anonymize`, `guest:blacklist` |
| checkin | `checkin:view`, `checkin:perform`, `checkin:override` |
| checkout | `checkout:view`, `checkout:perform`, `checkout:override_balance` |
| service | `service:view`, `service:manage` |
| payment | `payment:view`, `payment:create`, `payment:void`, `payment:adjust` |
| refund | `refund:view`, `refund:create` |
| invoice | `invoice:view`, `invoice:create`, `invoice:void`, `invoice:reissue` |
| housekeeping | `housekeeping:view`, `housekeeping:view_all`, `housekeeping:create`, `housekeeping:assign`, `housekeeping:update`, `housekeeping:inspect` |
| maintenance | `maintenance:view`, `maintenance:view_all`, `maintenance:create`, `maintenance:assign`, `maintenance:update`, `maintenance:complete` |
| expense | `expense:view`, `expense:create`, `expense:edit`, `expense:approve`, `expense:delete` |
| report | `report:view`, `report:export` |
| notification | `notification:view`, `notification:manage` |
| audit | `audit:view` |
| file | `file:upload`, `file:download`, `file:delete` |
| dev | `dev:reset_data` |

**Semantics**

- `*:view_all` (housekeeping, maintenance) widens `*:view` from "records assigned to me" to "all
  records in the property". A user with only `housekeeping:view` sees their own tasks.
- `*:override*` permissions unlock a blocked action and **always** require a typed reason, which is
  persisted to `audit_logs.reason`.
- Backend enforcement is mandatory (`@PreAuthorize("hasAuthority('reservation:cancel')")`).
  Frontend checks are UX-only and never the security boundary.
- `OWNER` implicitly holds every permission; it is still seeded explicitly so the matrix is auditable.

---

## 9. API contract

### 9.1 Envelope

Success (HTTP 2xx):

```json
{
  "success": true,
  "message": "Reservation created successfully.",
  "data": {},
  "timestamp": "2026-07-27T09:00:00+07:00"
}
```

Error (HTTP 4xx/5xx):

```json
{
  "success": false,
  "code": "ROOM_NOT_AVAILABLE",
  "message": "The selected room is not available for these dates.",
  "fieldErrors": [{ "field": "arrivalDate", "code": "INVALID_DATE_RANGE", "message": "..." }],
  "timestamp": "2026-07-27T09:00:00+07:00",
  "requestId": "local-7f3c1a92"
}
```

Paged `data`:

```json
{
  "content": [],
  "page": 0,
  "size": 20,
  "totalElements": 0,
  "totalPages": 0,
  "sort": "createdAt,desc"
}
```

### 9.2 Conventions

| Concern | Rule |
|---|---|
| Version | Path-based: `/api/v1`. Breaking change ⇒ `/api/v2`. |
| Pagination | `?page=0&size=20` (`size` max 100, default 20). Zero-based. |
| Sorting | `?sort=field,asc&sort=other,desc`. Field names are DTO field names, whitelisted per endpoint. |
| Filtering | Explicit named query params per endpoint. No generic RSQL/where-clause parameter. |
| Search | `?q=` free text, endpoint decides which columns. |
| Date filters | `?from=2026-07-01&to=2026-07-31` inclusive-from, inclusive-to for business dates. |
| Request id | Client may send `X-Request-Id`; otherwise the server generates one. Echoed in every response header and in error bodies. |
| Optimistic locking | Mutating requests on versioned aggregates require `version` in the body. Mismatch ⇒ HTTP 409 `OPTIMISTIC_LOCK_CONFLICT`. |
| Idempotency | Payment/refund/check-in/check-out creation accepts `Idempotency-Key` header; a replay returns the original result. |
| Auth | `Authorization: Bearer <accessToken>`. Refresh token in an `HttpOnly` cookie **and** returned in the body for local dev convenience (documented as local-only). |
| HTTP verbs | `GET` read, `POST` create/action, `PUT` full replace, `PATCH` partial, `DELETE` soft delete. State transitions are `POST /{id}/<action>` (e.g. `POST /reservations/{id}/cancel`). |
| Nulls | Omitted from responses (`@JsonInclude(NON_NULL)`) except explicit "cleared" fields. |
| Enum wire format | Exact `SCREAMING_SNAKE_CASE` string from §7. |
| Money wire format | JSON number with 2 decimals, serialised from `BigDecimal` (never a float literal produced by JS). |

### 9.3 HTTP status mapping

| Status | Used for |
|---|---|
| 200 | successful read / action |
| 201 | resource created (with `Location` header) |
| 204 | successful delete with no body |
| 400 | `VALIDATION_ERROR`, `INVALID_DATE_RANGE`, malformed request |
| 401 | `UNAUTHENTICATED`, `INVALID_CREDENTIALS`, `TOKEN_EXPIRED`, `SESSION_EXPIRED` |
| 403 | `PERMISSION_DENIED`, `ACCOUNT_LOCKED`, `ACCOUNT_DISABLED`, `OVERRIDE_REQUIRED` |
| 404 | `RESOURCE_NOT_FOUND` |
| 409 | `DUPLICATE_RESOURCE`, `OPTIMISTIC_LOCK_CONFLICT`, `ROOM_NOT_AVAILABLE`, `INVALID_STATE_TRANSITION`, `SYNC_CONFLICT` |
| 413 | `FILE_TOO_LARGE` |
| 415 | `UNSUPPORTED_FILE_TYPE` |
| 422 | business rule violation that is not a conflict (`DEPOSIT_REQUIRED`, `REFUND_EXCEEDS_BALANCE`, `OUTSTANDING_BALANCE`) |
| 500 | `INTERNAL_ERROR` — message is always generic, never a stack trace |
| 503 | `SERVICE_UNAVAILABLE` |

### 9.4 Canonical error codes

```
VALIDATION_ERROR              UNAUTHENTICATED               INVALID_CREDENTIALS
ACCOUNT_LOCKED                ACCOUNT_DISABLED              TOKEN_EXPIRED
TOKEN_INVALID                 SESSION_EXPIRED               PERMISSION_DENIED
OVERRIDE_REQUIRED             RESOURCE_NOT_FOUND            DUPLICATE_RESOURCE
OPTIMISTIC_LOCK_CONFLICT      INVALID_STATE_TRANSITION      INVALID_DATE_RANGE
ROOM_NOT_AVAILABLE            ROOM_ALREADY_OCCUPIED         ROOM_BLOCKED
ROOM_UNDER_MAINTENANCE        ROOM_OUT_OF_SERVICE           ROOM_NOT_CLEAN
ROOM_CAPACITY_EXCEEDED        RATE_NOT_CONFIGURED           MIN_STAY_NOT_MET
MAX_STAY_EXCEEDED             CLOSED_TO_ARRIVAL             CLOSED_TO_DEPARTURE
DEPOSIT_REQUIRED              OUTSTANDING_BALANCE           PAYMENT_ALREADY_VOIDED
PAYMENT_NOT_REFUNDABLE        REFUND_EXCEEDS_BALANCE        INVOICE_FINALIZED
GUEST_BLACKLISTED             GUEST_MERGE_CONFLICT          FILE_TOO_LARGE
UNSUPPORTED_FILE_TYPE         FILE_UPLOAD_FAILED            SEQUENCE_EXHAUSTED
SYNC_CONFLICT                 OFFLINE_NOT_PERMITTED         INTERNAL_ERROR
SERVICE_UNAVAILABLE
```

Every code has a translation at `error.<CODE>` in `messages/en.json` and `messages/km.json`.

### 9.5 Endpoint groups

```
/api/v1/auth            /api/v1/properties      /api/v1/users           /api/v1/roles
/api/v1/permissions     /api/v1/staff           /api/v1/room-types      /api/v1/rooms
/api/v1/availability    /api/v1/rates           /api/v1/reservations    /api/v1/guests
/api/v1/check-ins       /api/v1/check-outs      /api/v1/services        /api/v1/payments
/api/v1/refunds         /api/v1/invoices        /api/v1/housekeeping    /api/v1/maintenance
/api/v1/expenses        /api/v1/reports         /api/v1/notifications   /api/v1/settings
/api/v1/files           /api/v1/audit-logs      /api/v1/search          /api/v1/dev  (local profile only)
```

---

## 10. Document number formats

Allocated transactionally from `document_sequences (property_id, doc_type, period, last_number)`
using `SELECT ... FOR UPDATE`. Padding is 6 digits. `period` is the 4-digit year, or `-` when the
format has no year segment.

| Doc type | Format | Example |
|---|---|---|
| `RESERVATION` | `RSV-{YYYY}-{000000}` | `RSV-2026-000001` |
| `INVOICE` | `INV-{YYYY}-{000000}` | `INV-2026-000001` |
| `TAX_INVOICE` | `TAX-{YYYY}-{000000}` | `TAX-2026-000001` |
| `PAYMENT` | `PAY-{YYYY}-{000000}` | `PAY-2026-000001` |
| `REFUND` | `REF-{YYYY}-{000000}` | `REF-2026-000001` |
| `RECEIPT` | `RCT-{YYYY}-{000000}` | `RCT-2026-000001` |
| `FOLIO` | `FOL-{YYYY}-{000000}` | `FOL-2026-000001` |
| `GUEST` | `GST-{000000}` | `GST-000001` |
| `STAFF` | `STF-{000000}` | `STF-000001` |
| `EXPENSE` | `EXP-{YYYY}-{000000}` | `EXP-2026-000001` |
| `HOUSEKEEPING_TASK` | `HK-{YYYY}-{000000}` | `HK-2026-000001` |
| `MAINTENANCE_ISSUE` | `MT-{YYYY}-{000000}` | `MT-2026-000001` |

Formats are editable per property in Settings → Documents; the table above is the seeded default.

---

## 11. Frontend route map

```
app/
  (auth)/login                       (auth)/forgot-password        (auth)/reset-password
  (onboarding)/onboarding            (onboarding)/onboarding/[step]
  (dashboard)/dashboard
  (dashboard)/reservations           (dashboard)/reservations/new   (dashboard)/reservations/[id]
  (dashboard)/calendar
  (dashboard)/rooms                  (dashboard)/rooms/[id]         (dashboard)/rooms/board
  (dashboard)/room-types             (dashboard)/room-types/[id]
  (dashboard)/rates
  (dashboard)/guests                 (dashboard)/guests/[id]
  (dashboard)/check-in               (dashboard)/check-in/[reservationId]
  (dashboard)/in-house               (dashboard)/in-house/[stayId]
  (dashboard)/check-out              (dashboard)/check-out/[stayId]
  (dashboard)/payments               (dashboard)/payments/[id]
  (dashboard)/invoices               (dashboard)/invoices/[id]
  (dashboard)/housekeeping           (dashboard)/housekeeping/[id]
  (dashboard)/maintenance            (dashboard)/maintenance/[id]
  (dashboard)/expenses               (dashboard)/expenses/[id]
  (dashboard)/staff                  (dashboard)/staff/[id]
  (dashboard)/reports                (dashboard)/reports/[reportKey]
  (dashboard)/notifications
  (dashboard)/settings/...           (dashboard)/profile
  (dashboard)/dev                    -- rendered only when NEXT_PUBLIC_APP_ENV=local
  offline                            -- service-worker navigation fallback
```

Sidebar order is exactly the 16 modules from the PRD §10. Mobile bottom navigation is
Dashboard · Reservations · Calendar · Guests · More.

---

## 12. Repository layout

```
guest-house-management/
├── guesthouse-api/          Spring Boot 3 + Java 21 (Maven, wrapper committed)
├── guesthouse-web/          Next.js 15 + TypeScript
├── database/                Standalone SQL helpers (create db, reset, manual seed)
├── docs/                    All design & operations documentation
└── README.md
```

Backend packages under `com.guesthouse` are **feature-first**, each holding its own
`controller / service / repository / entity / dto / mapper`:

```
auth  user  role  property  room  reservation  guest  checkin  checkout
payment  invoice  housekeeping  maintenance  expense  report  notification
file  audit  common  config  security
```

Frontend is feature-first under `features/<feature>/{api,components,hooks,schema,types}` with shared
primitives in `components/ui` (shadcn) and cross-cutting code in `lib/`, `services/`, `stores/`.

---

## 13. Hard prohibitions (Phase 1–12)

Not implemented, not configured, not referenced by any runnable script — documented in
`docs/future-deployment-roadmap.md` only:

Docker · Docker Compose · Kubernetes · Nginx · GitHub/GitLab CI · cloud DB · cloud storage ·
AWS/Azure/GCP/DigitalOcean · VPS · production domains · SSL/TLS certificates · production monitoring ·
production backup services · deployment scripts · Testcontainers · real SMTP/email provider ·
SMS provider · Firebase Cloud Messaging or any third-party push provider · OTA/channel-manager
integrations (Agoda, Booking.com, Airbnb) · online payment gateways.

Also prohibited by coding standard:

- `any` in TypeScript; `double`/`float` for money; `@Data` on JPA entities
- hard-coded user-visible strings, role names, status strings or permission keys in components
- business logic inside React components or Spring controllers
- exposing JPA entities directly from controllers
- hard deletion of financial records
- returning stack traces, password hashes, refresh tokens or absolute file paths to clients

---

## 14. Local environment variables

`guesthouse-api/.env.example`

```env
SPRING_PROFILES_ACTIVE=local
DB_HOST=localhost
DB_PORT=5432
DB_NAME=guesthouse_db
DB_USERNAME=postgres
DB_PASSWORD=your_local_password
JWT_SECRET=replace_with_a_long_local_secret_at_least_64_characters_long_0123456789
JWT_ACCESS_EXPIRATION_MINUTES=30
JWT_REFRESH_EXPIRATION_DAYS=7
FILE_UPLOAD_DIR=uploads
FRONTEND_URL=http://localhost:3000
SEED_DEMO_DATA=true
```

`guesthouse-web/.env.local.example`

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_APP_NAME=Guest House Manager
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_ENV=local
NEXT_PUBLIC_DEFAULT_LOCALE=en
```

No real secret is ever committed. `.env`, `.env.local` are git-ignored; only `*.example` files are
tracked.
