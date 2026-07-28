"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/layout/header";
import { MobileHeader } from "@/components/layout/mobile-header";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "sonner";
import {
  Building2,
  FileText,
  Percent,
  BedDouble,
  UserCheck,
  Bell,
  Globe,
  Terminal,
  ChevronRight,
  LogOut,
} from "lucide-react";

interface SettingsRow {
  icon: React.ElementType;
  label: string;
  description: string;
  href: string;
}

// Replaces the previous 4-tab single page (474 lines) with the brief's own
// §29 drill-down pattern: a list of sections, each its own dedicated
// sub-page. Renders identically at every breakpoint — fixes the mobile bug
// where every row linked back to /settings itself instead of a real
// sub-page (responsive-strategy.md §3), by construction rather than a
// mobile-only patch. Rows that already have a real, dedicated page
// elsewhere in the app (Rooms & Rates, Staff & Security, Notifications)
// link straight there instead of duplicating that page under /settings.
export default function SettingsPage() {
  const router = useRouter();
  const { user, clearSession } = useAuthStore();
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");

  const SETTINGS_ROWS: SettingsRow[] = [
    { icon: Building2, label: t("rows.property"), description: t("rows.propertyDescription"), href: "/settings/property" },
    { icon: FileText, label: t("rows.documents"), description: t("rows.documentsDescription"), href: "/settings/documents" },
    { icon: Percent, label: t("rows.taxes"), description: t("rows.taxesDescription"), href: "/settings/taxes" },
    { icon: BedDouble, label: t("rows.rooms"), description: t("rows.roomsDescription"), href: "/rooms" },
    { icon: UserCheck, label: t("rows.staffSecurity"), description: t("rows.staffSecurityDescription"), href: "/staff" },
    { icon: Bell, label: t("rows.notification"), description: t("rows.notificationDescription"), href: "/notifications" },
    { icon: Globe, label: t("rows.language"), description: t("rows.languageDescription"), href: "/settings/localization" },
    { icon: Terminal, label: t("rows.localDev"), description: t("rows.localDevDescription"), href: "/settings/local-dev" },
  ];

  const handleLogout = () => {
    clearSession();
    toast.success(tCommon("actions.loggedOutSuccess"));
    router.push("/login");
  };

  const displayName = user?.displayName || t("profile.ownerFallback");
  const primaryRole = user?.roles?.[0] || t("profile.roleFallback");

  const rowsList = (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {SETTINGS_ROWS.map((row) => {
        const Icon = row.icon;
        return (
          <Link
            key={row.href}
            href={row.href}
            className="flex items-center gap-3 bg-card border border-border/60 rounded-2xl p-4 shadow-sm hover:bg-muted/30 transition-colors"
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-4.5 w-4.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{row.label}</p>
              <p className="text-xs text-muted-foreground truncate">{row.description}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </Link>
        );
      })}
    </div>
  );

  return (
    <div>
      {/* Mobile view */}
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

          {rowsList}

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
        <PageHeader title={t("pageTitle")} description={t("pageDescription")} />
        {rowsList}
      </div>
    </div>
  );
}
