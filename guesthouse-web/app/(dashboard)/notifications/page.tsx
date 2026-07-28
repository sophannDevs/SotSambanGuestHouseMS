"use client";

import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/layout/header";
import { MobileHeader } from "@/components/layout/mobile-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Bell, CheckCheck } from "lucide-react";

export default function NotificationsPage() {
  const t = useTranslations("notifications");

  return (
    <div>
      <div className="md:hidden">
        <MobileHeader title={t("title")} showNotification={false} />
      </div>
      <div className="hidden md:block">
        <PageHeader
          title={t("title")}
          description={t("description")}
          actionLabel={t("markAllAsRead")}
          actionIcon={CheckCheck}
        />
      </div>
      <div className="p-4 md:p-0">
        <EmptyState
          icon={Bell}
          title={t("empty.title")}
          description={t("empty.description")}
        />
      </div>
    </div>
  );
}
