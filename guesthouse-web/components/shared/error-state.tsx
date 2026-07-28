import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

// Brief §33: clear message, a retry action, a safe fallback — never a raw
// API error string. Not yet wired to a live failure anywhere in the app
// (every page still reads local demo data, so there's no real fetch that
// can currently fail); ready for the first real API call each page gets in
// its own redesign phase, per redesign-roadmap.md.
export function ErrorState({
  title = "Something went wrong",
  description = "This didn't load. Check your connection and try again.",
  onRetry,
}: ErrorStateProps) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon" className="bg-destructive/10 text-destructive">
          <AlertTriangle aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {onRetry && (
        <EmptyContent>
          <Button variant="outline" onClick={onRetry}>
            <RefreshCw />
            <span>Try again</span>
          </Button>
        </EmptyContent>
      )}
    </Empty>
  );
}
