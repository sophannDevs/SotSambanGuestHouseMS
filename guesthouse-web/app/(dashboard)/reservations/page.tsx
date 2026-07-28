"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/layout/header";
import { MobileHeader } from "@/components/layout/mobile-header";
import { DataTable, SortableHeader } from "@/components/shared/data-table";
import { DataTableToolbar } from "@/components/shared/data-table-toolbar";
import { ResponsiveDataList } from "@/components/shared/responsive-data-list";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { DateDisplay } from "@/components/shared/date-display";
import { MoneyDisplay } from "@/components/shared/money-display";
import { formatDualPrice } from "@/lib/currency";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { useAuthStore } from "@/lib/auth-store";
import { apiFetch } from "@/lib/api-client";
import type { ReservationDto } from "@/lib/api-types";
import { Plus, Eye, BedDouble } from "lucide-react";

type Bucket = "today" | "upcoming" | "history";

const HISTORY_STATUSES = ["CHECKED_OUT", "CANCELLED", "NO_SHOW"];

function bucketFor(reservation: ReservationDto, todayIso: string): Bucket {
  if (HISTORY_STATUSES.includes(reservation.reservationStatus)) return "history";
  if (reservation.arrivalDate === todayIso) return "today";
  return reservation.arrivalDate > todayIso ? "upcoming" : "history";
}

