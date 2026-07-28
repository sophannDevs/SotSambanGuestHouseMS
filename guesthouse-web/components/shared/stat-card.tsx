import * as React from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

// Tone → class is a static lookup, not a template-interpolated string —
// Tailwind's compiler only generates classes it can see literally in source,
// so `bg-${tone}/10` would silently produce no CSS at all.
const TONE_CLASSES: Record<NonNullable<StatCardProps["tone"]>, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  info: "bg-info/10 text-info",
  destructive: "bg-destructive/10 text-destructive",
};

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  description?: string;
  trend?: { value: string; direction: "up" | "down" };
  tone?: "primary" | "success" | "warning" | "info" | "destructive";
  /** When set, the whole card becomes a link and gains a hover elevation —
   * kept conditional so the hover affordance never implies interactivity
   * a plain display tile doesn't have. */
  href?: string;
  className?: string;
}

// Retires the 15+ independently hand-rolled "stat card" divs found across
// dashboard, rooms/board, reports, housekeeping, guests/[id], minibar, and
// reservations/[id] (current-ui-audit.md §5/§13), each picking its own mix
// of radius/shadow/icon-tile color.
export function StatCard({ label, value, icon: Icon, description, trend, tone = "primary", href, className }: StatCardProps) {
  const TrendIcon = trend?.direction === "down" ? TrendingDown : TrendingUp;

  const content = (
    <CardContent className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
        <div className={cn("flex size-9 items-center justify-center rounded-xl", TONE_CLASSES[tone])}>
          <Icon className="size-5" aria-hidden="true" />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold tabular-nums text-foreground">{value}</span>
        {trend && (
          <span
            className={cn(
              "flex items-center text-xs font-medium",
              trend.direction === "up" ? "text-success" : "text-destructive"
            )}
          >
            <TrendIcon className="mr-0.5 size-3.5" aria-hidden="true" />
            {trend.value}
          </span>
        )}
      </div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </CardContent>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        <Card className={cn("transition-shadow hover:shadow-md", className)}>{content}</Card>
      </Link>
    );
  }

  return <Card className={className}>{content}</Card>;
}
