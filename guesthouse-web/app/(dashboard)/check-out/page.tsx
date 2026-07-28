"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/header";
import { MobileHeader } from "@/components/layout/mobile-header";
import { ResponsiveDataList } from "@/components/shared/responsive-data-list";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { StepIndicator } from "@/components/shared/step-indicator";
import { FormActions } from "@/components/shared/form-actions";
import { NotAvailableNotice } from "@/components/shared/not-available-notice";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { MoneyDisplay } from "@/components/shared/money-display";
import { DateDisplay } from "@/components/shared/date-display";
import { FormFieldGroup } from "@/components/shared/form-field-group";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import type { BookingDto, CheckOutRequest } from "@/lib/api-types";
import { LogOut, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const STEP_KEYS = ["review", "key"] as const;

export default function CheckOutPage() {
  const t = useTranslations("checkOut");
  const tCommon = useTranslations("common");
  const queryClient = useQueryClient();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  const canView = hasHydrated && hasPermission("booking:view");
  const canEdit = hasHydrated && hasPermission("booking:edit");

  const departuresQuery = useQuery({
    queryKey: ["front-desk", "departures"],
    queryFn: () => apiFetch<BookingDto[]>("/front-desk/departures"),
    enabled: canView,
  });
  const departures = departuresQuery.data ?? [];

  const [selectedDepartureId, setSelectedDepartureId] = React.useState<string | null>(null);
  const selectedDeparture = departures.find((d) => d.id === selectedDepartureId) ?? null;

  const [step, setStep] = React.useState(1);
  const STEPS = STEP_KEYS.map((key) => ({ key, title: t(`wizard.steps.${key}`) }));

  const [keyReturned, setKeyReturned] = React.useState(true);
  const [notes, setNotes] = React.useState("");
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const openWizard = (item: BookingDto) => {
    setSelectedDepartureId(item.id);
    setStep(1);
    setKeyReturned(true);
    setNotes("");
  };

  const closeWizard = () => setSelectedDepartureId(null);

  React.useEffect(() => {
    if (typeof window === "undefined" || selectedDepartureId) return;
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("bookingId") ?? urlParams.get("reservationId");
    const match = id ? departures.find((d) => d.id === id) : undefined;
    if (match) openWizard(match);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departures]);

  const checkOutMutation = useMutation({
    mutationFn: (body: CheckOutRequest) => apiFetch<BookingDto>("/front-desk/check-out", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (booking) => {
      queryClient.invalidateQueries({ queryKey: ["front-desk", "departures"] });
      queryClient.invalidateQueries({ queryKey: ["front-desk", "in-house"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast.success(t("toast.completed", { name: `${booking.mainGuest.firstName} ${booking.mainGuest.lastName}`, room: booking.assignedRoomNumber ?? "" }));
      setConfirmOpen(false);
      closeWizard();
    },
    onError: (error: Error) => {
      toast.error(error.message);
      setConfirmOpen(false);
    },
  });

  const isLastStep = step === STEPS.length;
  const handleNext = () => {
    if (isLastStep) {
      setConfirmOpen(true);
      return;
    }
    setStep((s) => s + 1);
  };

  const handleConfirmCheckOut = () => {
    if (!selectedDeparture) return;
    checkOutMutation.mutate({
      bookingId: selectedDeparture.id,
      keyReturned,
      notes: notes.trim() || null,
    });
  };

  const isLoading = !hasHydrated || departuresQuery.isLoading;
  const isError = departuresQuery.isError;

  return (
    <div>
      {/* Mobile view */}
      <div className="md:hidden">
        <MobileHeader title={t("title")} />
        <div className="space-y-4 p-4">
          <h3 className="text-sm font-bold text-foreground">{t("departuresHeading", { count: departures.length })}</h3>

          {isLoading ? (
            <PageSkeleton />
          ) : isError ? (
            <ErrorState title={t("loadError")} onRetry={() => departuresQuery.refetch()} />
          ) : (
            <ResponsiveDataList
              data={departures}
              keyExtractor={(item) => item.id}
              emptyMessage={t("emptyDepartures")}
              renderCard={(item) => (
                <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-mono text-xs font-bold text-primary">{item.bookingNumber}</p>
                      <p className="text-sm font-bold text-foreground">
                        {item.mainGuest.firstName} {item.mainGuest.lastName}
                      </p>
                      <p className="text-xs font-semibold text-muted-foreground">
                        {item.assignedRoomNumber ? t("table.roomPrefix", { room: item.assignedRoomNumber }) : t("unassigned")}
                      </p>
                    </div>
                    <DateDisplay date={item.departureDate} />
                  </div>
                  <div className="flex items-center justify-between border-t border-border/40 pt-2.5">
                    <MoneyDisplay amount={item.balanceDue} hideSecondary className={item.balanceDue > 0 ? "text-warning" : "text-success"} />
                    {canEdit && (
                      <Button size="sm" onClick={() => openWizard(item)}>
                        <LogOut />
                        <span>{t("processCheckOut")}</span>
                      </Button>
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
      <PageHeader title={t("title")} description={t("description")} />

      <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-foreground">{t("departuresHeading", { count: departures.length })}</h3>

        {isLoading ? (
          <PageSkeleton />
        ) : isError ? (
          <ErrorState title={t("loadError")} onRetry={() => departuresQuery.refetch()} />
        ) : departures.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-xs bg-muted/20 border border-border/40 rounded-2xl">
            {t("emptyDepartures")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-border/40 text-xs font-semibold uppercase text-muted-foreground bg-muted/20">
                  <th className="py-3 px-4">{t("table.reservationNumber")}</th>
                  <th className="py-3 px-4">{t("table.guestName")}</th>
                  <th className="py-3 px-4">{t("table.roomNumber")}</th>
                  <th className="py-3 px-4">{t("table.departureDate")}</th>
                  <th className="py-3 px-4">{t("table.folioBalance")}</th>
                  <th className="py-3 px-4 text-right">{t("table.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {departures.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-all">
                    <td className="py-3.5 px-4 font-mono font-bold text-primary">{item.bookingNumber}</td>
                    <td className="py-3.5 px-4 font-bold text-foreground">
                      {item.mainGuest.firstName} {item.mainGuest.lastName}
                    </td>
                    <td className="py-3.5 px-4 font-bold">{item.assignedRoomNumber ? t("table.roomPrefix", { room: item.assignedRoomNumber }) : t("unassigned")}</td>
                    <td className="py-3.5 px-4 text-xs">
                      <DateDisplay date={item.departureDate} />
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <MoneyDisplay amount={item.balanceDue} hideSecondary className={item.balanceDue > 0 ? "text-warning" : "text-success"} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {canEdit && (
                        <Button size="sm" className="ml-auto" onClick={() => openWizard(item)}>
                          <LogOut />
                          <span>{t("processCheckOut")}</span>
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>

      <ResponsiveDialog
        open={!!selectedDeparture}
        onOpenChange={(open) => !open && closeWizard()}
        title={t("wizard.title")}
        description={selectedDeparture ? t("wizard.roomGuest", { room: selectedDeparture.assignedRoomNumber ?? "—", guestName: `${selectedDeparture.mainGuest.firstName} ${selectedDeparture.mainGuest.lastName}` }) : undefined}
        footer={
          selectedDeparture && (
            <FormActions>
              {step > 1 && (
                <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)} disabled={checkOutMutation.isPending}>
                  {tCommon("actions.back")}
                </Button>
              )}
              <Button type="button" variant="outline" onClick={closeWizard} disabled={checkOutMutation.isPending}>
                {tCommon("actions.cancel")}
              </Button>
              <Button type="button" onClick={handleNext} disabled={checkOutMutation.isPending}>
                <LogOut />
                <span>{isLastStep ? t("wizard.reviewAndComplete") : tCommon("actions.next")}</span>
              </Button>
            </FormActions>
          )
        }
      >
        {selectedDeparture && (
          <div className="space-y-4">
            <StepIndicator steps={STEPS} currentStep={step} />

            {step === 1 && (
              <div className="space-y-3">
                <div className="p-3.5 bg-muted/30 border border-border/40 rounded-xl space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("wizard.stayLabel")}</span>
                    <span className="font-semibold text-foreground">
                      <DateDisplay date={selectedDeparture.arrivalDate} /> – <DateDisplay date={selectedDeparture.departureDate} /> ({selectedDeparture.totalNights})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("wizard.folioTotal")}</span>
                    <MoneyDisplay amount={selectedDeparture.totalAmount} hideSecondary />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("wizard.paidAmount")}</span>
                    <MoneyDisplay amount={selectedDeparture.paidAmount} hideSecondary />
                  </div>
                  <div className="flex justify-between border-t border-border/40 pt-1">
                    <span className="text-muted-foreground font-bold">{t("wizard.balanceDue")}</span>
                    <MoneyDisplay amount={selectedDeparture.balanceDue} hideSecondary className={selectedDeparture.balanceDue > 0 ? "text-warning" : "text-success"} />
                  </div>
                </div>
                {selectedDeparture.balanceDue > 0 && (
                  <div className="flex gap-2.5 rounded-xl border border-warning/30 bg-warning/10 p-3">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0 text-warning mt-0.5" aria-hidden="true" />
                    <p className="text-xs font-semibold text-warning">{t("wizard.outstandingBalanceWarning")}</p>
                  </div>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <Field orientation="horizontal">
                  <Checkbox id="keyReturn" checked={keyReturned} onCheckedChange={(checked) => setKeyReturned(checked === true)} />
                  <FieldLabel htmlFor="keyReturn" className="text-xs font-medium">
                    {t("wizard.keyReturnedLabel")}
                  </FieldLabel>
                </Field>

                <NotAvailableNotice title={t("wizard.notAvailable.conditionTitle")} description={t("wizard.notAvailable.conditionDescription")} />

                <FormFieldGroup label={t("wizard.notesLabel")} htmlFor="check-out-notes">
                  <Textarea id="check-out-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
                </FormFieldGroup>

                <NotAvailableNotice title={t("wizard.notAvailable.invoiceTitle")} description={t("wizard.notAvailable.invoiceDescription")} />
              </div>
            )}
          </div>
        )}
      </ResponsiveDialog>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t("confirmDialog.title")}
        description={
          selectedDeparture
            ? t("confirmDialog.description", { guestName: `${selectedDeparture.mainGuest.firstName} ${selectedDeparture.mainGuest.lastName}`, room: selectedDeparture.assignedRoomNumber ?? "—" })
            : ""
        }
        confirmLabel={t("confirmDialog.confirmLabel")}
        onConfirm={handleConfirmCheckOut}
        variant="destructive"
      />
    </div>
  );
}
