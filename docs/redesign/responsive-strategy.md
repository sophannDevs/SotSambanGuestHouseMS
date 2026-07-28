# Responsive Strategy — Guest House Manager

| Item | Value |
|---|---|
| Document | `docs/redesign/responsive-strategy.md` |
| Phase | Phase 1 — Audit & Planning |
| Date | 2026-07-28 |
| Basis | `current-ui-audit.md` §6, §12 (mobile/responsive findings, all 26 pages individually surveyed) |

## 1. Breakpoints and test matrix

Per the brief, formalized as the project standard (matches Tailwind's default breakpoints already in use — no custom breakpoint config needed):

| Tier | Range | Tailwind prefix |
|---|---|---|
| Small mobile | 320–374px | (base, no prefix) |
| Standard mobile | 375–767px | (base, no prefix) |
| Tablet | 768–1023px | `md:` |
| Desktop | 1024–1439px | `lg:` |
| Large desktop | ≥1440px | `xl:` |

Test viewports for every redesigned page before marking it done (matches brief exactly): `320×568, 375×667, 390×844, 430×932, 768×1024, 1024×768, 1366×768, 1440×900, 1920×1080`.

## 2. The pattern already proven in this codebase — extend it, don't invent a new one

12 of 26 pages (`dashboard`, `reservations`, `rooms`, `rooms/[id]`, `guests`, `housekeeping`, `minibar`, and others per the full table in `current-ui-audit.md`) already correctly implement a genuine dual layout: a `md:hidden` block with a mobile-native card/list treatment, and a separate `hidden md:block` block with the desktop table/grid treatment — not a single table squeezed smaller. **This is the correct pattern the brief asks for in §12 ("do not assume a desktop table can simply shrink on mobile") and it already exists in this codebase.** The work is to extend it to the other 14 pages, not to design a new approach.

## 3. Per-page remediation table

All 26 pages under `guesthouse-web/app/(dashboard)/`, current state → required fix:

| Route | Current mobile state | Fix needed | Priority |
|---|---|---|---|
| `dashboard` | Dual layout, correct | None — this is the reference pattern | — |
| `reservations` | Dual layout, correct | None | — |
| `rooms` | Dual layout, correct | None | — |
| `rooms/[id]` | Dual layout, correct | None | — |
| `guests` | Dual layout, correct | None | — |
| `housekeeping` | Dual layout, correct | None | — |
| `minibar` | Dual layout, correct | None (but fix icon-only stepper labels — see `accessibility-audit.md`) | — |
| `guests/[id]` | Dual layout, correct | None (but fix duplicate mock dataset — `current-ui-audit.md` §5) | — |
| `calendar` | **No mobile layout** — desktop timeline shown unscaled at all widths; legend row risks clipping ≤360px | Needs a genuinely different mobile view per brief §18 (Agenda / Day / Room-list-by-date), not a shrunk timeline. Add `flex-wrap` to the legend regardless of the mobile-view decision. | **High** |
| `in-house` | **No mobile layout** — plain table at all widths | Convert to card list on mobile (this is exactly the front-desk "view active stay" screen staff use on a phone — `user-workflows.md` §3) | **High** |
| `check-out` | **No mobile layout**, plus a modal with no dialog semantics | Card list + rebuild modal on shadcn `Dialog`/`Sheet` | **Critical** (this is a financial, guided-flow screen per brief §23) |
| `payments` | No mobile layout | Card list conversion | Medium |
| `invoices` | No mobile layout, **and** search is non-functional (bug) | Card list conversion + fix the filter bug in the same pass | High |
| `maintenance` | No mobile layout | Card list — this module is fully backend-built (`user-workflows.md` §6), a good early wiring target | Medium |
| `expenses` | No mobile layout, **and** search is non-functional (bug) | Card list conversion + fix the filter bug in the same pass | High |
| `staff` | No mobile layout (smallest page, 73 lines) | Card list conversion | Low |
| `reports` | Dual layout exists, but verify chart legibility/legend wrapping at 375px once real charts replace the hardcoded trend line | Re-test after Phase 10 data wiring | Medium |
| `settings` | Dual layout claimed but mobile view has **no real fields** — most rows just link back to `/settings` itself | This is effectively unimplemented on mobile today; needs the brief's §29 drill-down pattern (settings list → dedicated sub-page per section), not a cosmetic fix | **High** |
| `notifications` | No mobile header at all (the one page `mobile-header.tsx`'s own bell icon links to) | Add `MobileHeader`; low complexity since the page is a 24-line empty-state stub today | Medium |
| `rooms/board` | Tile grid is responsive already (no overflow), but the route has **no nav link anywhere** | Fix navigation first (audit §8), then verify responsive behaviour is still fine once real data replaces `DEMO_TILES` | High (navigation, not layout) |
| `reservations/new` | Mobile-only UI at all widths — **no header ≥md at all** | Add a proper desktop layout per brief §17 (sections + sticky summary panel), not just "restore a header" | **Critical** — this is the primary reservation-creation flow |
| `housekeeping/[id]` | Mobile-only UI at all widths — **no header ≥md** | Add desktop treatment; also uses a second, divergent hand-rolled step-wizard (audit §5) to consolidate with `reservations/new`'s via the shared `StepIndicator` | High |
| `profile` | Mobile-only UI at all widths — **no header ≥md**, no `PageHeader` import at all | Add `PageHeader` for desktop | Medium |
| `more` | Mobile-only UI at all widths — **no header ≥md** | This page is mobile-by-nature (it's the bottom-nav's "More" destination) — acceptable to keep mobile-only *if* it 404s or redirects sensibly at desktop widths where the sidebar already shows every item the "More" page lists; verify that behaviour explicitly rather than leaving a bare unstyled page at desktop widths | Medium |
| `reservations/[id]` | Partial dual layout (header swaps, body grid shared) | Verify once real data replaces the hardcoded "John Smith" — currently `id` param is read but unused | Medium |

## 4. Mobile-first operational requirements (brief §13) — status against real workflows

Cross-checked against `user-workflows.md`'s backend-readiness tags, since a mobile-friendly button that calls a non-existent endpoint isn't actually done:

| Task | Can be done on mobile today (UI)? | Backed by real data? |
|---|---|---|
| View dashboard | Yes (best-built mobile screen in the app) | No — fully mocked (`current-ui-audit.md` §11) |
| Check today's arrivals/departures | Partially (dashboard tiles show counts only) | No |
| Search reservations | Yes, UI exists | No |
| Create a reservation | No real mobile layout gap, but the flow itself has no availability/pricing backend yet | No (`user-workflows.md` §1) |
| View room status | Yes | No (`rooms/board` is orphaned + mocked) |
| Check in a guest | UI exists, no dialog accessibility | **Yes — this is the best-backed workflow in the app** (`user-workflows.md` §2) |
| View an in-house guest | No mobile card layout yet | Yes, the list endpoint is real |
| Add a charge | No UI, no backend | No |
| Record a payment | UI exists on `check-out`, not on `in-house` | Yes, backend real |
| Check out a guest | No mobile layout, no dialog accessibility | Partially (the transition itself is real; invoice/receipt/refund are not) |
| Start/complete a housekeeping task | UI exists | Yes, backend real |
| Report maintenance | No mobile layout on the list page, form itself is mobile-usable | Yes — fully backend-built |
| Add an expense | No mobile layout on the list, form itself is mobile-usable | Yes, backend real |
| View notifications | Empty-state only, no mobile header | No backend at all |

**Reading this table**: several "mobile UX" gaps are the *smaller* problem — the workflow's backend readiness (already documented in `user-workflows.md`) determines whether fixing the mobile layout alone actually makes the task usable, or whether it's still fundamentally blocked. Sequence the roadmap accordingly (see `redesign-roadmap.md`): don't spend a design pass polishing the mobile layout of a screen whose backend doesn't exist yet, beyond giving it an honest placeholder state.

## 5. Touch targets and mobile interaction audit

- **Minimum 44×44px tap target**: not yet measured pixel-by-pixel (no running browser session in Phase 1), but every icon-only control flagged as missing an `aria-label` in `accessibility-audit.md` should get its hit-area verified at the same time its label is fixed — they're the same components (`minibar` steppers, modal close buttons, `calendar` chevrons).
- **No horizontal page scroll**: confirmed clean today — every wide table/grid already correctly scopes its scroll to `overflow-x-auto` on the container, not the page. Keep this discipline as new tables/lists are built (`DataTable` component, `component-inventory.md` §B, should bake this in once rather than leaving it to each page).
- **No desktop-only hover interaction for a critical action**: `topbar.tsx`'s dropdowns currently only close on a second click (no outside-click/Escape handling), which is a keyboard/mouse gap more than a touch gap, but worth fixing in the same `DropdownMenu` migration.
- **Sticky bottom action bar for important forms**: not implemented anywhere yet. First candidates once built: `reservations/new` (brief explicitly calls for it), `check-in`, `check-out`.
- **Mobile keyboard types**: no page currently sets `inputMode`/`type="tel"`/`type="email"` deliberately beyond the login screen's `type="email"`/`type="password"`. Add per-field as forms migrate to shadcn `Input`/`Field` (Phase 6+) — e.g. phone fields in `guests`, `staff` should get `type="tel"` and amount fields in `payments`/`expenses` should get `inputMode="decimal"`.

## 6. What "done" looks like per page

A redesigned page passes this phase's responsive bar when: it has a genuine mobile-native layout (not a shrunk desktop one) for any content wider than a simple form, a header at every breakpoint (fixing the four-page regression in §3), no page-level horizontal scroll, touch targets ≥44px, and — where the table-vs-card decision applies — follows `component-inventory.md`'s `DataTable`/`ResponsiveDataList` pair rather than a bespoke per-page solution.
