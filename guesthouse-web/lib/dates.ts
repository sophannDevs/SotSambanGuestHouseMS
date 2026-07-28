import { formatInTimeZone } from "date-fns-tz";

// conventions.md §5's default. The frontend has never rendered a date in
// the property's timezone at all so far — every date shown today is
// formatted in the browser's local zone (current-ui-audit.md §"what
// component-inventory.md found"). Once property settings are fetched from
// the real, already-built backend endpoint (current-ui-audit.md Appendix A:
// settings is FULLY BUILT), this constant should be replaced by the
// property's own `timezone` field instead.
export const DEFAULT_TIMEZONE = "Asia/Phnom_Penh";

export function formatDate(date: Date | string | number, pattern = "MMM d, yyyy"): string {
  return formatInTimeZone(date, DEFAULT_TIMEZONE, pattern);
}

export function formatDateTime(date: Date | string | number, pattern = "MMM d, yyyy 'at' h:mm a"): string {
  return formatInTimeZone(date, DEFAULT_TIMEZONE, pattern);
}

export function formatTime(date: Date | string | number, pattern = "h:mm a"): string {
  return formatInTimeZone(date, DEFAULT_TIMEZONE, pattern);
}

// Backend `LocalDate` fields (e.g. Booking.arrivalDate) already serialize
// as a bare "yyyy-MM-dd" string with no time component, so they compare
// directly against "today" in the property zone without re-parsing as an
// instant; `Instant` fields (e.g. Payment.paymentTime) need the timezone
// conversion first.
const PLAIN_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isTodayInPropertyZone(date: Date | string): boolean {
  const today = formatInTimeZone(new Date(), DEFAULT_TIMEZONE, "yyyy-MM-dd");
  const target = typeof date === "string" && PLAIN_DATE.test(date) ? date : formatInTimeZone(date, DEFAULT_TIMEZONE, "yyyy-MM-dd");
  return target === today;
}

// Calendar-date-only arithmetic — parsed and re-serialized in UTC so the
// result never drifts with the browser's local offset. Only the anchor date
// passed in needs to already be timezone-aware (e.g. via `formatDate`);
// once anchored, day-adding/diffing is timezone-agnostic.
export function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function diffDaysIso(a: string, b: string): number {
  return Math.round((new Date(`${a}T00:00:00Z`).getTime() - new Date(`${b}T00:00:00Z`).getTime()) / 86_400_000);
}
