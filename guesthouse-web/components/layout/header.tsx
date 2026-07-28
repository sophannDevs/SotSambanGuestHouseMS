"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: React.ElementType;
  className?: string;
  /** Renders the action as disabled with `disabledReason` as its `title`
   * tooltip, instead of either hiding it or leaving it clickable-but-inert —
   * for actions the catalogue's permission key expects but the backend
   * hasn't implemented yet (e.g. staff:create, report:export). Matches the
   * disabled-button-with-title pattern already used on rooms/[id] and
   * reservations/[id] (redesign-roadmap.md Redesign Phases 6/8) rather than
   * introducing a second "not available" affordance. */
  actionDisabledReason?: string;
}

export function PageHeader({
  title,
  description,
  actionLabel,
  onAction,
  actionIcon: ActionIcon = Plus,
  className,
  actionDisabledReason,
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-border/40", className)}>
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {actionLabel && (
        <button
          onClick={onAction}
          disabled={!!actionDisabledReason}
          title={actionDisabledReason}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-semibold text-sm rounded-xl shadow-md shadow-primary/20 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-all active:scale-[0.98] self-start sm:self-auto disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary disabled:active:scale-100"
        >
          <ActionIcon className="h-4 w-4" />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
}
