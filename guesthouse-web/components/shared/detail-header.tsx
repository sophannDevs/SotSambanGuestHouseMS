import * as React from "react";
import Link from "next/link";
import { ArrowLeft, type LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/layout/header";

interface DetailHeaderProps {
  backHref: string;
  backLabel: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionIcon?: LucideIcon;
  onAction?: () => void;
}

// Unifies the "back link + PageHeader" pair every detail page
// (reservations/[id], guests/[id], rooms/[id]) was hand-rolling separately.
export function DetailHeader({ backHref, backLabel, title, description, actionLabel, actionIcon, onAction }: DetailHeaderProps) {
  return (
    <div className="space-y-4">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        <span>{backLabel}</span>
      </Link>
      <PageHeader title={title} description={description} actionLabel={actionLabel} actionIcon={actionIcon} onAction={onAction} />
    </div>
  );
}
