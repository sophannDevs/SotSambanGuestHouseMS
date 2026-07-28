"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/header";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { MoneyDisplay } from "@/components/shared/money-display";
import { DateDisplay } from "@/components/shared/date-display";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import { formatDate } from "@/lib/dates";
import type { ReservationDto, RoomDto } from "@/lib/api-types";
import { FileText, LogOut } from "lucide-react";

function remainingNights(departureDate: string): number {
  const todayIso = formatDate(new Date(), "yyyy-MM-dd");
  const ms = new Date(`${departureDate}T00:00:00Z`).getTime() - new Date(`${todayIso}T00:00:00Z`).getTime();
  return Math.max(0, Math.round(ms / 86_400_000));
}

export default function InHousePage() {
  const t = useTranslations("inHouse");
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  const canView = hasHydrated && hasPermission("reservation:view");
  const canEdit = hasHydrated && hasPermission("reservation:edit");

  const inHouseQuery = useQuery({
    queryKey: ["front-desk", "in-house"],
    queryFn: () => apiFetch<ReservationDto[]>("/front-desk/in-house"),
    enabled: canView,
  });
  const roomsQuery = useQuery({
    queryKey: ["rooms"],
    queryFn: () => apiFetch<RoomDto[]>("/rooms"),
    enabled: canView,
  });

  const inHouseList = inHouseQuery.data ?? [];
  const roomsById = new Map((roomsQuery.data ?? []).map((r) => [r.id, r]));

  const isLoading = !hasHydrated || inHouseQuery.isLoading;
  const isError = inHouseQuery.isError;

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />

      <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-foreground">{t("staysHeading", { count: inHouseList.length })}</h3>

        {isLoading ? (
          <PageSkeleton />
        ) : isError ? (
          <ErrorState title={t("loadError")} onRetry={() => inHouseQuery.refetch()} />
        ) : inHouseList.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-xs bg-muted/20 border border-border/40 rounded-2xl">{t("emptyList")}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-border/40 text-xs font-semibold uppercase text-muted-foreground bg-muted/20">
                  <th className="py-3 px-4">{t("table.roomNumber")}</th>
                  <th className="py-3 px-4">{t("table.guestName")}</th>
                  <th className="py-3 px-4">{t("table.reservationNumber")}</th>
                  <th className="py-3 px-4">{t("table.checkInOut")}</th>
                  <th className="py-3 px-4">{t("table.remaining")}</th>
                  <th className="py-3 px-4">{t("table.housekeeping")}</th>
                  <th className="py-3 px-4">{t("table.folioBalance")}</th>
                  <th className="py-3 px-4 text-right">{t("table.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {inHouseList.map((item) => {
                  const room = item.assignedRoomId ? roomsById.get(item.assignedRoomId) : undefined;
                  return (
                    <tr key={item.id} className="hover:bg-muted/30 transition-all">
                      <td className="py-3.5 px-4 font-black text-foreground">
                        {item.assignedRoomNumber ? t("table.roomPrefix", { room: item.assignedRoomNumber }) : t("unassigned")}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-foreground">
                        {item.mainGuest.firstName} {item.mainGuest.lastName}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-primary">{item.reservationNumber}</td>
                      <td className="py-3.5 px-4 text-xs font-medium">
                        <DateDisplay date={item.arrivalDate} format="MMM d" /> – <DateDisplay date={item.departureDate} format="MMM d" />
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-xs">{t("table.nightsLeft", { count: remainingNights(item.departureDate) })}</td>
                      <td className="py-3.5 px-4">{room ? <StatusBadge status={room.housekeepingStatus} /> : <span className="text-xs text-muted-foreground">—</span>}</td>
                      <td className="py-3.5 px-4 text-xs">
                        <MoneyDisplay amount={item.balanceDue} hideSecondary className={item.balanceDue > 0 ? "text-warning" : "text-success"} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/reservations/${item.id}`}
                            className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 font-semibold text-xs rounded-xl inline-flex items-center gap-1 transition-all"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            <span>{t("table.folio")}</span>
                          </Link>
                          {canEdit && (
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/check-out?reservationId=${item.id}`}>
                                <LogOut className="h-3.5 w-3.5" />
                                <span>{t("table.checkOut")}</span>
                              </Link>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
