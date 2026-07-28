"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { UserPlus } from "lucide-react";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";
import { FormFieldGroup } from "@/components/shared/form-field-group";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { CreateGuestRequest } from "@/lib/api-types";

interface NewGuestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: CreateGuestRequest) => void;
  isSubmitting?: boolean;
}

const EMPTY: CreateGuestRequest = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  nationality: "Cambodian",
  idPassportNumber: "",
  notes: "",
};

export function NewGuestDialog({ isOpen, onClose, onSubmit, isSubmitting }: NewGuestDialogProps) {
  const t = useTranslations("guests.newDialog");
  const tCommon = useTranslations("common");
  const [values, setValues] = React.useState<CreateGuestRequest>(EMPTY);

  React.useEffect(() => {
    if (isOpen) setValues(EMPTY);
  }, [isOpen]);

  const set = <K extends keyof CreateGuestRequest>(key: K, value: CreateGuestRequest[K]) => setValues((v) => ({ ...v, [key]: value }));

  const canSubmit = values.firstName.trim().length > 0 && values.lastName.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      ...values,
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      phone: values.phone?.trim() || null,
      email: values.email?.trim() || null,
      idPassportNumber: values.idPassportNumber?.trim() || null,
      notes: values.notes?.trim() || null,
    });
  };

  return (
    <ResponsiveDialog open={isOpen} onOpenChange={(open) => !open && onClose()} title={t("title")} description={t("description")}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FormFieldGroup label={t("firstNameLabel")} htmlFor="guest-first-name" required>
            <Input id="guest-first-name" value={values.firstName} onChange={(e) => set("firstName", e.target.value)} />
          </FormFieldGroup>
          <FormFieldGroup label={t("lastNameLabel")} htmlFor="guest-last-name" required>
            <Input id="guest-last-name" value={values.lastName} onChange={(e) => set("lastName", e.target.value)} />
          </FormFieldGroup>
        </div>

        <FormFieldGroup label={t("phoneLabel")} htmlFor="guest-phone">
          <Input id="guest-phone" type="tel" inputMode="tel" value={values.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
        </FormFieldGroup>

        <FormFieldGroup label={t("emailLabel")} htmlFor="guest-email">
          <Input id="guest-email" type="email" value={values.email ?? ""} onChange={(e) => set("email", e.target.value)} />
        </FormFieldGroup>

        <FormFieldGroup label={t("idPassportLabel")} htmlFor="guest-id-passport">
          <Input id="guest-id-passport" value={values.idPassportNumber ?? ""} onChange={(e) => set("idPassportNumber", e.target.value)} />
        </FormFieldGroup>

        <FormFieldGroup label={t("nationalityLabel")} htmlFor="guest-nationality">
          <Select value={values.nationality} onValueChange={(v) => set("nationality", v)}>
            <SelectTrigger className="w-full" id="guest-nationality">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Cambodian">{t("nationalities.cambodian")}</SelectItem>
              <SelectItem value="American">{t("nationalities.american")}</SelectItem>
              <SelectItem value="British">{t("nationalities.british")}</SelectItem>
              <SelectItem value="Other">{t("nationalities.other")}</SelectItem>
            </SelectContent>
          </Select>
        </FormFieldGroup>

        <FormFieldGroup label={t("notesLabel")} htmlFor="guest-notes">
          <Textarea id="guest-notes" rows={2} value={values.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
        </FormFieldGroup>

        <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            {tCommon("actions.cancel")}
          </Button>
          <Button type="submit" disabled={!canSubmit || isSubmitting}>
            <UserPlus />
            <span>{t("submit")}</span>
          </Button>
        </div>
      </form>
    </ResponsiveDialog>
  );
}
