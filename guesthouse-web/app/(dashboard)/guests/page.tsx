"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/layout/header";
import { MobileHeader } from "@/components/layout/mobile-header";
import { DataTable } from "@/components/shared/data-table";
import { DataTableToolbar } from "@/components/shared/data-table-toolbar";
import { ResponsiveDataList } from "@/components/shared/responsive-data-list";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import type { GuestDto, BookingDto, CreateGuestRequest } from "@/lib/api-types";
import { Plus, Mail, Phone, Sparkles, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { NewGuestDialog } from "@/components/guests/new-guest-dialog";

export default function GuestsPage() {
  const t = useTranslations("guests");
  const tCommon = useTranslations("common");
  const tStatus = useTranslations("enum.status");
  const queryClient = useQueryClient();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const canView = hasHydrated && hasPermission("guest:view");
  const canCreate = hasHydrated && hasPermission("guest:edit");

  const guestsQuery = useQuery({
    queryKey: ["guests"],
    queryFn: () => apiFetch<GuestDto[]>("/guests"),
    enabled: canView,
  });
  const bookingsQuery = useQuery({
    queryKey: ["bookings"],
    queryFn: () => apiFetch<BookingDto[]>("/bookings"),
    enabled: canView,
  });

  const guests = guestsQuery.data;
  const bookings = bookingsQuery.data ?? [];
  const staysByGuestId = new Map<string, number>();
  for (const b of bookings) {
    staysByGuestId.set(b.mainGuest.id, (staysByGuestId.get(b.mainGuest.id) ?? 0) + 1);
  }

  const [search, setSearch] = React.useState("");
  const [newGuestOpen, setNewGuestOpen] = React.useState(false);

  const filteredGuests = React.useMemo(() => {
    const list = guests ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((g) => {
      const name = `${g.firstName} ${g.lastName}`.toLowerCase();
      return (
        name.includes(q) ||
        (g.email ?? "").toLowerCase().includes(q) ||
        (g.phone ?? "").includes(q) ||
        (g.idPassportNumber ?? "").toLowerCase().includes(q)
      );
    });
  }, [guests, search]);

  const createGuestMutation = useMutation({
    mutationFn: (values: CreateGuestRequest) => apiFetch<GuestDto>("/guests", { method: "POST", body: JSON.stringify(values) }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["guests"] });
      toast.success(t("toast.guestCreated", { name: `${created.firstName} ${created.lastName}` }));
      setNewGuestOpen(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const columns: ColumnDef<GuestDto, unknown>[] = [
    {
      id: "name",
      accessorFn: (g) => `${g.firstName} ${g.lastName}`,
      header: t("table.guestName"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5 font-bold text-foreground">
          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs flex-shrink-0">
            {row.original.firstName.charAt(0)}
          </div>
          <span>
            {row.original.firstName} {row.original.lastName}
          </span>
        </div>
      ),
    },
    {
      id: "contact",
      header: t("table.contact"),
      cell: ({ row }) => (
        <div className="text-xs space-y-0.5">
          {row.original.email && (
            <div className="flex items-center gap-1.5 text-foreground">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{row.original.email}</span>
            </div>
          )}
          {row.original.phone && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Phone className="h-3.5 w-3.5" />
              <span>{row.original.phone}</span>
            </div>
          )}
        </div>
      ),
    },
    { id: "passport", accessorKey: "idPassportNumber", header: t("table.passportId"), cell: ({ row }) => <span className="font-mono text-xs">{row.original.idPassportNumber ?? "—"}</span> },
    { id: "nationality", accessorKey: "nationality", header: t("table.nationality"), cell: ({ row }) => <span className="text-xs">{row.original.nationality}</span> },
    {
      id: "vipLevel",
      accessorKey: "vipLevel",
      header: t("table.vipLevel"),
      cell: ({ row }) =>
        row.original.vipLevel === "VIP_GOLD" ? (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-1 w-fit">
            <Sparkles className="h-3 w-3" />
            {tStatus("VIP_GOLD")}
          </span>
        ) : (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-muted text-muted-foreground w-fit">{tStatus(row.original.vipLevel)}</span>
        ),
    },
    {
      id: "stays",
      header: t("table.stays"),
      cell: ({ row }) => <span className="font-semibold">{t("staysCount", { count: staysByGuestId.get(row.original.id) ?? 0 })}</span>,
    },
    {
      id: "actions",
      header: () => <span className="sr-only">{t("table.actions")}</span>,
      cell: ({ row }) => (
        <Link href={`/guests/${row.original.id}`} className="ml-auto flex w-fit font-medium text-primary hover:underline text-xs">
          {t("actions.viewProfile")}
        </Link>
      ),
    },
  ];

  const isLoading = !hasHydrated || guestsQuery.isLoading;
  const isError = guestsQuery.isError;

  return (
    <div>
      {/* Mobile view */}
      <div className="md:hidden">
        <MobileHeader
          title={t("mobileTitle")}
          rightSlot={
            <PermissionGuard permission="guest:edit">
              <button
                onClick={() => setNewGuestOpen(true)}
                aria-label={t("addGuestAriaLabel")}
                className="h-9 w-9 flex items-center justify-center rounded-full text-foreground hover:bg-muted transition-colors"
              >
                <Plus className="h-5 w-5" />
              </button>
            </PermissionGuard>
          }
        />
        <div className="p-4 space-y-4">
          <DataTableToolbar searchValue={search} onSearchChange={setSearch} searchPlaceholder={t("searchPlaceholder")} />
          {isLoading ? (
            <PageSkeleton />
          ) : isError ? (
            <ErrorState title={t("loadError")} onRetry={() => guestsQuery.refetch()} />
          ) : (
            <ResponsiveDataList
              data={filteredGuests}
              keyExtractor={(g) => g.id}
              emptyMessage={tCommon("status.noResults")}
              renderCard={(guest) => (
                <Link
                  href={`/guests/${guest.id}`}
                  className="flex items-center gap-3 bg-card border border-border/60 rounded-2xl p-3.5 shadow-sm active:scale-[0.99] transition-transform"
                >
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm flex-shrink-0">
                    {guest.firstName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">
                      {guest.firstName} {guest.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {guest.phone ?? "—"} · {t("staysCount", { count: staysByGuestId.get(guest.id) ?? 0 })}
                    </p>
                  </div>
                  {guest.vipLevel === "VIP_GOLD" && <Sparkles className="h-4 w-4 text-amber-500 flex-shrink-0" />}
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </Link>
              )}
            />
          )}
        </div>
      </div>

      {/* Desktop / tablet view */}
      <div className="hidden md:block space-y-6">
        <PageHeader title={t("title")} description={t("description")} actionLabel={canCreate ? t("actions.newGuest") : undefined} actionIcon={Plus} onAction={() => setNewGuestOpen(true)} />

        <DataTableToolbar searchValue={search} onSearchChange={setSearch} searchPlaceholder={t("searchPlaceholder")} />

        {isLoading ? (
          <PageSkeleton />
        ) : isError ? (
          <ErrorState title={t("loadError")} onRetry={() => guestsQuery.refetch()} />
        ) : (
          <DataTable columns={columns} data={filteredGuests} emptyMessage={tCommon("status.noResults")} />
        )}
      </div>

      <NewGuestDialog
        isOpen={newGuestOpen}
        onClose={() => setNewGuestOpen(false)}
        onSubmit={(values) => createGuestMutation.mutate(values)}
        isSubmitting={createGuestMutation.isPending}
      />
    </div>
  );
}
