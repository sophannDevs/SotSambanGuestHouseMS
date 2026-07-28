"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MobileHeader } from "@/components/layout/mobile-header";
import { PageHeader } from "@/components/layout/header";
import { EmptyState } from "@/components/shared/empty-state";
import { StepIndicator } from "@/components/shared/step-indicator";
import { FormActions } from "@/components/shared/form-actions";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { DateDisplay } from "@/components/shared/date-display";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import type { HousekeepingTaskDto } from "@/lib/api-types";
import { SearchX, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

function humanizeTaskType(taskType: string): string {
  return taskType
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const STATUS_TO_STEP: Record<string, number> = { PENDING: 1, IN_PROGRESS: 2, COMPLETED: 3, INSPECTED: 3 };
const NEXT_STATUS: Record<string, string> = { PENDING: "IN_PROGRESS", IN_PROGRESS: "COMPLETED" };

export default function HousekeepingFlowPage() {
  const t = useTranslations("housekeepingDetail");
  const tStatus = useTranslations("enum.status");
  const params = useParams<{ id: string }>();
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

  const task = tasksQuery.data?.find((tk) => tk.id === params.id);

  const FLOW_STEPS = [
    { key: 1, title: t("steps.start.title"), description: t("steps.start.description") },
    { key: 2, title: t("steps.inProgress.title"), description: t("steps.inProgress.description") },
    { key: 3, title: t("steps.complete.title"), description: t("steps.complete.description") },
  ];

  const statusMutation = useMutation({
    mutationFn: (status: string) => apiFetch<HousekeepingTaskDto>(`/housekeeping/tasks/${params.id}/status?status=${encodeURIComponent(status)}`, { method: "PUT" }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["housekeeping", "tasks"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      if (updated.status === "COMPLETED") {
        toast.success(t("toast.roomMarked", { room: updated.roomNumber, status: tStatus("CLEAN") }));
        router.push("/housekeeping");
      }
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!hasHydrated || tasksQuery.isLoading) {
    return (
      <div className="p-4 md:p-0">
        <PageSkeleton />
      </div>
    );
  }

  if (tasksQuery.isError) {
    return (
      <div className="p-4 md:p-0">
        <ErrorState title={t("loadError")} onRetry={() => tasksQuery.refetch()} />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="p-6">
        <EmptyState
          icon={SearchX}
          title={t("notFound.title")}
          description={t("notFound.description")}
          action={{ label: t("notFound.backAction"), icon: ArrowLeft, onClick: () => router.push("/housekeeping") }}
        />
      </div>
    );
  }

  const currentStep = STATUS_TO_STEP[task.status] ?? 1;
  const nextStatus = NEXT_STATUS[task.status];

  return (
    <div className="mx-auto max-w-lg md:max-w-2xl">
      <MobileHeader title={t("title")} showNotification={false} />
      <div className="hidden md:block">
        <PageHeader title={t("title")} description={t("description", { room: task.roomNumber })} />
      </div>

      <div className="p-4 space-y-6 pb-36 md:p-0 md:pb-8">
        <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm">
          <p className="text-sm font-bold text-foreground">
            {task.roomNumber} {humanizeTaskType(task.taskType)}
          </p>
          <p className="text-xs text-muted-foreground">
            <DateDisplay date={task.scheduledDate} />
          </p>
        </div>

        <StepIndicator steps={FLOW_STEPS} currentStep={currentStep} orientation="vertical" />
      </div>

      {canUpdate && nextStatus && (
        <FormActions sticky>
          <Button
            size="lg"
            className="w-full md:w-auto md:px-8"
            onClick={() => statusMutation.mutate(nextStatus)}
            disabled={statusMutation.isPending}
          >
            {currentStep < 3 ? t("actions.advanceTo", { title: FLOW_STEPS[currentStep]?.title ?? "" }) : t("actions.markAsComplete")}
          </Button>
        </FormActions>
      )}
    </div>
  );
}
