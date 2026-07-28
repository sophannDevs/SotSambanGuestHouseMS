"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";
import { FormFieldGroup } from "@/components/shared/form-field-group";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/dates";
import type { CreateExpenseRequest } from "@/lib/api-types";

interface NewExpenseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: CreateExpenseRequest) => void;
  isSubmitting?: boolean;
}

const CATEGORIES = ["ELECTRICITY", "WATER", "INTERNET", "SUPPLIES", "MAINTENANCE", "STAFF", "OTHER"] as const;
const METHODS = ["CASH", "BANK_TRANSFER", "CREDIT_CARD"] as const;

function emptyValues(): CreateExpenseRequest {
  return {
    category: "SUPPLIES",
    description: "",
    amount: 0,
    expenseDate: formatDate(new Date(), "yyyy-MM-dd"),
    vendor: "",
    paymentMethod: "CASH",
    notes: "",
  };
}

export function NewExpenseDialog({ isOpen, onClose, onSubmit, isSubmitting }: NewExpenseDialogProps) {
  const t = useTranslations("expenses.newDialog");
  // categories live at the parent "expenses" level (shared with the
  // expenses table's own category badges), not nested under newDialog.
  const tExpenses = useTranslations("expenses");
  const tCommon = useTranslations("common");
  const [values, setValues] = React.useState<CreateExpenseRequest>(emptyValues());

  React.useEffect(() => {
    if (isOpen) setValues(emptyValues());
  }, [isOpen]);

  const set = <K extends keyof CreateExpenseRequest>(key: K, value: CreateExpenseRequest[K]) => setValues((v) => ({ ...v, [key]: value }));

  const canSubmit = values.description.trim().length > 0 && values.amount > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      ...values,
      description: values.description.trim(),
      vendor: values.vendor?.trim() || null,
      notes: values.notes?.trim() || null,
    });
  };

  return (
    <ResponsiveDialog open={isOpen} onOpenChange={(open) => !open && onClose()} title={t("title")} description={t("description")}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormFieldGroup label={t("categoryLabel")} htmlFor="expense-category">
          <Select value={values.category} onValueChange={(v) => set("category", v)}>
            <SelectTrigger className="w-full" id="expense-category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {tExpenses(`categories.${c}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormFieldGroup>

        <FormFieldGroup label={t("descriptionLabel")} htmlFor="expense-description" required>
          <Input id="expense-description" value={values.description} onChange={(e) => set("description", e.target.value)} />
        </FormFieldGroup>

        <div className="grid grid-cols-2 gap-3">
          <FormFieldGroup label={t("amountLabel")} htmlFor="expense-amount" required>
            <Input id="expense-amount" type="number" min={0.01} step="0.01" value={values.amount} onChange={(e) => set("amount", Number(e.target.value) || 0)} />
          </FormFieldGroup>
          <FormFieldGroup label={t("dateLabel")} htmlFor="expense-date">
            <Input id="expense-date" type="date" value={values.expenseDate} onChange={(e) => set("expenseDate", e.target.value)} />
          </FormFieldGroup>
        </div>

        <FormFieldGroup label={t("vendorLabel")} htmlFor="expense-vendor">
          <Input id="expense-vendor" value={values.vendor ?? ""} onChange={(e) => set("vendor", e.target.value)} />
        </FormFieldGroup>

        <FormFieldGroup label={t("paymentMethodLabel")} htmlFor="expense-method">
          <Select value={values.paymentMethod} onValueChange={(v) => set("paymentMethod", v)}>
            <SelectTrigger className="w-full" id="expense-method">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {METHODS.map((m) => (
                <SelectItem key={m} value={m}>
                  {t(`methods.${m}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormFieldGroup>

        <FormFieldGroup label={t("notesLabel")} htmlFor="expense-notes">
          <Textarea id="expense-notes" rows={2} value={values.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
        </FormFieldGroup>

        <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            {tCommon("actions.cancel")}
          </Button>
          <Button type="submit" disabled={!canSubmit || isSubmitting}>
            <Plus />
            <span>{t("submit")}</span>
          </Button>
        </div>
      </form>
    </ResponsiveDialog>
  );
}
