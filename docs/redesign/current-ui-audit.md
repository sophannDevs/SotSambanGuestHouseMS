# Current UI Audit — Guest House Manager

| Item | Value |
|---|---|
| Document | `docs/redesign/current-ui-audit.md` |
| Phase | Phase 1 — Audit & Planning |
| Date | 2026-07-28 |
| Method | Full read of `guesthouse-web/app/**`, `guesthouse-web/components/**`, `guesthouse-web/lib/**`; full domain-by-domain read of `guesthouse-api/src/**`; live `npx shadcn@latest info` probe |
| Related documents | [conventions](../conventions.md) · [product-requirements](../product-requirements.md) · [source-brief](../source-brief.md) · [user-workflows](user-workflows.md) · [design-system](design-system.md) · [component-inventory](component-inventory.md) · [accessibility-audit](accessibility-audit.md) |

## 0. Executive summary — read this before the rest of the document

The task brief frames this as auditing "my entire existing Guest House Management System." The honest finding, stated plainly because it changes what "redesign" means here: **there is no existing production UI with real users to protect.** What exists is:

- A **substantial, partially-real backend** (`guesthouse-api`): 11 Flyway migrations, 28 JPA entities, real JWT auth, a real permission model, and working (if incomplete) service/controller code for `property`, `onboarding`, `room_type`, `room`, `checkin`/`checkout` (as a combined "front-desk" feature), `maintenance`, and `settings` — plus partially-built `auth`, `user`, `reservation`, `guest`, `payment`, `invoice`, `housekeeping`, `expense`, `report`, `amenity`, and `staff`. See §Appendix A for the full domain table.
- A **visual-only frontend prototype** (`guesthouse-web`): all 26 route pages under `app/(dashboard)/` render, and several are genuinely well-crafted Tailwind layouts with a real mobile/desktop split — but **every page's data is a hardcoded literal or a local mock array**. Zero pages call the real backend above. The login screen is the one exception: it does call `POST /api/v1/auth/login` for real, with a silent fallback to a fabricated local session if the call fails.
- **shadcn/ui is not installed anywhere in the repository.** No `components.json` exists at any path (confirmed by a repo-wide glob and by a live `npx shadcn@latest info` probe, which reports `"components": []`). Every screen is hand-rolled `div` + Tailwind.

This reframes the work: it is not "fix a live system without breaking it for real users," it is **"install the mandated design system now, then rebuild each page's UI against the design system while wiring it to the backend capability that, in most cases, already exists and is waiting."** The redesign and the first real feature-wiring pass are the same pass for most modules. The audit below and the roadmap that follows are written on that basis. The one rule this does *not* relax: the backend's existing behavior, auth model, and permission checks are real and must still be preserved exactly as the "Critical Rules" in the brief require — "prototype frontend" does not mean "prototype backend."

---

## 1. Current frontend architecture

| Aspect | Finding |
|---|---|
| Framework | Next.js 15.1.5, App Router, React 19, TypeScript 5.7 (`strict` per `tsconfig.json`) — matches `conventions.md` §2 exactly. |
| Routing | Route groups `app/(dashboard)/*` (26 pages, all client components) + `app/login`, `app/onboarding/{,[step]}` + `app/page.tsx` (redirects `/` → `/dashboard`, unconditionally — see High-risk areas). |
| Rendering | **Every page and every layout is `"use client"`.** Zero server components are used anywhere in `app/`, despite Next 15/React 19 RSC being the framework default and `npx shadcn info` confirming `rsc: true` on the project. This is a real performance/architecture gap (see `docs/redesign/redesign-roadmap.md` and Phase 38 of the brief), not just a style nit. |
| State | `zustand` (`lib/auth-store.ts`, persisted to `localStorage`) for session/permissions — real and correctly wired. `@tanstack/react-query` is installed and its `QueryClientProvider` is correctly configured in `components/providers.tsx`, but **zero components call `useQuery`/`useMutation` anywhere** — it is fully dormant. |
| Data fetching | `lib/api-client.ts`'s `apiFetch()` is a complete, correct fetch wrapper: bearer token injection, silent-refresh-on-401 with retry, `ApiResponse` envelope unwrapping matching `conventions.md` §9.1 exactly. **It is imported by exactly one file in the whole app: `app/login/page.tsx`** (indirectly, via a raw `fetch` that mirrors it — login doesn't even use `apiFetch` itself, it hand-rolls the same call). Every other page ignores both `apiFetch` and React Query in favor of local `useState` seeded from literals. |
| Forms | `react-hook-form` + `zod` + `@hookform/resolvers` are installed (`conventions.md`-mandated) but **used nowhere**. All forms (`check-in`, `check-out`, `bulk-create-dialog`, `room-block-dialog`, `settings`) are plain controlled `useState` inputs with manual `if (!x.trim())` checks, no schema, no field-level error display. |
| i18n | `next-intl` is installed but **there is no `messages/` directory, no `i18n.ts`/`getRequestConfig`, no `[locale]` route segment, and zero `useTranslations`/`getTranslations` calls anywhere in the app.** Every visible string in all 26 pages plus every shared component is a hardcoded English literal. This is the single largest gap against `conventions.md`'s "no hard-coded user-visible strings" hard prohibition and against B34's English+Khmer requirement. |
| PWA | `public/manifest.json` and `public/sw.js` exist and the service worker is registered from `app/(dashboard)/layout.tsx`; not deeply audited in Phase 1 (scheduled for the Phase 11 mobile/PWA polish pass in the roadmap). |

