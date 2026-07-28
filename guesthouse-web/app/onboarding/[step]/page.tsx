"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, ChevronRight, ChevronLeft, ShieldCheck, Home, MapPin, Clock, DollarSign, BedDouble, FileText, CreditCard, Users, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface StepMeta {
  step: number;
  key: string;
  icon: React.ElementType;
}

const STEPS_META: StepMeta[] = [
  { step: 1, key: "ownerAccount", icon: ShieldCheck },
  { step: 2, key: "propertyInfo", icon: Home },
  { step: 3, key: "addressLocation", icon: MapPin },
  { step: 4, key: "timezone", icon: Clock },
  { step: 5, key: "currency", icon: DollarSign },
  { step: 6, key: "checkInTime", icon: Clock },
  { step: 7, key: "checkOutTime", icon: Clock },
  { step: 8, key: "roomTypes", icon: BedDouble },
  { step: 9, key: "roomInventory", icon: BedDouble },
  { step: 10, key: "taxesFees", icon: FileText },
  { step: 11, key: "paymentMethods", icon: CreditCard },
  { step: 12, key: "staffSetup", icon: Users },
  { step: 13, key: "reviewSetup", icon: Sparkles },
  { step: 14, key: "finishSetup", icon: CheckCircle2 },
];

const DEFAULT_META: StepMeta = {
  step: 1,
  key: "ownerAccount",
  icon: ShieldCheck,
};

export default function OnboardingStepPage() {
  const t = useTranslations("onboarding");
  const params = useParams();
  const router = useRouter();

  const stepNumber = parseInt((params.step as string) || "1", 10);
  const currentStepIndex = Math.min(Math.max(stepNumber - 1, 0), 13);
  const currentMeta: StepMeta = STEPS_META[currentStepIndex] ?? DEFAULT_META;
  const progressPercent = Math.round(((currentStepIndex + 1) / 14) * 100);
  const currentTitle = t(`steps.${currentMeta.key}.title`);
  const currentDesc = t(`steps.${currentMeta.key}.desc`);

  const StepIcon = currentMeta.icon;

  const handleNext = () => {
    if (stepNumber < 14) {
      router.push(`/onboarding/${stepNumber + 1}`);
    } else {
      toast.success(t("toast.complete"));
      router.push("/dashboard");
    }
  };

  const handlePrev = () => {
    if (stepNumber > 1) {
      router.push(`/onboarding/${stepNumber - 1}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Bar (FR-026) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-primary uppercase tracking-wider">{t("progress.stepOf", { step: stepNumber, total: 14 })}</span>
          <span className="text-muted-foreground">{t("progress.percentCompleted", { percent: progressPercent })}</span>
        </div>
        <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Step Card */}
      <div className="bg-card border border-border/60 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex items-center gap-4 pb-4 border-b border-border/40">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <StepIcon className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{currentTitle}</h2>
            <p className="text-xs text-muted-foreground">{currentDesc}</p>
          </div>
        </div>

        {/* Step Dynamic Content */}
        <div className="py-4 space-y-4">
          {stepNumber === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-foreground">{t("step1.authenticatedOwnerLabel")} <strong>Sot Samban (owner@sotsamban.local)</strong></p>
              <p className="text-xs text-muted-foreground">{t("step1.accountStatus")}</p>
            </div>
          )}

          {stepNumber === 2 && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("step2.guestHouseName")}</label>
                <input type="text" defaultValue="Sot Samban Guest House" className="w-full h-10 px-3.5 text-sm bg-muted/40 border border-border/60 rounded-xl" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("step2.propertyCode")}</label>
                <input type="text" defaultValue="SSGH" disabled className="w-full h-10 px-3.5 text-sm bg-muted/20 border border-border/40 rounded-xl font-mono text-muted-foreground" />
              </div>
            </div>
          )}

          {stepNumber >= 3 && stepNumber <= 13 && (
            <div className="p-6 rounded-2xl bg-muted/30 border border-border/40 text-center space-y-2">
              <p className="text-sm font-semibold text-foreground">{t("genericStep.configured", { step: stepNumber, title: currentTitle })}</p>
              <p className="text-xs text-muted-foreground">{t("genericStep.defaults")}</p>
            </div>
          )}

          {stepNumber === 14 && (
            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-3">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
              <h3 className="text-lg font-bold text-foreground">{t("step14.title")}</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                {t("step14.description")}
              </p>
            </div>
          )}
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-border/40">
          <button
            onClick={handlePrev}
            disabled={stepNumber === 1}
            className="px-4 py-2 text-sm font-medium rounded-xl border border-border/60 hover:bg-accent disabled:opacity-40 transition-all flex items-center gap-1.5"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>{t("nav.previous")}</span>
          </button>

          <button
            onClick={handleNext}
            className="px-5 py-2.5 bg-primary text-primary-foreground font-semibold text-sm rounded-xl shadow-md shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-2"
          >
            <span>{stepNumber === 14 ? t("nav.finishSetup") : t("nav.continue")}</span>
            {stepNumber === 14 ? <CheckCircle2 className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
