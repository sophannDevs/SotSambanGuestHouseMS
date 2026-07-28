"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Lock } from "lucide-react";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";
import { FormFieldGroup } from "@/components/shared/form-field-group";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/dates";
import type { RoomDto, RoomBlockDto } from "@/lib/api-types";

// Calendar-date-only arithmetic anchored to the property's timezone, same
// approach reservations/new uses for its arrival/departure pickers.
function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function todayIso(): string {
  return formatDate(new Date(), "yyyy-MM-dd");
}

interface RoomBlockDialogProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: RoomDto[];
  /** Pre-selects a specific room (e.g. a per-tile "Block" action) — when
   * absent, the dialog shows a room picker (e.g. the header-level action). */
  roomId?: string;
  onSubmit: (values: RoomBlockDto) => void;
  isSubmitting?: boolean;
}

const REASONS = ["MAINTENANCE", "RENOVATION", "OWNER_USE", "DEEP_CLEANING", "INSPECTION", "OTHER"] as const;

export function RoomBlockDialog({ isOpen, onClose, rooms, roomId, onSubmit, isSubmitting }: RoomBlockDialogProps) {
  const t = useTranslations("roomsBoard.blockDialog");
  const tCommon = useTranslations("common");
  const [selectedRoomId, setSelectedRoomId] = React.useState<string>("");
  // Never empty — the JSX below computes `addDaysIso(startDate, 1)` on every
  // render (not just after the reset effect fires), so an empty initial
  // state would throw on the very first render.
  const [startDate, setStartDate] = React.useState(todayIso());
  const [endDate, setEndDate] = React.useState(() => addDaysIso(todayIso(), 1));
  const [reason, setReason] = React.useState<(typeof REASONS)[number]>("MAINTENANCE");
  const [note, setNote] = React.useState("");

  React.useEffect(() => {
    if (isOpen) {
      setSelectedRoomId(roomId ?? "");
      const today = todayIso();
      setStartDate(today);
      // The backend rejects end_date <= start_date (ck_room_blocks__dates),
      // so the default range must already span at least one day.
      setEndDate(addDaysIso(today, 1));
      setReason("MAINTENANCE");
      setNote("");
    }
  }, [isOpen, roomId]);

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId) ?? null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomId || !startDate || !endDate) return;
    onSubmit({ roomId: selectedRoomId, startDate, endDate, reason, note: note.trim() || undefined });
  };

  return (
    <ResponsiveDialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title={selectedRoom ? t("titleWithRoom", { room: selectedRoom.roomNumber }) : t("title")}
      description={t("description")}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {!roomId && (
          <FormFieldGroup label={t("roomLabel")} htmlFor="block-room" required>
            <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
              <SelectTrigger className="w-full" id="block-room">
                <SelectValue placeholder={t("roomPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {rooms.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    #{r.roomNumber} ({r.roomTypeName})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormFieldGroup>
        )}

        <div className="grid grid-cols-2 gap-3">
          <FormFieldGroup label={t("startDateLabel")} htmlFor="block-start">
            <Input
              id="block-start"
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (e.target.value >= endDate) setEndDate(addDaysIso(e.target.value, 1));
              }}
            />
          </FormFieldGroup>
          <FormFieldGroup label={t("endDateLabel")} htmlFor="block-end">
            <Input id="block-end" type="date" min={addDaysIso(startDate, 1)} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </FormFieldGroup>
        </div>

        <FormFieldGroup label={t("reasonLabel")} htmlFor="block-reason">
          <Select value={reason} onValueChange={(v) => setReason(v as (typeof REASONS)[number])}>
            <SelectTrigger className="w-full" id="block-reason">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REASONS.map((r) => (
                <SelectItem key={r} value={r}>
                  {t(`reasons.${r}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormFieldGroup>

        <FormFieldGroup label={t("noteLabel")} htmlFor="block-note">
          <Textarea id="block-note" rows={2} value={note} placeholder={t("notePlaceholder")} onChange={(e) => setNote(e.target.value)} />
        </FormFieldGroup>

        <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            {tCommon("actions.cancel")}
          </Button>
          <Button type="submit" variant="warning" disabled={!selectedRoomId || !startDate || !endDate || isSubmitting}>
            <Lock />
            <span>{t("confirm")}</span>
          </Button>
        </div>
      </form>
    </ResponsiveDialog>
  );
}