## 2. Current design system status

**There is no design system yet — only design *tokens*, and even those are incomplete.** `guesthouse-web/app/globals.css` defines a full, correctly-named HSL CSS-variable set — `--background`, `--foreground`, `--card`, `--popover`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, `--radius` (`0.75rem`), plus five bespoke `--sidebar-*` tokens — mirrored one-to-one in `tailwind.config.ts`. This is genuinely good news: **the token names already match what shadcn/ui's own `init` expects**, so installing shadcn should slot in without a token-naming migration.

What's missing, all **Critical** for a "centralized status color" system per the brief's own §9:

- **No `--success`/`--warning`/`--info` tokens exist at all.** Every page invents its own `emerald-500`/`amber-500`/`rose-500`/`blue-500` Tailwind literal for status color, independently, per page (see §5, §13).
- No documented type scale — every page picks `text-2xl`/`text-3xl font-bold` etc. ad hoc.
- No documented elevation/shadow scale — `shadow-sm` through `shadow-2xl`, including colour-tinted shadows like `shadow-blue-600/25`, are mixed with no rule for which tier gets which shadow.
- Two CSS classes are referenced in components but **never defined**: `.pattern-hatched` (used in `app/(dashboard)/calendar/page.tsx` for blocked-date styling) and `.scrollbar-none` (used in `minibar`, `settings`, `housekeeping`, `reservations`) — both are silent no-ops today.

## 3. Existing shadcn/ui usage

**None.** Confirmed three independent ways:
1. Repo-wide glob for `components.json` — zero matches, anywhere.
2. `guesthouse-web/components/ui/` contains exactly one file, `status-badge.tsx`, which is a hand-written component, not a shadcn-generated one.
3. Live probe this session: `npx shadcn@latest info --json` from `guesthouse-web/` returns `"config": null, "preset": null, "components": []` against a correctly detected project (`Next.js 15.1.5`, `tailwindVersion: v3`, `tailwindCssFile: app/globals.css`, `importAlias: "@"`).

This is the starting point for Phase 2 of the roadmap: `npx shadcn@latest init`, reusing the existing token values rather than accepting shadcn's defaults (see `design-system.md`).

## 4. Existing reusable components

12 files in `guesthouse-web/components/`. Verdict per file:

