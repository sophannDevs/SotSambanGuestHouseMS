"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { BOTTOM_NAV_ITEMS } from "@/lib/nav-config";

// Exactly the 5 tabs documented in conventions.md §11 / source-brief B5:
// Dashboard · Reservations · Calendar · Guests · More. Kept as a fixed,
// always-visible set of wayfinding chrome rather than permission-filtered —
// the destination pages themselves are responsible for a permission-denied
// state (per the brief's own per-page UX contract), not the bottom bar.
export function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const moreActive = BOTTOM_NAV_ITEMS.every((item) => !isActive(item.href)) && pathname !== "/dashboard";

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-0 right-0 z-40 h-16 border-t border-border/50 bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <div className="mx-auto grid h-16 max-w-md grid-cols-5">
        {BOTTOM_NAV_ITEMS.map((item) => (
          <TabLink key={item.id} href={item.href} label={t(item.titleKey)} icon={item.icon} active={isActive(item.href)} />
        ))}
        <TabLink href="/more" label={t("groups.more")} icon={Menu} active={moreActive} />
      </div>
    </nav>
  );
}

function TabLink({
  label,
  href,
  icon: Icon,
  active,
}: {
  label: string;
  href: string;
  icon: React.ElementType;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-11 flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors",
        active ? "text-primary" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
      <span className="truncate px-1">{label}</span>
    </Link>
  );
}
