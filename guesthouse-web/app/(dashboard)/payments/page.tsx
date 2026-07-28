"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/layout/header";
import { DataTable } from "@/components/shared/data-table";
import { DataTableToolbar } from "@/components/shared/data-table-toolbar";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { MoneyDisplay } from "@/components/shared/money-display";
import { DateTimeDisplay } from "@/components/shared/date-display";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import type { PaymentDto, ReservationDto, RecordPaymentRequest } from "@/lib/api-types";
import { CreditCard, Plus, DollarSign, Banknote, QrCode, FileText } from "lucide-react";
import { toast } from "sonner";
import { RecordPaymentDialog } from "@/components/payments/record-payment-dialog";

export default function PaymentsPage() {
  const t = useTranslations("payments");
  const tCommon = useTranslations("common");
  const queryClient = useQueryClient();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const canView = hasHydrated && hasPermission("payment:view");
  const canCreate = hasHydrated && hasPermission("payment:create");

  const paymentsQuery = useQuery({
    queryKey: ["payments"],
    queryFn: () => apiFetch<PaymentDto[]>("/payments"),
    enabled: canView,
  });
  const reservationsQuery = useQuery({
    queryKey: ["reservations"],
    queryFn: () => apiFetch<ReservationDto[]>("/reservations"),
    enabled: canView,
  });

  const payments = paymentsQuery.data;
  const [search, setSearch] = React.useState("");
  const [recordOpen, setRecordOpen] = React.useState(false);

  const filtered = React.useMemo(() => {
    const list = payments ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((p) => p.paymentNumber.toLowerCase().includes(q) || p.guestName.toLowerCase().includes(q) || p.reservationNumber.toLowerCase().includes(q));
  }, [payments, search]);

  const recordMutation = useMutation({
    mutationFn: (values: RecordPaymentRequest) => apiFetch<PaymentDto>("/payments", { method: "POST", body: JSON.stringify(values) }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      toast.success(t("toasts.recorded", { paymentNumber: created.paymentNumber }));
      setRecordOpen(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const getMethodBadge = (method: string) => {
    switch (method) {
      case "CASH":
        return <span className="flex items-center gap-1 text-emerald-500 font-semibold"><Banknote className="h-3.5 w-3.5" /> {t("methods.CASH")}</span>;
      case "CREDIT_CARD":
        return <span className="flex items-center gap-1 text-blue-500 font-semibold"><CreditCard className="h-3.5 w-3.5" /> {t("methods.CREDIT_CARD")}</span>;
      case "KHQR":
        return <span className="flex items-center gap-1 text-rose-500 font-semibold"><QrCode className="h-3.5 w-3.5" /> {t("methods.KHQR")}</span>;
      default:
        return <span className="flex items-center gap-1 text-muted-foreground font-semibold"><DollarSign className="h-3.5 w-3.5" /> {t("methods.BANK_TRANSFER")}</span>;
    }
  };

  const columns: ColumnDef<PaymentDto, unknown>[] = [
    { accessorKey: "paymentNumber", header: t("table.paymentNumber"), cell: ({ row }) => <span className="font-mono font-bold text-primary">{row.original.paymentNumber}</span> },
    { accessorKey: "reservationNumber", header: t("table.reservationNumber"), cell: ({ row }) => <span className="font-mono text-xs">{row.original.reservationNumber}</span> },
    { accessorKey: "guestName", header: t("table.guest"), cell: ({ row }) => <span className="font-bold text-foreground">{row.original.guestName}</span> },
    { accessorKey: "amount", header: t("table.amount"), cell: ({ row }) => <MoneyDisplay amount={row.original.amount} hideSecondary className="text-emerald-500" /> },
    { id: "method", header: t("table.method"), cell: ({ row }) => <span className="text-xs">{getMethodBadge(row.original.paymentMethod)}</span> },
    {
      id: "kind",
      header: t("table.kind"),
      cell: ({ row }) => {
        const key = `kinds.${row.original.paymentKind}`;
        return <Badge variant="neutral">{t.has(key) ? t(key) : row.original.paymentKind}</Badge>;
      },
    },
    { accessorKey: "status", header: t("table.status"), cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { accessorKey: "paymentTime", header: t("table.timestamp"), cell: ({ row }) => <span className="text-xs text-muted-foreground"><DateTimeDisplay date={row.original.paymentTime} /></span> },
    {
      id: "receipt",
      header: () => <span className="sr-only">{t("table.receipt")}</span>,
      cell: () => (
        <button
          disabled
          title={t("toasts.receiptNotAvailable")}
          className="ml-auto flex items-center gap-1 px-3 py-1 bg-muted text-muted-foreground font-semibold text-xs rounded-xl cursor-not-allowed"
        >
          <FileText className="h-3.5 w-3.5" />
          <span>{t("table.receipt")}</span>
        </button>
      ),
    },
  ];

  const isLoading = !hasHydrated || paymentsQuery.isLoading;
  const isError = paymentsQuery.isError;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actionLabel={canCreate ? t("actions.recordPayment") : undefined}
        actionIcon={Plus}
        onAction={() => setRecordOpen(true)}
      />

      <DataTableToolbar searchValue={search} onSearchChange={setSearch} searchPlaceholder={t("search.placeholder")} />

      {isLoading ? (
        <PageSkeleton />
      ) : isError ? (
        <ErrorState title={t("loadError")} onRetry={() => paymentsQuery.refetch()} />
      ) : (
        <DataTable columns={columns} data={filtered} emptyMessage={tCommon("status.noResults")} />
      )}

      <RecordPaymentDialog
        isOpen={recordOpen}
        onClose={() => setRecordOpen(false)}
        reservations={reservationsQuery.data ?? []}
        onSubmit={(values) => recordMutation.mutate(values)}
        isSubmitting={recordMutation.isPending}
      />
    </div>
  );
}
