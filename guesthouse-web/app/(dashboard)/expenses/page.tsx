"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/header";
import { MobileHeader } from "@/components/layout/mobile-header";
import { DataTable } from "@/components/shared/data-table";
import { DataTableToolbar } from "@/components/shared/data-table-toolbar";
import { ResponsiveDataList } from "@/components/shared/responsive-data-list";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { MoneyDisplay } from "@/components/shared/money-display";
import { DateDisplay } from "@/components/shared/date-display";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import type { ExpenseDto, CreateExpenseRequest } from "@/lib/api-types";
import { DollarSign, Plus, Zap, Wifi, ShoppingBag, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { NewExpenseDialog } from "@/components/expenses/new-expense-dialog";

export default function ExpensesPage() {
  const t = useTranslations("expenses");
  const tCommon = useTranslations("common");
  const queryClient = useQueryClient();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const canView = hasHydrated && hasPermission("expense:view");
  const canCreate = hasHydrated && hasPermission("expense:create");
  const canApprove = hasHydrated && hasPermission("expense:approve");

  const expensesQuery = useQuery({
    queryKey: ["expenses"],
    queryFn: () => apiFetch<ExpenseDto[]>("/expenses"),
    enabled: canView,
  });
  const expenses = expensesQuery.data;

  const [search, setSearch] = React.useState("");
  const [newExpenseOpen, setNewExpenseOpen] = React.useState(false);

  const filtered = React.useMemo(() => {
    const list = expenses ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (exp) => exp.expenseNumber.toLowerCase().includes(q) || exp.description.toLowerCase().includes(q) || (exp.vendor ?? "").toLowerCase().includes(q)
    );
  }, [expenses, search]);

  const createMutation = useMutation({
    mutationFn: (values: CreateExpenseRequest) => apiFetch<ExpenseDto>("/expenses", { method: "POST", body: JSON.stringify(values) }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success(t("toasts.recorded", { expenseNumber: created.expenseNumber }));
      setNewExpenseOpen(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => apiFetch<ExpenseDto>(`/expenses/${id}/approve`, { method: "PUT" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success(t("toasts.approved"));
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "ELECTRICITY":
        return <Zap className="h-3.5 w-3.5 text-amber-500" />;
      case "INTERNET":
        return <Wifi className="h-3.5 w-3.5 text-blue-500" />;
      case "SUPPLIES":
        return <ShoppingBag className="h-3.5 w-3.5 text-purple-500" />;
      default:
        return <DollarSign className="h-3.5 w-3.5 text-emerald-500" />;
    }
  };

  const getCategoryLabel = (category: string) => (t.has(`categories.${category}`) ? t(`categories.${category}`) : category);

  const columns: ColumnDef<ExpenseDto, unknown>[] = [
    { accessorKey: "expenseNumber", header: t("table.expenseNumber"), cell: ({ row }) => <span className="font-mono font-bold text-primary">{row.original.expenseNumber}</span> },
    {
      accessorKey: "category",
      header: t("table.category"),
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-muted text-foreground">
          {getCategoryIcon(row.original.category)}
          {getCategoryLabel(row.original.category)}
        </span>
      ),
    },
    { accessorKey: "description", header: t("table.description"), cell: ({ row }) => <span className="font-semibold text-foreground">{row.original.description}</span> },
    { accessorKey: "vendor", header: t("table.vendor"), cell: ({ row }) => <span className="text-xs font-medium text-muted-foreground">{row.original.vendor ?? "—"}</span> },
    { accessorKey: "amount", header: t("table.amount"), cell: ({ row }) => <MoneyDisplay amount={row.original.amount} hideSecondary className="text-rose-500" /> },
    { accessorKey: "expenseDate", header: t("table.date"), cell: ({ row }) => <span className="text-xs text-muted-foreground"><DateDisplay date={row.original.expenseDate} /></span> },
    { accessorKey: "approvalStatus", header: t("table.status"), cell: ({ row }) => <StatusBadge status={row.original.approvalStatus} /> },
    {
      id: "actions",
      header: () => <span className="sr-only">{t("table.actions")}</span>,
      cell: ({ row }) =>
        canApprove && row.original.approvalStatus !== "APPROVED" ? (
          <Button size="sm" className="ml-auto" onClick={() => approveMutation.mutate(row.original.id)} disabled={approveMutation.isPending}>
            <CheckCircle2 />
            <span>{t("actions.approve")}</span>
          </Button>
        ) : null,
    },
  ];

  const isLoading = !hasHydrated || expensesQuery.isLoading;
  const isError = expensesQuery.isError;

  return (
    <div>
      {/* Mobile view */}
      <div className="md:hidden">
        <MobileHeader
          title={t("title")}
          rightSlot={
            canCreate ? (
              <button
                onClick={() => setNewExpenseOpen(true)}
                aria-label={t("actions.recordExpense")}
                className="flex h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-muted"
              >
                <Plus className="h-5 w-5" />
              </button>
            ) : undefined
          }
        />
        <div className="space-y-4 p-4">
          <DataTableToolbar searchValue={search} onSearchChange={setSearch} searchPlaceholder={t("search.placeholder")} />
          {isLoading ? (
            <PageSkeleton />
          ) : isError ? (
            <ErrorState title={t("loadError")} onRetry={() => expensesQuery.refetch()} />
          ) : (
            <ResponsiveDataList
              data={filtered}
              keyExtractor={(exp) => exp.id}
              emptyMessage={tCommon("status.noResults")}
              renderCard={(exp) => (
                <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-mono text-xs font-bold text-primary">{exp.expenseNumber}</p>
                      <p className="text-sm font-bold text-foreground">{exp.description}</p>
                      <p className="text-xs text-muted-foreground">{exp.vendor ?? "—"}</p>
                    </div>
                    <StatusBadge status={exp.approvalStatus} />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 font-bold text-foreground">
                      {getCategoryIcon(exp.category)}
                      {getCategoryLabel(exp.category)}
                    </span>
                    <MoneyDisplay amount={exp.amount} hideSecondary className="text-rose-500" />
                  </div>
                  <div className="flex items-center justify-between border-t border-border/40 pt-2.5 text-[11px] text-muted-foreground">
                    <DateDisplay date={exp.expenseDate} />
                    {canApprove && exp.approvalStatus !== "APPROVED" && (
                      <button
                        onClick={() => approveMutation.mutate(exp.id)}
                        disabled={approveMutation.isPending}
                        className="flex items-center gap-1 font-semibold text-emerald-500 disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>{t("actions.approve")}</span>
                      </button>
                    )}
                  </div>
                </div>
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
        actionLabel={canCreate ? t("actions.recordExpense") : undefined}
        actionIcon={Plus}
        onAction={() => setNewExpenseOpen(true)}
      />

      <DataTableToolbar searchValue={search} onSearchChange={setSearch} searchPlaceholder={t("search.placeholder")} />

      {isLoading ? (
        <PageSkeleton />
      ) : isError ? (
        <ErrorState title={t("loadError")} onRetry={() => expensesQuery.refetch()} />
      ) : (
        <DataTable columns={columns} data={filtered} emptyMessage={tCommon("status.noResults")} />
      )}
      </div>

      <NewExpenseDialog
        isOpen={newExpenseOpen}
        onClose={() => setNewExpenseOpen(false)}
        onSubmit={(values) => createMutation.mutate(values)}
        isSubmitting={createMutation.isPending}
      />
    </div>
  );
}
