# Design System — Guest House Manager

| Item | Value |
|---|---|
| Document | `docs/redesign/design-system.md` |
| Phase | Phase 1 — Audit & Planning (foundation implemented in Phase 2) |
| Date | 2026-07-28 |
| Basis | Existing `guesthouse-web/app/globals.css` + `tailwind.config.ts` tokens (kept, not replaced) · live `npx shadcn@latest info` probe · `ui-ux-pro-max` design-system queries (below) · `current-ui-audit.md` findings |

## 0. Direction: refine, don't replace

The existing `globals.css` already defines a complete, correctly-named shadcn-compatible token set (`--background`, `--card`, `--primary`, `--border`, `--radius`, …). Per `skill-usage-report.md`'s adoption of `impeccable`'s "refinement preserves; redesign replaces" principle, and the brief's own "No Blind Rewrite" rule, this document **keeps the existing token values** and fills the real gaps found in the audit (no semantic status colors, no documented type/spacing/radius/shadow scale, no shadcn components) rather than proposing a new palette from scratch.

## 1. Brand direction

**Mode: Operate, not Persuade** (per `impeccable`'s taxonomy, adopted in `skill-usage-report.md`). The people using this system are on shift, often mid-task, sometimes on a phone with one hand free at a front desk. The design's job is to be fast and unambiguous, not to impress. Concretely:

| Do | Don't | Why |
|---|---|---|
| Flat cards with a 1px border, shadow only on hover/overlay | Heavy or colour-tinted shadows as a resting state (`shadow-blue-600/25` on a static icon tile, found on the dashboard and login hero) | The brief explicitly asks to avoid "heavy shadows" and this pattern reads as generic-SaaS-template, not hospitality |
| One accent hue (blue, already in place) used deliberately | Gradient blobs (`from-blue-600 via-indigo-600 to-violet-600`, found on the sidebar brand mark and login icon) as decoration | Gradients-as-decoration is explicitly called out to avoid in the brief and reads as "AI-generated template," per `frontend-design`'s own calibration notes |
| Calm, high-legibility layout, generous tap targets | Dense ERP-style screens, tiny text | Direct brief requirement — "not a visually complicated ERP-style interface" |
| Status conveyed by icon + label + colour together | Colour alone | Accessibility requirement (`accessibility-audit.md`) and B45 |

## 2. Colors

### 2.1 What's already correct — keep it

`tailwind.config.ts` + `globals.css` already wire: `background`, `foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring`, plus `sidebar-{bg,fg,active,activeFg,hover}`. Verified by computing the actual resolved colour: `--primary: 221.2 83.2% 53.3%` (light mode) resolves to **`#2563EB` — Tailwind's `blue-600`**, exactly.

### 2.2 `ui-ux-pro-max` query trail (grounding, per `skill-usage-report.md`)

Three `--design-system` queries were run against the skill's database (full command lines and raw output preserved in this phase's session log):

