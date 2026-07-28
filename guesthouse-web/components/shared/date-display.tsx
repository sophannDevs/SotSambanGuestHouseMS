import { formatDate, formatDateTime } from "@/lib/dates";

interface DateDisplayProps {
  date: Date | string | number;
  format?: string;
  className?: string;
}

// Always renders in the property's timezone (lib/dates.ts), never the
// browser's — conventions.md §5.6. Uses a semantic <time> element with a
// machine-readable ISO `dateTime` alongside the human-readable text.
export function DateDisplay({ date, format, className }: DateDisplayProps) {
  return (
    <time dateTime={new Date(date).toISOString()} className={className}>
      {formatDate(date, format)}
    </time>
  );
}

export function DateTimeDisplay({ date, format, className }: DateDisplayProps) {
  return (
    <time dateTime={new Date(date).toISOString()} className={className}>
      {formatDateTime(date, format)}
    </time>
  );
}
