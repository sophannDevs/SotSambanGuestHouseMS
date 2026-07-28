"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { LoadingState } from "@/components/shared/loading-state";
import { useAuthStore } from "@/lib/auth-store";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  React.useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  React.useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.replace("/login");
    }
  }, [hasHydrated, isAuthenticated, router]);

  // Brief §14: never show a blank page while loading. Both the brief
  // session-restore window and the moment between "not authenticated" and
  // the redirect effect actually firing need *something* on screen.
  if (!hasHydrated || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <LoadingState label="Loading your session..." />
      </div>
    );
  }

  return (
    // h-screen + overflow-hidden overrides SidebarProvider's default
    // min-h-svh — keeps the sidebar fixed in place while only <main> scrolls,
    // matching the app-shell behavior this layout already had.
    <SidebarProvider className="h-screen overflow-hidden bg-background">
      <AppSidebar />
      <SidebarInset className="overflow-hidden">
        <div className="hidden md:flex">
          <TopBar />
        </div>
        <main className="flex-1 overflow-y-auto pb-24 md:p-6 md:pb-8 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </SidebarInset>
      <BottomNav />
    </SidebarProvider>
  );
}
