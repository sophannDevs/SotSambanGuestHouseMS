"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MobileHeader } from "@/components/layout/mobile-header";
import { PageHeader } from "@/components/layout/header";
import { StepIndicator } from "@/components/shared/step-indicator";
import { FormSection } from "@/components/shared/form-section";
import { FormFieldGroup } from "@/components/shared/form-field-group";
import { FormActions } from "@/components/shared/form-actions";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import { formatDualPrice } from "@/lib/currency";
import { formatDate, addDaysIso } from "@/lib/dates";
import { estimateStayTotal } from "@/lib/pricing";
import type { GuestDto, RoomTypeDto, RoomDto, BookingDto, CreateBookingRequest } from "@/lib/api-types";
import { BedDouble, Check, Search, UserPlus, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STEP_KEYS = ["guest", "room", "stay", "confirm"] as const;

interface NewGuestDraft {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  nationality: string;
  idPassportNumber: string;
}

const EMPTY_DRAFT: NewGuestDraft = { firstName: "", lastName: "", phone: "", email: "", nationality: "Cambodian", idPassportNumber: "" };

function todayIso(): string {
  return formatDate(new Date(), "yyyy-MM-dd");
}

function nightsBetween(arrival: string, departure: string): number {
  const ms = new Date(`${departure}T00:00:00Z`).getTime() - new Date(`${arrival}T00:00:00Z`).getTime();
  return Math.round(ms / 86_400_000);
}

export default function NewBookingPage() {
  const t = useTranslations("reservationNew");
  const tCommon = useTranslations("common.actions");
  const tStatus = useTranslations("common.status");
  const router = useRouter();
  const queryClient = useQueryClient();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  const canCreateBooking = hasHydrated && hasPermission("booking:edit");
  const canCreateGuest = hasHydrated && hasPermission("guest:edit");

  const [step, setStep] = React.useState(1);
  const STEPS = STEP_KEYS.map((key) => ({ key, title: t(`steps.${key}`) }));

  // --- Step 1: Guest ---
  const [guestMode, setGuestMode] = React.useState<"search" | "new">("search");
  const [guestSearch, setGuestSearch] = React.useState("");
  const [selectedGuestId, setSelectedGuestId] = React.useState<string | null>(null);
  const [newGuestDraft, setNewGuestDraft] = React.useState<NewGuestDraft>(EMPTY_DRAFT);

  const guestsQuery = useQuery({
    queryKey: ["guests"],
    queryFn: () => apiFetch<GuestDto[]>("/guests"),
    enabled: step === 1 && guestMode === "search",
  });

  const allGuests = guestsQuery.data;
  const matchingGuests = React.useMemo(() => {
    const guests = allGuests ?? [];
    const q = guestSearch.trim().toLowerCase();
    if (!q) return guests.slice(0, 20);
    return guests.filter((g) => `${g.firstName} ${g.lastName}`.toLowerCase().includes(q) || (g.phone ?? "").includes(q));
  }, [allGuests, guestSearch]);
  const isTruncatedGuestList = guestSearch.trim().length === 0 && (allGuests?.length ?? 0) > matchingGuests.length;

  const selectedGuest = guestsQuery.data?.find((g) => g.id === selectedGuestId) ?? null;

  // --- Step 2: Room type + room ---
  const roomTypesQuery = useQuery({
    queryKey: ["room-types"],
    queryFn: () => apiFetch<RoomTypeDto[]>("/room-types"),
    enabled: step >= 2,
  });
  const roomsQuery = useQuery({
    queryKey: ["rooms"],
    queryFn: () => apiFetch<RoomDto[]>("/rooms"),
    enabled: step >= 2,
  });

  const [selectedRoomTypeId, setSelectedRoomTypeId] = React.useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = React.useState<string | null>(null);

  const activeRoomTypes = (roomTypesQuery.data ?? []).filter((rt) => rt.active);
  const selectedRoomType = activeRoomTypes.find((rt) => rt.id === selectedRoomTypeId) ?? null;
  const availableRoomsForType = (roomsQuery.data ?? []).filter(
    (r) => r.roomTypeId === selectedRoomTypeId && r.operationalStatus === "AVAILABLE" && r.active
  );

  // --- Step 3: Stay ---
  const [arrivalDate, setArrivalDate] = React.useState(todayIso());
  const [departureDate, setDepartureDate] = React.useState(addDaysIso(todayIso(), 1));
  const [adults, setAdults] = React.useState(1);
  const [children, setChildren] = React.useState(0);

  const nights = Math.max(0, nightsBetween(arrivalDate, departureDate));
  const estimate = selectedRoomType && nights > 0 ? estimateStayTotal(selectedRoomType.basePrice, nights) : null;
  const price = estimate ? formatDualPrice(estimate.total) : null;

  // --- Submit ---
  const guestDisplayName =
    guestMode === "search" ? (selectedGuest ? `${selectedGuest.firstName} ${selectedGuest.lastName}` : "") : `${newGuestDraft.firstName} ${newGuestDraft.lastName}`;

  const submitMutation = useMutation({
    mutationFn: async () => {
      let guestId = selectedGuestId;
      if (guestMode === "new") {
        const created = await apiFetch<GuestDto>("/guests", {
          method: "POST",
          body: JSON.stringify({
            firstName: newGuestDraft.firstName.trim(),
            lastName: newGuestDraft.lastName.trim(),
            phone: newGuestDraft.phone.trim(),
            email: newGuestDraft.email.trim() || null,
            nationality: newGuestDraft.nationality || "Cambodian",
            idPassportNumber: newGuestDraft.idPassportNumber.trim() || null,
          }),
        });
        guestId = created.id;
      }
      if (!guestId || !selectedRoomTypeId) throw new Error(t("toast.missingRequired"));

      const body: CreateBookingRequest = {
        mainGuestId: guestId,
        roomTypeId: selectedRoomTypeId,
        assignedRoomId: selectedRoomId,
        arrivalDate,
        departureDate,
        adults,
        children,
        source: "DIRECT_WALK_IN",
      };
      return apiFetch<BookingDto>("/bookings", { method: "POST", body: JSON.stringify(body) });
    },
    onSuccess: (booking) => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast.success(t("toast.confirmed", { guestName: guestDisplayName }));
      router.push(`/bookings/${booking.id}`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const canProceed =
    (step === 1 &&
      ((guestMode === "search" && !!selectedGuestId) ||
        (guestMode === "new" && newGuestDraft.firstName.trim().length > 0 && newGuestDraft.lastName.trim().length > 0 && newGuestDraft.phone.trim().length > 0))) ||
    (step === 2 && !!selectedRoomTypeId) ||
    (step === 3 && nights >= 1 && adults >= 1) ||
    step === 4;

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
      return;
    }
    submitMutation.mutate();
  };

  if (hasHydrated && !canCreateBooking) {
    return (
      <div className="p-4 md:p-0 md:mt-6">
        <EmptyState
          icon={ShieldAlert}
          title={t("noPermission.title")}
          description={t("noPermission.description")}
          action={{ label: t("noPermission.backAction"), onClick: () => router.push("/bookings") }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg md:max-w-5xl">
      <MobileHeader title={t("mobileTitle")} showNotification={false} />
      <div className="hidden md:block">
        <PageHeader title={t("title")} description={t("description")} />
      </div>

      {/* Step progress */}
      <div className="px-4 pt-4 pb-2 md:px-0">
        <StepIndicator steps={STEPS} currentStep={step} />
      </div>

      <div className="md:grid md:grid-cols-3 md:items-start md:gap-8">
      <div className="p-4 space-y-5 pb-48 md:col-span-2 md:p-0 md:pb-8">
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setGuestMode("search")}
                className={cn(
                  "rounded-xl border p-2.5 text-xs font-bold transition-all",
                  guestMode === "search" ? "border-primary bg-primary/10 text-primary" : "border-border/60 text-muted-foreground"
                )}
              >
                <Search className="mx-auto mb-1 h-4 w-4" />
                {t("guestInfo.searchTab")}
              </button>
              <button
                onClick={() => canCreateGuest && setGuestMode("new")}
                disabled={!canCreateGuest}
                className={cn(
                  "rounded-xl border p-2.5 text-xs font-bold transition-all disabled:opacity-40",
                  guestMode === "new" ? "border-primary bg-primary/10 text-primary" : "border-border/60 text-muted-foreground"
                )}
              >
                <UserPlus className="mx-auto mb-1 h-4 w-4" />
                {t("guestInfo.newTab")}
              </button>
            </div>

            {guestMode === "search" ? (
              <FormSection title={t("guestInfo.heading")} description={t("guestInfo.searchDescription")}>
                <Input
                  value={guestSearch}
                  onChange={(e) => setGuestSearch(e.target.value)}
                  placeholder={t("guestInfo.searchPlaceholder")}
                />
                <div className="space-y-2">
                  {guestsQuery.isLoading && <p className="text-xs text-muted-foreground">{tStatus("loading")}</p>}
                  {!guestsQuery.isLoading && matchingGuests.length === 0 && (
                    <p className="text-xs text-muted-foreground py-2">{t("guestInfo.noMatches")}</p>
                  )}
                  {isTruncatedGuestList && <p className="text-[11px] text-muted-foreground">{t("guestInfo.showingRecent")}</p>}
                  {matchingGuests.map((guest) => {
                    const isSelected = guest.id === selectedGuestId;
                    return (
                      <button
                        key={guest.id}
                        onClick={() => setSelectedGuestId(guest.id)}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition-all",
                          isSelected ? "border-primary bg-primary/10" : "border-border/60 bg-card"
                        )}
                      >
                        <div>
                          <p className="text-sm font-bold text-foreground">
                            {guest.firstName} {guest.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">{[guest.phone, guest.email].filter(Boolean).join(" • ") || "—"}</p>
                        </div>
                        {isSelected && (
                          <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Check className="h-3.5 w-3.5" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </FormSection>
            ) : (
              <FormSection title={t("guestInfo.newHeading")}>
                <FormFieldGroup label={t("guestInfo.firstNameLabel")} htmlFor="new-guest-first-name" required>
                  <Input
                    id="new-guest-first-name"
                    value={newGuestDraft.firstName}
                    onChange={(e) => setNewGuestDraft({ ...newGuestDraft, firstName: e.target.value })}
                  />
                </FormFieldGroup>
                <FormFieldGroup label={t("guestInfo.lastNameLabel")} htmlFor="new-guest-last-name" required>
                  <Input
                    id="new-guest-last-name"
                    value={newGuestDraft.lastName}
                    onChange={(e) => setNewGuestDraft({ ...newGuestDraft, lastName: e.target.value })}
                  />
                </FormFieldGroup>
                <FormFieldGroup label={t("guestInfo.phoneLabel")} htmlFor="new-guest-phone" required>
                  <Input
                    id="new-guest-phone"
                    type="tel"
                    inputMode="tel"
                    placeholder={t("guestInfo.phonePlaceholder")}
                    value={newGuestDraft.phone}
                    onChange={(e) => setNewGuestDraft({ ...newGuestDraft, phone: e.target.value })}
                  />
                </FormFieldGroup>
                <FormFieldGroup label={t("guestInfo.emailLabel")} htmlFor="new-guest-email">
                  <Input
                    id="new-guest-email"
                    type="email"
                    value={newGuestDraft.email}
                    onChange={(e) => setNewGuestDraft({ ...newGuestDraft, email: e.target.value })}
                  />
                </FormFieldGroup>
                <FormFieldGroup label={t("guestInfo.idPassportLabel")} htmlFor="new-guest-id-passport">
                  <Input
                    id="new-guest-id-passport"
                    value={newGuestDraft.idPassportNumber}
                    onChange={(e) => setNewGuestDraft({ ...newGuestDraft, idPassportNumber: e.target.value })}
                  />
                </FormFieldGroup>
                <FormFieldGroup label={t("guestInfo.nationalityLabel")} htmlFor="new-guest-nationality">
                  <Select value={newGuestDraft.nationality} onValueChange={(v) => setNewGuestDraft({ ...newGuestDraft, nationality: v })}>
                    <SelectTrigger className="w-full" id="new-guest-nationality">
                      <SelectValue placeholder={t("guestInfo.nationalityPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cambodian">{t("guestInfo.nationalities.cambodian")}</SelectItem>
                      <SelectItem value="American">{t("guestInfo.nationalities.american")}</SelectItem>
                      <SelectItem value="British">{t("guestInfo.nationalities.british")}</SelectItem>
                      <SelectItem value="Other">{t("guestInfo.nationalities.other")}</SelectItem>
                    </SelectContent>
                  </Select>
                </FormFieldGroup>
              </FormSection>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-foreground">{t("room.typeHeading")}</h2>
            <div className="space-y-2">
              {roomTypesQuery.isLoading && <p className="text-xs text-muted-foreground">{tStatus("loading")}</p>}
              {(roomTypesQuery.data ?? []).length === 0 && !roomTypesQuery.isLoading && (
                <p className="text-xs text-muted-foreground">{t("room.noRoomTypes")}</p>
              )}
              {activeRoomTypes.map((rt) => {
                const rtPrice = formatDualPrice(rt.basePrice);
                const isSelected = rt.id === selectedRoomTypeId;
                return (
                  <button
                    key={rt.id}
                    onClick={() => {
                      setSelectedRoomTypeId(rt.id);
                      setSelectedRoomId(null);
                    }}
                    className={cn(
                      "w-full flex gap-3 bg-card border rounded-2xl p-3 shadow-sm text-left transition-all",
                      isSelected ? "border-primary ring-2 ring-primary/20" : "border-border/60"
                    )}
                  >
                    <div className="h-14 w-14 flex-shrink-0 rounded-xl bg-gradient-to-br from-blue-500/15 to-indigo-500/15 flex items-center justify-center">
                      <BedDouble className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground">{rt.name}</p>
                      <p className="text-xs text-muted-foreground">{t("room.maxGuests", { count: rt.maxAdults + rt.maxChildren })}</p>
                      <p className="text-sm font-bold text-primary mt-1">
                        {rtPrice.usd} <span className="text-[11px] font-normal text-muted-foreground">≈ {rtPrice.khr}</span>
                      </p>
                    </div>
                    {isSelected && (
                      <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {selectedRoomTypeId && (
              <div className="space-y-2 pt-2">
                <h2 className="text-sm font-bold text-foreground">{t("room.assignHeading")}</h2>
                <p className="text-xs text-muted-foreground">{t("room.availabilityDisclaimer")}</p>
                <button
                  onClick={() => setSelectedRoomId(null)}
                  className={cn(
                    "w-full rounded-xl border p-3 text-left text-xs font-semibold transition-all",
                    selectedRoomId === null ? "border-primary bg-primary/10 text-primary" : "border-border/60 text-muted-foreground"
                  )}
                >
                  {t("room.assignLater")}
                </button>
                {availableRoomsForType.map((room) => {
                  const isSelected = room.id === selectedRoomId;
                  return (
                    <button
                      key={room.id}
                      onClick={() => setSelectedRoomId(room.id)}
                      className={cn(
                        "w-full flex items-center justify-between rounded-xl border p-3 text-left transition-all",
                        isSelected ? "border-primary bg-primary/10" : "border-border/60 bg-card"
                      )}
                    >
                      <span className="text-sm font-bold text-foreground">
                        #{room.roomNumber} {room.roomName ? `· ${room.roomName}` : ""}
                      </span>
                      {isSelected && <Check className="h-4 w-4 text-primary" />}
                    </button>
                  );
                })}
                {availableRoomsForType.length === 0 && (
                  <p className="text-xs text-muted-foreground py-2">{t("room.noRoomsAvailable")}</p>
                )}
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <FormSection title={t("stay.datesHeading")}>
              <FormFieldGroup label={t("stay.arrivalLabel")} htmlFor="stay-arrival-date" required>
                <Input
                  id="stay-arrival-date"
                  type="date"
                  value={arrivalDate}
                  onChange={(e) => {
                    setArrivalDate(e.target.value);
                    if (e.target.value >= departureDate) setDepartureDate(addDaysIso(e.target.value, 1));
                  }}
                />
              </FormFieldGroup>
              <FormFieldGroup label={t("stay.departureLabel")} htmlFor="stay-departure-date" required>
                <Input
                  id="stay-departure-date"
                  type="date"
                  min={addDaysIso(arrivalDate, 1)}
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                />
              </FormFieldGroup>
              <div className="grid grid-cols-2 gap-3">
                <FormFieldGroup label={t("stay.adultsLabel")} htmlFor="stay-adults">
                  <Input
                    id="stay-adults"
                    type="number"
                    min={1}
                    max={selectedRoomType?.maxAdults ?? 10}
                    value={adults}
                    onChange={(e) => setAdults(Math.max(1, Number(e.target.value) || 1))}
                  />
                </FormFieldGroup>
                <FormFieldGroup label={t("stay.childrenLabel")} htmlFor="stay-children">
                  <Input
                    id="stay-children"
                    type="number"
                    min={0}
                    max={selectedRoomType?.maxChildren ?? 5}
                    value={children}
                    onChange={(e) => setChildren(Math.max(0, Number(e.target.value) || 0))}
                  />
                </FormFieldGroup>
              </div>
            </FormSection>

            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
              <p className="text-xs font-semibold text-muted-foreground">{t("stay.pricePreview")}</p>
              {price ? (
                <>
                  <p className="text-2xl font-black text-primary mt-1">{price.usd}</p>
                  <p className="text-xs text-muted-foreground">
                    ≈ {price.khr} · {t("stay.nightsSummary", { count: nights })}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">{t("stay.selectRoomFirst")}</p>
              )}
              <p className="text-[11px] text-muted-foreground mt-2">{t("stay.estimateDisclaimer")}</p>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-foreground">{t("confirm.heading")}</h2>
            <div className="bg-card border border-border/60 rounded-2xl p-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("confirm.guestLabel")}</span>
                <span className="font-semibold text-foreground">{guestDisplayName.trim() || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("confirm.roomTypeLabel")}</span>
                <span className="font-semibold text-foreground">{selectedRoomType?.name ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("confirm.roomLabel")}</span>
                <span className="font-semibold text-foreground">
                  {selectedRoomId ? `#${availableRoomsForType.find((r) => r.id === selectedRoomId)?.roomNumber}` : t("room.assignLater")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("confirm.datesLabel")}</span>
                <span className="font-semibold text-foreground">
                  {arrivalDate} – {departureDate} ({nights})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("confirm.occupancyLabel")}</span>
                <span className="font-semibold text-foreground">{t("confirm.occupancyValue", { adults, children })}</span>
              </div>
              <div className="flex justify-between border-t border-border/40 pt-3 text-base font-bold">
                <span>{t("confirm.totalLabel")}</span>
                <span className="text-primary">{price?.usd ?? "—"}</span>
              </div>
              {price && <p className="text-xs text-muted-foreground text-right -mt-2">≈ {price.khr}</p>}
              <p className="text-[11px] text-muted-foreground">{t("stay.estimateDisclaimer")}</p>
            </div>
          </div>
        )}
      </div>

      <aside className="hidden md:block md:sticky md:top-20 space-y-4 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{t("summary.heading")}</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">{t("confirm.guestLabel")}</span>
            <span className="text-right font-semibold text-foreground">{guestDisplayName.trim() || "—"}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">{t("confirm.roomTypeLabel")}</span>
            <span className="text-right font-semibold text-foreground">{selectedRoomType?.name ?? "—"}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">{t("confirm.roomLabel")}</span>
            <span className="text-right font-semibold text-foreground">
              {selectedRoomId ? `#${availableRoomsForType.find((r) => r.id === selectedRoomId)?.roomNumber}` : selectedRoomTypeId ? t("room.assignLater") : "—"}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">{t("confirm.datesLabel")}</span>
            <span className="text-right font-semibold text-foreground">{step >= 3 ? `${arrivalDate} – ${departureDate} (${nights})` : "—"}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">{t("confirm.occupancyLabel")}</span>
            <span className="text-right font-semibold text-foreground">{step >= 3 ? t("confirm.occupancyValue", { adults, children }) : "—"}</span>
          </div>
        </div>
        <div className="flex justify-between border-t border-border/40 pt-3 text-base font-bold">
          <span>{t("confirm.totalLabel")}</span>
          <span className="text-primary">{price?.usd ?? "—"}</span>
        </div>
        {price && <p className="-mt-2 text-right text-xs text-muted-foreground">≈ {price.khr}</p>}
      </aside>
      </div>

      <FormActions sticky className="mx-auto max-w-lg md:max-w-5xl">
        {step > 1 && (
          <Button variant="outline" size="lg" onClick={() => setStep(step - 1)} disabled={submitMutation.isPending}>
            {tCommon("back")}
          </Button>
        )}
        <Button size="lg" className="flex-1" disabled={!canProceed || submitMutation.isPending} onClick={handleNext}>
          {step < 4 ? t("nextLabel", { step: STEPS[step]?.title ?? "" }) : submitMutation.isPending ? tCommon("submit") : t("confirmBooking")}
        </Button>
      </FormActions>
    </div>
  );
}
