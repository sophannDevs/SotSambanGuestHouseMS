"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, EyeOff, Save, ShieldAlert } from "lucide-react";
import { DetailHeader } from "@/components/shared/detail-header";
import { MobileHeader } from "@/components/layout/mobile-header";
import { FormSection } from "@/components/shared/form-section";
import { FormFieldGroup } from "@/components/shared/form-field-group";
import { FormActions } from "@/components/shared/form-actions";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import type { PropertyResponse, UpdatePropertyRequest } from "@/lib/api-types";

const TIMEZONES = [
  { value: "Asia/Phnom_Penh", labelKey: "timezonePhnomPenh" },
  { value: "Asia/Bangkok", labelKey: "timezoneBangkok" },
  { value: "UTC", labelKey: "timezoneUtc" },
] as const;

export default function PropertySettingsPage() {
  const t = useTranslations("settings.property");
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
  const [showWifiPassword, setShowWifiPassword] = React.useState(false);

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
      <FormSection title={t("generalInfo")}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormFieldGroup label={t("nameLabel")} htmlFor="p-name" required>
            <Input id="p-name" value={values.name} onChange={(e) => set("name", e.target.value)} disabled={!canEdit} />
          </FormFieldGroup>
          <FormFieldGroup label={t("codeLabel")}>
            <Input value={values.code} disabled className="font-mono text-muted-foreground" />
          </FormFieldGroup>
          <div className="md:col-span-2">
            <FormFieldGroup label={t("descriptionLabel")} htmlFor="p-description">
              <Textarea id="p-description" rows={2} value={values.description ?? ""} onChange={(e) => set("description", e.target.value)} disabled={!canEdit} />
            </FormFieldGroup>
          </div>
          <FormFieldGroup label={t("timezoneLabel")} htmlFor="p-timezone">
            <Select value={values.timezone} onValueChange={(v) => set("timezone", v)} disabled={!canEdit}>
              <SelectTrigger className="w-full" id="p-timezone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {t(tz.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormFieldGroup>
          <FormFieldGroup label={t("currencyLabel")} htmlFor="p-currency">
            <Input id="p-currency" value={values.currency} onChange={(e) => set("currency", e.target.value.toUpperCase())} disabled={!canEdit} className="font-semibold" />
          </FormFieldGroup>
        </div>
      </FormSection>

      <FormSection title={t("addressContact")}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <FormFieldGroup label={t("addressLineLabel")} htmlFor="p-address">
              <Input id="p-address" value={values.addressLine ?? ""} onChange={(e) => set("addressLine", e.target.value)} disabled={!canEdit} />
            </FormFieldGroup>
          </div>
          <FormFieldGroup label={t("cityLabel")} htmlFor="p-city">
            <Input id="p-city" value={values.city ?? ""} onChange={(e) => set("city", e.target.value)} disabled={!canEdit} />
          </FormFieldGroup>
          <FormFieldGroup label={t("provinceLabel")} htmlFor="p-province">
            <Input id="p-province" value={values.province ?? ""} onChange={(e) => set("province", e.target.value)} disabled={!canEdit} />
          </FormFieldGroup>
          <FormFieldGroup label={t("countryLabel")} htmlFor="p-country">
            <Input id="p-country" value={values.country ?? ""} onChange={(e) => set("country", e.target.value)} disabled={!canEdit} />
          </FormFieldGroup>
          <FormFieldGroup label={t("emergencyContactLabel")} htmlFor="p-emergency">
            <Input id="p-emergency" value={values.emergencyContact ?? ""} onChange={(e) => set("emergencyContact", e.target.value)} disabled={!canEdit} type="tel" />
          </FormFieldGroup>
        </div>
      </FormSection>

      <FormSection title={t("checkTimes")}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormFieldGroup label={t("checkInLabel")} htmlFor="p-checkin">
            <Input id="p-checkin" type="time" value={values.defaultCheckInTime?.slice(0, 5) ?? ""} onChange={(e) => set("defaultCheckInTime", e.target.value)} disabled={!canEdit} />
          </FormFieldGroup>
          <FormFieldGroup label={t("checkOutLabel")} htmlFor="p-checkout">
            <Input id="p-checkout" type="time" value={values.defaultCheckOutTime?.slice(0, 5) ?? ""} onChange={(e) => set("defaultCheckOutTime", e.target.value)} disabled={!canEdit} />
          </FormFieldGroup>
        </div>
      </FormSection>

      <FormSection title={t("wifiHeading")} description={t("wifiDescription")}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormFieldGroup label={t("wifiNameLabel")} htmlFor="p-wifi-name">
            <Input id="p-wifi-name" value={values.wifiName ?? ""} onChange={(e) => set("wifiName", e.target.value)} disabled={!canEdit} />
          </FormFieldGroup>
          <FormFieldGroup label={t("wifiPasswordLabel")} htmlFor="p-wifi-password">
            <div className="relative">
              <Input
                id="p-wifi-password"
                type={showWifiPassword ? "text" : "password"}
                value={values.wifiPassword ?? ""}
                onChange={(e) => set("wifiPassword", e.target.value)}
                disabled={!canEdit}
                className="pr-9 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowWifiPassword((v) => !v)}
                aria-label={showWifiPassword ? t("hideWifiPassword") : t("showWifiPassword")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showWifiPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </FormFieldGroup>
        </div>
      </FormSection>

      <FormSection title={t("rulesHeading")}>
        <FormFieldGroup label={t("houseRulesLabel")} htmlFor="p-house-rules">
          <Textarea id="p-house-rules" rows={3} value={values.houseRules ?? ""} onChange={(e) => set("houseRules", e.target.value)} disabled={!canEdit} />
        </FormFieldGroup>
        <FormFieldGroup label={t("cancellationPolicyLabel")} htmlFor="p-cancellation-policy">
          <Textarea id="p-cancellation-policy" rows={3} value={values.cancellationPolicy ?? ""} onChange={(e) => set("cancellationPolicy", e.target.value)} disabled={!canEdit} />
        </FormFieldGroup>
      </FormSection>

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
