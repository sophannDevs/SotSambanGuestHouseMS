"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/header";
import { MobileHeader } from "@/components/layout/mobile-header";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import { isTodayInPropertyZone } from "@/lib/dates";
import { formatDualPrice } from "@/lib/currency";
import { toneForStatus } from "@/components/ui/status-badge";
import { StatCard } from "@/components/shared/stat-card";
import { DateDisplay } from "@/components/shared/date-display";
import { MoneyDisplay } from "@/components/shared/money-display";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import type { RoomDto, ReservationDto, PaymentDto } from "@/lib/api-types";
import {
  BedDouble,
  CalendarCheck,
  CreditCard,
  Sparkles,
  LogIn,
  LogOut,
  CalendarDays,
  Home,
} from "lucide-react";

// Dot color derives from the same STATUS_TONE map status-badge.tsx uses
// (design-system.md §2.4) instead of a second, independent color choice —
// this list previously picked its own emerald/rose/amber/slate values.
const TONE_DOT_CLASS: Record<string, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-destructive",
  info: "bg-info",
  neutral: "bg-muted-foreground",
};

// Folds the backend's finer-grained `derivedStatus` values (business-rules.md
// §9.6/FR-075) back down into the four buckets this legend has always shown,
// so every room lands in exactly one bucket and the counts sum to the total.
type RoomBucket = "AVAILABLE" | "OCCUPIED" | "CLEANING" | "MAINTENANCE";

