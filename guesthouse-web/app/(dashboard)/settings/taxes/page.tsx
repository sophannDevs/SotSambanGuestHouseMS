"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Percent } from "lucide-react";
import { DetailHeader } from "@/components/shared/detail-header";
import { MobileHeader } from "@/components/layout/mobile-header";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { NotAvailableNotice } from "@/components/shared/not-available-notice";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import type { TaxDto } from "@/lib/api-types";
import { TaxFormDialog } from "@/components/settings/tax-form-dialog";

export default function TaxesSettingsPage() {
  const t = useTranslations("settings.taxes");
  const tCommon = useTranslations("common");
  const queryClient = useQueryClient();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const canView = hasHydrated && hasPermission("settings:view");
  const canEdit = hasHydrated && hasPermission("settings:edit");

  const taxesQuery = useQuery({
    queryKey: ["taxes"],
    queryFn: () => apiFetch<TaxDto[]>("/properties/taxes"),
    enabled: canView,
  });

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingTax, setEditingTax] = React.useState<TaxDto | null>(null);

  const saveMutation = useMutation({
    mutationFn: (values: TaxDto) => apiFetch<TaxDto>("/properties/taxes", { method: "POST", body: JSON.stringify(values) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taxes"] });
      toast.success(t("savedSuccess"));
      setDialogOpen(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const openCreate = () => {
    setEditingTax(null);
    setDialogOpen(true);
  };
  const openEdit = (tax: TaxDto) => {
    setEditingTax(tax);
    setDialogOpen(true);
  };

  const isLoading = !hasHydrated || taxesQuery.isLoading;
  const isError = taxesQuery.isError;
  const taxes = taxesQuery.data ?? [];

  const list = isLoading ? (
    <PageSkeleton />
  ) : isError ? (
    <ErrorState title={t("loadError")} onRetry={() => taxesQuery.refetch()} />
  ) : taxes.length === 0 ? (
    <EmptyState icon={Percent} title={t("empty.title")} description={t("empty.description")} />
  ) : (
    <div className="space-y-3">
      {taxes.map((tax) => (
        <button
          key={tax.id}
          type="button"
          onClick={() => canEdit && openEdit(tax)}
          disabled={!canEdit}
          className="w-full flex items-center justify-between gap-3 bg-card border border-border/60 rounded-2xl p-4 shadow-sm text-left disabled:cursor-not-allowed hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Percent className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{tax.name}</p>
              <p className="text-xs text-muted-foreground">
                {tax.appliesToServiceCharge ? t("appliesToServiceCharge") : t("excludesServiceCharge")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-black text-foreground">{tax.ratePercentage}%</span>
            <StatusBadge status={tax.active ? "ACTIVE" : "INACTIVE"} />
          </div>
        </button>
      ))}
    </div>
  );

  return (
    <div>
      <div className="md:hidden">
        <MobileHeader title={t("mobileTitle")} />
        {canEdit && (
          <div className="p-4 pb-0">
            <Button onClick={openCreate} className="w-full">
              <Plus />
              <span>{t("addTax")}</span>
            </Button>
          </div>
        )}
      </div>
      <div className="hidden md:block">
        <DetailHeader
          backHref="/settings"
          backLabel={tCommon("actions.backToSettings")}
          title={t("title")}
          description={t("description")}
          actionLabel={canEdit ? t("addTax") : undefined}
          actionIcon={Plus}
          onAction={openCreate}
        />
      </div>

      {/* Rendered once (not duplicated per breakpoint) */}
      <div className="p-4 space-y-4 md:p-0 md:mt-6 md:space-y-6">
        {list}
        <NotAvailableNotice title={t("notAvailable.title")} description={t("notAvailable.description")} />
      </div>

      <TaxFormDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        tax={editingTax}
        onSubmit={(values) => saveMutation.mutate(values)}
        isSubmitting={saveMutation.isPending}
      />
    </div>
  );
}
