"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { MobileHeader } from "@/components/layout/mobile-header";
import { PageHeader } from "@/components/layout/header";
import { useAuthStore } from "@/lib/auth-store";
import { getMoreNavGroups } from "@/lib/nav-config";
import { LogOut, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export default function MorePage() {
  const router = useRouter();
  const clearSession = useAuthStore((state) => state.clearSession);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");

  const groups = React.useMemo(
    () =>
      getMoreNavGroups()
        .map((group) => ({
          ...group,
          items: group.items.filter((item) => hasPermission(item.permission)),
        }))
        .filter((group) => group.items.length > 0),
    [hasPermission]
  );

  const handleLogout = () => {
    clearSession();
    toast.success(tCommon("actions.loggedOutSuccess"));
    router.push("/login");
  };

  return (
    <div className="mx-auto max-w-lg md:max-w-3xl">
      <MobileHeader title={t("morePage.title")} showNotification={false} />
      <div className="hidden md:block">
        <PageHeader
          title={t("morePage.title")}
          description={t("morePage.description")}
        />
      </div>
      <div className="space-y-5 p-4 md:grid md:grid-cols-2 md:gap-5 md:space-y-0 md:p-0">
        {groups.map((group) => (
          <div key={group.id}>
            <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t(group.titleKey)}
            </h2>
            <div className="divide-y divide-border/40 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="flex min-h-11 items-center gap-3 px-4 py-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                  >
                    <Icon className="h-4 w-4 flex-shrink-0 text-primary" aria-hidden="true" />
                    <span className="flex-1 text-sm font-medium text-foreground">{t(item.titleKey)}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        <button
          onClick={handleLogout}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-destructive/10 py-3.5 text-sm font-semibold text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:col-span-2"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          <span>{tCommon("actions.logout")}</span>
        </button>
      </div>
    </div>
  );
}
