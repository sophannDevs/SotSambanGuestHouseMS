import * as React from "react";
import { cn } from "@/lib/utils";

interface InfoGridItem {
  label: string;
  value: React.ReactNode;
  hint?: string;
}

interface InfoGridProps {
  items: InfoGridItem[];
  columns?: 2 | 3 | 4;
  className?: string;
}

// The label/value/hint block repeated for every field on every detail page
// (reservations/[id], guests/[id], rooms/[id]) — one layout instead of one
// per page.
export function InfoGrid({ items, columns = 3, className }: InfoGridProps) {
  const colsClass = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
  }[columns];

  return (
    <div className={cn("grid grid-cols-2 gap-4", colsClass, className)}>
      {items.map((item) => (
        <div key={item.label}>
          <span className="block text-xs font-semibold uppercase text-muted-foreground">{item.label}</span>
          <span className="text-base font-bold text-foreground">{item.value}</span>
          {item.hint && <p className="text-xs text-muted-foreground">{item.hint}</p>}
        </div>
      ))}
    </div>
  );
}
