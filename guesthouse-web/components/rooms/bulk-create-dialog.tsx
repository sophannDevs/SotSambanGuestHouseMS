"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";
import { FormFieldGroup } from "@/components/shared/form-field-group";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { RoomTypeDto, BulkCreateRoomsRequest } from "@/lib/api-types";

interface BulkCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  roomTypes: RoomTypeDto[];
  onSubmit: (values: BulkCreateRoomsRequest) => void;
  isSubmitting?: boolean;
}

// Also covers single-room creation (start === end produces exactly one
// room) — POST /rooms/bulk-create is the only room-create endpoint this
// dialog needs, so there's no separate "add one room" form.
export function BulkCreateDialog({ isOpen, onClose, roomTypes, onSubmit, isSubmitting }: BulkCreateDialogProps) {
  const t = useTranslations("rooms.bulkDialog");
  const tCommon = useTranslations("common");
  const [roomTypeId, setRoomTypeId] = React.useState<string>("");
  const [startNum, setStartNum] = React.useState(101);
  const [endNum, setEndNum] = React.useState(110);
  const [floor, setFloor] = React.useState(1);
  const [building, setBuilding] = React.useState("Main");
  const [prefix, setPrefix] = React.useState("");

  React.useEffect(() => {
    if (isOpen && !roomTypeId && roomTypes[0]) setRoomTypeId(roomTypes[0].id);
  }, [isOpen, roomTypeId, roomTypes]);

  const count = Math.max(0, endNum - startNum + 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomTypeId) return;
    onSubmit({ roomTypeId, startNumber: startNum, endNumber: endNum, floor, building, prefix: prefix || undefined });
  };

  return (
    <ResponsiveDialog open={isOpen} onOpenChange={(open) => !open && onClose()} title={t("title")} description={t("description")}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormFieldGroup label={t("roomTypeLabel")} htmlFor="bulk-room-type" required>
          <Select value={roomTypeId} onValueChange={setRoomTypeId}>
            <SelectTrigger className="w-full" id="bulk-room-type">
              <SelectValue placeholder={t("roomTypePlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {roomTypes.map((rt) => (
                <SelectItem key={rt.id} value={rt.id}>
                  {rt.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormFieldGroup>

        <div className="grid grid-cols-2 gap-3">
          <FormFieldGroup label={t("startNumberLabel")} htmlFor="bulk-start">
            <Input id="bulk-start" type="number" value={startNum} onChange={(e) => setStartNum(parseInt(e.target.value) || 0)} />
          </FormFieldGroup>
          <FormFieldGroup label={t("endNumberLabel")} htmlFor="bulk-end">
            <Input id="bulk-end" type="number" value={endNum} onChange={(e) => setEndNum(parseInt(e.target.value) || 0)} />
          </FormFieldGroup>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormFieldGroup label={t("floorLabel")} htmlFor="bulk-floor">
            <Input id="bulk-floor" type="number" value={floor} onChange={(e) => setFloor(parseInt(e.target.value) || 1)} />
          </FormFieldGroup>
          <FormFieldGroup label={t("buildingLabel")} htmlFor="bulk-building">
            <Input id="bulk-building" value={building} onChange={(e) => setBuilding(e.target.value)} />
          </FormFieldGroup>
        </div>

        <FormFieldGroup label={t("prefixLabel")} htmlFor="bulk-prefix" description={t("prefixDescription")}>
          <Input id="bulk-prefix" value={prefix} placeholder={t("prefixPlaceholder")} onChange={(e) => setPrefix(e.target.value)} />
        </FormFieldGroup>

        <div className="p-3 bg-muted/30 border border-border/40 rounded-xl text-xs text-muted-foreground">
          {t("preview", { count, from: `${prefix}${startNum}`, to: `${prefix}${endNum}`, floor })}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            {tCommon("actions.cancel")}
          </Button>
          <Button type="submit" disabled={!roomTypeId || count < 1 || isSubmitting}>
            <Plus />
            <span>{t("submit", { count })}</span>
          </Button>
        </div>
      </form>
    </ResponsiveDialog>
  );
}
