"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { CreditCard, Check } from "lucide-react";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";
import { FormFieldGroup } from "@/components/shared/form-field-group";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { MoneyDisplay } from "@/components/shared/money-display";
import { cn } from "@/lib/utils";
import type { BookingDto, RecordPaymentRequest } from "@/lib/api-types";

interface RecordPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: BookingDto[];
  onSubmit: (values: RecordPaymentRequest) => void;
  isSubmitting?: boolean;
}

const METHODS = ["CASH", "CREDIT_CARD", "BANK_TRANSFER", "KHQR"] as const;
const KINDS = ["PAYMENT", "DEPOSIT"] as const;

export function RecordPaymentDialog({ isOpen, onClose, bookings, onSubmit, isSubmitting }: RecordPaymentDialogProps) {
  const t = useTranslations("payments.recordDialog");
  const tPayments = useTranslations("payments");
  const tCommon = useTranslations("common");
  const [search, setSearch] = React.useState("");
  const [bookingId, setBookingId] = React.useState<string | null>(null);
  const [amount, setAmount] = React.useState("");
  const [method, setMethod] = React.useState<(typeof METHODS)[number]>("CASH");
  const [kind, setKind] = React.useState<(typeof KINDS)[number]>("PAYMENT");
  const [transactionReference, setTransactionReference] = React.useState("");

  React.useEffect(() => {
    if (isOpen) {
      setSearch("");
      setBookingId(null);
      setAmount("");
      setMethod("CASH");
      setKind("PAYMENT");
      setTransactionReference("");
    }
  }, [isOpen]);

  const selectedBooking = bookings.find((b) => b.id === bookingId) ?? null;

  React.useEffect(() => {
    if (selectedBooking) setAmount(selectedBooking.balanceDue > 0 ? String(selectedBooking.balanceDue) : "");
  }, [selectedBooking]);

  const q = search.trim().toLowerCase();
  const matchingBookings = bookings
    .filter((b) => !q || b.bookingNumber.toLowerCase().includes(q) || `${b.mainGuest.firstName} ${b.mainGuest.lastName}`.toLowerCase().includes(q))
    .slice(0, 20);

  const numericAmount = Number(amount);
  const canSubmit = !!bookingId && numericAmount > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !bookingId) return;
    onSubmit({
      bookingId,
      amount: numericAmount,
      paymentMethod: method,
      paymentKind: kind,
      transactionReference: transactionReference.trim() || null,
    });
  };

  return (
    <ResponsiveDialog open={isOpen} onOpenChange={(open) => !open && onClose()} title={t("title")} description={t("description")}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormFieldGroup label={t("reservationLabel")} htmlFor="payment-reservation-search" required>
          <Input id="payment-reservation-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("reservationSearchPlaceholder")} />
        </FormFieldGroup>

        <div className="max-h-48 space-y-1.5 overflow-y-auto">
          {matchingBookings.map((b) => {
            const isSelected = b.id === bookingId;
            return (
              <button
                type="button"
                key={b.id}
                onClick={() => setBookingId(b.id)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-xl border p-2.5 text-left text-xs transition-all",
                  isSelected ? "border-primary bg-primary/10" : "border-border/60 bg-card"
                )}
              >
                <div>
                  <p className="font-mono font-bold text-primary">{b.bookingNumber}</p>
                  <p className="text-muted-foreground">
                    {b.mainGuest.firstName} {b.mainGuest.lastName}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <MoneyDisplay amount={b.balanceDue} hideSecondary className={b.balanceDue > 0 ? "text-warning" : "text-success"} />
                  {isSelected && <Check className="h-4 w-4 text-primary" />}
                </div>
              </button>
            );
          })}
          {matchingBookings.length === 0 && <p className="text-xs text-muted-foreground py-2">{t("noMatches")}</p>}
        </div>

        <FormFieldGroup label={t("amountLabel")} htmlFor="payment-amount" required>
          <Input id="payment-amount" type="number" min={0.01} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </FormFieldGroup>

        <div className="grid grid-cols-2 gap-3">
          <FormFieldGroup label={t("methodLabel")} htmlFor="payment-method">
            <Select value={method} onValueChange={(v) => setMethod(v as (typeof METHODS)[number])}>
              <SelectTrigger className="w-full" id="payment-method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {METHODS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {tPayments(`methods.${m}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormFieldGroup>
          <FormFieldGroup label={t("kindLabel")} htmlFor="payment-kind">
            <Select value={kind} onValueChange={(v) => setKind(v as (typeof KINDS)[number])}>
              <SelectTrigger className="w-full" id="payment-kind">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {KINDS.map((k) => (
                  <SelectItem key={k} value={k}>
                    {tPayments(`kinds.${k}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormFieldGroup>
        </div>

        <FormFieldGroup label={t("transactionReferenceLabel")} htmlFor="payment-txn-ref">
          <Input id="payment-txn-ref" value={transactionReference} onChange={(e) => setTransactionReference(e.target.value)} />
        </FormFieldGroup>

        <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            {tCommon("actions.cancel")}
          </Button>
          <Button type="submit" disabled={!canSubmit || isSubmitting}>
            <CreditCard />
            <span>{t("submit")}</span>
          </Button>
        </div>
      </form>
    </ResponsiveDialog>
  );
}
