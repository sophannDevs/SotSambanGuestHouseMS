import { formatDualPrice } from "@/lib/currency";
import { cn } from "@/lib/utils";

interface MoneyDisplayProps {
  amount: number;
  className?: string;
  secondaryClassName?: string;
  /** Hide the "≈ KHR" secondary line — for tight table cells. */
  hideSecondary?: boolean;
}

// Promotes the USD-primary / KHR-secondary pattern already used correctly
// (if inconsistently) across the app into one component, instead of every
// page calling formatDualPrice and laying out the two lines itself.
export function MoneyDisplay({ amount, className, secondaryClassName, hideSecondary }: MoneyDisplayProps) {
  const price = formatDualPrice(amount);
  return (
    <span className={cn("inline-flex items-baseline gap-1.5", className)}>
      <span className="font-bold tabular-nums text-foreground">{price.usd}</span>
      {!hideSecondary && (
        <span className={cn("text-xs font-normal text-muted-foreground tabular-nums", secondaryClassName)}>
          ≈ {price.khr}
        </span>
      )}
    </span>
  );
}
