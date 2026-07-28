"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { DetailHeader } from "@/components/shared/detail-header";
import { MobileHeader } from "@/components/layout/mobile-header";
import { DetailSection } from "@/components/shared/detail-section";
import { NotAvailableNotice } from "@/components/shared/not-available-notice";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { TranslationEditor } from "@/components/settings/translation-editor";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import { LOCALE_LABELS, SUPPORTED_LOCALES, type Locale } from "@/i18n/config";
import { setLocale } from "@/lib/locale-actions";
import type { PropertyResponse } from "@/lib/api-types";

export default function LocalizationSettingsPage() {
  const t = useTranslations("settings.localization");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const locale = useLocale();
  const [, startTransition] = React.useTransition();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const canView = hasHydrated && hasPermission("property:view");

  const propertyQuery = useQuery({
    queryKey: ["property"],
    queryFn: () => apiFetch<PropertyResponse>("/properties/current"),
    enabled: canView,
  });

  const handleChangeLocale = (next: Locale) => {
    if (next === locale) return;
    startTransition(() => {
      setLocale(next).then(() => router.refresh());
    });
  };

  const content = (
    <div className="space-y-6">
      <DetailSection title={t("preferenceHeading")}>
        <p className="text-xs text-muted-foreground -mt-2">{t("preferenceDescription")}</p>
        <div className="flex gap-2">
          {SUPPORTED_LOCALES.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => handleChangeLocale(code)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border transition-all ${
                locale === code
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              {locale === code && <Check className="h-4 w-4" />}
              {LOCALE_LABELS[code]}
            </button>
          ))}
        </div>
      </DetailSection>

      <DetailSection title={t("regionalHeading")}>
        <p className="text-xs text-muted-foreground -mt-2">{t("regionalDescription")}</p>
        {!hasHydrated || propertyQuery.isLoading ? (
          <PageSkeleton />
        ) : (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">{t("currencyLabel")}</p>
              <p className="font-bold text-foreground">{propertyQuery.data?.currency ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">{t("timezoneLabel")}</p>
              <p className="font-bold text-foreground">{propertyQuery.data?.timezone ?? "—"}</p>
            </div>
          </div>
        )}
        <p className="text-xs text-muted-foreground">{t("regionalEditHint")}</p>
      </DetailSection>

      <NotAvailableNotice title={t("notAvailable.title")} description={t("notAvailable.description")} />

      <div className="bg-card border border-border/60 rounded-3xl p-6 sm:p-8 shadow-xl">
        <TranslationEditor />
      </div>
    </div>
  );

  return (
    <div>
      <div className="md:hidden">
        <MobileHeader title={t("mobileTitle")} />
      </div>
      <div className="hidden md:block">
        <DetailHeader backHref="/settings" backLabel={tCommon("actions.backToSettings")} title={t("title")} description={t("description")} />
      </div>
      {/* Rendered once (not duplicated per breakpoint) — TranslationEditor
          below owns its own query/mutation state, which must not be
          double-mounted. */}
      <div className="p-4 md:p-0 md:mt-6">{content}</div>
    </div>
  );
}
