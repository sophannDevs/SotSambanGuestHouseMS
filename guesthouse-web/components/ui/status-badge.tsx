import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { badgeVariants } from "@/components/ui/badge";
import type { VariantProps } from "class-variance-authority";

type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";
type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

const TONE_TO_BADGE_VARIANT: Record<StatusTone, BadgeVariant> = {
  success: "success",
  warning: "warning",
  danger: "destructive",
  info: "info",
  neutral: "neutral",
};

// Covers room operational/housekeeping/maintenance status, reservation status,
// payment status, housekeeping task status, invoice status, expense approval
// status, staff/employment status, and priority levels — one lookup instead
// of a switch statement duplicated per page (current-ui-audit.md §5/§13).
// Canonical mapping: docs/redesign/design-system.md §2.4.
const STATUS_TONE: Record<string, StatusTone> = {
  // Room operational
  AVAILABLE: "success",
  OCCUPIED: "danger",
  OCCUPIED_DIRTY: "danger",
  RESERVED: "info",
  BLOCKED: "neutral",
  OUT_OF_SERVICE: "danger",
  UNDER_MAINTENANCE: "danger",
  MAINTENANCE: "danger",

  // Housekeeping / room cleanliness
  CLEAN: "success",
  DIRTY: "danger",
  CLEANING: "warning",
  IN_PROGRESS: "warning",
  INSPECTED: "info",
  DO_NOT_DISTURB: "neutral",
  CLEANING_REQUESTED: "warning",
  COMPLETED: "success",
  PENDING: "warning",

  // Reservation lifecycle
  DRAFT: "neutral",
  CONFIRMED: "info",
  CHECKED_IN: "success",
  CHECKED_OUT: "neutral",
  CANCELLED: "danger",
  NO_SHOW: "danger",
  WAITING_LIST: "warning",

  // Payment
  UNPAID: "danger",
  PARTIALLY_PAID: "warning",
  PAID: "success",
  OVERPAID: "info",
  FAILED: "danger",
  REFUNDED: "neutral",
  PARTIALLY_REFUNDED: "warning",
  VOIDED: "neutral",

  // Invoice
  ISSUED: "info",

  // Expense approval
  SUBMITTED: "warning",
  APPROVED: "success",
  REJECTED: "danger",

  // Maintenance issue lifecycle
  REPORTED: "warning",
  ASSIGNED: "info",
  WAITING_FOR_PARTS: "warning",
  RESOLVED: "success",

  // Priority
  LOW: "neutral",
  MEDIUM: "warning",
  HIGH: "danger",
  URGENT: "danger",

  // Staff / employment status
  LOCKED: "danger",
  PENDING_ACTIVATION: "warning",
  ON_LEAVE: "warning",
  SUSPENDED: "danger",
  TERMINATED: "neutral",

  // Misc
  VIP_GOLD: "warning",
  STANDARD: "neutral",
  ACTIVE: "success",
  INACTIVE: "neutral",
};

function normalize(status: string) {
  return status.trim().toUpperCase().replace(/[\s-]+/g, "_");
}

export function toneForStatus(status: string): StatusTone {
  return STATUS_TONE[normalize(status)] ?? "neutral";
}

export function labelForStatus(status: string) {
  return normalize(status).replace(/_/g, " ");
}

interface StatusBadgeProps {
  status: string;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const tone = toneForStatus(status);
  const t = useTranslations("enum.status");
  const key = normalize(status);
  const translated = t.has(key) ? t(key) : undefined;

  return (
    <Badge variant={TONE_TO_BADGE_VARIANT[tone]} className={className}>
      {label ?? translated ?? labelForStatus(status)}
    </Badge>
  );
}
