"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { MobileHeader } from "@/components/layout/mobile-header";
import { PageHeader } from "@/components/layout/header";
import { useAuthStore } from "@/lib/auth-store";
import { useTheme } from "@/components/theme-provider";
import { UserCog, KeyRound, Sun, Moon, Globe, LogOut, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export default function ProfilePage() {
  const t = useTranslations("profile");
  const tCommon = useTranslations("common.actions");
  const router = useRouter();
  const { user, clearSession } = useAuthStore();
  const { theme, setTheme } = useTheme();

  const displayName = user?.displayName || t("fallbackName");
  const primaryRole = user?.roles?.[0] || t("fallbackRole");
  const phone = "+855 12 345 678";

  const handleLogout = () => {
    clearSession();
    toast.success(tCommon("loggedOutSuccess"));
    router.push("/login");
  };

  return (
    <div className="mx-auto max-w-lg md:max-w-2xl">
      <MobileHeader title={t("mobileTitle")} showNotification={false} />
      <div className="hidden md:block">
        <PageHeader title={t("title")} description={t("description")} />
      </div>

      <div className="p-4 space-y-5">
        <div className="flex flex-col items-center text-center gap-2 pt-2">
          <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">{displayName}</h2>
            <p className="text-xs text-muted-foreground">{primaryRole} · {phone}</p>
          </div>
        </div>

        <div className="bg-card border border-border/60 rounded-2xl shadow-sm divide-y divide-border/40 overflow-hidden">
          <button
            onClick={() => toast.info(t("toast.editProfileOpened"))}
            className="w-full flex items-center gap-3 px-4 py-3.5"
          >
            <UserCog className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="flex-1 text-sm font-medium text-foreground text-left">{t("menu.editProfile")}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>

          <button
            onClick={() => toast.info(t("toast.changePasswordOpened"))}
            className="w-full flex items-center gap-3 px-4 py-3.5"
          >
            <KeyRound className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="flex-1 text-sm font-medium text-foreground text-left">{t("menu.changePassword")}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>

          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-full flex items-center gap-3 px-4 py-3.5"
          >
            {theme === "dark" ? (
              <Moon className="h-4 w-4 text-primary flex-shrink-0" />
            ) : (
              <Sun className="h-4 w-4 text-primary flex-shrink-0" />
            )}
            <span className="flex-1 text-sm font-medium text-foreground text-left">{t("menu.appTheme")}</span>
            <span className="text-xs text-muted-foreground">{t(`theme.${theme}`)}</span>
          </button>

          <button
            onClick={() => toast.info(t("toast.languageComingSoon"))}
            className="w-full flex items-center gap-3 px-4 py-3.5"
          >
            <Globe className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="flex-1 text-sm font-medium text-foreground text-left">{t("menu.language")}</span>
            <span className="text-xs text-muted-foreground">{t("languageValue")}</span>
          </button>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold text-sm rounded-2xl py-3.5"
        >
          <LogOut className="h-4 w-4" />
          <span>{tCommon("logout")}</span>
        </button>
      </div>
    </div>
  );
}
