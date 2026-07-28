"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/header";
import { MobileHeader } from "@/components/layout/mobile-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { DateDisplay } from "@/components/shared/date-display";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import type { HousekeepingTaskDto } from "@/lib/api-types";
import { CheckCircle2, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const PRIORITY_DOT: Record<string, string> = {
  HIGH: "bg-rose-500",
  MEDIUM: "bg-amber-500",
  LOW: "bg-emerald-500",
};

function humanizeTaskType(taskType: string): string {
  return taskType
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function HousekeepingPage() {
  const t = useTranslations("housekeeping");
  const tStatus = useTranslations("enum.status");
  const router = useRouter();
  const queryClient = useQueryClient();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const canView = hasHydrated && hasPermission("housekeeping:view");
  const canUpdate = hasHydrated && hasPermission("housekeeping:update");

  const tasksQuery = useQuery({
    queryKey: ["housekeeping", "tasks"],
    queryFn: () => apiFetch<HousekeepingTaskDto[]>("/housekeeping/tasks"),
    enabled: canView,
  });
  const tasks = tasksQuery.data ?? [];

  const [tab, setTab] = React.useState<"PENDING" | "IN_PROGRESS" | "COMPLETED">("PENDING");

  const TABS = [
    { key: "PENDING", label: t("tabs.toClean") },
    { key: "IN_PROGRESS", label: t("tabs.inProgress") },
    { key: "COMPLETED", label: t("tabs.completed") },
  ] as const;

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiFetch<HousekeepingTaskDto>(`/housekeeping/tasks/${id}/status?status=${encodeURIComponent(status)}`, { method: "PUT" }),
    onSuccess: (_task, variables) => {
      queryClient.invalidateQueries({ queryKey: ["housekeeping", "tasks"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast.success(t("toast.statusUpdated", { status: tStatus(variables.status) }));
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const counts = {
    PENDING: tasks.filter((task) => task.status === "PENDING").length,
    IN_PROGRESS: tasks.filter((task) => task.status === "IN_PROGRESS").length,
    COMPLETED: tasks.filter((task) => task.status === "COMPLETED").length,
  };
  const visibleTasks = tasks.filter((task) => task.status === tab);

  const isLoading = !hasHydrated || tasksQuery.isLoading;
  const isError = tasksQuery.isError;

  return (
    <div>
      {/* Mobile view */}
      <div className="md:hidden">
        <MobileHeader title={t("mobileTitle")} />
        <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto scrollbar-none">
          {TABS.map((tabItem) => (
            <button
              key={tabItem.key}
              onClick={() => setTab(tabItem.key)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                tab === tabItem.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {tabItem.label} {counts[tabItem.key]}
            </button>
          ))}
        </div>

        <div className="px-4 pb-4 space-y-3">
          {isLoading ? (
            <PageSkeleton />
          ) : isError ? (
            <ErrorState title={t("loadError")} onRetry={() => tasksQuery.refetch()} />
          ) : (
            <>
              {visibleTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => router.push(`/housekeeping/${task.id}`)}
                  className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm space-y-3 cursor-pointer active:scale-[0.99] transition-transform"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${PRIORITY_DOT[task.priority] ?? "bg-muted-foreground"}`} />
                      <div>
                        <p className="text-sm font-bold text-foreground">{t("roomLabel", { number: task.roomNumber })}</p>
                        <p className="text-xs text-muted-foreground">{humanizeTaskType(task.taskType)}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <DateDisplay date={task.scheduledDate} />
                  </p>

                  {canUpdate && task.status === "PENDING" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        statusMutation.mutate({ id: task.id, status: "IN_PROGRESS" });
                      }}
                      disabled={statusMutation.isPending}
                      className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-xs font-bold disabled:opacity-50"
                    >
                      {t("actions.startCleaning")}
                    </button>
                  )}
                  {canUpdate && task.status === "IN_PROGRESS" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        statusMutation.mutate({ id: task.id, status: "COMPLETED" });
                      }}
                      disabled={statusMutation.isPending}
                      className="w-full h-10 rounded-xl bg-emerald-600 text-white text-xs font-bold disabled:opacity-50"
                    >
                      {t("actions.markComplete")}
                    </button>
                  )}
                  {task.status === "COMPLETED" && <StatusBadge status="COMPLETED" />}
                </div>
              ))}

              {visibleTasks.length === 0 && <p className="text-center text-sm text-muted-foreground py-10">{t("emptyState.message")}</p>}
            </>
          )}
        </div>
      </div>

      {/* Desktop / tablet view */}
      <div className="hidden md:block space-y-6">
        <PageHeader title={t("title")} description={t("description")} />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground uppercase">{t("summary.pendingCleaning")}</p>
            <p className="text-2xl font-bold text-amber-500">{counts.PENDING}</p>
          </div>
          <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground uppercase">{t("summary.inProgress")}</p>
            <p className="text-2xl font-bold text-blue-500">{counts.IN_PROGRESS}</p>
          </div>
          <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground uppercase">{t("summary.completedToday")}</p>
            <p className="text-2xl font-bold text-emerald-500">{counts.COMPLETED}</p>
          </div>
        </div>

        <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-xl space-y-4">
          {isLoading ? (
            <PageSkeleton />
          ) : isError ? (
            <ErrorState title={t("loadError")} onRetry={() => tasksQuery.refetch()} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border/40 text-xs font-semibold uppercase text-muted-foreground bg-muted/20">
                    <th className="py-3 px-4">{t("table.roomNumber")}</th>
                    <th className="py-3 px-4">{t("table.taskType")}</th>
                    <th className="py-3 px-4">{t("table.priority")}</th>
                    <th className="py-3 px-4">{t("table.scheduled")}</th>
                    <th className="py-3 px-4">{t("table.status")}</th>
                    <th className="py-3 px-4 text-right">{t("table.actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {tasks.map((task) => (
                    <tr key={task.id} className="hover:bg-muted/30 transition-all">
                      <td className="py-3.5 px-4 font-black text-foreground">{t("roomNumberHash", { number: task.roomNumber })}</td>
                      <td className="py-3.5 px-4 font-semibold">{humanizeTaskType(task.taskType)}</td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={task.priority} />
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground">
                        <DateDisplay date={task.scheduledDate} />
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={task.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {canUpdate && task.status === "PENDING" && (
                          <button
                            onClick={() => statusMutation.mutate({ id: task.id, status: "IN_PROGRESS" })}
                            disabled={statusMutation.isPending}
                            className="px-3.5 py-1.5 bg-primary text-primary-foreground font-semibold text-xs rounded-xl shadow-md hover:bg-primary/90 inline-flex items-center gap-1 disabled:opacity-50"
                          >
                            <span>{t("actions.startCleaning")}</span>
                          </button>
                        )}
                        {canUpdate && task.status === "IN_PROGRESS" && (
                          <button
                            onClick={() => statusMutation.mutate({ id: task.id, status: "COMPLETED" })}
                            disabled={statusMutation.isPending}
                            className="px-3.5 py-1.5 bg-emerald-600 text-white font-semibold text-xs rounded-xl shadow-md hover:bg-emerald-700 inline-flex items-center gap-1 disabled:opacity-50"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>{t("actions.markClean")}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {tasks.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">{t("emptyState.message")}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
