"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MobileHeader } from "@/components/layout/mobile-header";
import { DetailHeader } from "@/components/shared/detail-header";
import { DetailSection } from "@/components/shared/detail-section";
import { InfoGrid } from "@/components/shared/info-grid";
import { ErrorState } from "@/components/shared/error-state";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DateDisplay } from "@/components/shared/date-display";
import { MoneyDisplay } from "@/components/shared/money-display";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuthStore } from "@/lib/auth-store";
import { apiFetch } from "@/lib/api-client";
import { formatKHR, formatUSD } from "@/lib/currency";
import type { BookingDto } from "@/lib/api-types";
import { CheckCircle2, XCircle, Printer, Pencil, CalendarClock } from "lucide-react";
import { toast } from "sonner";

const CANCELLABLE_STATUSES = ["DRAFT", "PENDING", "CONFIRMED"];

export default function BookingDetailPage() {
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const t = useTranslations("reservationDetail");
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  const canView = hasHydrated && hasPermission("booking:view");
  const canCancel = hasHydrated && hasPermission("booking:cancel");

  const bookingQuery = useQuery({
    queryKey: ["booking", params.id],
    queryFn: () => apiFetch<BookingDto>(`/bookings/${params.id}`),
    enabled: canView && !!params.id,
    retry: false,
  });

  const [cancelOpen, setCancelOpen] = React.useState(false);

  const cancelMutation = useMutation({
    mutationFn: () => apiFetch<BookingDto>(`/bookings/${params.id}/cancel`, { method: "POST" }),
    onSuccess: () => {
      toast.success(t("toast.cancelled"));
      queryClient.invalidateQueries({ queryKey: ["booking", params.id] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      setCancelOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
      setCancelOpen(false);
    },
  });

  if (!hasHydrated || bookingQuery.isLoading) {
    return (
      <div className="p-4 md:p-0 md:mt-6">
        <PageSkeleton />
      </div>
    );
  }

  if (bookingQuery.isError || !bookingQuery.data) {
    return (
      <div className="p-4 md:p-0 md:mt-6">
        <ErrorState
          title={t("notFound.title")}
          description={t("notFound.description")}
          onRetry={() => bookingQuery.refetch()}
        />
        <div className="mt-4 text-center">
          <Link href="/bookings" className="text-xs font-semibold text-primary hover:underline">
            {t("notFound.backAction")}
          </Link>
        </div>
      </div>
    );
  }

  const booking = bookingQuery.data;
  const guest = booking.mainGuest;
  const subtotal = booking.totalAmount - booking.taxAmount;
  const bookingTitle = t("title", { id: booking.bookingNumber });

  return (
    <div>
      <div className="md:hidden">
        <MobileHeader title={bookingTitle} showNotification={false} />
      </div>

      <div className="hidden md:block">
        <DetailHeader
          backHref="/bookings"
          backLabel={t("backToReservations")}
          title={bookingTitle}
          description={t("description")}
          actionLabel={t("printVoucher")}
          actionIcon={Printer}
          onAction={() => toast.info(t("toast.printDialogOpened"))}
        />
      </div>

      <div className="p-4 md:p-0 md:mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details Panel */}
        <div className="lg:col-span-2 space-y-6">
          <DetailSection title={t("guestStayHeading")} action={<StatusBadge status={booking.bookingStatus} />}>
            <div>
              <span className="text-xs font-semibold uppercase text-muted-foreground">{t("guestNameLabel")}</span>
              <h3 className="text-lg font-bold text-foreground">
                {guest.firstName} {guest.lastName}
              </h3>
              <p className="text-xs text-muted-foreground">
                {[guest.email, guest.phone].filter(Boolean).join(" • ") || "—"}
              </p>
            </div>

            <InfoGrid
              items={[
                {
                  label: t("assignedRoomLabel"),
                  value: booking.assignedRoomNumber ? `Room #${booking.assignedRoomNumber}` : t("unassigned"),
                  hint: booking.roomTypeName,
                },
                {
                  label: t("stayDatesLabel"),
                  value: (
                    <>
                      <DateDisplay date={booking.arrivalDate} /> – <DateDisplay date={booking.departureDate} />
                    </>
                  ),
                  hint: t("nights", { count: booking.totalNights }),
                },
                { label: t("occupancyLabel"), value: t("adults", { count: booking.adults }) },
              ]}
            />

            <div className="pt-4 border-t border-border/40 flex flex-wrap items-center gap-3">
              {booking.bookingStatus === "CHECKED_IN" && (
                <Button asChild>
                  <Link href={`/check-out?bookingId=${booking.id}`}>
                    <CheckCircle2 />
                    <span>{t("checkOutGuest")}</span>
                  </Link>
                </Button>
              )}

              {canCancel && CANCELLABLE_STATUSES.includes(booking.bookingStatus) && (
                <Button variant="destructive" onClick={() => setCancelOpen(true)}>
                  <XCircle />
                  <span>{t("cancelBooking")}</span>
                </Button>
              )}

              <DisabledActionButton icon={Pencil} label={t("editBooking")} explanation={t("notYetAvailable.edit")} />
              <DisabledActionButton icon={CalendarClock} label={t("extendStay")} explanation={t("notYetAvailable.extend")} />
            </div>
          </DetailSection>

          {(booking.specialRequests || booking.internalNotes) && (
            <DetailSection title={t("notesHeading")}>
              {booking.specialRequests && (
                <div>
                  <span className="text-xs font-semibold uppercase text-muted-foreground">{t("specialRequestsLabel")}</span>
                  <p className="text-sm text-foreground">{booking.specialRequests}</p>
                </div>
              )}
              {booking.internalNotes && (
                <div>
                  <span className="text-xs font-semibold uppercase text-muted-foreground">{t("internalNotesLabel")}</span>
                  <p className="text-sm text-foreground">{booking.internalNotes}</p>
                </div>
              )}
            </DetailSection>
          )}
        </div>

        {/* Folio Financial Panel */}
        <div className="space-y-6">
          <DetailSection title={t("folio.heading")}>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("folio.roomRate", { nights: booking.totalNights, rate: formatRate(booking.baseRate) })}</span>
                <span className="font-semibold text-foreground">
                  <MoneyDisplay amount={subtotal} hideSecondary />
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("folio.vatTax", { percent: 10 })}</span>
                <span className="font-semibold text-foreground">
                  <MoneyDisplay amount={booking.taxAmount} hideSecondary />
                </span>
              </div>
              <div className="flex justify-between border-t border-border/30 pt-2 text-sm font-bold">
                <span>{t("folio.grandTotal")}</span>
                <span className="text-primary">{formatUSD(booking.totalAmount)}</span>
              </div>
              <p className="text-right text-[11px] text-muted-foreground -mt-1">≈ {formatKHR(booking.totalAmount)}</p>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{t("folio.paidAmount")}</span>
                <span className="font-semibold text-success">{formatUSD(booking.paidAmount)}</span>
              </div>
              <div className="flex justify-between text-xs font-bold border-t border-border/30 pt-2">
                <span>{t("folio.balanceDue")}</span>
                <span className={booking.balanceDue <= 0 ? "text-success" : "text-warning"}>
                  {formatUSD(booking.balanceDue)}
                </span>
              </div>
            </div>
          </DetailSection>
        </div>
      </div>

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title={t("cancelDialog.title")}
        description={t("cancelDialog.description", { number: booking.bookingNumber })}
        confirmLabel={t("cancelDialog.confirm")}
        cancelLabel={t("cancelDialog.dismiss")}
        variant="destructive"
        onConfirm={() => cancelMutation.mutate()}
      />
    </div>
  );
}

function DisabledActionButton({ icon: Icon, label, explanation }: { icon: React.ElementType; label: string; explanation: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span>
          <Button variant="outline" disabled>
            <Icon />
            <span>{label}</span>
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>{explanation}</TooltipContent>
    </Tooltip>
  );
}

function formatRate(rate: number): string {
  return `$${rate.toFixed(2)}`;
}
