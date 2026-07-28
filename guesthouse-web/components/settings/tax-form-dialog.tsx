"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Save } from "lucide-react";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";
import { FormFieldGroup } from "@/components/shared/form-field-group";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import type { TaxDto } from "@/lib/api-types";

interface TaxFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tax: TaxDto | null;
  onSubmit: (values: TaxDto) => void;
  isSubmitting?: boolean;
}

const EMPTY: TaxDto = { id: null, name: "", ratePercentage: 0, appliesToServiceCharge: true, active: true };

export function TaxFormDialog({ isOpen, onClose, tax, onSubmit, isSubmitting }: TaxFormDialogProps) {
  const t = useTranslations("settings.taxes.dialog");
  const tCommon = useTranslations("common");
  const [values, setValues] = React.useState<TaxDto>(EMPTY);

  React.useEffect(() => {
    if (isOpen) setValues(tax ?? EMPTY);
  }, [isOpen, tax]);

  const set = <K extends keyof TaxDto>(key: K, value: TaxDto[K]) => setValues((v) => ({ ...v, [key]: value }));

  const canSubmit = values.name.trim().length > 0 && values.ratePercentage >= 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({ ...values, name: values.name.trim() });
  };

  return (
    <ResponsiveDialog open={isOpen} onOpenChange={(open) => !open && onClose()} title={tax ? t("editTitle") : t("createTitle")} description={t("description")}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormFieldGroup label={t("nameLabel")} htmlFor="tax-name" required>
          <Input id="tax-name" value={values.name} onChange={(e) => set("name", e.target.value)} />
        </FormFieldGroup>
        <FormFieldGroup label={t("rateLabel")} htmlFor="tax-rate" required>
          <Input id="tax-rate" type="number" min={0} step="0.01" value={values.ratePercentage} onChange={(e) => set("ratePercentage", Number(e.target.value) || 0)} />
        </FormFieldGroup>
        <Field orientation="horizontal">
          <Checkbox id="tax-service-charge" checked={values.appliesToServiceCharge} onCheckedChange={(checked) => set("appliesToServiceCharge", checked === true)} />
          <FieldLabel htmlFor="tax-service-charge" className="text-xs font-medium">
            {t("appliesToServiceChargeLabel")}
          </FieldLabel>
        </Field>
        <Field orientation="horizontal">
          <Checkbox id="tax-active" checked={values.active} onCheckedChange={(checked) => set("active", checked === true)} />
          <FieldLabel htmlFor="tax-active" className="text-xs font-medium">
            {t("activeLabel")}
          </FieldLabel>
        </Field>

        <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            {tCommon("actions.cancel")}
          </Button>
          <Button type="submit" disabled={!canSubmit || isSubmitting}>
            <Save />
            <span>{tCommon("actions.save")}</span>
          </Button>
        </div>
      </form>
    </ResponsiveDialog>
  );
}
