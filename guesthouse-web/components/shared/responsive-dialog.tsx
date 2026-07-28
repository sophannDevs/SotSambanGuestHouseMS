"use client";

import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface ResponsiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  /** Pins this content to the bottom of the dialog/sheet, outside the
   * scrollable body — for a guided flow's Next/Back/Cancel bar (`FormActions`
   * without its own `sticky` prop, which pins to the viewport and only makes
   * sense for a full page, not a dialog), so it stays reachable while a long
   * step's content scrolls (responsive-strategy.md §5's sticky-action-bar
   * ask for the check-in/check-out wizards). Omit for dialogs whose action
   * buttons should simply scroll with the content — every other
   * ResponsiveDialog caller today. */
  footer?: React.ReactNode;
}

// Dialog on desktop, a bottom Sheet on mobile — the one pattern the brief's
// "Dialog and Drawer Standard" (§32) asks for, applied once instead of
// per-screen. Replaces 5 independent hand-rolled `fixed inset-0` overlays
// that had zero dialog semantics (accessibility-audit.md C-1, the single
// highest-severity finding in the whole audit) — shadcn's Dialog/Sheet
// supply role="dialog", a focus trap, Escape-to-close, and a correctly
// labelled close button by construction, so fixing this is a side effect
// of the migration rather than bespoke work.
export function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  footer,
}: ResponsiveDialogProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className={cn("max-h-[90vh] rounded-t-2xl", footer ? "flex flex-col p-0" : "overflow-y-auto", className)}
        >
          <SheetHeader className={footer ? "p-4 pb-0" : undefined}>
            <SheetTitle>{title}</SheetTitle>
            {description && <SheetDescription>{description}</SheetDescription>}
          </SheetHeader>
          {footer ? (
            <>
              <div className="flex-1 overflow-y-auto px-4 py-3">{children}</div>
              <div className="px-4 pb-4">{footer}</div>
            </>
          ) : (
            <div className="px-4 pb-4">{children}</div>
          )}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("sm:max-w-lg max-h-[85vh]", footer ? "flex flex-col p-0" : "overflow-y-auto", className)}>
        <DialogHeader className={footer ? "p-4 pb-0" : undefined}>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {footer ? (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-3">{children}</div>
            <div className="px-4 pb-4">{footer}</div>
          </>
        ) : (
          children
        )}
      </DialogContent>
    </Dialog>
  );
}
