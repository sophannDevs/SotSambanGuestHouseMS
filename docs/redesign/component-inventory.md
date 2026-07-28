# Component Inventory — Guest House Manager

| Item | Value |
|---|---|
| Document | `docs/redesign/component-inventory.md` |
| Phase | Phase 1 — Audit & Planning (installed/built starting Phase 2–4) |
| Date | 2026-07-28 |
| Principle | Every component below is justified by a specific, named finding in `current-ui-audit.md` — not copied wholesale from the task brief's suggestion list. Where the brief's list proposed near-duplicate components, they're merged here with a stated reason, per the brief's own Code Quality rule ("avoid duplicate status mappings," "reuse components," "avoid giant components"). |
| **Build status** | This document is the Phase 1 **plan**. As of the end of Phase 4, every `components/shared/` component below is built and has at least one real migrated caller — see `redesign-roadmap.md` §5.1 for the as-built record, including two plan deviations made during implementation: `DataTablePagination` was folded into `DataTable` itself rather than shipped as a fourth standalone export, and `ActionBar` was dropped in favor of `FormActions`'s existing `sticky` prop, which already covers the identical responsive-sticky-bar need. |

## A. shadcn/ui base components (`components/ui/`)

Confirmed via live probe this session (`npx shadcn@latest info --json` from `guesthouse-web/`): `"components": []` — **nothing is installed**. Project context detected correctly: Next.js 15.1.5, `tailwindVersion: v3`, `tailwindCssFile: app/globals.css`, `importAlias: "@"`. `npx shadcn@latest init` (Phase 2) should point at the existing `app/globals.css` and **decline to overwrite** the existing CSS variables — reuse the values, per `design-system.md`.

### A.1 Install now — each mapped to a concrete finding

