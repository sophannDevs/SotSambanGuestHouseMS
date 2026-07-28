"use client";

import * as React from "react";
import { PageHeader } from "@/components/layout/header";
import { MobileHeader } from "@/components/layout/mobile-header";
import {
  Save,
  Building2,
  Percent,
  ShieldCheck,
  Mail,
  Wifi,
  Clock,
  MapPin,
  FileText,
  Check,
  DollarSign,
  Repeat,
  Users,
  Bell,
  Archive,
  Globe,
  Info,
  LogOut,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "sonner";
import { LOCALE_LABELS, SUPPORTED_LOCALES, type Locale } from "@/i18n/config";
import { setLocale } from "@/lib/locale-actions";
import { TranslationEditor } from "@/components/settings/translation-editor";

export default function SettingsPage() {
  const router = useRouter();
  const { user, clearSession } = useAuthStore();
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const [, startTransition] = React.useTransition();

  const SETTINGS_ROWS = [
    { icon: Building2, label: t("rows.businessProfile"), href: "/settings" },
    { icon: DollarSign, label: t("rows.currency"), href: "/settings" },
    { icon: Repeat, label: t("rows.exchangeRate"), href: "/settings" },
    { icon: Users, label: t("rows.users"), href: "/staff" },
    { icon: Bell, label: t("rows.notification"), href: "/notifications" },
    { icon: Archive, label: t("rows.backupRestore"), href: "/settings" },
    { icon: Globe, label: t("rows.language"), href: "/settings" },
    { icon: Info, label: t("rows.aboutApp"), href: "/settings" },
  ];

  const handleLogout = () => {
    clearSession();
    toast.success(tCommon("actions.loggedOutSuccess"));
    router.push("/login");
  };

  const [activeTab, setActiveTab] = React.useState<"property" | "taxes" | "policies" | "language" | "dev">("property");

  const handleChangeLocale = (next: Locale) => {
    if (next === locale) return;
    startTransition(() => {
      setLocale(next).then(() => router.refresh());
    });
  };

  // Property State
  const [name, setName] = React.useState("Sot Samban Guest House");
  const [code] = React.useState("SSGH");
  const [description, setDescription] = React.useState("Local family-operated guest house in Siem Reap");
  const [timezone, setTimezone] = React.useState("Asia/Phnom_Penh");
  const [currency, setCurrency] = React.useState("USD");
  const [checkInTime, setCheckInTime] = React.useState("14:00");
  const [checkOutTime, setCheckOutTime] = React.useState("12:00");

  // Address
  const [addressLine, setAddressLine] = React.useState("Street 05, Wat Bo Village");
  const [city, setCity] = React.useState("Siem Reap");
  const [province, setProvince] = React.useState("Siem Reap");
  const [taxId, setTaxId] = React.useState("TAX-883921");

  // Wi-Fi & Policies
  const [wifiName, setWifiName] = React.useState("SotSamban_Guest_WiFi");
  const [wifiPassword, setWifiPassword] = React.useState("Welcome2026");
  const [houseRules, setHouseRules] = React.useState("Quiet hours after 22:00. No smoking inside rooms.");
  const [cancellationPolicy, setCancellationPolicy] = React.useState("Free cancellation up to 24 hours before check-in.");

  // Tax State
  const [vatRate, setVatRate] = React.useState("10.00");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(t("savedSuccess"));
  };

  const displayName = user?.displayName || t("profile.ownerFallback");
  const primaryRole = user?.roles?.[0] || t("profile.roleFallback");

  return (
    <div>
      {/* Mobile view — matches the "Settings" mockup screen */}
      <div className="md:hidden">
        <MobileHeader title={t("pageTitle")} showNotification={false} />
        <div className="p-4 space-y-4">
          <Link href="/profile" className="flex items-center gap-3 bg-card border border-border/60 rounded-2xl p-4 shadow-sm">
            <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground">{t("profile.roleCountry", { role: primaryRole })}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>

          <div className="bg-card border border-border/60 rounded-2xl shadow-sm divide-y divide-border/40 overflow-hidden">
            {SETTINGS_ROWS.map((row) => {
              const Icon = row.icon;
              return (
                <Link key={row.label} href={row.href} className="flex items-center gap-3 px-4 py-3.5">
                  <Icon className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="flex-1 text-sm font-medium text-foreground">{row.label}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              );
            })}
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold text-sm rounded-2xl py-3.5"
          >
            <LogOut className="h-4 w-4" />
            <span>{tCommon("actions.logout")}</span>
          </button>
        </div>
      </div>

      {/* Desktop / tablet view */}
      <div className="hidden md:block space-y-6">
      <PageHeader
        title={t("pageTitle")}
        description={t("pageDescription")}
        actionLabel={tCommon("actions.saveAll")}
        actionIcon={Save}
        onAction={() => toast.success(t("savedSuccess"))}
      />

      {/* Tabs Header */}
      <div className="flex border-b border-border/40 space-x-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab("property")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === "property"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>{t("tabs.property")}</span>
        </button>

        <button
          onClick={() => setActiveTab("taxes")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === "taxes"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Percent className="h-4 w-4" />
          <span>{t("tabs.taxes")}</span>
        </button>

        <button
          onClick={() => setActiveTab("policies")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === "policies"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>{t("tabs.policies")}</span>
        </button>

        <button
          onClick={() => setActiveTab("language")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === "language"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Globe className="h-4 w-4" />
          <span>{t("tabs.language")}</span>
        </button>

        <button
          onClick={() => setActiveTab("dev")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === "dev"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Mail className="h-4 w-4" />
          <span>{t("tabs.dev")}</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "language" ? (
        <div className="bg-card border border-border/60 rounded-3xl p-6 sm:p-8 shadow-xl space-y-8">
          <div className="space-y-3">
            <h3 className="text-base font-semibold flex items-center gap-2 border-b border-border/40 pb-2">
              <Globe className="h-4 w-4 text-primary" />
              {t("language.preferenceHeading")}
            </h3>
            <p className="text-xs text-muted-foreground">{t("language.preferenceDescription")}</p>
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
          </div>

          <TranslationEditor />
        </div>
      ) : (
      <form onSubmit={handleSave} className="bg-card border border-border/60 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        {activeTab === "property" && (
          <div className="space-y-6">
            <h3 className="text-base font-semibold flex items-center gap-2 border-b border-border/40 pb-2">
              <Building2 className="h-4 w-4 text-primary" />
              {t("property.generalInfo")}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  {t("property.nameLabel")}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 px-3.5 text-sm bg-muted/40 border border-border/60 rounded-xl focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  {t("property.codeLabel")}
                </label>
                <input
                  type="text"
                  value={code}
                  disabled
                  className="w-full h-10 px-3.5 text-sm bg-muted/20 border border-border/40 rounded-xl font-mono text-muted-foreground cursor-not-allowed"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  {t("property.descriptionLabel")}
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 text-sm bg-muted/40 border border-border/60 rounded-xl focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  {t("property.timezoneLabel")}
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full h-10 px-3.5 text-sm bg-muted/40 border border-border/60 rounded-xl focus:ring-2 focus:ring-primary/30"
                >
                  <option value="Asia/Phnom_Penh">{t("property.timezonePhnomPenh")}</option>
                  <option value="Asia/Bangkok">{t("property.timezoneBangkok")}</option>
                  <option value="UTC">{t("property.timezoneUtc")}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  {t("property.currencyLabel")}
                </label>
                <input
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full h-10 px-3.5 text-sm bg-muted/40 border border-border/60 rounded-xl font-semibold"
                />
              </div>
            </div>

            <h3 className="text-base font-semibold flex items-center gap-2 border-b border-border/40 pb-2 pt-4">
              <MapPin className="h-4 w-4 text-primary" />
              {t("property.addressContact")}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  {t("property.addressLineLabel")}
                </label>
                <input
                  type="text"
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  className="w-full h-10 px-3.5 text-sm bg-muted/40 border border-border/60 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  {t("property.cityLabel")}
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full h-10 px-3.5 text-sm bg-muted/40 border border-border/60 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  {t("property.provinceLabel")}
                </label>
                <input
                  type="text"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full h-10 px-3.5 text-sm bg-muted/40 border border-border/60 rounded-xl"
                />
              </div>
            </div>

            <h3 className="text-base font-semibold flex items-center gap-2 border-b border-border/40 pb-2 pt-4">
              <Clock className="h-4 w-4 text-primary" />
              {t("property.checkTimes")}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  {t("property.checkInLabel")}
                </label>
                <input
                  type="time"
                  value={checkInTime}
                  onChange={(e) => setCheckInTime(e.target.value)}
                  className="w-full h-10 px-3.5 text-sm bg-muted/40 border border-border/60 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  {t("property.checkOutLabel")}
                </label>
                <input
                  type="time"
                  value={checkOutTime}
                  onChange={(e) => setCheckOutTime(e.target.value)}
                  className="w-full h-10 px-3.5 text-sm bg-muted/40 border border-border/60 rounded-xl"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "taxes" && (
          <div className="space-y-6">
            <h3 className="text-base font-semibold flex items-center gap-2 border-b border-border/40 pb-2">
              <Percent className="h-4 w-4 text-primary" />
              {t("taxes.heading")}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  {t("taxes.vatLabel")}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={vatRate}
                  onChange={(e) => setVatRate(e.target.value)}
                  className="w-full h-10 px-3.5 text-sm bg-muted/40 border border-border/60 rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  {t("taxes.tinLabel")}
                </label>
                <input
                  type="text"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  className="w-full h-10 px-3.5 text-sm bg-muted/40 border border-border/60 rounded-xl"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "policies" && (
          <div className="space-y-6">
            <h3 className="text-base font-semibold flex items-center gap-2 border-b border-border/40 pb-2">
              <Wifi className="h-4 w-4 text-primary" />
              {t("policies.wifiHeading")}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  {t("policies.wifiNameLabel")}
                </label>
                <input
                  type="text"
                  value={wifiName}
                  onChange={(e) => setWifiName(e.target.value)}
                  className="w-full h-10 px-3.5 text-sm bg-muted/40 border border-border/60 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  {t("policies.wifiPasswordLabel")}
                </label>
                <input
                  type="text"
                  value={wifiPassword}
                  onChange={(e) => setWifiPassword(e.target.value)}
                  className="w-full h-10 px-3.5 text-sm bg-muted/40 border border-border/60 rounded-xl font-mono"
                />
              </div>
            </div>

            <h3 className="text-base font-semibold flex items-center gap-2 border-b border-border/40 pb-2 pt-4">
              <FileText className="h-4 w-4 text-primary" />
              {t("policies.rulesHeading")}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  {t("policies.houseRulesLabel")}
                </label>
                <textarea
                  rows={3}
                  value={houseRules}
                  onChange={(e) => setHouseRules(e.target.value)}
                  className="w-full p-3 text-sm bg-muted/40 border border-border/60 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  {t("policies.cancellationPolicyLabel")}
                </label>
                <textarea
                  rows={3}
                  value={cancellationPolicy}
                  onChange={(e) => setCancellationPolicy(e.target.value)}
                  className="w-full p-3 text-sm bg-muted/40 border border-border/60 rounded-xl"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "dev" && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold flex items-center gap-2 border-b border-border/40 pb-2">
              <Mail className="h-4 w-4 text-primary" />
              {t("dev.heading")}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t("dev.description")}
            </p>
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/40 font-mono text-xs text-muted-foreground space-y-2">
              <div className="flex items-center justify-between border-b border-border/30 pb-2">
                <span className="font-semibold text-foreground">{t("dev.simulatorTitle")}</span>
                <span className="text-emerald-500 font-bold">{t("dev.simulatedMailCount")}</span>
              </div>
              <p>{t("dev.toLabel")}: owner@sotsamban.local</p>
              <p>{t("dev.subjectLabel")}: {t("dev.subjectValue")}</p>
              <p className="text-blue-500 hover:underline">{t("dev.linkLabel")}: http://localhost:3000/reset-password?token=local-demo-token-12345</p>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-border/40">
          <button
            type="submit"
            className="px-5 py-2.5 bg-primary text-primary-foreground font-semibold text-sm rounded-xl shadow-md shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-2"
          >
            <Check className="h-4 w-4" />
            <span>{t("saveButton")}</span>
          </button>
        </div>
      </form>
      )}
      </div>
    </div>
  );
}
