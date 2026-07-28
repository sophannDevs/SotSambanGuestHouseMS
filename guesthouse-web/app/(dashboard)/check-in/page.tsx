"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/header";
import { StatusBadge } from "@/components/ui/status-badge";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";
import { StepIndicator } from "@/components/shared/step-indicator";
import { FormFieldGroup } from "@/components/shared/form-field-group";
import { FormActions } from "@/components/shared/form-actions";
import { NotAvailableNotice } from "@/components/shared/not-available-notice";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { MoneyDisplay } from "@/components/shared/money-display";
import { DateDisplay } from "@/components/shared/date-display";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import type { ReservationDto, RoomDto, CheckInRequest } from "@/lib/api-types";
import { UserPlus, UserCheck, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STEP_KEYS = ["guest", "room", "confirm"] as const;

export default function CheckInPage() {
  const t = useTranslations("checkIn");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const queryClient = useQueryClient();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  const canView = hasHydrated && hasPermission("reservation:view");
  const canEdit = hasHydrated && hasPermission("reservation:edit");

  const arrivalsQuery = useQuery({
    queryKey: ["front-desk", "arrivals"],
    queryFn: () => apiFetch<ReservationDto[]>("/front-desk/arrivals"),
    enabled: canView,
  });

  const [selectedArrivalId, setSelectedArrivalId] = React.useState<string | null>(null);
  const arrivals = React.useMemo(
    () => [...(arrivalsQuery.data ?? [])].sort((a, b) => a.arrivalDate.localeCompare(b.arrivalDate)),
    [arrivalsQuery.data]
  );
  const selectedArrival = arrivals.find((a) => a.id === selectedArrivalId) ?? null;

  const roomsQuery = useQuery({
    queryKey: ["rooms"],
    queryFn: () => apiFetch<RoomDto[]>("/rooms"),
    enabled: !!selectedArrivalId,
  });
  const availableRoomsForType = (roomsQuery.data ?? []).filter(
    (r) => r.roomTypeId === selectedArrival?.roomTypeId && r.operationalStatus === "AVAILABLE" && r.active
  );

  const [step, setStep] = React.useState(1);
  const STEPS = STEP_KEYS.map((key) => ({ key, title: t(`wizard.steps.${key}`) }));

  const [roomId, setRoomId] = React.useState<string | null>(null);
  const [keyNumber, setKeyNumber] = React.useState("");
  const [houseRulesAccepted, setHouseRulesAccepted] = React.useState(true);
  const [vehiclePlate, setVehiclePlate] = React.useState("");
  const [notes, setNotes] = React.useState("");

  const openWizard = (arrival: ReservationDto) => {
    setSelectedArrivalId(arrival.id);
    setStep(1);
    setRoomId(arrival.assignedRoomId);
    setKeyNumber(arrival.assignedRoomNumber ? `KEY-${arrival.assignedRoomNumber}` : "");
    setHouseRulesAccepted(true);
    setVehiclePlate("");
    setNotes("");
  };

  const closeWizard = () => setSelectedArrivalId(null);

  const checkInMutation = useMutation({
    mutationFn: (body: CheckInRequest) => apiFetch<ReservationDto>("/front-desk/check-in", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (reservation) => {
      queryClient.invalidateQueries({ queryKey: ["front-desk", "arrivals"] });
      queryClient.invalidateQueries({ queryKey: ["front-desk", "in-house"] });
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast.success(
        t("toast.checkInCompleted", {
          name: `${reservation.mainGuest.firstName} ${reservation.mainGuest.lastName}`,
          room: reservation.assignedRoomNumber ?? "",
        })
      );
      closeWizard();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const handleSubmit = () => {
    if (!selectedArrival || !roomId) return;
    checkInMutation.mutate({
      reservationId: selectedArrival.id,
      roomId,
      keyNumber: keyNumber.trim() || null,
      houseRulesAccepted,
      vehiclePlate: vehiclePlate.trim() || null,
      notes: notes.trim() || null,
    });
  };

  const canProceed = step === 1 || (step === 2 && !!roomId) || step === 3;
  const isLastStep = step === STEPS.length;

  const handleNext = () => {
    if (isLastStep) {
      handleSubmit();
      return;
    }
    setStep((s) => s + 1);
  };

  const isLoading = !hasHydrated || arrivalsQuery.isLoading;
  const isError = arrivalsQuery.isError;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actionLabel={canEdit ? t("actionLabel") : undefined}
        actionIcon={UserPlus}
        onAction={() => router.push("/reservations/new")}
      />

      <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-foreground">{t("arrivalsHeading", { count: arrivals.length })}</h3>

        {isLoading ? (
          <PageSkeleton />
        ) : isError ? (
          <ErrorState title={t("loadError")} onRetry={() => arrivalsQuery.refetch()} />
        ) : arrivals.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-xs bg-muted/20 border border-border/40 rounded-2xl">
            {t("emptyArrivals")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-border/40 text-xs font-semibold uppercase text-muted-foreground bg-muted/20">
                  <th className="py-3 px-4">{t("table.reservationNumber")}</th>
                  <th className="py-3 px-4">{t("table.guestName")}</th>
                  <th className="py-3 px-4">{t("table.roomAndType")}</th>
                  <th className="py-3 px-4">{t("table.arrivalDate")}</th>
                  <th className="py-3 px-4">{t("table.balanceDue")}</th>
                  <th className="py-3 px-4">{t("table.status")}</th>
                  <th className="py-3 px-4 text-right">{t("table.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {arrivals.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-all">
                    <td className="py-3.5 px-4 font-mono font-bold text-primary">{item.reservationNumber}</td>
                    <td className="py-3.5 px-4 font-bold text-foreground">
                      {item.mainGuest.firstName} {item.mainGuest.lastName}
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <span className="font-bold text-foreground">{item.assignedRoomNumber ? `#${item.assignedRoomNumber}` : t("unassigned")}</span>
                      <span className="text-muted-foreground ml-1.5">({item.roomTypeName})</span>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold">
                      <DateDisplay date={item.arrivalDate} />
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <MoneyDisplay amount={item.balanceDue} hideSecondary className={item.balanceDue > 0 ? "text-warning" : "text-success"} />
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={item.reservationStatus} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {canEdit && (
                        <button
                          onClick={() => openWizard(item)}
                          className="px-3.5 py-1.5 bg-primary text-primary-foreground font-semibold text-xs rounded-xl shadow-md hover:bg-primary/90 flex items-center gap-1 ml-auto"
                        >
                          <UserCheck className="h-3.5 w-3.5" />
                          <span>{t("startCheckIn")}</span>
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

      <ResponsiveDialog
        open={!!selectedArrival}
        onOpenChange={(open) => !open && closeWizard()}
        title={t("wizard.title")}
        description={selectedArrival ? `${selectedArrival.reservationNumber} • ${selectedArrival.mainGuest.firstName} ${selectedArrival.mainGuest.lastName}` : undefined}
      >
        {selectedArrival && (
          <div className="space-y-4">
            <StepIndicator steps={STEPS} currentStep={step} />

            {step === 1 && (
              <div className="space-y-3">
                <div className="p-3.5 bg-muted/30 border border-border/40 rounded-xl space-y-1 text-xs">
                  <p className="text-foreground font-bold">
                    {selectedArrival.mainGuest.firstName} {selectedArrival.mainGuest.lastName}
                  </p>
                  <p className="text-muted-foreground">
                    {[selectedArrival.mainGuest.phone, selectedArrival.mainGuest.nationality].filter(Boolean).join(" • ") || "—"}
                  </p>
                  {selectedArrival.mainGuest.idPassportNumber && (
                    <p className="text-muted-foreground">{t("wizard.idNumber", { number: selectedArrival.mainGuest.idPassportNumber })}</p>
                  )}
                </div>
                <NotAvailableNotice title={t("wizard.notAvailable.guestsTitle")} description={t("wizard.notAvailable.guestsDescription")} />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                {selectedArrival.assignedRoomId ? (
                  <div className="p-3.5 bg-primary/5 border border-primary/20 rounded-xl text-xs">
                    <p className="text-foreground">
                      {t("wizard.assignedRoom")}{" "}
                      <strong className="text-primary font-bold">
                        {t("wizard.roomWithType", { room: selectedArrival.assignedRoomNumber ?? "", type: selectedArrival.roomTypeName })}
                      </strong>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-foreground">{t("wizard.assignRoomHeading")}</p>
                    {roomsQuery.isLoading && <p className="text-xs text-muted-foreground">{tCommon("status.loading")}</p>}
                    {!roomsQuery.isLoading && availableRoomsForType.length === 0 && (
                      <p className="text-xs text-muted-foreground py-2">{t("wizard.noRoomsAvailable")}</p>
                    )}
                    {availableRoomsForType.map((room) => {
                      const isSelected = room.id === roomId;
                      return (
                        <button
                          key={room.id}
                          onClick={() => setRoomId(room.id)}
                          className={cn(
                            "w-full flex items-center justify-between rounded-xl border p-3 text-left transition-all",
                            isSelected ? "border-primary bg-primary/10" : "border-border/60 bg-card"
                          )}
                        >
                          <span className="text-sm font-bold text-foreground">
                            #{room.roomNumber} {room.roomName ? `· ${room.roomName}` : ""}
                          </span>
                          {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                <FormFieldGroup label={t("wizard.keyNumberLabel")} htmlFor="key-number">
                  <Input id="key-number" value={keyNumber} onChange={(e) => setKeyNumber(e.target.value)} className="font-mono" />
                </FormFieldGroup>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="p-3.5 bg-muted/30 border border-border/40 rounded-xl space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("wizard.folioTotal")}</span>
                    <MoneyDisplay amount={selectedArrival.totalAmount} hideSecondary />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("wizard.balanceDue")}</span>
                    <MoneyDisplay amount={selectedArrival.balanceDue} hideSecondary className={selectedArrival.balanceDue > 0 ? "text-warning" : "text-success"} />
                  </div>
                </div>
                <NotAvailableNotice title={t("wizard.notAvailable.depositTitle")} description={t("wizard.notAvailable.depositDescription")} />

                <FormFieldGroup label={t("wizard.vehiclePlateLabel")} htmlFor="vehicle-plate">
                  <Input id="vehicle-plate" value={vehiclePlate} onChange={(e) => setVehiclePlate(e.target.value)} />
                </FormFieldGroup>

                <FormFieldGroup label={t("wizard.notesLabel")} htmlFor="check-in-notes">
                  <Textarea id="check-in-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
                </FormFieldGroup>

                <Field orientation="horizontal">
                  <Checkbox id="rules" checked={houseRulesAccepted} onCheckedChange={(checked) => setHouseRulesAccepted(checked === true)} />
                  <FieldLabel htmlFor="rules" className="text-xs font-medium">
                    {t("wizard.houseRulesLabel")}
                  </FieldLabel>
                </Field>

                <NotAvailableNotice title={t("wizard.notAvailable.signatureTitle")} description={t("wizard.notAvailable.signatureDescription")} />
              </div>
            )}

            <FormActions>
              {step > 1 && (
                <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)} disabled={checkInMutation.isPending}>
                  {tCommon("actions.back")}
                </Button>
              )}
              <Button type="button" variant="outline" onClick={closeWizard} disabled={checkInMutation.isPending}>
                {tCommon("actions.cancel")}
              </Button>
              <Button type="button" onClick={handleNext} disabled={!canProceed || checkInMutation.isPending}>
                <CheckCircle2 />
                <span>{isLastStep ? t("wizard.complete") : tCommon("actions.next")}</span>
              </Button>
            </FormActions>
          </div>
        )}
      </ResponsiveDialog>
    </div>
  );
}
