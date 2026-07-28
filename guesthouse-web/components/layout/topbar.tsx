"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Search, Bell, Sun, Moon, Globe, LogOut, User } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useAuthStore } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { LOCALE_LABELS, SUPPORTED_LOCALES, type Locale } from "@/i18n/config";
import { setLocale } from "@/lib/locale-actions";

export function TopBar() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, clearSession } = useAuthStore();
  const locale = useLocale();
  const t = useTranslations("layout");
  const tCommon = useTranslations("common");
  const [, startTransition] = React.useTransition();

  const handleChangeLocale = (next: Locale) => {
    if (next === locale) return;
    startTransition(() => {
      setLocale(next).then(() => router.refresh());
    });
  };

  const handleLogout = () => {
    clearSession();
    toast.success(tCommon("actions.loggedOutSuccess"));
    router.push("/login");
  };

  const displayName = user?.displayName || tCommon("fallback.guestUser");
  const email = user?.email || "guest@sotsamban.local";
  const primaryRole = user?.roles?.[0] || "STAFF";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center gap-4 border-b border-border/40 bg-card/70 px-4 backdrop-blur-md lg:px-6">
      <Tooltip>
        <TooltipTrigger asChild>
          <SidebarTrigger />
        </TooltipTrigger>
        <TooltipContent>{t("tooltip.toggleSidebar")}</TooltipContent>
      </Tooltip>

      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          type="search"
          placeholder={t("search.placeholder")}
          className="h-10 pl-9"
        />
      </div>

      <div className="flex items-center gap-1.5">
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={t("tooltip.switchLanguage")}>
                  <Globe />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>{t("tooltip.language")}</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              {SUPPORTED_LOCALES.map((code) => (
                <DropdownMenuItem key={code} onSelect={() => handleChangeLocale(code)}>
                  <span className="flex-1">{LOCALE_LABELS[code]}</span>
                  {locale === code && <span aria-hidden="true">✓</span>}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={theme === "dark" ? t("tooltip.switchToLight") : t("tooltip.switchToDark")}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun /> : <Moon />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{theme === "dark" ? t("tooltip.lightMode") : t("tooltip.darkMode")}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={t("tooltip.notifications")} asChild>
              <Link href="/notifications">
                <Bell />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("tooltip.notifications")}</TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-10 gap-2 pl-1.5 pr-2.5">
              <Avatar className="size-7">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                  {initial}
                </AvatarFallback>
              </Avatar>
              <span className="hidden flex-col items-start leading-tight sm:flex">
                <span className="text-xs font-semibold">{displayName}</span>
                <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  {primaryRole}
                </span>
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <p className="text-xs font-semibold">{displayName}</p>
              <p className="truncate text-[11px] text-muted-foreground">{email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <User />
                  <span>{t("menu.profileSettings")}</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={handleLogout}>
              <LogOut />
              <span>{t("menu.logOut")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
