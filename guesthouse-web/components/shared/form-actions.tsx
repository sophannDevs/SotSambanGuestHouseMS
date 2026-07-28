import * as React from "react";
import { cn } from "@/lib/utils";

interface FormActionsProps {
  children: React.ReactNode;
  /** Pins the action bar to the bottom of the viewport on mobile and lets it
   * sit inline on desktop — the pattern reservations/new and the check-in/
   * check-out wizards already use, formalized once instead of per-page. */
  sticky?: boolean;
  className?: string;
}

export function FormActions({ children, sticky = false, className }: FormActionsProps) {
  return (
    <div
      className={cn(
        "flex justify-end gap-2 border-t border-border pt-4",
        sticky &&
          "fixed inset-x-0 bottom-16 z-30 border-t bg-card p-4 md:relative md:inset-auto md:bottom-auto md:border-0 md:bg-transparent md:p-0 md:pt-4",
        className
      )}
    >
      {children}
    </div>
  );
}
