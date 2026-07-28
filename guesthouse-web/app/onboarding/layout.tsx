"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Home } from "lucide-react";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations("onboarding");

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between relative overflow-hidden">
      {/* Top Header Bar */}
      <header className="h-16 border-b border-border/40 bg-card/60 backdrop-blur-md px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
            <Home className="h-5 w-5" />
          </div>
          <span className="font-bold text-lg tracking-tight">{t("wizard.headerTitle")}</span>
        </div>
        <span className="text-xs text-muted-foreground font-medium">Sot Samban Guest House</span>
      </header>

      {/* Main Step Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 z-10 flex flex-col justify-center">
        {children}
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-muted-foreground border-t border-border/30 bg-card/30">
        {t("wizard.footer")}
      </footer>
    </div>
  );
}