| Component | Justified by |
|---|---|
| `button` | Every raw `<button>` in the app (audit §5, §7) |
| `card` (+ Header/Title/Description/Content/Footer) | 15+ hand-rolled "stat card" divs (audit §5, §13) |
| `badge` | Underlying primitive for the rebuilt `StatusBadge` (§B below) |
| `dialog`, `alert-dialog` | 5 duplicated, zero-accessible modal shells (audit §5, §7 — Critical) |
| `sheet`, `drawer` | Mobile filter panels, mobile secondary nav (brief §11, §32) |
| `table` | 10 hand-rolled `<table>`s, none paginated/sortable (audit §10) |
| `form`, `input`, `textarea`, `select`, `checkbox`, `radio-group`, `switch` | Zero forms use a real layout/validation primitive today (audit §9 — Critical) |
| `calendar`, `popover` | Date pickers for reservation dates, report filters, expense date |
| `dropdown-menu` | `topbar.tsx`'s hand-rolled menus (no `role="menu"`, no focus trap — audit §4) |
| `sidebar` | Direct fix for the audit's clearest anti-pattern match: `ui-ux-pro-max`'s shadcn-stack query literally names `<div className="w-64 fixed">` as the "Code Bad" example, which is what `sidebar.tsx` does today |
| `tabs` | 4 independent hand-rolled tab-strip implementations (audit §5) |
| `skeleton` | Brief §33 + `ui-ux-pro-max` ux guideline ("skeleton/spinner for operations > 300ms"); zero loading states exist today |
| `empty` | Zero consistent empty-state pattern exists (`/notifications` is the one page with any empty state, and it's bespoke) |
| `alert` | Inline warnings (uncovered balance, room not ready) — brief §46 |
| `avatar` | Guest/staff representations in lists and the user menu — none used today |
| `tooltip` | Required for collapsed-sidebar labels (brief §11) and icon-only button hints |
| `toggle-group` | `topbar.tsx`'s EN/KM toggle, once real i18n exists to switch |
| `separator` | Replaces manual `border-t` divs used for the same purpose throughout |
| `sonner` | Already installed and wired (`components/providers.tsx`) — no change, just keep using it |
| `collapsible` | Rebuild of the sidebar's hand-rolled "More" expand/collapse (currently a manual `grid-template-rows` transition — works, but reinvents what this component does with correct ARIA for free) |

### A.2 Defer — no finding justifies these yet

| Component | Why it waits |
|---|---|
| `command` | No search-palette exists or was requested beyond a plain search box; revisit only if/when brief B32's cross-entity global search is actually built |
| `input-otp` | No OTP/2FA flow exists anywhere in the auth spec |
| `menubar` | `Sidebar` + `DropdownMenu` already cover every menu need found |
| `navigation-menu` | Superseded by `Sidebar` for this app's shape (single-level app nav, not a multi-level marketing nav) |
| `resizable` | No split-pane UI exists or was requested |
| `slider` | No range-input use case found (quantities in `minibar` are discrete steppers, not a range) |
| `progress` | The existing hand-rolled step-circle indicator (check-in wizard, reservation-new wizard) is an appropriate pattern for a *stepper*, which `Progress` (a linear bar) doesn't model well — see `StepIndicator` in §B instead |
| `breadcrumb` | Real, but lower priority — add opportunistically to detail pages (`reservations/[id]`, `guests/[id]`, `rooms/[id]`) once those are rebuilt, not a blocking Phase 2 install |
| `hover-card`, `context-menu` | No use case found in any of the 26 pages |
| `accordion` | No FAQ/long-list-collapse pattern found; `Collapsible` (already listed above) covers the one real case (sidebar's "More") |

## B. Shared app-level components (`components/shared/`)

This directory does not exist yet (audit §4 — Critical structural gap). Everything below is new. Where the brief's own suggested list proposed near-duplicate components, the merge decision and reason are stated explicitly rather than silently dropped.

| Component | Status | Notes |
|---|---|---|
| `AppShell` | **Formalize existing** | `(dashboard)/layout.tsx` already does this job (auth guard, sidebar+topbar+bottom-nav composition, service-worker registration) — extend it, don't create a parallel component. |
| `PageHeader` | **Formalize existing** | `components/layout/header.tsx`'s `PageHeader` already exists and is reused correctly on several pages — keep the name, migrate its styling onto shadcn primitives, fix `focus:` → `focus-visible:` (audit §7). |
| `PageContainer`, `PageSection` | **Build** | Thin spacing wrappers; closes the "no documented page padding/section-gap rule" gap (`design-system.md` §4). |
| `MobileNavigation`, `MobileHeader` | **Formalize existing** | `bottom-nav.tsx` and `mobile-header.tsx` are already good; fix the "4 pages render `MobileHeader` with no desktop counterpart, losing the header entirely ≥768px" bug (audit §6 — Critical) as part of formalizing, not as a separate task. |
| `UserMenu` | **Build** | Extract from `topbar.tsx`'s hand-rolled dropdown onto shadcn `DropdownMenu` (audit §4). |
| `PropertySwitcher` | **Do not build.** | Release 1 is explicitly single-property (`product-requirements.md` A-01: "`property_id` is present... even though release 1 serves one guest house," resolved server-side from the session, never from a UI switcher). Building switcher UI now is speculative work for an out-of-scope capability. Revisit only alongside real multi-property support. |
| `SearchInput` | **Build** | Reimplemented ~10 times; 2 confirmed non-functional (`invoices`, `expenses` — audit §9, a real bug to fix in the same pass). |
| `FilterBar` (desktop), `FilterSheet` (mobile) | **Build, both** | Genuinely different responsive treatments, not redundant with each other — no filter UI beyond a plain search box exists anywhere today. |
| `DataTable`, `ResponsiveDataList`, `DataTableToolbar`, `DataTablePagination` | **Build, all four** | Each closes a distinct, separately-confirmed gap: no shared table (10 pages), no mobile card conversion (10 pages), no working toolbar (2 broken search boxes), no pagination anywhere despite the backend already paginating everything (`conventions.md` §9.2). Built on the already-installed-but-dormant `@tanstack/react-table`. |
| `EmptyState`, `ErrorState`, `LoadingState`, `PageSkeleton` | **Build, all four — not redundant** | Each serves a different moment (structural loading placeholder / inline spinner / retry-capable failure panel / "nothing here yet" explainer); brief §33 requires all four and the audit found zero consistent implementations of any of them. |
| `FormSection`, `FormFieldGroup`, `FormActions` | **Build, as thin wrappers** | `FormFieldGroup` wraps shadcn's own `FieldGroup`/`Field` rather than reinventing it — per the shadcn skill's rule to compose, not duplicate. Closes the "zero forms use a shared layout primitive" gap (audit §9 — Critical). |
| `ConfirmDialog` | **Build — merges `ConfirmDialog` + `DeleteConfirmDialog` into one** | The brief lists these as two components; the only real difference is copy tone and a `variant="destructive"` style, not structure. One component with a `variant` prop avoids the duplicate-component pattern the audit is trying to eliminate elsewhere (§13). Built on shadcn `AlertDialog`. |
| `PermissionGuard` | **Revive, don't rebuild** | Already exists at `components/auth/permission-guard.tsx` but is dead code (0 imports) while `sidebar.tsx` reimplements the same permission-filter logic inline. Standardize on the real component in Phase 3 instead of a third implementation appearing. |
| `StatusBadge` (single component, domain-parameterized) | **Extend existing, do not fork into 4** | The brief's list separately names `ReservationStatusBadge`/`RoomStatusBadge`/`PaymentStatusBadge`/`HousekeepingStatusBadge`. The existing `components/ui/status-badge.tsx` already proves the right shape: one component, a `STATUS_TONE` map, called as `<StatusBadge domain="reservation" status="CONFIRMED" />`. Forking it into four components would recreate exactly the "duplicate status mapping" problem the brief's own Code Quality section (§39) warns against. Extend its map using the canonical table in `design-system.md` §2.4, and migrate the ~8 pages currently hand-rolling their own badge `<span>` onto it (audit §5, §13). |
| `MetricCard` / `StatCard` (one component, `StatCard` is the name kept) | **Build, merge the two names** | Same component under two names in the brief's list; 15+ existing hand-rolled copies to retire (audit §5, §13). |
| `ChartCard` | **Build** | Consistent title/description/legend shell around the `reports` page's raw `recharts` `LineChart` — currently unwrapped. Lower priority (Phase 10). |
| `ActivityList` | **Build, scoped to what has data** | Can be populated now from the real per-domain history tables that already exist (`RoomStatusHistory`, `ReservationStatusHistory`, `LoginHistory`) — no need to wait for a unified audit log. |
| `NotificationList` | **Defer** | The `notification` backend domain is NOT STARTED (`current-ui-audit.md` Appendix A) — build the shell in Phase 11 alongside whichever backend work lands first, not before. |
| `DetailHeader`, `DetailSection`, `InfoGrid` | **Build, all three** | Underlying layout primitives for every detail page (`reservations/[id]`, `guests/[id]`, `rooms/[id]`), which today each hand-roll their own header+grid. |
| `MoneyDisplay` | **Promote existing pattern to a component** | `lib/currency.ts`'s `formatDualPrice` (USD primary + KHR secondary) is already good and used inconsistently; wrap it once. |
| `DateDisplay`, `DateTimeDisplay` | **Build — closes a real, previously undocumented gap** | No date-formatting utility exists in `lib/` at all today (only `currency.ts` and `pricing.ts`) despite `conventions.md` §5.6 mandating that **dates render in the property's timezone, never the browser's**. Every date shown today is formatted ad hoc, browser-local. These two components (backed by a new `lib/dates.ts` using `date-fns-tz` against the property's timezone from the auth/property store) are the fix — flagged here because nothing in the task brief's own list named this gap, but the audit found it. |
| `GuestSummary`, `RoomSummary`, `ReservationSummary`, `PaymentSummary` | **Build, kept as separate components** | Unlike the status badges, these genuinely have different field sets — not parameterizable as one component. Each should compose from `InfoGrid`/`DetailSection` rather than hand-rolling its own grid, which is the actual duplication to fix. |
| `StepIndicator` | **Build — new name, not in the brief's list** | The brief's list doesn't name this, but the audit found it's needed: two independent hand-rolled step-circle wizards exist (`reservations/new` 4-step, `housekeeping/[id]` 3-step). One shared component closes both. |
| `MobileActionBar` / `DesktopActionBar` | **Build as one `ActionBar` component, responsive internally** | The app already proves the right pattern elsewhere (`dashboard`, `reservations` render `hidden md:block` / `md:hidden` siblings *within one page*) — a single `ActionBar` that switches its own rendering by breakpoint follows that proven pattern, instead of two components the caller has to remember to pair. |
| `ResponsiveDialog` (covers `ResponsiveFormDialog` too) | **Build as one component** | "Dialog on desktop, Sheet on mobile" is a rendering strategy, not a different component depending on whether a form is inside it — a form is just composed as the dialog's children, per shadcn's "compose, don't reinvent" principle. One `ResponsiveDialog`, not two. |

## C. Feature-specific components (`features/<feature>/components/`)

This layer does not exist yet either — `conventions.md` §12's target frontend layout (`features/<feature>/{api,components,hooks,schema,types}`) has not been started. Existing feature components to migrate in, plus new ones the workflow audit (`user-workflows.md`) surfaced as needed:

| Component | Source / status |
|---|---|
| `features/rooms/components/bulk-create-dialog.tsx`, `room-block-dialog.tsx` | Migrate from `components/rooms/`, rebuild on shadcn `Dialog` + `ResponsiveDialog` |
| `features/reservations/components/*` (new-reservation wizard steps, availability panel, price summary) | New — currently one monolithic `reservations/new/page.tsx` (288 lines); split into the brief §17 nine-section form using `StepIndicator` + `FormSection` |
| `features/check-in/components/*` | New — currently inline in `check-in/page.tsx`; split per the step-based flow in `user-workflows.md` §2 |
| `features/rooms/components/room-status-board.tsx` | New home for the orphaned `rooms/board/page.tsx` content — also fix the missing nav link while relocating it (audit §8) |

## D. What this inventory deliberately excludes

No component is listed "because the brief mentioned it" alone — each row above traces to a specific audit or workflow finding. Anything from the brief's suggestion lists not mentioned here (e.g. a dedicated `Command` palette, `InputOTP`, a `PropertySwitcher`) was considered and explicitly deferred or rejected in §A.2/§B, not overlooked.
