"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/header";
import { MobileHeader } from "@/components/layout/mobile-header";
import { StatCard } from "@/components/shared/stat-card";
import { DetailSection } from "@/components/shared/detail-section";
import { NotAvailableNotice } from "@/components/shared/not-available-notice";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import { isTodayInPropertyZone } from "@/lib/dates";
import { formatDualPrice } from "@/lib/currency";
import type { FinancialReportDto, BookingDto } from "@/lib/api-types";
import { TrendingUp, TrendingDown, BarChart3, Percent, LogIn, LogOut, CalendarDays, Download } from "lucide-react";

export default function ReportsPage() {
  const t = useTranslations("reports");
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const canViewReport = hasHydrated && hasPermission("report:view");
  const canViewBookings = hasHydrated && hasPermission("booking:view");

  const reportQuery = useQuery({
    queryKey: ["reports", "financial"],
    queryFn: () => apiFetch<FinancialReportDto>("/reports/financial"),
    enabled: canViewReport,
  });
  const arrivalsQuery = useQuery({
    queryKey: ["front-desk", "arrivals"],
    queryFn: () => apiFetch<BookingDto[]>("/front-desk/arrivals"),
    enabled: canViewBookings,
  });
  const inHouseQuery = useQuery({
    queryKey: ["front-desk", "in-house"],
    queryFn: () => apiFetch<BookingDto[]>("/front-desk/in-house"),
    enabled: canViewBookings,
  });

  const enabledQueries = [
    canViewReport ? reportQuery : null,
    canViewBookings ? arrivalsQuery : null,
    canViewBookings ? inHouseQuery : null,
  ].filter((q): q is NonNullable<typeof q> => q !== null);

  const isLoading = !hasHydrated || enabledQueries.some((q) => q.isLoading);
  const isError = enabledQueries.some((q) => q.isError);
  const refetchAll = () => enabledQueries.forEach((q) => q.refetch());

  const report = reportQuery.data;
  const arrivals = arrivalsQuery.data ?? [];
  const inHouse = inHouseQuery.data ?? [];

  const arrivalsToday = arrivals.filter((r) => isTodayInPropertyZone(r.arrivalDate));
  const checkedInToday = inHouse.filter((r) => isTodayInPropertyZone(r.arrivalDate));
  const bookingsToday = arrivalsToday.length + checkedInToday.length;
  const checkOutsToday = inHouse.filter((r) => isTodayInPropertyZone(r.departureDate));

  const gross = formatDualPrice(report?.grossRevenue ?? 0);
  const expenses = formatDualPrice(report?.totalExpenses ?? 0);
  const netProfit = report?.netProfitLoss ?? 0;
  const netProfitDisplay = formatDualPrice(Math.abs(netProfit));
  const isNetPositive = netProfit >= 0;
  const occupancyRate = report ? Number(report.occupancyRate).toFixed(1) : "0.0";
  const adr = formatDualPrice(report?.averageDailyRate ?? 0);
  const revPar = formatDualPrice(report?.revPar ?? 0);

  return (
    <div>
      {/* Mobile view */}
      <div className="md:hidden">
        <MobileHeader title={t("title")} showNotification={false} />
        <div className="p-4 space-y-4">
          {isLoading ? (
            <PageSkeleton />
          ) : isError ? (
            <ErrorState title={t("loadError")} onRetry={refetchAll} />
          ) : (
            <>
              {canViewBookings && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm space-y-1">
                    <CalendarDays className="h-4 w-4 text-emerald-500" />
                    <p className="text-xl font-bold text-foreground">{bookingsToday}</p>
                    <p className="text-xs text-muted-foreground">{t("stats.bookings")}</p>
                  </div>
                  <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm space-y-1">
                    <LogIn className="h-4 w-4 text-indigo-500" />
                    <p className="text-xl font-bold text-foreground">{checkedInToday.length}</p>
                    <p className="text-xs text-muted-foreground">{t("stats.checkIns")}</p>
                  </div>
                  <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm space-y-1">
                    <LogOut className="h-4 w-4 text-amber-500" />
                    <p className="text-xl font-bold text-foreground">{checkOutsToday.length}</p>
                    <p className="text-xs text-muted-foreground">{t("stats.checkOuts")}</p>
                  </div>
                  <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm space-y-1">
                    <Percent className="h-4 w-4 text-blue-500" />
                    <p className="text-xl font-bold text-foreground">{occupancyRate}%</p>
                    <p className="text-xs text-muted-foreground">{t("stats.occupancyRate")}</p>
                  </div>
                </div>
              )}

              {canViewReport && (
                <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">{t("stats.grossRevenue")}</p>
                  <p className="text-2xl font-black text-emerald-500">{gross.usd}</p>
                  <p className="text-xs text-muted-foreground">{t("allTimeCaption")}</p>
                </div>
              )}

              <NotAvailableNotice title={t("notAvailable.title")} description={t("notAvailable.description")} />
            </>
          )}
        </div>

        <div className="p-4">
          <button
            disabled
            title={t("toasts.exportNotAvailable")}
            className="w-full h-12 rounded-2xl bg-muted text-muted-foreground font-semibold text-sm flex items-center justify-center gap-2 cursor-not-allowed"
          >
            {t("actions.exportReport")}
          </button>
        </div>
      </div>

      {/* Desktop / tablet view */}
      <div className="hidden md:block space-y-6">
        <PageHeader
          title={t("title")}
          description={t("description")}
          actionLabel={t("actions.exportCsv")}
          actionIcon={Download}
          actionDisabledReason={t("toasts.exportNotAvailable")}
        />

        {isLoading ? (
          <PageSkeleton />
        ) : isError ? (
          <ErrorState title={t("loadError")} onRetry={refetchAll} />
        ) : (
          <div className="space-y-6">
            {canViewReport && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard
                  label={t("stats.grossRevenue")}
                  value={gross.usd}
                  icon={TrendingUp}
                  tone="success"
                  description={t("allTimeCaption")}
                  href="/payments"
                />
                <StatCard
                  label={t("stats.approvedExpenses")}
                  value={expenses.usd}
                  icon={BarChart3}
                  tone="destructive"
                  description={t("allTimeCaption")}
                  href="/expenses"
                />
                <StatCard
                  label={isNetPositive ? t("stats.netProfit") : t("stats.netLoss")}
                  value={`${isNetPositive ? "" : "-"}${netProfitDisplay.usd}`}
                  icon={isNetPositive ? TrendingUp : TrendingDown}
                  tone={isNetPositive ? "primary" : "destructive"}
                  description={t("allTimeCaption")}
                />
                <StatCard label={t("stats.occupancyRate")} value={`${occupancyRate}%`} icon={Percent} tone="warning" description={t("allTimeCaption")} href="/rooms" />
                <StatCard label={t("stats.adr")} value={adr.usd} icon={TrendingUp} tone="info" description={t("allTimeCaption")} />
                <StatCard label={t("stats.revpar")} value={revPar.usd} icon={TrendingUp} tone="info" description={t("allTimeCaption")} />
              </div>
            )}

            {canViewBookings && (
              <DetailSection title={t("charts.todayActivity")}>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-2xl font-bold text-foreground">{bookingsToday}</p>
                    <p className="text-xs text-muted-foreground">{t("stats.bookings")}</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{checkedInToday.length}</p>
                    <p className="text-xs text-muted-foreground">{t("stats.checkIns")}</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{checkOutsToday.length}</p>
                    <p className="text-xs text-muted-foreground">{t("stats.checkOuts")}</p>
                  </div>
                </div>
              </DetailSection>
            )}

            {canViewReport && (
              <DetailSection title={t("charts.plSummary")}>
                <div className="divide-y divide-border/40 text-sm">
                  <div className="py-3 flex justify-between items-center font-semibold">
                    <span className="text-foreground">{t("table.roomRevenue")}</span>
                    <span className="text-emerald-500 font-bold">{gross.usd}</span>
                  </div>
                  <div className="py-3 flex justify-between items-center font-semibold">
                    <span className="text-muted-foreground">{t("table.approvedExpenses")}</span>
                    <span className="text-rose-500 font-medium">-{expenses.usd}</span>
                  </div>
                  <div className="py-4 flex justify-between items-center text-base font-black border-t-2 border-border/60">
                    <span className="text-foreground">{t("table.netOperatingProfit")}</span>
                    <span className={isNetPositive ? "text-indigo-500" : "text-rose-500"}>
                      {isNetPositive ? "" : "-"}
                      {netProfitDisplay.usd}
                    </span>
                  </div>
                </div>
              </DetailSection>
            )}

            <NotAvailableNotice title={t("notAvailable.title")} description={t("notAvailable.description")} />
          </div>
        )}
      </div>
    </div>
  );
}
