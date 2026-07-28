# Accessibility Audit — Guest House Manager

| Item | Value |
|---|---|
| Document | `docs/redesign/accessibility-audit.md` |
| Phase | Phase 1 — Audit & Planning (static code audit; no browser/automated-tool pass yet) |
| Date | 2026-07-28 |
| Standard | WCAG 2.2 AA, per the brief |
| Method | Full read of every page/component's source. **No live browser, screen reader, or automated contrast-checking pass was run in Phase 1** — findings below are everything verifiable from source code; anything that needs a running app (contrast ratios, heading-hierarchy in rendered DOM, actual screen-reader behaviour) is explicitly marked "not yet verified" rather than guessed, and is scheduled for the Phase 12 QA pass in `redesign-roadmap.md`. |

## Summary by severity

| Severity | Count | Theme |
|---|---|---|
| Critical | 2 | Zero dialog accessibility anywhere; no `prefers-reduced-motion` handling |
| High | 2 | Icon-only controls with no accessible name; inconsistent focus-visible styling |
| Medium | 3 | Hand-rolled dropdown menus with no ARIA menu semantics; unverified heading hierarchy; unverified table header semantics |
| Deferred (needs a live pass) | 3 | Contrast ratios, screen-reader smoke test, touch-target pixel measurement |

---

## Critical

### C-1. Zero dialog/overlay accessibility anywhere in the app

**Finding.** All five hand-rolled modal implementations lack every piece of required dialog semantics: no `role="dialog"`, no `aria-modal="true"`, no focus trap, no Escape-to-close, no return-focus-to-trigger on close.

**Files:**
- `guesthouse-web/app/(dashboard)/check-in/page.tsx` (deposit/payment modal)
- `guesthouse-web/app/(dashboard)/check-out/page.tsx` (checkout modal)
- `guesthouse-web/components/rooms/bulk-create-dialog.tsx`
- `guesthouse-web/components/rooms/room-block-dialog.tsx`
- `guesthouse-web/components/auth/session-expiry-dialog.tsx` (also dead code — never mounted)

**Why Critical, not High:** these gate real actions — collecting a deposit, completing a checkout, blocking a room — and a keyboard or screen-reader user cannot currently reliably operate or dismiss any of them. This is also the single highest-leverage fix in the whole audit: migrating all five to shadcn's `Dialog`/`AlertDialog`/`Sheet` (per the mandatory shadcn skill's own Critical Rule — "Dialog, Sheet, and Drawer always need a Title... required for accessibility") fixes every instance at once, for free, as a side effect of the Phase 2–3 component work already planned in `component-inventory.md`. No bespoke accessibility engineering is needed here — just the migration that's already scheduled.

**Fix:** rebuild on shadcn `Dialog`/`AlertDialog` (desktop) and `Sheet` (mobile) via the shared `ResponsiveDialog` wrapper (`component-inventory.md` §B). Every instance must include a `DialogTitle`/`SheetTitle`/`AlertDialogTitle` (use `className="sr-only"` only if it must be visually hidden, per the shadcn skill rule) — never a title-less overlay.

### C-2. No `prefers-reduced-motion` handling anywhere

**Finding.** `guesthouse-web/app/globals.css` was read in full — it defines zero `@media (prefers-reduced-motion: reduce)` block. Multiple components rely on CSS transitions/transforms for meaningful state changes, not just decoration: `components/layout/sidebar.tsx`'s `transition-[width] duration-300` (collapse), `group-hover:scale-110` icon scaling, and the "More" section's `grid-template-rows` expand/collapse transition; `app/(dashboard)/dashboard/page.tsx`'s `animate-pulse` online-status dot.

**Why Critical:** this is a hard requirement in both the brief (§35: "Respect reduced-motion preferences") and the `ui-ux-pro-max` pre-delivery checklist ("prefers-reduced-motion respected") that currently has literally zero implementation, not a partial one — it's a one-line CSS addition with no design tradeoff, so there's no reason to leave it as a gap.

**Fix:** add a global rule in `globals.css` (e.g. wrapping non-essential transition/animation declarations in `@media (prefers-reduced-motion: no-preference)`, or the inverse `reduce` block that zeroes `transition-duration`/`animation-duration`) before any further component migration — this is foundation work, not a per-page fix.

---

## High

### H-1. Icon-only interactive elements with no accessible name

**Finding.** Verified in code (not sampled) across:

| File | Element |
|---|---|
| `app/(dashboard)/check-in/page.tsx` | Modal close `<button><X/></button>` |
| `app/(dashboard)/check-out/page.tsx` | Modal close `<button><X/></button>` |
| `components/rooms/bulk-create-dialog.tsx` | Modal close `<button><X/></button>` |
| `components/rooms/room-block-dialog.tsx` | Modal close `<button><X/></button>` |
| `app/(dashboard)/calendar/page.tsx` | Prev/next `<ChevronLeft/>`/`<ChevronRight/>` buttons |
| `app/(dashboard)/minibar/page.tsx` | Minus/Plus quantity steppers (×2 sets — mobile and desktop blocks) |
| `components/layout/topbar.tsx` | Notification bell and theme-toggle buttons use `title=` only — not a reliable accessible name across all assistive tech and touch contexts |