export default function ReservationsPage() {
  const router = useRouter();
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const t = useTranslations("reservations");
  const tCommon = useTranslations("common");

  const canView = hasHydrated && hasPermission("reservation:view");
  // The backend checks `reservation:edit` on POST /reservations, not the
  // catalogue's `reservation:create` (current-ui-audit.md §8's permission-
  // drift finding) — gating "New Booking" on the key it actually enforces.
  const canCreate = hasHydrated && hasPermission("reservation:edit");

  const reservationsQuery = useQuery({
    queryKey: ["reservations"],
    queryFn: () => apiFetch<ReservationDto[]>("/reservations"),
    enabled: canView,
  });

  const [search, setSearch] = React.useState("");

  const TABS = [
    { key: "all", label: t("tabs.all") },
    { key: "today", label: t("tabs.today") },
    { key: "upcoming", label: t("tabs.upcoming") },
    { key: "history", label: t("tabs.history") },
  ] as const;
  const [tab, setTab] = React.useState<(typeof TABS)[number]["key"]>("all");

  const reservations = reservationsQuery.data;
  const todayIso = new Date().toISOString().slice(0, 10);

  const searched = React.useMemo(() => {
    const list = reservations ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((r) => {
      const guestName = `${r.mainGuest.firstName} ${r.mainGuest.lastName}`.toLowerCase();
      return (
        r.reservationNumber.toLowerCase().includes(q) ||
        guestName.includes(q) ||
        (r.assignedRoomNumber ?? "").toLowerCase().includes(q)
      );
    });
  }, [reservations, search]);

  const filtered = React.useMemo(
    () => (tab === "all" ? searched : searched.filter((r) => bucketFor(r, todayIso) === tab)),
    [searched, tab, todayIso]
  );

  const columns: ColumnDef<ReservationDto, unknown>[] = [
    {
      accessorKey: "reservationNumber",
      header: ({ column }) => <SortableHeader label={t("table.reservationNumber")} column={column} />,
      cell: ({ row }) => (
        <Link href={`/reservations/${row.original.id}`} className="font-mono font-bold text-primary hover:underline">
          {row.original.reservationNumber}
        </Link>
      ),
    },
    {
      id: "guest",
      accessorFn: (r) => `${r.mainGuest.firstName} ${r.mainGuest.lastName}`,
      header: t("table.guest"),
      cell: ({ row }) => (
        <span className="font-semibold text-foreground">
          {row.original.mainGuest.firstName} {row.original.mainGuest.lastName}
        </span>
      ),
    },
    {
      id: "room",
      header: t("table.roomAndType"),
      cell: ({ row }) => (
        <span className="text-xs">
          <span className="font-bold text-foreground">
            {row.original.assignedRoomNumber ? `#${row.original.assignedRoomNumber}` : t("unassigned")}
          </span>
          <span className="text-muted-foreground ml-1.5">({row.original.roomTypeName})</span>
        </span>
      ),
    },
    {
      id: "stayDates",
      accessorKey: "arrivalDate",
      header: ({ column }) => <SortableHeader label={t("table.stayDates")} column={column} />,
      cell: ({ row }) => (
        <span className="text-xs font-medium whitespace-nowrap">
          <DateDisplay date={row.original.arrivalDate} format="MMM d" /> – <DateDisplay date={row.original.departureDate} format="MMM d" />{" "}
          ({row.original.totalNights} n)
        </span>
      ),
    },
    {
      accessorKey: "totalAmount",
      header: t("table.folioTotal"),
      cell: ({ row }) => <MoneyDisplay amount={row.original.totalAmount} />,
    },
    {
      accessorKey: "balanceDue",
      header: t("table.balance"),
      cell: ({ row }) => (
        <span className={row.original.balanceDue <= 0 ? "text-success font-bold text-xs" : "text-warning font-bold text-xs"}>
          {formatDualPrice(row.original.balanceDue).usd}
        </span>
      ),
    },
    {
      accessorKey: "reservationStatus",
      header: t("table.status"),
      cell: ({ row }) => <StatusBadge status={row.original.reservationStatus} />,
    },
    {
      id: "actions",
      header: () => <span className="sr-only">{t("table.actions")}</span>,
      cell: ({ row }) => (
        <Link
          href={`/reservations/${row.original.id}`}
          className="ml-auto flex w-fit items-center gap-1 rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-all hover:bg-primary/20"
        >
          <Eye className="h-3.5 w-3.5" />
          <span>{t("table.details")}</span>
        </Link>
      ),
    },
  ];

  const isLoading = !hasHydrated || reservationsQuery.isLoading;
  const isError = reservationsQuery.isError;

  const TabBar = (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
      {TABS.map((tabItem) => (
        <button
          key={tabItem.key}
          onClick={() => setTab(tabItem.key)}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
            tab === tabItem.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}
        >
          {tabItem.label}
        </button>
      ))}
    </div>
  );

  return (
    <div>
      {/* Mobile view */}
      <div className="md:hidden">
        <MobileHeader
          title={t("title")}
          rightSlot={
            <PermissionGuard permission="reservation:edit">
              <Button size="icon" className="h-9 w-9 rounded-full" asChild>
                <Link href="/reservations/new" aria-label={t("newReservationAria")}>
                  <Plus />
                </Link>
              </Button>
            </PermissionGuard>
          }
        />
        <div className="px-4 py-3">{TabBar}</div>

        <div className="px-4 pb-4 space-y-3">
          {isLoading ? (
            <PageSkeleton />
          ) : isError ? (
            <ErrorState title={t("loadError")} onRetry={() => reservationsQuery.refetch()} />
          ) : (
            <ResponsiveDataList
              data={filtered}
              keyExtractor={(rsv) => rsv.id}
              emptyMessage={t("emptyView")}
              renderCard={(rsv) => (
                <Link
                  href={`/reservations/${rsv.id}`}
                  className="block bg-card border border-border/60 rounded-2xl p-4 shadow-sm space-y-2 active:scale-[0.99] transition-transform"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                        <BedDouble className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">
                          {rsv.assignedRoomNumber ? `${rsv.assignedRoomNumber} ` : ""}
                          {rsv.roomTypeName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {rsv.mainGuest.firstName} {rsv.mainGuest.lastName}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={rsv.reservationStatus} />
                  </div>
                  <div className="flex items-center justify-between text-xs pl-11">
                    <MoneyDisplay amount={rsv.totalAmount} className="font-bold text-primary" hideSecondary />
                    <span className="text-muted-foreground font-medium">
                      <DateDisplay date={rsv.arrivalDate} />
                    </span>
                  </div>
                </Link>
              )}
            />
          )}
        </div>
      </div>

      {/* Desktop / tablet view */}
      <div className="hidden md:block space-y-6">
        <PageHeader
          title={t("title")}
          description={t("description")}
          actionLabel={canCreate ? t("newBooking") : undefined}
          actionIcon={Plus}
          onAction={() => router.push("/reservations/new")}
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <DataTableToolbar searchValue={search} onSearchChange={setSearch} searchPlaceholder={t("searchPlaceholder")} />
          </div>
          {TabBar}
        </div>

        {isLoading ? (
          <PageSkeleton />
        ) : isError ? (
          <ErrorState title={t("loadError")} onRetry={() => reservationsQuery.refetch()} />
        ) : (
          <DataTable columns={columns} data={filtered} emptyMessage={tCommon("status.noResults")} />
        )}
      </div>
    </div>
  );
}
