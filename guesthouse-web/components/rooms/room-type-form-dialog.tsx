"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Save } from "lucide-react";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";
import { FormSection } from "@/components/shared/form-section";
import { FormFieldGroup } from "@/components/shared/form-field-group";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { AmenityDto, RoomTypeDto, RoomTypeRequest } from "@/lib/api-types";

interface RoomTypeFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  roomType: RoomTypeDto | null;
  amenities: AmenityDto[];
  onSubmit: (values: RoomTypeRequest) => void;
  isSubmitting?: boolean;
}

const BED_TYPES = ["SINGLE", "DOUBLE", "QUEEN", "KING", "TWIN", "BUNK"] as const;

const EMPTY: RoomTypeRequest = {
  name: "",
  code: "",
  description: "",
  basePrice: 0,
  extraBedPrice: 0,
  extraPersonPrice: 0,
  cleaningFee: 0,
  defaultDeposit: 0,
  maxAdults: 2,
  maxChildren: 1,
  bedCount: 1,
  bedType: "DOUBLE",
  roomSizeSqm: null,
  amenityIds: [],
  active: true,
};

export function RoomTypeFormDialog({ isOpen, onClose, roomType, amenities, onSubmit, isSubmitting }: RoomTypeFormDialogProps) {
  const t = useTranslations("rooms.typeDialog");
  const tCommon = useTranslations("common");
  const [values, setValues] = React.useState<RoomTypeRequest>(EMPTY);

  React.useEffect(() => {
    if (!isOpen) return;
    setValues(
      roomType
        ? {
            name: roomType.name,
            code: roomType.code,
            description: roomType.description ?? "",
            basePrice: roomType.basePrice,
            extraBedPrice: roomType.extraBedPrice,
            extraPersonPrice: roomType.extraPersonPrice,
            cleaningFee: roomType.cleaningFee,
            defaultDeposit: roomType.defaultDeposit,
            maxAdults: roomType.maxAdults,
            maxChildren: roomType.maxChildren,
            bedCount: roomType.bedCount,
            bedType: roomType.bedType,
            roomSizeSqm: roomType.roomSizeSqm,
            amenityIds: roomType.amenityIds,
            active: roomType.active,
          }
        : EMPTY
    );
  }, [isOpen, roomType]);

  const set = <K extends keyof RoomTypeRequest>(key: K, value: RoomTypeRequest[K]) => setValues((v) => ({ ...v, [key]: value }));

  const toggleAmenity = (id: string) => {
    const current = values.amenityIds ?? [];
    set("amenityIds", current.includes(id) ? current.filter((a) => a !== id) : [...current, id]);
  };

  const canSubmit = values.name.trim().length > 0 && values.code.trim().length > 0 && values.basePrice > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({ ...values, name: values.name.trim(), code: values.code.trim().toUpperCase(), roomSizeSqm: values.roomSizeSqm || null });
  };

  return (
    <ResponsiveDialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title={roomType ? t("editTitle") : t("createTitle")}
      description={t("description")}
      className="sm:max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <FormSection title={t("sections.basics")}>
          <div className="grid grid-cols-2 gap-3">
            <FormFieldGroup label={t("nameLabel")} htmlFor="rt-name" required>
              <Input id="rt-name" value={values.name} onChange={(e) => set("name", e.target.value)} />
            </FormFieldGroup>
            <FormFieldGroup label={t("codeLabel")} htmlFor="rt-code" required>
              <Input id="rt-code" value={values.code} onChange={(e) => set("code", e.target.value)} className="font-mono uppercase" />
            </FormFieldGroup>
          </div>
          <FormFieldGroup label={t("descriptionLabel")} htmlFor="rt-description">
            <Textarea id="rt-description" rows={2} value={values.description ?? ""} onChange={(e) => set("description", e.target.value)} />
          </FormFieldGroup>
        </FormSection>

        <FormSection title={t("sections.capacity")}>
          <div className="grid grid-cols-2 gap-3">
            <FormFieldGroup label={t("maxAdultsLabel")} htmlFor="rt-max-adults">
              <Input id="rt-max-adults" type="number" min={1} value={values.maxAdults} onChange={(e) => set("maxAdults", Number(e.target.value) || 1)} />
            </FormFieldGroup>
            <FormFieldGroup label={t("maxChildrenLabel")} htmlFor="rt-max-children">
              <Input id="rt-max-children" type="number" min={0} value={values.maxChildren} onChange={(e) => set("maxChildren", Number(e.target.value) || 0)} />
            </FormFieldGroup>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <FormFieldGroup label={t("bedCountLabel")} htmlFor="rt-bed-count">
              <Input id="rt-bed-count" type="number" min={1} value={values.bedCount} onChange={(e) => set("bedCount", Number(e.target.value) || 1)} />
            </FormFieldGroup>
            <FormFieldGroup label={t("bedTypeLabel")} htmlFor="rt-bed-type">
              <Select value={values.bedType} onValueChange={(v) => set("bedType", v)}>
                <SelectTrigger className="w-full" id="rt-bed-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BED_TYPES.map((bt) => (
                    <SelectItem key={bt} value={bt}>
                      {t(`bedTypes.${bt}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormFieldGroup>
            <FormFieldGroup label={t("roomSizeLabel")} htmlFor="rt-size">
              <Input
                id="rt-size"
                type="number"
                min={0}
                value={values.roomSizeSqm ?? ""}
                onChange={(e) => set("roomSizeSqm", e.target.value ? Number(e.target.value) : null)}
              />
            </FormFieldGroup>
          </div>
        </FormSection>

        <FormSection title={t("sections.pricing")}>
          <div className="grid grid-cols-2 gap-3">
            <FormFieldGroup label={t("basePriceLabel")} htmlFor="rt-base-price" required>
              <Input id="rt-base-price" type="number" min={0} step="0.01" value={values.basePrice} onChange={(e) => set("basePrice", Number(e.target.value) || 0)} />
            </FormFieldGroup>
            <FormFieldGroup label={t("extraBedPriceLabel")} htmlFor="rt-extra-bed">
              <Input id="rt-extra-bed" type="number" min={0} step="0.01" value={values.extraBedPrice} onChange={(e) => set("extraBedPrice", Number(e.target.value) || 0)} />
            </FormFieldGroup>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormFieldGroup label={t("extraPersonPriceLabel")} htmlFor="rt-extra-person">
              <Input id="rt-extra-person" type="number" min={0} step="0.01" value={values.extraPersonPrice} onChange={(e) => set("extraPersonPrice", Number(e.target.value) || 0)} />
            </FormFieldGroup>
            <FormFieldGroup label={t("cleaningFeeLabel")} htmlFor="rt-cleaning-fee">
              <Input id="rt-cleaning-fee" type="number" min={0} step="0.01" value={values.cleaningFee} onChange={(e) => set("cleaningFee", Number(e.target.value) || 0)} />
            </FormFieldGroup>
          </div>
          <FormFieldGroup label={t("defaultDepositLabel")} htmlFor="rt-deposit">
            <Input id="rt-deposit" type="number" min={0} step="0.01" value={values.defaultDeposit} onChange={(e) => set("defaultDeposit", Number(e.target.value) || 0)} />
          </FormFieldGroup>
        </FormSection>

        {amenities.length > 0 && (
          <FormSection title={t("sections.amenities")}>
            <div className="grid grid-cols-2 gap-2">
              {amenities.map((a) => (
                <Field key={a.id} orientation="horizontal">
                  <Checkbox id={`rt-amenity-${a.id}`} checked={(values.amenityIds ?? []).includes(a.id)} onCheckedChange={() => toggleAmenity(a.id)} />
                  <FieldLabel htmlFor={`rt-amenity-${a.id}`} className="text-xs font-medium">
                    {a.name}
                  </FieldLabel>
                </Field>
              ))}
            </div>
          </FormSection>
        )}

        <Field orientation="horizontal">
          <Checkbox id="rt-active" checked={values.active} onCheckedChange={(checked) => set("active", checked === true)} />
          <FieldLabel htmlFor="rt-active" className="text-xs font-medium">
            {t("activeLabel")}
          </FieldLabel>
        </Field>

        <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            {tCommon("actions.cancel")}
          </Button>
          <Button type="submit" disabled={!canSubmit || isSubmitting}>
            <Save />
            <span>{roomType ? tCommon("actions.save") : t("createSubmit")}</span>
          </Button>
        </div>
      </form>
    </ResponsiveDialog>
  );
}
