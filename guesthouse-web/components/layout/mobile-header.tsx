"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, Bell, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  /** "back" (default) shows a chevron that pops browser/app history; "root" shows a menu icon linking to /more — reserved for the Dashboard tab root. */
  variant?: "back" | "root";
  rightSlot?: React.ReactNode;
  showNotification?: boolean;
  className?: string;
}

export function MobileHeader({
  title,
  subtitle,
  variant = "back",
  rightSlot,
  showNotification = true,
  className,
}: MobileHeaderProps) {
  const router = useRouter();
  const t = useTranslations("layout.mobileHeader");

  return (
    <header
      className={cn(
        "md:hidden sticky top-0 z-20 flex items-center gap-3 h-14 px-4 bg-card/95 backdrop-blur-md border-b border-border/50",
        className
      )}
    >
      {variant === "back" ? (
        <button
          onClick={() => router.back()}
          aria-label={t("goBack")}
          className="h-9 w-9 -ml-1.5 flex items-center justify-center rounded-full text-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      ) : (
        <Link
          href="/more"
          aria-label={t("openMenu")}
          className="h-9 w-9 -ml-1.5 flex items-center justify-center rounded-full text-foreground hover:bg-muted transition-colors"
        >
          <Menu className="h-5 w-5" />
        </Link>
      )}

      <div className="flex-1 min-w-0">
        <h1 className="text-base font-bold text-foreground leading-tight truncate">{title}</h1>
        {subtitle && <p className="text-[11px] text-muted-foreground leading-tight truncate">{subtitle}</p>}
      </div>

      {rightSlot ? (
        rightSlot
      ) : showNotification ? (
        <Link
          href="/notifications"
          aria-label={t("notifications")}
          className="relative h-9 w-9 flex items-center justify-center rounded-full text-foreground hover:bg-muted transition-colors"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 border-2 border-card" />
        </Link>
      ) : null}
    </header>
  );
}
