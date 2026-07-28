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
import { NotAvailableNotice } from "@/components/shared/not-available-notice";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import type { StaffDto } from "@/lib/api-types";
import { Plus, Shield } from "lucide-react";

export default function StaffPage() {
  const t = useTranslations("staff");
  const tCommon = useTranslations("common");
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const canView = hasHydrated && hasPermission("staff:view");

  const staffQuery = useQuery({
    queryKey: ["staff"],
    queryFn: () => apiFetch<StaffDto[]>("/staff"),
    enabled: canView,
  });
  const staff = staffQuery.data;

  const [search, setSearch] = React.useState("");
  const filtered = React.useMemo(() => {
    const list = staff ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((s) => s.displayName.toLowerCase().includes(q) || s.email.toLowerCase().includes(q));
  }, [staff, search]);

  const getRoleLabel = (role: string) => (t.has(`roles.${role}`) ? t(`roles.${role}`) : role);

  const columns: ColumnDef<StaffDto, unknown>[] = [
    { accessorKey: "displayName", header: t("table.name"), cell: ({ row }) => <span className="font-bold text-foreground">{row.original.displayName}</span> },
    { accessorKey: "email", header: t("table.email"), cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.email}</span> },
    {
      accessorKey: "roles",
      header: t("table.role"),
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1.5">
          {row.original.roles.map((role) => (
            <Badge key={role} variant="info" className="gap-1">
              <Shield className="h-3 w-3" />
              {getRoleLabel(role)}
            </Badge>
          ))}
        </div>
      ),
    },
    { accessorKey: "status", header: t("table.status"), cell: ({ row }) => <StatusBadge status={row.original.status} /> },
  ];

  const isLoading = !hasHydrated || staffQuery.isLoading;
  const isError = staffQuery.isError;

  return (
    <div>
      {/* Mobile view */}
      <div className="md:hidden">
        <MobileHeader title={t("title")} />
        <div className="space-y-4 p-4">
          <DataTableToolbar searchValue={search} onSearchChange={setSearch} searchPlaceholder={t("search.placeholder")} />
          {isLoading ? (
            <PageSkeleton />
          ) : isError ? (
            <ErrorState title={t("loadError")} onRetry={() => staffQuery.refetch()} />
          ) : (
            <ResponsiveDataList
              data={filtered}
              keyExtractor={(s) => s.id}
              emptyMessage={tCommon("status.noResults")}
              renderCard={(s) => (
                <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-xs font-bold text-white">
                        {s.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">{s.displayName}</p>
                        <p className="text-xs text-muted-foreground">{s.email}</p>
                      </div>
                    </div>
                    <StatusBadge status={s.status} />
                  </div>
                  <div className="flex flex-wrap gap-1.5 pl-11.5">
                    {s.roles.map((role) => (
                      <Badge key={role} variant="info" className="gap-1">
                        <Shield className="h-3 w-3" />
                        {getRoleLabel(role)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            />
          )}
          <NotAvailableNotice title={t("notAvailable.title")} description={t("notAvailable.description")} />
        </div>
      </div>

      {/* Desktop / tablet view */}
      <div className="hidden md:block space-y-6">
        <PageHeader
          title={t("title")}
          description={t("description")}
          actionLabel={t("addMember")}
          actionIcon={Plus}
          actionDisabledReason={t("toast.notAvailable")}
        />

        <DataTableToolbar searchValue={search} onSearchChange={setSearch} searchPlaceholder={t("search.placeholder")} />

        {isLoading ? (
          <PageSkeleton />
        ) : isError ? (
          <ErrorState title={t("loadError")} onRetry={() => staffQuery.refetch()} />
        ) : (
          <DataTable columns={columns} data={filtered} emptyMessage={tCommon("status.noResults")} />
        )}

        <NotAvailableNotice title={t("notAvailable.title")} description={t("notAvailable.description")} />
      </div>
    </div>
  );
}