| File | Verdict | Detail |
|---|---|---|
| `components/ui/status-badge.tsx` | **Keep, extend, promote.** | A genuinely well-designed `STATUS_TONE` map → 5-tone pill covering room/reservation/payment/housekeeping/priority statuses. This is the one component in the app that already does what the brief's "centralized badge mapping" asks for — and it is bypassed by roughly 8 pages that hand-roll their own colored `<span>` instead (see §13). |
| `components/layout/sidebar.tsx` | **Rebuild on shadcn `Sidebar`.** | Functionally strong (permission-filtered nav, collapsible, `localStorage`-persisted, the *only* file in the app using `focus-visible`), but per the `ui-ux-pro-max` shadcn stack guidance it is exactly the anti-pattern shadcn's own docs warn against: a hand-rolled `<aside className="... w-64">` instead of `SidebarProvider`/`Sidebar`/`SidebarContent`. Preserve its permission-filtering logic and nav data; replace its shell. |
| `components/layout/mobile-header.tsx` | **Keep as pattern, migrate to shadcn primitives.** | Best-accessibility component in the app (`aria-label` on all three icon buttons). Its `md:hidden` sticky-header pattern is sound. |
| `components/layout/bottom-nav.tsx` | **Keep as pattern.** | Consistent, accessible (labelled FAB, visible tab text). |
| `components/layout/topbar.tsx` | **Rebuild.** | Language toggle is cosmetic only (local `useState`, does not touch actual copy — there is no real i18n to switch). Hand-rolled dropdowns have no `role="menu"`, no focus trap, no Escape-to-close, no outside-click handling. Icon buttons use `title=` only, not `aria-label`. Direct replacement candidate for shadcn `DropdownMenu`. |
| `components/theme-provider.tsx` | **Keep, minor migration.** | Standard `localStorage` + `document.documentElement.classList` dark-mode pattern, structurally almost identical to the canonical shadcn/`next-themes` pattern — low-risk swap. |
| `components/providers.tsx` | **Keep.** | Correctly wires `QueryClientProvider` → `ThemeProvider` → `Toaster` (`sonner`). Once pages start calling `useQuery`, no change needed here. |
| `components/auth/permission-guard.tsx` | **Dead code — 0 imports repo-wide.** | Ironic, since permission-gating is central to the product's whole model; the sidebar re-implements its own inline filtering instead of using this. Revive and standardize on it in Phase 3, or delete. |
| `components/auth/session-expiry-dialog.tsx` | **Dead code — 0 imports; also non-functional even if mounted** (its `open` state has no setter call). | No `role="dialog"`/`aria-modal`, no focus trap, no Escape. Rebuild on shadcn `AlertDialog` if the session-expiry-warning feature is still wanted. |
| `components/rooms/bulk-create-dialog.tsx` | **Rebuild on shadcn `Dialog`.** | Modal shell (`fixed inset-0 bg-background/80 backdrop-blur-sm` + `rounded-3xl shadow-2xl`) copy-pasted, not shared; close button is icon-only with no `aria-label`; no dialog semantics. |
| `components/rooms/room-block-dialog.tsx` | **Rebuild on shadcn `Dialog`.** | Near-duplicate of `bulk-create-dialog.tsx`'s shell — same gaps. |

**No `components/shared/` directory and no `features/<feature>/components/` structure exist yet** — the `conventions.md` §12 target layout ("Frontend is feature-first under `features/<feature>/{api,components,hooks,schema,types}`") has not been started on the frontend at all. This is a **Critical** structural gap the redesign must establish, not just a styling one.

## 5. Inconsistent design patterns