| Query phrasing | Pattern returned | Style returned | Colors returned | Verdict |
|---|---|---|---|---|
| "guest house hospitality property management dashboard operations calm professional" | "Real-Time / Operations Landing" (a marketing landing-page pattern) | "Liquid Glass" — ⚠ Moderate-Poor performance, ⚠ text-contrast risk | Teal/blue, Lora/Raleway (spa/wellness-tagged) | **Rejected.** Off-topic match — the query's hospitality/calm keywords pulled a spa-wellness style, not a software one. This is the exact failure mode the skill's own docs warn about ("if results look off-topic, pass `--domain` explicitly"). |
| "internal admin dashboard SaaS operations tool professional dense" | Same landing pattern (no better match exists in this tool's pattern database for "internal back-office app") | "Dark Mode (OLED)" — dark-only, no light mode | Navy `#1E3A5F` / blue `#2563EB` / green `#059669`, explicitly tagged **"Best For: Dashboards, analytics, data visualization, admin panels,"** Fira Code/Fira Sans | **Colors accepted, style and typography rejected.** The blue **exactly matches the existing `--primary` token** computed above — strong external validation to keep it rather than replace it. Dark-only style is disqualified outright (the brief requires light + dark). Fira Code as a *heading* font is a "developer tool" signal wrong for a non-technical staff audience; Fira Sans as body would load two extra font families for no benefit over the already-loaded Inter, which matters on the "weak Wi-Fi in a corridor" mobile scenario the product spec itself names. |
| `--domain ux` / `--stack shadcn` (targeted, not `--design-system`) | n/a | n/a | n/a | **Accepted outright** — concrete, on-topic guidance: loading skeletons for waits >300ms, submit → loading → success/error feedback, table overflow via horizontal scroll or card layout, bulk actions via checkbox + action bar, and — most directly actionable — "Use `Sidebar` for navigation... Don't: custom sidebar implementation... Code Bad: `<div className="w-64 fixed">`," which is a verbatim description of the current `components/layout/sidebar.tsx`. |

**Resulting decision:** keep the existing primary blue; add the missing semantic tokens below (green for success, drawing on the validated `#059669` suggestion, which also already matches the app's own informal `emerald-500` usage); reject glass/dark-only/monospace-heading styling outright.

### 2.3 New semantic tokens to add (the real gap — audit §2)

None of these exist today; every page currently invents its own Tailwind colour per status. Add as CSS variables next to the existing ones, light/dark pair, same HSL format:

| Token | Light value | Purpose | Replaces this ad hoc usage found in the audit |
|---|---|---|---|
| `--success` / `--success-foreground` | `142 71% 30%` bg-tint, text `#059669`-family | Available / Clean / Paid / Completed / Approved | `emerald-500`/`emerald-600` scattered across `dashboard`, `in-house`, `payments`, `housekeeping` |
| `--warning` / `--warning-foreground` | `32 95% 44%` (`amber-600`-family) | Pending / Cleaning / Partially Paid / Medium priority | `amber-500` scattered across `dashboard`, `maintenance`, `housekeeping` |
| `--info` / `--info-foreground` | `199 89% 40%` (`sky-600`-family, deliberately not blue — must stay visually distinct from `--primary`) | Draft / informational badges / low-priority notices | Ad hoc `blue-500` used for non-primary informational badges |
| Keep `--destructive` as the single "danger" hue | (unchanged) | Cancelled / No-Show / Overdue / Urgent / Voided | Reconciles the app's inconsistent `rose-500` vs `red-500`/`--destructive` usage down to one hue |

### 2.4 Canonical status → tone mapping

Centralizes the brief's §9 status lists onto four tones (`success` / `warning` / `info` / `destructive` / `neutral`), extending the logic already proven in `components/ui/status-badge.tsx`. Full component spec lives in `component-inventory.md`; the mapping itself:

| Domain | success | warning | info | destructive | neutral |
|---|---|---|---|---|---|
| Reservation | Confirmed, Checked In, Checked Out | Pending, Waiting List | Draft | Cancelled, No Show | — |
| Room (operational) | Available | Reserved | — | Blocked, Out of Service, Under Maintenance | Occupied* |
| Housekeeping | Clean, Inspected | Cleaning, Cleaning Requested | Do Not Disturb | Out of Service | Dirty* |
| Payment | Paid | Partially Paid, Pending | — | Failed, Voided | Unpaid* |
| Maintenance priority | — | Medium | Low | High, Urgent | — |

\* A few statuses (Occupied, Dirty, Unpaid) are deliberately **not** success/danger — they're normal operational states, not problems, and colouring every non-green status red/amber would violate "don't use colour as the only signal" by making the screen cry wolf. These get the neutral tone plus the icon/label always shown alongside colour (§1 rule).

## 3. Typography

Single family: **Inter** (already loaded via `tailwind.config.ts`'s `fontFamily.sans`, no change). Rejected adding a second family (see §2.2) — one well-weighted family is faster to load (relevant to the "weak Wi-Fi" mobile scenario) and is already shadcn's own ecosystem default.

| Role | Class | Notes |
|---|---|---|
| Page title | `text-2xl md:text-3xl font-bold tracking-tight` | One per page, in the shared `PageHeader`/`MobileHeader` |
| Section title | `text-lg font-semibold` | Card/section headers within a page |
| Card title | `text-base font-semibold` | Use shadcn `CardTitle`, don't hand-set |
| Body | `text-sm` (14px) | Matches the density already used throughout; keep as the table/list/form default |
| Secondary/muted text | `text-xs md:text-sm text-muted-foreground` | |
| Table text | `text-sm` | Header row `text-xs font-medium text-muted-foreground uppercase tracking-wide` |
| Form labels | shadcn `FieldLabel` default (`text-sm font-medium`) | **Deliberate change**: retires the app's current custom `text-xs uppercase tracking-wider` label style once forms migrate to shadcn `Field` (Phase 6+) — per the shadcn skill's Critical Rule "never override component typography," fighting the component's own label style to preserve a decorative detail is exactly the anti-pattern to avoid |
| Helper text | `text-xs text-muted-foreground` | |
| Error messages | `text-xs text-destructive`, rendered via shadcn `FieldError`/`FieldDescription`, adjacent to the field | Never a top-of-form-only list |
| Numeric / metric values | `text-2xl md:text-3xl font-bold tabular-nums` | Add `tabular-nums` — not present today; prevents digit-width jitter on the dashboard's live-updating numbers |
| Dual-currency money (`lib/currency.ts`'s `formatDualPrice`) | Primary amount at body/metric weight, secondary (`≈ ...`) at `text-xs text-muted-foreground` | This existing pattern (USD primary, KHR secondary) is good and is kept — formalized as the shared `MoneyDisplay` component in `component-inventory.md` |

Floor: nothing below `text-xs` (12px) for any user-readable sentence — matches the `ui-ux-pro-max` UX-guideline anti-pattern "text < 12px body."

## 4. Spacing

Formalized from Tailwind's default scale (no custom scale needed — the audit found spacing drift, not a missing scale):

| Context | Value |
|---|---|
| Page padding (desktop) | `p-6` to `p-8` |
| Page padding (mobile) | `p-4` |
| Section gap | `space-y-6` desktop, `space-y-5` mobile |
| Card padding | `p-5` to `p-6` desktop, `p-4` mobile |
| Form field vertical gap | `gap-4` inside shadcn `FieldGroup` (never `space-y-*` inside a form — shadcn Critical Rule) |
| Table cell padding | `px-4 py-3` |
| Dialog padding | shadcn `Dialog`/`Sheet` default, not hand-set |

Rule adopted from the shadcn skill directly: **`gap-*` on a flex container, never `space-x-*`/`space-y-*`.**

## 5. Radius

Base `--radius: 0.75rem` (12px) is kept — it already drives shadcn's own default Button/Input/Select/Card radius correctly with zero change needed. The audit's "High" severity radius finding wasn't a bad base value, it was **no rule for which element uses which of the ad hoc `rounded-xl/2xl/3xl/full` classes already in use.** Fix with a lookup table, not a new formula:

| Tier | Class | Use for |
|---|---|---|
| sm | `rounded-md` (`--radius` − 4px ≈ 8px) | Badges, small chips, checkbox/radio |
| md | `rounded-lg` (`--radius` ≈ 12px) | Buttons, inputs, dropdown items, table row hover — shadcn's default, don't override |
| lg | `rounded-2xl` (16px) | Cards, tab panels, list rows that need more presence than a plain table row |
| xl | `rounded-3xl` (24px) | **Reserved** for the small number of genuinely "hero" surfaces only: the login card, the mobile dashboard's greeting banner. Not for ordinary stat cards — this directly fixes the audit's finding of 15+ stat cards each independently picking `rounded-2xl` or `rounded-3xl` at random. |
| full | `rounded-full` | Avatars, pills/badges, the bottom-nav FAB |

## 6. Shadows

Brief's own rule — "subtle shadows only where they improve hierarchy" — becomes a concrete elevation scale:

| Tier | Class | Use for |
|---|---|---|
| 0 (flat) | none — border only | Resting cards, table rows. shadcn's default `Card` has no shadow; keep it that way. |
| 1 | `shadow-sm` | Hover state on an interactive card; dropdown/select menus |
| 2 | `shadow-md` | Popovers, `DropdownMenu`, `HoverCard` |
| 3 | `shadow-lg` | `Dialog`, `Sheet`, `Drawer` overlays |

**Banned as a systemic pattern**: colour-tinted decorative shadows (`shadow-blue-600/25`, `shadow-indigo-500/30`) on static elements like icon tiles or hero blobs — found on the dashboard and login screen and flagged in §1. The **one** kept exception, because it's a deliberate, standard shadcn button affordance rather than page decoration: the primary CTA button may keep a subtle `shadow-primary/20`-style resting shadow, consistent with shadcn's own Button examples.

## 7. Borders

Single `--border` token, already correct. Rule: **border communicates a card's edge; shadow communicates elevation/overlay. Don't stack a heavy border and a heavy shadow on the same resting element** — several dashboard tiles do both today (`border border-border/50 shadow-sm hover:shadow-md`, which is fine — hover-only elevation change on a bordered card is the correct pattern and should be the template copied everywhere, not the mixed patterns found elsewhere).

## 8. Icons

`lucide-react` is already the standard (matches `conventions.md` §2 and the mandatory `shadcn` skill's icon rules) — no change of library. Formalize the sizing/accessibility rule that `components/layout/sidebar.tsx` already gets right and the rest of the app doesn't:

| Rule | Correct example already in the codebase | Violations found (fix in redesign) |
|---|---|---|
| Icon adjacent to visible text → `aria-hidden="true"` on the icon, text carries the accessible name | `sidebar.tsx` nav links | — |
| Icon-only control → `aria-label` on the *button*, not `title=` | `mobile-header.tsx`, `bottom-nav.tsx`'s FAB | `topbar.tsx` notification bell + theme toggle (title-only); modal close `×` buttons in `check-in`, `check-out`, `bulk-create-dialog`, `room-block-dialog`; `calendar`'s prev/next chevrons; `minibar`'s quantity steppers |
| Size via component/utility, not ad hoc | — | Per the shadcn skill's own rule: icons inside shadcn components take no manual sizing class (`data-icon` handles it); everywhere else, standardize on `size-4` (16px) inline-with-text, `size-5` (20px) nav/standalone |

## 9. Dark mode

Already implemented correctly: `components/theme-provider.tsx` uses the same `localStorage` + `.dark` class-toggle shape as the canonical shadcn/`next-themes` pattern, and every token above is a CSS variable with a `.dark` override already defined in `globals.css`. No architecture change needed — just extend the new `--success`/`--warning`/`--info` tokens with their own `.dark` values (a `.dark` block already exists to add them to) and re-verify contrast for all five status tones in dark mode once shadcn is installed (tracked in `accessibility-audit.md`).

## 10. shadcn/ui rules adopted as binding (from `skill-usage-report.md`)

These are not optional style suggestions — they're the mandatory skill's Critical Rules, restated here as this project's own rules because every one of them maps to a real anti-pattern the audit found:

| Rule | Audit finding it fixes |
|---|---|
| Semantic colour tokens (`bg-primary`, `text-muted-foreground`), never raw hex/`bg-blue-500` | §2.3 above — the entire missing-status-token problem |
| `gap-*`, never `space-x-*`/`space-y-*` | Not yet a widespread violation, but binding going forward |
| `size-*` for equal width/height, not `w-* h-*` | Applies to every icon and avatar going forward |
| `truncate` shorthand | Applies to nav labels, table cells |
| No manual `dark:` overrides — use the semantic token, which already flips automatically | Prevents a whole new category of light/dark drift as pages are rebuilt |
| `cn()` for conditional classes | Already used correctly in `sidebar.tsx`; extend everywhere |
| No manual `z-index` on Dialog/Sheet/Popover — the component owns its stacking | Fixes the current hand-rolled modals' ad hoc `fixed inset-0` stacking |
| `Dialog`/`Sheet`/`Drawer` always need a `Title` (use `sr-only` if visually hidden) | Directly fixes the "zero dialog semantics" Critical accessibility finding |
| `FieldGroup`/`Field` for form layout, never raw `div`+`space-y-*` | Fixes the "no form uses a real layout primitive" finding |
| Use `Badge`/`Empty`/`Skeleton`/`Separator` instead of custom markup | Fixes the duplicated stat-card/badge/tab-strip patterns |

## 11. What this document deliberately does not do

Per the brief's own "No Placeholder UI" and "avoid premature abstraction" rules, this document does not invent tokens or scales for things nothing in the app needs yet (e.g. a marketing-page hero type scale, a data-visualization colour ramp beyond the four status tones). `component-inventory.md` and `redesign-roadmap.md` extend this foundation only as far as real, found duplication justifies.
