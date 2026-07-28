"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/header";
import { MobileHeader } from "@/components/layout/mobile-header";
import { DataTable } from "@/components/shared/data-table";
import { DataTableToolbar } from "@/components/shared/data-table-toolbar";
import { ResponsiveDataList } from "@/components/shared/responsive-data-list";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoneyDisplay } from "@/components/shared/money-display";
import { DateDisplay } from "@/components/shared/date-display";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import type { InvoiceDto, BookingDto } from "@/lib/api-types";
import { FileText, Plus, Eye } from "lucide-react";

export default function InvoicesPage() {
  const t = useTranslations("invoices");
  const tCommon = useTranslations("common");
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const canView = hasHydrated && hasPermission("invoice:view");

  const invoicesQuery = useQuery({
    queryKey: ["invoices"],
    queryFn: () => apiFetch<InvoiceDto[]>("/invoices"),
    enabled: canView,
  });
  const bookingsQuery = useQuery({
    queryKey: ["bookings"],
    queryFn: () => apiFetch<BookingDto[]>("/bookings"),
    enabled: canView,
  });

  const invoices = invoicesQuery.data;
  const bookingNumberById = new Map((bookingsQuery.data ?? []).map((b) => [b.id, b.bookingNumber]));

  const [search, setSearch] = React.useState("");
  const filtered = React.useMemo(() => {
    const list = invoices ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((inv) => inv.invoiceNumber.toLowerCase().includes(q) || inv.guestName.toLowerCase().includes(q));
  }, [invoices, search]);

  const getTypeLabel = (type: string) => (t.has(`type.${type}`) ? t(`type.${type}`) : type);

  const columns: ColumnDef<InvoiceDto, unknown>[] = [
    { accessorKey: "invoiceNumber", header: t("table.invoiceNumber"), cell: ({ row }) => <span className="font-mono font-bold text-primary">{row.original.invoiceNumber}</span> },
    {
      id: "bookingNumber",
      header: t("table.reservationNumber"),
      cell: ({ row }) => <span className="font-mono text-xs">{bookingNumberById.get(row.original.bookingId) ?? "—"}</span>,
    },
    { accessorKey: "guestName", header: t("table.guestName"), cell: ({ row }) => <span className="font-bold text-foreground">{row.original.guestName}</span> },
    { accessorKey: "invoiceType", header: t("table.type"), cell: ({ row }) => <Badge variant="info">{getTypeLabel(row.original.invoiceType)}</Badge> },
    { accessorKey: "subtotal", header: t("table.subtotal"), cell: ({ row }) => <MoneyDisplay amount={row.original.subtotal} hideSecondary /> },
    { accessorKey: "taxAmount", header: t("table.vat"), cell: ({ row }) => <MoneyDisplay amount={row.original.taxAmount} hideSecondary /> },
    { accessorKey: "grandTotal", header: t("table.grandTotal"), cell: ({ row }) => <MoneyDisplay amount={row.original.grandTotal} hideSecondary className="font-black" /> },
    { accessorKey: "status", header: t("table.status"), cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    {
      id: "actions",
      header: () => <span className="sr-only">{t("table.actions")}</span>,
      cell: () => (
        <Button variant="ghost" size="sm" className="ml-auto" disabled title={t("toasts.pdfNotAvailable")}>
          <Eye />
          <span>{t("actions.preview")}</span>
        </Button>
      ),
    },
  ];

  const isLoading = !hasHydrated || invoicesQuery.isLoading;
  const isError = invoicesQuery.isError;

  return (
    <div>
      {/* Mobile view */}
      <div className="md:hidden">
        <MobileHeader title={t("mobileTitle")} />
        <div className="space-y-4 p-4">
          <DataTableToolbar searchValue={search} onSearchChange={setSearch} searchPlaceholder={t("search.placeholderShort")} />
          {isLoading ? (
            <PageSkeleton />
          ) : isError ? (
            <ErrorState title={t("loadError")} onRetry={() => invoicesQuery.refetch()} />
          ) : (
            <ResponsiveDataList
              data={filtered}
              keyExtractor={(inv) => inv.id}
              emptyMessage={tCommon("status.noResults")}
              renderCard={(inv) => (
                <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary flex-shrink-0">
                        <FileText className="size-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">{inv.invoiceNumber}</p>
                        <p className="text-xs text-muted-foreground">{inv.guestName}</p>
                      </div>
                    </div>
                    <StatusBadge status={inv.status} />
                  </div>
                  <div className="flex items-center justify-between pl-11 text-xs">
                    <MoneyDisplay amount={inv.grandTotal} hideSecondary className="font-bold text-primary" />
                    <span className="text-muted-foreground font-medium">
                      <DateDisplay date={inv.issuedAt} />
                    </span>
                  </div>
                </div>
              )}
            />
          )}
        </div>
      </div>

      {/* Desktop / tablet view */}
      <div className="hidden md:block space-y-6">
        <PageHeader title={t("title")} description={t("description")} />
        <div className="flex justify-end -mt-4">
          <Button variant="outline" disabled title={t("toasts.issuanceNotAvailable")}>
            <Plus />
            <span>{t("actions.newInvoice")}</span>
          </Button>
        </div>
        <DataTableToolbar searchValue={search} onSearchChange={setSearch} searchPlaceholder={t("search.placeholder")} />
        {isLoading ? (
          <PageSkeleton />
        ) : isError ? (
          <ErrorState title={t("loadError")} onRetry={() => invoicesQuery.refetch()} />
        ) : (
          <DataTable columns={columns} data={filtered} emptyMessage={tCommon("status.noResults")} />
        )}
      </div>
    </div>
  );
}
