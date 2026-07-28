"use client";

import { useTranslations } from "next-intl";
import { Terminal } from "lucide-react";
import { DetailHeader } from "@/components/shared/detail-header";
import { MobileHeader } from "@/components/layout/mobile-header";
import { EmptyState } from "@/components/shared/empty-state";

// application-local.yml documents an intended /api/v1/dev/* surface (email
// viewer, seed-data reset, DevProfileGuard) that was never actually
// implemented — confirmed against the controller package, which has no
// dev/mail-related class at all (current-ui-audit.md Appendix A: "dev
// (reset-data): NOT STARTED — SEED_DEMO_DATA flag is read by nothing").
// The previous /settings "dev" tab presented a static "1 Simulated Mail"
// block as if this were live — replaced with an honest empty state rather
// than carrying that fabrication forward.
export default function LocalDevSettingsPage() {
  const t = useTranslations("settings.localDev");
  const tCommon = useTranslations("common");

  const content = (
    <EmptyState icon={Terminal} title={t("empty.title")} description={t("empty.description")} />
  );

  return (
    <div>
      <div className="md:hidden">
        <MobileHeader title={t("mobileTitle")} />
      </div>
      <div className="hidden md:block">
        <DetailHeader backHref="/settings" backLabel={tCommon("actions.backToSettings")} title={t("title")} description={t("description")} />
      </div>
      <div className="p-4 md:p-0 md:mt-6">{content}</div>
    </div>
  );
}
