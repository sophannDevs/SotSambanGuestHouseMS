import { Info } from "lucide-react";

interface NotAvailableNoticeProps {
  title: string;
  description: string;
}

// Inline honest-placeholder for a single field/step that has no backend yet
// (e.g. ID upload, signature capture, invoice generation) — distinct from
// EmptyState, which is a whole-page/section placeholder. Says what's missing
// and why, per the brief's empty-state contract, without pretending the
// surrounding form field works.
export function NotAvailableNotice({ title, description }: NotAvailableNoticeProps) {
  return (
    <div className="flex gap-2.5 rounded-xl border border-dashed border-border/60 bg-muted/20 p-3">
      <Info className="h-4 w-4 flex-shrink-0 text-muted-foreground mt-0.5" aria-hidden="true" />
      <div className="space-y-0.5">
        <p className="text-xs font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