**Contrast — what's already correct, to copy forward:** `components/layout/mobile-header.tsx` (all three icon buttons have real `aria-label`s), `components/layout/bottom-nav.tsx` (FAB has `aria-label="New booking"`), `components/layout/sidebar.tsx` (collapse toggle has `aria-label` + `aria-expanded`). These three files are the reference pattern — every fix in the left column above should match them, not invent a new approach.

**Fix:** add `aria-label` to every icon-only button above during the shadcn `Button` migration (Phase 2–3) — same migration as C-1, since 5 of the 7 rows are on the same dialogs.

### H-2. `focus-visible` is used in exactly one file in the entire app

**Finding.** `components/layout/sidebar.tsx` is the only file using `focus-visible:ring-2`. Every other interactive element in the app uses either plain `focus:` (shows a ring on mouse click too, not just keyboard focus — a minor but real visual-noise issue for mouse users, and the wrong signal for keyboard users if it's inconsistent) or no visible focus style at all.

**Fix:** once shadcn `Button`/`Input`/etc. are installed, this is mostly free — shadcn's base components ship correct `focus-visible` rings by default. The residual work is auditing any remaining hand-rolled interactive elements (e.g. table rows used as click targets, if any survive the `DataTable` migration) for the same treatment.

---

## Medium

### M-1. Hand-rolled dropdown menus with no ARIA menu semantics

**Finding.** `components/layout/topbar.tsx`'s user menu and notification dropdown are plain conditionally-rendered `div`s: no `role="menu"`/`role="menuitem"`, no arrow-key navigation, no Escape-to-close, no outside-click dismissal (the `title=`-only buttons in H-1 are on these same menus).

**Fix:** migrate to shadcn `DropdownMenu`, which provides all of the above by construction (same reasoning as C-1 — this is a migration outcome, not bespoke work).

### M-2. Heading hierarchy — not fully verified, one data point is concerning

**Finding.** Not exhaustively audited in Phase 1 (would require rendering every page and walking its heading tree). One concrete data point from the pages read directly: `app/(dashboard)/dashboard/page.tsx`'s desktop body uses `<h3 className="text-base font-semibold">Operational Status & Next Actions</h3>` as a section heading, with no `<h1>`/`<h2>` visible in the page body itself — the page title likely renders as an `<h1>` inside `PageHeader`/`MobileHeader`, which would make this a valid `h1 → h3` skip, but that needs confirming by reading `components/layout/header.tsx`'s actual markup, which was not done at the tag level in this phase.

**Fix:** verify `PageHeader`'s title renders as `<h1>` (or the correct level for its position in the DOM) as part of formalizing it in Phase 3, then spot-check 3–4 representative pages once rebuilt. Full-app heading audit is a Phase 12 QA item.

### M-3. Table header semantics — not verified

**Finding.** None of the 10 hand-rolled `<table>` implementations were checked at the `<th scope="col">` level in this phase's research passes.

**Fix:** moot as a manual fix — the `DataTable` shared component (`component-inventory.md` §B), once built on shadcn `Table`, produces correct header semantics for every list page in one place. Explicitly verify it once when `DataTable` ships, rather than once per page.

---

## Deferred to a live pass (Phase 12, per `redesign-roadmap.md`)

| Item | Why it can't be done from source alone |
|---|---|
| Colour contrast ratios (4.5:1 text, 3:1 large text/UI) | Needs rendered, computed colours — especially urgent for the **new** `--success`/`--warning`/`--info` tokens proposed in `design-system.md`, which have no prior real-world contrast check |
| Screen-reader smoke test (NVDA/VoiceOver) of at least check-in, check-out, and one form | Needs a running app and an actual assistive-technology pass |
| Touch-target pixel measurement (44×44px minimum) | Needs a rendered viewport at real device sizes |
| Colour-only status communication, verified visually | Static code shows every `StatusBadge` usage pairs colour with a text label already (good sign), but this should be re-confirmed by eye once the new semantic tokens replace the current ad hoc colours |

## What's already right — don't regress these while fixing the above

- `sidebar.tsx`'s `aria-current="page"`, `aria-expanded`, `aria-controls`, and `inert` (on the collapsed "More" panel) are all correctly used.
- `mobile-header.tsx` and `bottom-nav.tsx` are the app's accessibility high-water mark — every icon-only control has a real `aria-label`.
- The login form uses real `<label>` elements with visible text (not placeholder-only labels), matching the brief's form requirement.
- No component was found relying on colour as the *only* signal — every status indicator pairs colour with an icon and/or text label already, which is the right instinct to formalize (not invent) going into the `StatusBadge` rebuild.
