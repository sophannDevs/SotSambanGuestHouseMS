"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/layout/header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Plus, Shield, Mail } from "lucide-react";
import { toast } from "sonner";

interface StaffItem {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "MANAGER" | "RECEPTIONIST";
  status: "ACTIVE";
}

const DEMO_STAFF: StaffItem[] = [
  { id: "1", name: "Sot Samban", email: "owner@sotsamban.local", role: "OWNER", status: "ACTIVE" },
  { id: "2", name: "Manager Admin", email: "manager@sotsamban.local", role: "MANAGER", status: "ACTIVE" },
  { id: "3", name: "Front Desk Staff", email: "reception@sotsamban.local", role: "RECEPTIONIST", status: "ACTIVE" },
];

export default function StaffPage() {
  const t = useTranslations("staff");
  const [staff] = React.useState<StaffItem[]>(DEMO_STAFF);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actionLabel={t("addMember")}
        actionIcon={Plus}
        onAction={() => toast.info(t("toast.addMemberOpened"))}
      />

      <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-border/40 text-xs font-semibold uppercase text-muted-foreground bg-muted/20">
                <th className="py-3 px-4">{t("table.name")}</th>
                <th className="py-3 px-4">{t("table.email")}</th>
                <th className="py-3 px-4">{t("table.role")}</th>
                <th className="py-3 px-4">{t("table.status")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {staff.map((member) => (
                <tr key={member.id} className="hover:bg-muted/30 transition-all">
                  <td className="py-3.5 px-4 font-bold text-foreground">{member.name}</td>
                  <td className="py-3.5 px-4 text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                    <Mail className="h-3.5 w-3.5" />
                    {member.email}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center gap-1 w-fit">
                      <Shield className="h-3 w-3" />
                      {t(`roles.${member.role}`)}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={member.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