| Pattern | Inconsistency found | Files (representative, not exhaustive) | Severity |
|---|---|---|---|
| Corner radius | `tailwind.config.ts` ties `rounded-lg/md/sm` to the `--radius` variable (`0.75rem`), but almost every page instead uses Tailwind's stock `rounded-xl/2xl/3xl/full`, which is **unrelated to `--radius`** — changing the design-system radius token today would visually affect almost nothing. | Nearly every `page.tsx` under `app/(dashboard)/` | High |
| Shadows | No elevation scale; `shadow-sm` through `shadow-2xl` plus one-off colour-tinted shadows (`shadow-blue-600/25`, `shadow-indigo-500/30`, `shadow-primary/25`) chosen per-component with no rule. | `dashboard/page.tsx`, `login/page.tsx`, `sidebar.tsx`, `header.tsx` | Medium |
| Status colors | No semantic tokens; `emerald-500`, `amber-500`, `rose-500`, `blue-500`, `slate-400` chosen ad hoc per page instead of routing through `status-badge.tsx`'s existing `STATUS_TONE` map. | `dashboard`, `in-house`, `payments`, `invoices`, `maintenance`, `expenses`, `staff`, `guests`, `calendar`, `rooms/board` | Critical |
| Modal shell | Five separate hand-rolled implementations of the same overlay pattern, no shared component, **none** with `role="dialog"`/`aria-modal`/focus trap/Escape. | `check-in`, `check-out`, `bulk-create-dialog.tsx`, `room-block-dialog.tsx`, `session-expiry-dialog.tsx` | Critical |
| "Stat card" tile | The same `rounded-2xl bg-card border shadow-sm p-4/5` div copy-pasted 15+ times with small class drift, no `<StatCard>`/`<MetricCard>` component. | `dashboard`, `rooms/board`, `reports`, `housekeeping`, `guests/[id]`, `minibar`, `reservations/[id]` | High |
| Tab strip | Hand-rolled active/inactive ternary reimplemented 4 separate times instead of shadcn `Tabs`. | `rooms` (inventory/types), `settings` (4 tabs), mobile pill-tabs in `reservations`, `housekeeping` | Medium |
| Step wizard | Two independent hand-rolled circle+connector step indicators. | `reservations/new` (4-step), `housekeeping/[id]` (3-step) | Medium |
| Nav item config | The `{icon, label, href}` nav list is defined **three separate times** with overlapping entries that must be hand-kept in sync. | `sidebar.tsx` (`PRIMARY_NAV_ITEMS`/`SECONDARY_NAV_ITEMS`), `bottom-nav.tsx` (`LEFT_TABS`/`RIGHT_TABS`), `more/page.tsx` (`MORE_ITEMS`) | High |
| Mock data source | Two entities have **two independently hand-written datasets** describing the same records, already drifting (`guests` list vs `guests/[id]` uses a different field name for the same concept — `totalStays` vs `totalBookings`; `housekeeping` list vs `housekeeping/[id]` likewise). | `app/(dashboard)/guests/page.tsx` vs `guests/[id]/page.tsx`; `housekeeping/page.tsx` vs `housekeeping/[id]/page.tsx` | High |

## 6. Mobile issues

See `docs/redesign/responsive-strategy.md` for the full page-by-page remediation plan. Headline counts out of 26 pages:

- **10 pages have no mobile-specific layout at all** — a desktop-width table/grid is shown unscaled at every viewport: `calendar`, `in-house`, `check-out`, `payments`, `invoices`, `maintenance`, `expenses`, `staff`, `rooms/board`, plus `housekeeping/[id]` and `reservations/new` render a *mobile-only* UI with no desktop treatment (inverse problem, still "one layout for all widths").
- **4 pages lose their header entirely at desktop width**: `reservations/new`, `housekeeping/[id]`, `profile`, `more` render `<MobileHeader>` directly — and `MobileHeader`'s own class hardcodes `md:hidden` — so at ≥768px these four show bare content with no title and no back-navigation. **Critical.**
- `calendar/page.tsx`'s status-legend row has no `flex-wrap` and sits outside the timeline's `overflow-x-auto` container — real clipping/crowding risk at ≤360px. **Medium.**
- Icon-only steppers/close buttons (see §7) are a mobile usability issue as well as an accessibility one — no visible label to tap-confirm on a small screen.
- No page was found with page-level horizontal overflow — every wide table/grid that does have mobile handling correctly contains its own `overflow-x-auto`, which is the right pattern to keep.

## 7. Accessibility issues

Full detail and severity ranking in `docs/redesign/accessibility-audit.md`. Summary of the frontend-audit-relevant findings:

- **Icon-only interactive elements with no accessible name** (verified in code, not sampled): modal close buttons in `check-in/page.tsx`, `check-out/page.tsx`, `bulk-create-dialog.tsx`, `room-block-dialog.tsx`; prev/next chevrons in `calendar/page.tsx`; quantity steppers (×4) in `minibar/page.tsx`; notification-bell and theme-toggle buttons in `topbar.tsx` use `title=` only, which is not a reliable accessible name across assistive tech and touch contexts.
- **Zero dialog semantics anywhere** — none of the 5 modal implementations use `role="dialog"`, `aria-modal`, a focus trap, or Escape-to-close.
- **`focus-visible` is used in exactly one file** (`sidebar.tsx`) out of the whole app; every other interactive element uses plain `focus:` (shows a ring on mouse click too, not just keyboard) or nothing.
- Contrast has not been instrument-measured in Phase 1 (no running browser session yet); flagged for the Phase-12 accessibility QA pass once shadcn's tokens are in place.

## 8. Navigation issues

