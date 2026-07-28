"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/header";
import { MobileHeader } from "@/components/layout/mobile-header";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import { formatDate, addDaysIso, diffDaysIso, isTodayInPropertyZone } from "@/lib/dates";
import type { BookingDto, RoomDto } from "@/lib/api-types";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

const HIDDEN_STATUSES = new Set(["CANCELLED", "NO_SHOW"]);
const LEGEND_STATUSES = ["PENDING", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT"];

function mondayOfWeek(iso: string): string {
  const dow = new Date(`${iso}T00:00:00Z`).getUTCDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  return addDaysIso(iso, diff);
}

function getBarStyle(status: string): string {
  switch (status) {
    case "CHECKED_IN":
      return "bg-emerald-600 text-white";
    case "CONFIRMED":
      return "bg-blue-600 text-white";
    case "CHECKED_OUT":
      return "bg-slate-500 text-white";
    case "PENDING":
      return "bg-amber-500 text-white";
    default:
      return "bg-primary text-primary-foreground";
  }
}

export default function CalendarPage() {
  const t = useTranslations("calendar");
  const tStatus = useTranslations("enum.status");
  const router = useRouter();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const canView = hasHydrated && hasPermission("booking:view");

  const [weekStart, setWeekStart] = React.useState(() => mondayOfWeek(formatDate(new Date(), "yyyy-MM-dd")));
  const weekDates = React.useMemo(() => Array.from({ length: 7 }, (_, i) => addDaysIso(weekStart, i)), [weekStart]);
  const weekEndExclusive = addDaysIso(weekStart, 7);

  const bookingsQuery = useQuery({
    queryKey: ["bookings"],
    queryFn: () => apiFetch<BookingDto[]>("/bookings"),
    enabled: canView,
  });
  const roomsQuery = useQuery({
    queryKey: ["rooms"],
    queryFn: () => apiFetch<RoomDto[]>("/rooms"),
    enabled: canView,
  });

  const rooms = React.useMemo(
    () => [...(roomsQuery.data ?? [])].sort((a, b) => a.floor - b.floor || a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true })),
    [roomsQuery.data]
  );

  const visibleBookings = React.useMemo(
    () =>
      (bookingsQuery.data ?? []).filter(
        (b) => !HIDDEN_STATUSES.has(b.bookingStatus) && b.arrivalDate < weekEndExclusive && b.departureDate > weekStart
      ),
    [bookingsQuery.data, weekStart, weekEndExclusive]
  );

  const assignedBookings = visibleBookings.filter((b) => b.assignedRoomId);
  const unassignedCount = visibleBookings.length - assignedBookings.length;

  const isLoading = !hasHydrated || bookingsQuery.isLoading || roomsQuery.isLoading;
  const isError = bookingsQuery.isError || roomsQuery.isError;

  const weekLabel = `${formatDate(weekStart, "MMM d")} – ${formatDate(addDaysIso(weekStart, 6), "MMM d, yyyy")}`;

  const dayAgendas = weekDates.map((date) => ({
    date,
    arrivals: visibleBookings.filter((b) => b.arrivalDate === date),
    departures: visibleBookings.filter((b) => b.departureDate === date),
    staying: visibleBookings.filter((b) => b.arrivalDate < date && b.departureDate > date),
  }));

  const WeekNav = (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card border border-border/60 rounded-2xl p-3 sm:p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setWeekStart(mondayOfWeek(formatDate(new Date(), "yyyy-MM-dd")))}
          className="px-3.5 py-1.5 bg-muted hover:bg-accent text-foreground text-xs font-semibold rounded-xl border border-border/60"
        >
          {t("today")}
        </button>
        <div className="flex items-center border border-border/60 rounded-xl overflow-hidden">
          <button
            onClick={() => setWeekStart((w) => addDaysIso(w, -7))}
            aria-label={t("prevWeek")}
            className="flex h-11 w-11 items-center justify-center hover:bg-accent text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-3 text-xs font-bold text-foreground whitespace-nowrap">{weekLabel}</span>
          <button
            onClick={() => setWeekStart((w) => addDaysIso(w, 7))}
            aria-label={t("nextWeek")}
            className="flex h-11 w-11 items-center justify-center hover:bg-accent text-muted-foreground hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs font-medium">
        {LEGEND_STATUSES.map((status) => (
          <div key={status} className="flex items-center gap-1.5">
            <span className={`h-3 w-3 rounded-full ${getBarStyle(status).split(" ")[0]}`} />
            <span>{tStatus(status)}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      {/* Mobile view */}
      <div className="md:hidden">
        <MobileHeader
          title={t("title")}
          rightSlot={
            <Link href="/bookings/new" aria-label={t("newBooking")} className="flex h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-muted">
              <Plus className="h-5 w-5" />
            </Link>
          }
        />
        <div className="space-y-4 p-4">
          {WeekNav}

          {isLoading ? (
            <PageSkeleton />
          ) : isError ? (
            <ErrorState title={t("loadError")} onRetry={() => { bookingsQuery.refetch(); roomsQuery.refetch(); }} />
          ) : (
            <div className="space-y-3">
              {dayAgendas.map(({ date, arrivals, departures, staying }) => {
                const today = isTodayInPropertyZone(date);
                const isEmpty = arrivals.length === 0 && departures.length === 0 && staying.length === 0;
                return (
                  <div key={date} className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm space-y-2.5">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-black text-foreground">{formatDate(date, "EEE, MMM d")}</p>
                      {today && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">{t("agenda.todayLabel")}</span>}
                    </div>
                    {isEmpty ? (
                      <p className="text-xs text-muted-foreground">{t("agenda.noActivity")}</p>
                    ) : (
                      <div className="space-y-1.5">
                        {arrivals.map((b) => (
                          <AgendaRow key={`arr-${b.id}`} label={t("agenda.arriving")} booking={b} />
                        ))}
                        {departures.map((b) => (
                          <AgendaRow key={`dep-${b.id}`} label={t("agenda.departing")} booking={b} />
                        ))}
                        {staying.map((b) => (
                          <AgendaRow key={`stay-${b.id}`} label={t("agenda.inHouse")} booking={b} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Desktop / tablet view */}
      <div className="hidden md:block space-y-6">
        <PageHeader
          title={t("title")}
          description={t("description")}
          actionLabel={t("newBooking")}
          actionIcon={Plus}
          onAction={() => router.push("/bookings/new")}
        />

        {WeekNav}

        <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-xl overflow-x-auto">
          {isLoading ? (
            <PageSkeleton />
          ) : isError ? (
            <ErrorState title={t("loadError")} onRetry={() => { bookingsQuery.refetch(); roomsQuery.refetch(); }} />
          ) : rooms.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-xs bg-muted/20 border border-border/40 rounded-2xl">{t("noRooms")}</div>
          ) : (
            <div className="min-w-[800px]">
              <div className="grid grid-cols-8 border-b border-border/40 pb-3">
                <div className="text-xs font-bold uppercase text-muted-foreground">{t("roomColumn")}</div>
                {weekDates.map((date) => (
                  <div key={date} className="text-center">
                    <p className="text-xs font-semibold text-muted-foreground">{formatDate(date, "EEE")}</p>
                    <p className="text-xs font-bold text-foreground">{formatDate(date, "MMM d")}</p>
                  </div>
                ))}
              </div>

              <div className="divide-y divide-border/30">
                {rooms.map((room) => {
                  const roomBookings = assignedBookings.filter((b) => b.assignedRoomId === room.id);
                  return (
                    <div key={room.id} className="grid grid-cols-8 py-3 items-center relative min-h-[56px] hover:bg-muted/20">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">#{room.roomNumber}</span>
                        <span className="text-[11px] text-muted-foreground font-medium">({room.roomTypeName})</span>
                      </div>

                      <div className="col-span-7 grid grid-cols-7 relative h-10 items-center">
                        {weekDates.map((date) => (
                          <div key={date} className="border-r border-border/20 h-full" />
                        ))}

                        {roomBookings.map((b) => {
                          const overlapStart = b.arrivalDate > weekStart ? b.arrivalDate : weekStart;
                          const overlapEnd = b.departureDate < weekEndExclusive ? b.departureDate : weekEndExclusive;
                          const startDay = diffDaysIso(overlapStart, weekStart);
                          const lengthDays = diffDaysIso(overlapEnd, overlapStart);
                          if (lengthDays <= 0) return null;
                          return (
                            <Link
                              key={b.id}
                              href={`/bookings/${b.id}`}
                              style={{ left: `${(startDay / 7) * 100}%`, width: `${(lengthDays / 7) * 100}%` }}
                              className={`absolute h-8 rounded-xl px-2.5 flex items-center justify-between text-xs font-bold shadow-md cursor-pointer transition-all hover:scale-[1.02] ${getBarStyle(
                                b.bookingStatus
                              )}`}
                            >
                              <span className="truncate">{b.mainGuest.firstName} {b.mainGuest.lastName}</span>
                              <span className="text-[10px] opacity-80 font-mono ml-1">{b.bookingNumber}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {unassignedCount > 0 && (
          <Link href="/bookings" className="block text-xs text-muted-foreground hover:text-foreground hover:underline">
            {t("unassignedNote", { count: unassignedCount })}
          </Link>
        )}
      </div>
    </div>
  );
}

function AgendaRow({ label, booking }: { label: string; booking: BookingDto }) {
  return (
    <Link
      href={`/bookings/${booking.id}`}
      className="flex items-center justify-between gap-2 rounded-xl border border-border/40 bg-muted/20 p-2.5 text-xs"
    >
      <div className="min-w-0">
        <p className="font-semibold text-muted-foreground">{label}</p>
        <p className="truncate font-bold text-foreground">
          {booking.assignedRoomNumber ? `#${booking.assignedRoomNumber} · ` : ""}
          {booking.mainGuest.firstName} {booking.mainGuest.lastName}
        </p>
      </div>
      <StatusBadge status={booking.bookingStatus} />
    </Link>
  );
}
