import * as React from "react";
import { cn } from "@/lib/utils";

interface ResponsiveDataListProps<TData> {
  data: TData[];
  renderCard: (item: TData) => React.ReactNode;
  keyExtractor: (item: TData) => string;
  emptyMessage?: string;
  className?: string;
}

// Mobile half of the table/card pair (component-inventory.md §B) — same
// `data` as DataTable, a caller-supplied card renderer instead of columns,
// since each list's mobile card needs different information density than
// its desktop row (current-ui-audit.md §10/§12: "do not render unusable
// miniature desktop tables on mobile").
export function ResponsiveDataList<TData>({
  data,
  renderCard,
  keyExtractor,
  emptyMessage = "No results.",
  className,
}: ResponsiveDataListProps<TData>) {
  if (!data.length) {
    return <p className="py-10 text-center text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className={cn("space-y-3", className)}>
      {data.map((item) => (
        <React.Fragment key={keyExtractor(item)}>{renderCard(item)}</React.Fragment>
      ))}
    </div>
  );
}