- **Orphan route**: `app/(dashboard)/rooms/board/page.tsx` (the room status board) has **zero links to it anywhere in the app** — it is only reachable by typing the URL directly. **High** — this is one of the brief's explicitly-required screens (§19 "Room Management Redesign").
- **Nav config triplication** (§5) is itself a navigation-correctness risk: the three independent `{icon,label,href}` lists can silently drift (a module renamed/removed in one list but not the others).
- **Permission-key drift between the sidebar's nav-gating and the backend's actual enforcement.** The sidebar correctly gates each nav item on a canonical permission key from `conventions.md` §8 (e.g. `checkin:view`). The backend, however, was found to enforce several of its own endpoints on a *different* (but still catalogue-valid) key — e.g. `FrontDeskController`'s arrivals/in-house/departures endpoints check `reservation:view`, not `checkin:view`/`checkout:view` as the catalogue implies; several create/update actions across `RoomController`, `RoomTypeController`, `GuestController`, `ReservationController` check a generic `*:edit` key rather than the specific `*:create` one the catalogue defines. With today's seeded roles this is invisible (every seeded role that has one of the pair has the other too), but it is a **latent correctness risk** the redesign's permission-gated UI (nav items, action buttons, `PermissionGuard`) must be wired against *the key the backend actually checks*, not the idealized catalogue key, or a future custom role will see a nav item it cannot actually use. Fixing the backend's literals to match the catalogue is a backend change outside this UI redesign's mandate ("do not change backend behavior without necessity") and is logged here as a recommendation for the API team, not something the redesign should silently patch around. **High.**
- `app/page.tsx` unconditionally `redirect("/dashboard")` with no auth check of its own — relies entirely on `(dashboard)/layout.tsx`'s client-side auth guard running afterward. Not broken today, but worth a look during Phase 3 (a logged-out user briefly round-trips through `/dashboard` before being bounced to `/login`).

## 9. Form usability issues

- **No form on the entire frontend uses `react-hook-form`/`zod`**, despite both being installed exactly for this purpose per `conventions.md`. Every form is manual `useState` + ad hoc `if` checks (`check-in`, `check-out`, `bulk-create-dialog`, `room-block-dialog`, `settings`). **Critical** — this is a direct, repo-wide violation of the brief's own Forms Standard (§30) and blocks every downstream requirement in that section (near-field errors, required-field indicators wired to a schema, unsaved-changes protection).
- **Two confirmed non-functional search inputs**: `app/(dashboard)/invoices/page.tsx` and `app/(dashboard)/expenses/page.tsx` both declare a `search` state and render a search `<input>`, but each renders `invoices.map(...)` / `expenses.map(...)` directly instead of the filtered result — the computed filter variable exists but is never used. Typing in either search box currently does nothing. **High** — a real functional bug, not a style issue.
- `settings/page.tsx` (474 lines, the largest page in the app) renders the property's Wi-Fi password in a plain `type="text"` input with no masking — worth a conscious decision (not necessarily "fix," since it's a local-only admin settings screen an owner fills in once, but should be a deliberate choice in the redesign, not an accident). **Medium.**
- No form anywhere shows a submit-in-progress state distinct from the general page (no per-field disabling, no "Saving…" affordance beyond a couple of pages) and none shows a validation summary or field-level inline error, because none has schema validation to render errors from yet.

## 10. Table usability issues