function bucketForRoom(room: RoomDto): RoomBucket {
  if (["BLOCKED", "UNDER_MAINTENANCE", "OUT_OF_SERVICE"].includes(room.operationalStatus)) return "MAINTENANCE";
  if (room.operationalStatus === "OCCUPIED") return "OCCUPIED";
  if (["DIRTY", "CLEANING", "CLEANING_REQUESTED"].includes(room.housekeepingStatus)) return "CLEANING";
  return "AVAILABLE";
}

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const tEnum = useTranslations("enum.status");
  const router = useRouter();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  const canViewRooms = hasHydrated && hasPermission("room:view");
  const canViewReservations = hasHydrated && hasPermission("reservation:view");
  const canViewPayments = hasHydrated && hasPermission("payment:view");

  const roomsQuery = useQuery({
    queryKey: ["rooms"],
    queryFn: () => apiFetch<RoomDto[]>("/rooms"),
    enabled: canViewRooms,
  });
  const arrivalsQuery = useQuery({
    queryKey: ["front-desk", "arrivals"],
    queryFn: () => apiFetch<ReservationDto[]>("/front-desk/arrivals"),
    enabled: canViewReservations,
  });
  const inHouseQuery = useQuery({
    queryKey: ["front-desk", "in-house"],
    queryFn: () => apiFetch<ReservationDto[]>("/front-desk/in-house"),
    enabled: canViewReservations,
  });
  const paymentsQuery = useQuery({
    queryKey: ["payments"],
    queryFn: () => apiFetch<PaymentDto[]>("/payments"),
    enabled: canViewPayments,
  });

  const enabledQueries = [
    canViewRooms ? roomsQuery : null,
    canViewReservations ? arrivalsQuery : null,
    canViewReservations ? inHouseQuery : null,
    canViewPayments ? paymentsQuery : null,
  ].filter((q): q is NonNullable<typeof q> => q !== null);

  const isLoading = !hasHydrated || enabledQueries.some((q) => q.isLoading);
  const isError = enabledQueries.some((q) => q.isError);

  const rooms = roomsQuery.data ?? [];
  const arrivals = arrivalsQuery.data ?? [];
  const inHouse = inHouseQuery.data ?? [];
  const payments = paymentsQuery.data ?? [];

  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter((r) => r.operationalStatus === "OCCUPIED").length;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  const roomBuckets: Record<RoomBucket, number> = { AVAILABLE: 0, OCCUPIED: 0, CLEANING: 0, MAINTENANCE: 0 };
  for (const room of rooms) roomBuckets[bucketForRoom(room)] += 1;

  const dirtyRooms = rooms.filter((r) => r.housekeepingStatus === "DIRTY").length;
  const cleaningRooms = rooms.filter((r) => r.housekeepingStatus === "CLEANING").length;
  const cleanRooms = rooms.filter((r) => r.housekeepingStatus === "CLEAN").length;

  const arrivalsToday = arrivals.filter((r) => isTodayInPropertyZone(r.arrivalDate));
  const checkedInToday = inHouse.filter((r) => isTodayInPropertyZone(r.arrivalDate));
  const totalArrivalsToday = arrivalsToday.length + checkedInToday.length;
  const checkOutsToday = inHouse.filter((r) => isTodayInPropertyZone(r.departureDate));

  const todayPayments = payments.filter((p) => isTodayInPropertyZone(p.paymentTime));
  const todayRevenueAmount = todayPayments.reduce((sum, p) => sum + p.amount, 0);
  const todayRevenue = formatDualPrice(todayRevenueAmount);

  const ROOM_STATUS: Array<{ status: RoomBucket; count: number }> = [
    { status: "AVAILABLE", count: roomBuckets.AVAILABLE },
    { status: "OCCUPIED", count: roomBuckets.OCCUPIED },
    { status: "CLEANING", count: roomBuckets.CLEANING },
    { status: "MAINTENANCE", count: roomBuckets.MAINTENANCE },
  ];

  const QUICK_STATS = [
    canViewReservations && {
      icon: LogIn,
      label: t("quickStats.checkIns"),
      value: String(checkedInToday.length),
      tone: "text-blue-600 dark:text-blue-400 bg-blue-500/10",
    },
    canViewReservations && {
      icon: LogOut,
      label: t("quickStats.checkOuts"),
      value: String(checkOutsToday.length),
      tone: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10",
    },
    canViewReservations && {
      icon: CalendarDays,
      label: t("quickStats.bookings"),
      value: String(totalArrivalsToday),
      tone: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
    },
    canViewReservations && {
      icon: Home,
      label: t("quickStats.inHouse"),
      value: String(inHouse.length),
      tone: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
    },
  ].filter((s): s is Exclude<typeof s, false> => Boolean(s));

  const refetchAll = () => enabledQueries.forEach((q) => q.refetch());

  return (
    <div>
      {/* Mobile view — matches the "Dashboard" mockup screen */}
      <div className="md:hidden">
        <MobileHeader title={t("title")} variant="root" />
        <div className="p-4 space-y-5">
          {canViewPayments && (
            <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-5 shadow-xl shadow-blue-600/25">
              <p className="text-xs font-medium text-blue-100">{t("todayOverview")}</p>
              <p className="text-[11px] text-blue-200">
                <DateDisplay date={new Date()} format="MMMM d, yyyy" />
              </p>
              <p className="pt-2">
                <MoneyDisplay
                  amount={todayRevenueAmount}
                  className="text-3xl font-black tracking-tight text-white"
                  secondaryClassName="text-blue-200"
                  hideSecondary
                />
              </p>
              <p className="text-xs text-blue-100 mt-0.5">≈ {todayRevenue.khr} · {t("totalRevenue")}</p>
            </div>
          )}

          {isLoading ? (
            <PageSkeleton />
          ) : isError ? (
            <ErrorState title={t("loadError")} onRetry={refetchAll} />
          ) : (
            <>
              {QUICK_STATS.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {QUICK_STATS.map((stat) => {
                    const Icon = stat.icon;
                    return (
                      <div key={stat.label} className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm space-y-2">
                        <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${stat.tone}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <p className="text-2xl font-bold text-foreground leading-none">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {canViewRooms && (
                <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-foreground">{t("roomStatusHeading")}</h3>
                    <Link href="/rooms" className="text-xs font-semibold text-primary">
                      {t("viewAll")}
                    </Link>
                  </div>
                  <div className="space-y-3">
                    {ROOM_STATUS.map((s) => (
                      <div key={s.status} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2.5">
                          <span className={`h-2.5 w-2.5 rounded-full ${TONE_DOT_CLASS[toneForStatus(s.status)]}`} />
                          <span className="text-foreground font-medium">{tEnum(s.status)}</span>
                        </div>
                        <span className="font-bold text-foreground">{s.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Desktop / tablet view */}
      <div className="hidden md:block space-y-6">
        <PageHeader
          title={t("title")}
          description={t("description")}
          actionLabel={t("newReservation")}
          onAction={() => router.push("/reservations/new")}
        />

        {isLoading ? (
          <PageSkeleton />
        ) : isError ? (
          <ErrorState title={t("loadError")} onRetry={refetchAll} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {canViewRooms && (
              <StatCard
                label={t("stats.occupancy")}
                value={`${occupancyRate}%`}
                icon={BedDouble}
                description={t("stats.occupancyDescription", { occupied: occupiedRooms, total: totalRooms })}
                href="/rooms"
              />
            )}
            {canViewReservations && (
              <StatCard
                label={t("stats.expectedArrival")}
                value={t("stats.expectedArrivalValue", { count: totalArrivalsToday })}
                icon={CalendarCheck}
                tone="info"
                description={t("stats.expectedArrivalDescription", { checkedIn: checkedInToday.length, pending: arrivalsToday.length })}
                href="/check-in"
              />
            )}
            {canViewPayments && (
              <StatCard
                label={t("stats.todayRevenue")}
                value={todayRevenue.usd}
                icon={CreditCard}
                tone="success"
                description={t("stats.todayRevenueDescription", { khr: todayRevenue.khr, count: todayPayments.length })}
                href="/payments"
              />
            )}
            {canViewRooms && (
              <StatCard
                label={t("stats.housekeeping")}
                value={t("stats.housekeepingValue", { count: dirtyRooms })}
                icon={Sparkles}
                tone="warning"
                description={t("stats.housekeepingDescription", { clean: cleanRooms, cleaning: cleaningRooms })}
                href="/housekeeping"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
