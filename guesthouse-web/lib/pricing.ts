export const HOURLY_RATE = 5;

export type BookingType = "HOURLY" | "HALF_DAY" | "DAILY";

export const BOOKING_TYPES: { key: BookingType; label: string; hint: string }[] = [
  { key: "HOURLY", label: "Hourly", hint: "Pay for hours" },
  { key: "HALF_DAY", label: "Half Day", hint: "Up to 6 hours" },
  { key: "DAILY", label: "Daily", hint: "24 hours" },
];

// Shared by the New Booking wizard and Walk-in Check-in so both quote the same price
// for the same room + stay type instead of each re-deriving the formula.
export function calculateStayPrice(bookingType: BookingType, nightlyRate: number, hours = 3): number {
  if (bookingType === "HOURLY") return HOURLY_RATE * hours;
  if (bookingType === "HALF_DAY") return Math.round(nightlyRate * 0.6 * 100) / 100;
  return nightlyRate;
}

export interface StayEstimate {
  nights: number;
  subtotal: number;
  tax: number;
  total: number;
}

// Mirrors BookingService.createBooking's own arithmetic (rate * nights,
// flat 10% VAT) exactly, so the wizard's preview matches what the server will
// actually charge in the common case — but it stays a preview: the server
// recomputes and is the value of record (redesign-roadmap.md Phase 6,
// conventions.md §6). Not used by the Hourly/Half-Day walk-in flow above,
// which has no date-range concept to compute nights from.
export function estimateStayTotal(nightlyRate: number, nights: number): StayEstimate {
  const subtotal = Math.round(nightlyRate * nights * 100) / 100;
  const tax = Math.round(subtotal * 0.1 * 100) / 100;
  return { nights, subtotal, tax, total: Math.round((subtotal + tax) * 100) / 100 };
}
