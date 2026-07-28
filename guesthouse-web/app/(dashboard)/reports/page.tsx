"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/layout/header";
import { MobileHeader } from "@/components/layout/mobile-header";
import { formatDualPrice } from "@/lib/currency";
import { BarChart3, TrendingUp, Calendar, LogIn, LogOut, CalendarDays, Download } from "lucide-react";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

const REVENUE_TREND = [
  { time: "12AM", value: 0 },
  { time: "6AM", value: 180 },
  { time: "12PM", value: 620 },
  { time: "6PM", value: 980 },
  { time: "12AM", value: 1250 },
];

function RevenueChart() {
  return (
    <div className="h-40">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={REVENUE_TREND} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <XAxis dataKey="time" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(value: number) => formatDualPrice(value).usd}
            contentStyle={{ fontSize: 12, borderRadius: 12 }}
          />
          <Line type="monotone" dataKey="value" stroke="hsl(221.2 83.2% 53.3%)" strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function ReportsPage() {
  const t = useTranslations("reports");
  const revenue = formatDualPrice(1450);
  const todayRevenue = formatDualPrice(1250);

  return (
    <div>
      {/* Mobile view — matches the "Reports" mockup screen */}
      <div className="md:hidden">
        <MobileHeader title={t("title")} showNotification={false} />
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between bg-card border border-border/60 rounded-2xl px-4 h-11 shadow-sm">
            <span className="text-sm font-semibold text-foreground">Jul 20 – Jul 27</span>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm space-y-1">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <p className="text-xl font-bold text-foreground">{todayRevenue.usd}</p>
              <p className="text-xs text-muted-foreground">{t("stats.revenue")}</p>
            </div>
            <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm space-y-1">
              <CalendarDays className="h-4 w-4 text-blue-500" />
              <p className="text-xl font-bold text-foreground">24</p>
              <p className="text-xs text-muted-foreground">{t("stats.bookings")}</p>
            </div>
            <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm space-y-1">
              <LogIn className="h-4 w-4 text-indigo-500" />
              <p className="text-xl font-bold text-foreground">12</p>
              <p className="text-xs text-muted-foreground">{t("stats.checkIns")}</p>
            </div>
            <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm space-y-1">
              <LogOut className="h-4 w-4 text-amber-500" />
              <p className="text-xl font-bold text-foreground">8</p>
              <p className="text-xs text-muted-foreground">{t("stats.checkOuts")}</p>
            </div>
          </div>

          <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm space-y-2">
            <h3 className="text-sm font-bold text-foreground">{t("charts.revenueChart")}</h3>
            <RevenueChart />
          </div>
        </div>

        <div className="p-4">
          <button
            onClick={() => toast.success(t("toasts.reportExported"))}
            className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/30 active:scale-[0.99] transition-transform"
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
          onAction={() => toast.success(t("toasts.csvExported"))}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border border-border/60 rounded-3xl p-5 shadow-lg space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase">{t("stats.grossRevenue")}</p>
            <p className="text-3xl font-black text-emerald-500">{revenue.usd}</p>
            <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1 text-emerald-500">
              <TrendingUp className="h-3 w-3" /> {t("stats.vsLastMonth", { percent: "+14%" })}
            </p>
          </div>

          <div className="bg-card border border-border/60 rounded-3xl p-5 shadow-lg space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase">{t("stats.approvedExpenses")}</p>
            <p className="text-3xl font-black text-rose-500">$245.00</p>
            <p className="text-[11px] text-muted-foreground font-medium">{t("stats.approvedExpensesDescription")}</p>
          </div>

          <div className="bg-card border border-border/60 rounded-3xl p-5 shadow-lg space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase">{t("stats.netProfit")}</p>
            <p className="text-3xl font-black text-indigo-500">$1,205.00</p>
            <p className="text-[11px] text-emerald-500 font-medium">{t("stats.profitMargin", { percent: "83.1" })}</p>
          </div>

          <div className="bg-card border border-border/60 rounded-3xl p-5 shadow-lg space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase">{t("stats.occupancyRate")}</p>
            <p className="text-3xl font-black text-amber-500">75.0%</p>
            <p className="text-[11px] text-muted-foreground font-medium">{t("stats.adrRevPar", { adr: "$45.00", revpar: "$33.75" })}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-card border border-border/60 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              {t("charts.revenueTrendToday")}
            </h3>
            <RevenueChart />
          </div>

          <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              {t("charts.plSummary", { month: "July 2026" })}
            </h3>
            <div className="divide-y divide-border/40 text-sm">
              <div className="py-3 flex justify-between items-center font-semibold">
                <span className="text-foreground">{t("table.roomRevenue")}</span>
                <span className="text-emerald-500 font-bold">{revenue.usd}</span>
              </div>
              <div className="py-3 flex justify-between items-center font-semibold">
                <span className="text-muted-foreground">{t("table.utilitiesSupplies")}</span>
                <span className="text-rose-500 font-medium">-$245.00</span>
              </div>
              <div className="py-4 flex justify-between items-center text-base font-black border-t-2 border-border/60">
                <span className="text-foreground">{t("table.netOperatingProfit")}</span>
                <span className="text-indigo-500 font-black">$1,205.00</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
