import { Spinner } from "@/components/ui/spinner";

// Inline, not full-page — the brief explicitly says not to block the whole
// screen with a spinner for every request (§33).
export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
      <Spinner />
      <span>{label}</span>
    </div>
  );
}