- No shared `DataTable` component exists; every list page (`reservations`, `rooms`, `guests`, `payments`, `invoices`, `maintenance`, `expenses`, `staff`, `in-house`, `check-out`) hand-rolls its own `<table>` with its own header/row markup, its own inline status-badge reimplementation (§5), and its own search-box wiring (two of which don't work, §9).
- No table has sorting, column visibility, or real pagination — every list simply `.map()`s over the full (tiny, hardcoded) mock array. Not flagged as a "bug" since the datasets are currently 1–4 rows each, but it is a **Critical** gap the moment real data (potentially hundreds of reservations/guests) is wired in, per the brief's own performance rule (B42: "Never load all reservations/guests/payments — paginated APIs only") and per `conventions.md`'s pagination contract (`?page=&size=`), which the backend already implements and the frontend currently has no code path to consume.
- No list page has a true mobile card conversion of its table — see §6.

## 11. Dashboard issues

`app/(dashboard)/dashboard/page.tsx` is the clearest single example of the prototype-vs-product gap: it renders literal text — *"Backend Connection Active... Local Spring Boot REST API listening at http://localhost:8080/api/v1"* and *"Phase 2 Local Project Setup complete. Phase 3 Authentication ready to begin."* — as if it were a build-status page, alongside fabricated metrics (`85%` occupancy, `5 Stays`, `4 Dirty`) that never change. This is not a styling problem to "polish" — the whole page needs to be rebuilt against real (or, where the backend has no endpoint yet, honestly-labeled-placeholder) data. **Critical**, and the highest-visibility page in the app.

## 12. Responsive-layout issues

Covered in depth in `docs/redesign/responsive-strategy.md`. Headline: the app already demonstrates the *correct* dual-layout pattern (`hidden md:block` desktop / `md:hidden` mobile, as seen in `dashboard`, `reservations`, `rooms`) on 12 of 26 pages — this is a real, reusable pattern to extend, not invent from scratch. The other 14 pages need to be brought up to the same pattern, not redesigned from first principles.

## 13. Duplicate code

Consolidated from §5 for a single "what to build once" view (feeds directly into `component-inventory.md`):

| Duplicated thing | Times found | Should become |
|---|---|---|
| Status/priority/type colored badge | ~8 independent reimplementations | Extend the existing `status-badge.tsx` `STATUS_TONE` map to cover every status family; delete the 8 local versions |
| "Stat card" tile | 15+ copies | `MetricCard`/`StatCard` shared component |
| Modal shell | 5 copies, 0 accessible | shadcn `Dialog` / `Sheet` (responsive-dialog wrapper) |
| Tab strip | 4 copies | shadcn `Tabs` |
| Step wizard | 2 copies | One shared step-wizard pattern |
| Nav item list | 3 independent copies | One source of truth, consumed by sidebar/bottom-nav/more |
| Mock entity dataset | 2 pairs already diverged (`guests`, `housekeeping`) | One `lib/demo-data.ts`-style source per entity until real API wiring lands, exactly as `rooms` already correctly does |

## 14. High-risk areas

Ranked by (impact if mishandled) × (likelihood of being touched early in the redesign):

1. **Permission-key drift** (§8) — silent, hard to notice, security-adjacent. **Critical** to get right when building the shared `PermissionGuard`/nav-gating in Phase 3: gate against what the backend actually checks today.
2. **Money/rate/availability domains have no backend at all** (`rate`, `availability`, `refund`, `service`/add-on-charges) — the redesign must not silently fabricate working UI for double-booking prevention, rate plans, or refunds; these need an honest "not available yet" state, not a prettied-up mock (see Appendix A and `redesign-roadmap.md`).
3. **Auth's silent offline-fallback session** in `app/login/page.tsx` (lines ~55–83): if the real `/api/v1/auth/login` call throws for *any* reason (backend down, network blip, CORS misconfig — not just "offline"), the catch block fabricates a valid-looking local session and lets the user in. This is presumably intentional for local-dev convenience, but it means a backend outage is currently indistinguishable from a successful login from the UI's perspective. Flag for a product decision before Phase 3, not a silent carry-forward.
4. **`reservationId`/`guestId`/`taskId` route params are read but not used** to fetch the matching record on several detail pages (`reservations/[id]` always shows "John Smith" regardless of `id`) — trivial today because the data is fake, but this is exactly the code path that will be wired to the real API next, so it should be designed correctly the first time rather than patched twice.
5. **Two dead components** (`permission-guard.tsx`, `session-expiry-dialog.tsx`) sitting next to a live, hand-rolled reimplementation of the first one's job (sidebar's inline filtering) — decide once (revive + standardize, or delete) rather than letting a third variant appear.

## 15. Recommended redesign order

This is refactoring-in-place, not a rewrite (per the brief's own "No Blind Rewrite" rule and `impeccable`'s "refinement preserves" principle — see `skill-usage-report.md`). Full phase detail with acceptance criteria lives in `docs/redesign/redesign-roadmap.md`; the ordering logic is:

