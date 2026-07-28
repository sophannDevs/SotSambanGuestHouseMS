import * as React from "react";
import { FieldGroup } from "@/components/ui/field";

interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

// A named group of fields within a longer form (e.g. reservations/new's
// "Guest Information" / "Room Selection" steps) — one level up from
// shadcn's own Field/FieldGroup, which lay out individual fields but don't
// title a whole block of them (brief §17: "Use clear section titles").
export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <FieldGroup>{children}</FieldGroup>
    </div>
  );
}
