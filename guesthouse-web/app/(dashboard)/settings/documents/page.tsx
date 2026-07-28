"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save, ShieldAlert } from "lucide-react";
import { DetailHeader } from "@/components/shared/detail-header";
import { MobileHeader } from "@/components/layout/mobile-header";
import { FormSection } from "@/components/shared/form-section";
import { FormFieldGroup } from "@/components/shared/form-field-group";
import { FormActions } from "@/components/shared/form-actions";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { NotAvailableNotice } from "@/components/shared/not-available-notice";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import type { PropertyResponse, UpdatePropertyRequest } from "@/lib/api-types";

// Every field on this page is a real column on PropertyDetails
// (UpdatePropertyRequest.java) that had no UI consumer anywhere in the app
// before this phase — the previous /settings page only ever surfaced
// name/address/check-times/wifi/house-rules, leaving legalName,
// billingAddress, bankDetails, invoiceFooterNote, businessRegistrationNumber
// dead despite being real, already-persisted backend capability.
export default function DocumentsSettingsPage() {
  const t = useTranslations("settings.documents");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const queryClient = useQueryClient();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const canView = hasHydrated && hasPermission("property:view");
  const canEdit = hasHydrated && hasPermission("property:edit");

  const propertyQuery = useQuery({
    queryKey: ["property"],
    queryFn: () => apiFetch<PropertyResponse>("/properties/current"),
    enabled: canView,
  });

  const [values, setValues] = React.useState<PropertyResponse | null>(null);

  React.useEffect(() => {
    if (propertyQuery.data) setValues(propertyQuery.data);
  }, [propertyQuery.data]);

  const saveMutation = useMutation({
    mutationFn: (payload: UpdatePropertyRequest) => apiFetch<PropertyResponse>("/properties/current", { method: "PUT", body: JSON.stringify(payload) }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["property"], updated);
      toast.success(t("savedSuccess"));
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const set = <K extends keyof PropertyResponse>(key: K, value: PropertyResponse[K]) =>
    setValues((prev) => (prev ? { ...prev, [key]: value } : prev));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!values) return;
    saveMutation.mutate(values);
  };

  if (hasHydrated && !canView) {
    return (
      <div className="p-4 md:p-0 md:mt-6">
        <EmptyState
          icon={ShieldAlert}
          title={t("noPermission.title")}
          description={t("noPermission.description")}
          action={{ label: t("noPermission.backAction"), onClick: () => router.push("/settings") }}
        />
      </div>
    );
  }

  const isLoading = !hasHydrated || propertyQuery.isLoading;
  const isError = propertyQuery.isError;

  const content = isLoading ? (
    <PageSkeleton />
  ) : isError ? (
    <ErrorState title={t("loadError")} onRetry={() => propertyQuery.refetch()} />
  ) : values ? (
    <form onSubmit={handleSave} className="space-y-6 bg-card border border-border/60 rounded-3xl p-6 sm:p-8 shadow-xl pb-24 md:pb-8">
      <FormSection title={t("legalHeading")}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormFieldGroup label={t("legalNameLabel")} htmlFor="d-legal-name">
            <Input id="d-legal-name" value={values.legalName ?? ""} onChange={(e) => set("legalName", e.target.value)} disabled={!canEdit} />
          </FormFieldGroup>
          <FormFieldGroup label={t("businessRegistrationLabel")} htmlFor="d-biz-reg">
            <Input id="d-biz-reg" value={values.businessRegistrationNumber ?? ""} onChange={(e) => set("businessRegistrationNumber", e.target.value)} disabled={!canEdit} />
          </FormFieldGroup>
          <FormFieldGroup label={t("taxIdLabel")} htmlFor="d-tax-id">
            <Input id="d-tax-id" value={values.taxIdNumber ?? ""} onChange={(e) => set("taxIdNumber", e.target.value)} disabled={!canEdit} />
          </FormFieldGroup>
          <div className="md:col-span-2">
            <FormFieldGroup label={t("billingAddressLabel")} htmlFor="d-billing-address">
              <Textarea id="d-billing-address" rows={2} value={values.billingAddress ?? ""} onChange={(e) => set("billingAddress", e.target.value)} disabled={!canEdit} />
            </FormFieldGroup>
          </div>
          <div className="md:col-span-2">
            <FormFieldGroup label={t("bankDetailsLabel")} htmlFor="d-bank-details">
              <Textarea id="d-bank-details" rows={2} value={values.bankDetails ?? ""} onChange={(e) => set("bankDetails", e.target.value)} disabled={!canEdit} />
            </FormFieldGroup>
          </div>
        </div>
      </FormSection>

      <FormSection title={t("invoiceHeading")} description={t("invoiceDescription")}>
        <FormFieldGroup label={t("invoiceFooterLabel")} htmlFor="d-invoice-footer">
          <Textarea id="d-invoice-footer" rows={2} value={values.invoiceFooterNote ?? ""} onChange={(e) => set("invoiceFooterNote", e.target.value)} disabled={!canEdit} />
        </FormFieldGroup>
        <FormFieldGroup label={t("termsLabel")} htmlFor="d-terms">
          <Textarea id="d-terms" rows={3} value={values.termsAndConditions ?? ""} onChange={(e) => set("termsAndConditions", e.target.value)} disabled={!canEdit} />
        </FormFieldGroup>
      </FormSection>

      <NotAvailableNotice title={t("notAvailable.title")} description={t("notAvailable.description")} />

      {canEdit && (
        <FormActions sticky>
          <Button type="submit" disabled={saveMutation.isPending}>
            <Save />
            <span>{tCommon("actions.save")}</span>
          </Button>
        </FormActions>
      )}
    </form>
  ) : null;

  return (
    <div>
      <div className="md:hidden">
        <MobileHeader title={t("mobileTitle")} />
      </div>
      <div className="hidden md:block">
        <DetailHeader backHref="/settings" backLabel={tCommon("actions.backToSettings")} title={t("title")} description={t("description")} />
      </div>
      {/* Rendered once (not duplicated per breakpoint) — the form below has
          real element ids and htmlFor associations that would collide if
          mounted twice in the DOM simultaneously. */}
      <div className="p-4 md:p-0 md:mt-6">{content}</div>
    </div>
  );
}
