"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/header";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import type { MaintenanceIssueDto, ReportIssueRequest, RoomDto } from "@/lib/api-types";
import { Plus, CheckCircle2, Lock } from "lucide-react";
import { toast } from "sonner";
import { ReportIssueDialog } from "@/components/maintenance/report-issue-dialog";

export default function MaintenancePage() {
  const t = useTranslations("maintenance");
  const tStatus = useTranslations("enum.status");
  const queryClient = useQueryClient();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const canView = hasHydrated && hasPermission("maintenance:view");
  const canCreate = hasHydrated && hasPermission("maintenance:create");
  const canComplete = hasHydrated && hasPermission("maintenance:complete");

  const issuesQuery = useQuery({
    queryKey: ["maintenance", "issues"],
    queryFn: () => apiFetch<MaintenanceIssueDto[]>("/maintenance/issues"),
    enabled: canView,
  });
  const roomsQuery = useQuery({
    queryKey: ["rooms"],
    queryFn: () => apiFetch<RoomDto[]>("/rooms"),
    enabled: canView,
  });

  const issues = issuesQuery.data ?? [];
  const [reportOpen, setReportOpen] = React.useState(false);

  const reportMutation = useMutation({
    mutationFn: (values: ReportIssueRequest) => apiFetch<MaintenanceIssueDto>("/maintenance/issues", { method: "POST", body: JSON.stringify(values) }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["maintenance", "issues"] });
      if (created.blocking) queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast.success(t("toast.issueReported", { roomNumber: created.roomNumber }));
      setReportOpen(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string) => apiFetch<MaintenanceIssueDto>(`/maintenance/issues/${id}/resolve`, { method: "PUT" }),
    onSuccess: (resolved) => {
      queryClient.invalidateQueries({ queryKey: ["maintenance", "issues"] });
      if (resolved.blocking) queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast.success(t("toast.issueResolved", { roomNumber: resolved.roomNumber, status: tStatus("AVAILABLE") }));
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const isLoading = !hasHydrated || issuesQuery.isLoading;
  const isError = issuesQuery.isError;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actionLabel={canCreate ? t("actions.reportIssue") : undefined}
        actionIcon={Plus}
        onAction={() => setReportOpen(true)}
      />

      <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-foreground">{t("sections.reportedIssues", { count: issues.length })}</h3>

        {isLoading ? (
          <PageSkeleton />
        ) : isError ? (
          <ErrorState title={t("loadError")} onRetry={() => issuesQuery.refetch()} />
        ) : issues.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-xs bg-muted/20 border border-border/40 rounded-2xl">{t("emptyState")}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-border/40 text-xs font-semibold uppercase text-muted-foreground bg-muted/20">
                  <th className="py-3 px-4">{t("table.roomNumber")}</th>
                  <th className="py-3 px-4">{t("table.titleDescription")}</th>
                  <th className="py-3 px-4">{t("table.severity")}</th>
                  <th className="py-3 px-4">{t("table.roomBlock")}</th>
                  <th className="py-3 px-4">{t("table.status")}</th>
                  <th className="py-3 px-4 text-right">{t("table.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {issues.map((issue) => (
                  <tr key={issue.id} className="hover:bg-muted/30 transition-all">
                    <td className="py-3.5 px-4 font-black text-foreground">{t("roomNumberHash", { number: issue.roomNumber })}</td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-foreground">{issue.title}</p>
                      {issue.description && <p className="text-xs text-muted-foreground">{issue.description}</p>}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={issue.severity} />
                    </td>
                    <td className="py-3.5 px-4">
                      {issue.blocking ? (
                        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-500/10 text-slate-400 flex items-center gap-1 w-fit">
                          <Lock className="h-3 w-3" />
                          {tStatus("UNDER_MAINTENANCE")}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">{t("labels.nonBlocking")}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={issue.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {canComplete && issue.status === "REPORTED" && (
                        <button
                          onClick={() => resolveMutation.mutate(issue.id)}
                          disabled={resolveMutation.isPending}
                          className="px-3.5 py-1.5 bg-emerald-600 text-white font-semibold text-xs rounded-xl shadow-md hover:bg-emerald-700 inline-flex items-center gap-1 disabled:opacity-50"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>{t("actions.resolveIssue")}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ReportIssueDialog
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        rooms={roomsQuery.data ?? []}
        onSubmit={(values) => reportMutation.mutate(values)}
        isSubmitting={reportMutation.isPending}
      />
    </div>
  );
}
