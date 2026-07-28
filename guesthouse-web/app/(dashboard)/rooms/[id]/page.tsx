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
import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import { formatDualPrice } from "@/lib/currency";
import type { RoomDto, RoomTypeDto } from "@/lib/api-types";
import { BedDouble, Users, Check, Pencil } from "lucide-react";

export default function RoomDetailsPage() {
  const t = useTranslations("roomDetail");
  const params = useParams<{ id: string }>();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const canView = hasHydrated && hasPermission("room:view");

  // No GET /rooms/{id} endpoint exists — derive from the already-fetched
  // list, same constraint the Front Desk phase hit for reservations lacking
  // per-item GETs.
  const roomsQuery = useQuery({
    queryKey: ["rooms"],
    queryFn: () => apiFetch<RoomDto[]>("/rooms"),
    enabled: canView,
  });
  const roomTypesQuery = useQuery({
    queryKey: ["room-types"],
    queryFn: () => apiFetch<RoomTypeDto[]>("/room-types"),
    enabled: canView,
  });

  const isLoading = !hasHydrated || roomsQuery.isLoading || roomTypesQuery.isLoading;
  const isError = roomsQuery.isError || roomTypesQuery.isError;

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
        <ErrorState title={t("loadError")} onRetry={() => { roomsQuery.refetch(); roomTypesQuery.refetch(); }} />
      </div>
    );
  }

  const room = roomsQuery.data?.find((r) => r.id === params.id);
  const roomType = room ? roomTypesQuery.data?.find((rt) => rt.id === room.roomTypeId) : undefined;

  if (!room) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">
        {t("notFound.message")} <Link href="/rooms" className="text-primary font-semibold">{t("notFound.backLink")}</Link>
      </div>
    );
  }

  const price = roomType ? formatDualPrice(roomType.basePrice) : null;

  return (
    <div>
      {/* Mobile view */}
      <div className="md:hidden">
        <MobileHeader title={t("mobileTitle")} />
        <div className="h-48 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center">
          <BedDouble className="h-16 w-16 text-primary/60" />
        </div>

        <div className="p-4 space-y-5 pb-36">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">{t("roomNumberLabel", { number: room.roomNumber })}</h2>
              <p className="text-sm text-muted-foreground">{room.roomTypeName}</p>
            </div>
            <StatusBadge status={room.derivedStatus} />
          </div>

          <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm">
            {price ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-primary">{price.usd}</span>
                  <span className="text-sm text-muted-foreground">{t("perNight")}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">≈ {price.khr}</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">—</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm space-y-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-bold text-foreground">{t("maxOccupancyGuests", { count: room.maxOccupancy })}</p>
              <p className="text-xs text-muted-foreground">{t("labels.maxCapacity")}</p>
            </div>
            <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm space-y-1">
              <BedDouble className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-bold text-foreground">{roomType?.bedType ?? "—"}</p>
              <p className="text-xs text-muted-foreground">
                {roomType?.roomSizeSqm ? `${roomType.roomSizeSqm} m² • ` : ""}
                {t("labels.floor", { floor: room.floor })}
              </p>
            </div>
          </div>

          {roomType && roomType.amenities.length > 0 && (
            <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-foreground">{t("sections.amenities")}</h3>
              <div className="grid grid-cols-2 gap-2.5">
                {roomType.amenities.map((amenity) => (
                  <div key={amenity.id} className="flex items-center gap-2 text-xs text-foreground">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>{amenity.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="fixed bottom-24 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent md:hidden">
          <button
            disabled
            title={t("toast.notAvailable")}
            className="w-full h-12 rounded-2xl bg-muted text-muted-foreground font-semibold text-sm flex items-center justify-center gap-2 cursor-not-allowed"
          >
            <Pencil className="h-4 w-4" />
            <span>{t("actions.editRoom")}</span>
          </button>
        </div>
      </div>

      {/* Desktop / tablet view */}
      <div className="hidden md:block space-y-6">
        <PageHeader title={t("title", { number: room.roomNumber, type: room.roomTypeName })} description={t("description")} />
        <div className="flex justify-end -mt-4">
          <button
            disabled
            title={t("toast.notAvailable")}
            className="px-4 py-2 rounded-xl bg-muted text-muted-foreground text-sm font-semibold flex items-center gap-2 cursor-not-allowed"
          >
            <Pencil className="h-4 w-4" />
            <span>{t("actions.editRoom")}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-card border border-border/60 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="h-56 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center">
              <BedDouble className="h-20 w-20 text-primary/60" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground">{t("roomNumberLabel", { number: room.roomNumber })}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("labels.floor", { floor: room.floor })} • {roomType?.bedType ?? "—"} {roomType?.roomSizeSqm ? `• ${roomType.roomSizeSqm} m²` : ""}
                </p>
              </div>
              <StatusBadge status={room.derivedStatus} />
            </div>
            {roomType && roomType.amenities.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {roomType.amenities.map((amenity) => (
                  <div key={amenity.id} className="flex items-center gap-2 text-xs font-medium text-foreground bg-muted/40 rounded-xl px-3 py-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>{amenity.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-xl space-y-4 h-fit">
            <h4 className="text-sm font-bold uppercase tracking-wider text-foreground border-b border-border/40 pb-2">
              {t("sections.pricingCapacity")}
            </h4>
            {roomType && (
              <div>
                <p className="text-2xl font-black text-primary">
                  <MoneyDisplay amount={roomType.basePrice} /> <span className="text-sm font-medium text-muted-foreground">{t("perNight")}</span>
                </p>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{t("maxOccupancyMaximum", { count: room.maxOccupancy })}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

