import * as React from "react";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";

interface FormFieldGroupProps {
  label: string;
  htmlFor?: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

// Thin convenience wrapper around shadcn's own Field/FieldLabel/
// FieldDescription/FieldError — composes them instead of reinventing them
// (shadcn skill's own rule), but collapses 4 separate elements most callers
// would otherwise repeat at every field into one. Sets `data-invalid` on the
// Field per the shadcn forms rule; the control passed as `children` still
// needs its own `aria-invalid` — this wrapper can't set that generically
// since it doesn't know the control's element type.
export function FormFieldGroup({ label, htmlFor, description, error, required, children }: FormFieldGroupProps) {
  return (
    <Field data-invalid={!!error || undefined}>
      <FieldLabel htmlFor={htmlFor}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </FieldLabel>
      {children}
      {error ? <FieldError>{error}</FieldError> : description ? <FieldDescription>{description}</FieldDescription> : null}
    </Field>
  );
}
