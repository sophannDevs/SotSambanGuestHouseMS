"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { MobileHeader } from "@/components/layout/mobile-header";
import { PageHeader } from "@/components/layout/header";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { MoneyDisplay } from "@/components/shared/money-display";
import { DateDisplay } from "@/components/shared/date-display";
import { formatDualPrice } from "@/lib/currency";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import type { GuestDto, ReservationDto } from "@/lib/api-types";
import { Phone, Sparkles, CalendarCheck, BedDouble, History } from "lucide-react";

export default function GuestDetailsPage() {
  const t = useTranslations("guestDetail");
  const params = useParams<{ id: string }>();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const canView = hasHydrated && hasPermission("guest:view");

  // No GET /guests/{id} endpoint exists — derive from the already-fetched
  // list, same constraint Redesign Phases 7-8 hit for reservations/rooms.
  const guestsQuery = useQuery({
    queryKey: ["guests"],
    queryFn: () => apiFetch<GuestDto[]>("/guests"),
    enabled: canView,
  });
  const reservationsQuery = useQuery({
    queryKey: ["reservations"],
    queryFn: () => apiFetch<ReservationDto[]>("/reservations"),
    enabled: canView,
  });

  const isLoading = !hasHydrated || guestsQuery.isLoading || reservationsQuery.isLoading;
  const isError = guestsQuery.isError || reservationsQuery.isError;

  if (isLoading) {
    return (
      <div className="p-4 md:p-0">
        <PageSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 md:p-0">
        <ErrorState title={t("loadError")} onRetry={() => { guestsQuery.refetch(); reservationsQuery.refetch(); }} />
      </div>
    );
  }

  const guest = guestsQuery.data?.find((g) => g.id === params.id);

  if (!guest) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">
        {t("notFound.message")} <Link href="/guests" className="text-primary font-semibold">{t("notFound.backLink")}</Link>
      </div>
    );
  }

  // No `guestId` filter on GET /reservations — filter the full list
  // client-side, same as rooms/[id]'s "derive from list" precedent.
  const guestReservations = (reservationsQuery.data ?? [])
    .filter((r) => r.mainGuest.id === guest.id)
    .sort((a, b) => b.arrivalDate.localeCompare(a.arrivalDate));

  const totalBookings = guestReservations.length;
  const totalSpending = guestReservations.reduce((sum, r) => sum + r.paidAmount, 0);
  const latestStay = guestReservations[0];
  const spending = formatDualPrice(totalSpending);
  const guestName = `${guest.firstName} ${guest.lastName}`;

  return (
    <div>
      {/* Mobile view */}
      <div className="md:hidden">
        <MobileHeader title={t("mobileTitle")} showNotification={false} />
        <div className="p-4 space-y-5">
          <div className="flex flex-col items-center text-center gap-2 pt-2">
            <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold">
              {guest.firstName.charAt(0)}
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center justify-center gap-1.5">
                {guestName}
                {guest.vipLevel === "VIP_GOLD" && <Sparkles className="h-4 w-4 text-amber-500" />}
              </h2>
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5 mt-0.5">
                <Phone className="h-3.5 w-3.5" /> {guest.phone ?? "—"} · {guest.nationality}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm space-y-1">
              <p className="text-xs text-muted-foreground">{t("labels.totalBookings")}</p>
              <p className="text-xl font-bold text-foreground">{totalBookings}</p>
            </div>
            <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm space-y-1">
              <p className="text-xs text-muted-foreground">{t("labels.totalSpending")}</p>
              <p className="text-xl font-bold text-primary">{spending.usd}</p>
            </div>
            <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><CalendarCheck className="h-3.5 w-3.5" /> {t("labels.latestCheckIn")}</p>
              <p className="text-sm font-bold text-foreground">{latestStay ? <DateDisplay date={latestStay.arrivalDate} /> : "—"}</p>
            </div>
            <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><BedDouble className="h-3.5 w-3.5" /> {t("labels.room")}</p>
              <p className="text-sm font-bold text-foreground">{latestStay ? `${latestStay.assignedRoomNumber ?? "—"} · ${latestStay.roomTypeName}` : "—"}</p>
            </div>
          </div>

          <BookingHistory reservations={guestReservations} title={t("labels.bookingHistory")} emptyMessage={t("noBookings")} />
        </div>
      </div>

      {/* Desktop / tablet view */}
      <div className="hidden md:block space-y-6">
        <PageHeader title={guestName} description={`${guest.phone ?? "—"} · ${guest.nationality}`} />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm space-y-1">
            <p className="text-xs text-muted-foreground uppercase font-semibold">{t("labels.totalBookings")}</p>
            <p className="text-2xl font-bold text-foreground">{totalBookings}</p>
          </div>
          <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm space-y-1">
            <p className="text-xs text-muted-foreground uppercase font-semibold">{t("labels.totalSpending")}</p>
            <p className="text-2xl font-bold text-primary">{spending.usd}</p>
            <p className="text-xs text-muted-foreground">≈ {spending.khr}</p>
          </div>
          <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm space-y-1">
            <p className="text-xs text-muted-foreground uppercase font-semibold">{t("labels.latestCheckIn")}</p>
            <p className="text-sm font-bold text-foreground">{latestStay ? <DateDisplay date={latestStay.arrivalDate} /> : "—"}</p>
          </div>
          <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm space-y-1">
            <p className="text-xs text-muted-foreground uppercase font-semibold">{t("labels.room")}</p>
            <p className="text-sm font-bold text-foreground">{latestStay ? `${latestStay.assignedRoomNumber ?? "—"} · ${latestStay.roomTypeName}` : "—"}</p>
          </div>
        </div>

        <BookingHistory reservations={guestReservations} title={t("labels.bookingHistory")} emptyMessage={t("noBookings")} />
      </div>
    </div>
  );
}

function BookingHistory({ reservations, title, emptyMessage }: { reservations: ReservationDto[]; title: string; emptyMessage: string }) {
  return (
    <div className="bg-card border border-border/60 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm md:shadow-xl space-y-3">
      <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
        <History className="h-4 w-4 text-muted-foreground" /> {title}
      </h3>
      {reservations.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center">{emptyMessage}</p>
      ) : (
        <div className="space-y-2">
          {reservations.map((r) => (
            <Link
              key={r.id}
              href={`/reservations/${r.id}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/40 p-3 text-xs hover:bg-muted/30 transition-all"
            >
              <div>
                <p className="font-mono font-bold text-primary">{r.reservationNumber}</p>
                <p className="text-muted-foreground mt-0.5">
                  <DateDisplay date={r.arrivalDate} format="MMM d" /> – <DateDisplay date={r.departureDate} format="MMM d, yyyy" /> · {r.roomTypeName}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <MoneyDisplay amount={r.totalAmount} hideSecondary className="font-bold" />
                <StatusBadge status={r.reservationStatus} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