1. **Design foundation first** (tokens + shadcn `init`, reusing existing CSS variable values) — nothing downstream should be built twice.
2. **App shell second** (sidebar/topbar/mobile nav on shadcn `Sidebar`/`Sheet`) — every page depends on it, and it's already the clearest anti-pattern example (§4).
3. **Shared components third** (`StatusBadge` extension, `MetricCard`, responsive `Dialog`, `DataTable`, form primitives) — these retire the duplication in §13 once, before it gets copied into more pages.
4. **Then page-by-page**, ordered by backend readiness (Appendix A) so that "redesign" and "first real data wiring" happen together: `dashboard` → `rooms`/`room-types` → `reservations` (create/view/cancel only — no edit/extend yet) → `check-in`/`check-out` (via the real `/front-desk` endpoints) → `guests` → `payments`/`invoices` (read-heavy first) → `housekeeping`/`maintenance` → `expenses`/`reports` → `staff`/`settings` → last, the domains with **no backend yet** (`calendar`'s real availability engine, rate management, refunds, notifications) get a redesigned UI shell with an honest "not implemented yet" empty state rather than a data-wired page.

---

## Appendix A — Backend domain readiness (frontend wiring guide)

Verdict legend: **FULLY BUILT** = entity+repo+service+controller all exist and cover the page's core need · **PARTIAL** = some actions work, some don't (detailed) · **NOT STARTED** = no controller exists; any UI for this must be an honest placeholder, not mock-as-if-real data.

| Domain | Verdict | What actually works | What does not exist yet |
|---|---|---|---|
| property | FULLY BUILT | `GET/PUT /api/v1/properties/current` | — |
| onboarding | FULLY BUILT | `GET /status`, `PUT /step/{step}`, `POST /complete` | — |
| room_type | FULLY BUILT | Full CRUD | — |
| room | FULLY BUILT | List/create/bulk-create, housekeeping-status update, block | Unblock, delete |
| settings | FULLY BUILT | Property settings + taxes (nested under `/properties`, not `/settings`) | Top-level `/settings` path; the doc-listed sections beyond property/tax |
| checkin / checkout | FULLY BUILT (as one "front-desk" feature) | Arrivals, in-house, departures, check-in, check-out — real state transitions on `Reservation`/`Room` | Canonical `/check-ins`/`/check-outs` paths; `checkin:override`/`checkout:override_balance` logic |
| maintenance | FULLY BUILT | List, create, resolve | — |
| auth | PARTIAL | Login, refresh, logout, logout-all | Forgot/reset-password (paths whitelisted, no controller) |
| user | PARTIAL | Self-service profile, change password, login history | Admin user CRUD |
| reservation | PARTIAL | List, view, create, cancel | Edit, extend, no-show, change-room, add-charge, override |
| guest | PARTIAL | Search/list, create | Edit, documents, merge, blacklist |
| payment | PARTIAL | List, create | Void, adjust, refund |
| invoice | PARTIAL | List only | No code path issues an invoice — the one seed row is a hardcoded SQL insert |
| housekeeping | PARTIAL | List tasks, update status | Create/assign task |
| expense | PARTIAL | List, create, approve | Edit, reject, delete |
| report | PARTIAL | One financial report | Export; every other report key in the brief |
| amenity | PARTIAL | List only | Create/manage (entity+repo exist, no service layer) |
| staff | PARTIAL | Read-only list (projects `User`) | Create/edit/deactivate/reset-password |
| rate | NOT STARTED | — | Entity+repo exist; zero service/controller/usage |
| availability | NOT STARTED | — | No overlap/double-booking engine exists at all |
| service (add-ons) | NOT STARTED | — | — |
| refund | NOT STARTED | — | — |
| notification | NOT STARTED | — | — |
| file | NOT STARTED | — | Upload-dir config exists; no upload/download endpoint |
| audit | NOT STARTED | — | Only per-domain history tables (`RoomStatusHistory`, `ReservationStatusHistory`, `LoginHistory`) exist; no unified audit log |
| role | NOT STARTED as an API | — | Powers login internally; no `/roles` management endpoint |
| search | NOT STARTED | — | — |
| dev (reset-data) | NOT STARTED | — | `SEED_DEMO_DATA` flag is read by nothing; demo rows are unconditional Flyway `INSERT`s instead |

Full method-by-method detail (exact REST paths, permission-key literals, migration-vs-code cross-check) is preserved in this phase's research notes and will be re-verified at the top of whichever roadmap phase touches each domain, since backend code will keep moving during Phases 2–12.
