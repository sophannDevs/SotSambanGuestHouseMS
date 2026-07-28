"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Wrench } from "lucide-react";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";
import { FormFieldGroup } from "@/components/shared/form-field-group";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { RoomDto, ReportIssueRequest } from "@/lib/api-types";

interface ReportIssueDialogProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: RoomDto[];
  onSubmit: (values: ReportIssueRequest) => void;
  isSubmitting?: boolean;
}

const SEVERITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export function ReportIssueDialog({ isOpen, onClose, rooms, onSubmit, isSubmitting }: ReportIssueDialogProps) {
  const t = useTranslations("maintenance.reportDialog");
  const tCommon = useTranslations("common");
  const tStatus = useTranslations("enum.status");
  const [roomId, setRoomId] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [severity, setSeverity] = React.useState<(typeof SEVERITIES)[number]>("MEDIUM");
  const [isBlocking, setIsBlocking] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setRoomId("");
      setTitle("");
      setDescription("");
      setSeverity("MEDIUM");
      setIsBlocking(false);
    }
  }, [isOpen]);

  const canSubmit = !!roomId && title.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({ roomId, title: title.trim(), description: description.trim() || undefined, severity, isBlocking });
  };

  return (
    <ResponsiveDialog open={isOpen} onOpenChange={(open) => !open && onClose()} title={t("title")} description={t("description")}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormFieldGroup label={t("roomLabel")} htmlFor="issue-room" required>
          <Select value={roomId} onValueChange={setRoomId}>
            <SelectTrigger className="w-full" id="issue-room">
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

        <FormFieldGroup label={t("titleLabel")} htmlFor="issue-title" required>
          <Input id="issue-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("titlePlaceholder")} />
        </FormFieldGroup>

        <FormFieldGroup label={t("descriptionLabel")} htmlFor="issue-description">
          <Textarea id="issue-description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </FormFieldGroup>

        <FormFieldGroup label={t("severityLabel")} htmlFor="issue-severity">
          <Select value={severity} onValueChange={(v) => setSeverity(v as (typeof SEVERITIES)[number])}>
            <SelectTrigger className="w-full" id="issue-severity">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SEVERITIES.map((s) => (
                <SelectItem key={s} value={s}>
                  {tStatus(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormFieldGroup>

        <Field orientation="horizontal">
          <Checkbox id="issue-blocking" checked={isBlocking} onCheckedChange={(checked) => setIsBlocking(checked === true)} />
          <FieldLabel htmlFor="issue-blocking" className="text-xs font-medium">
            {t("blockingLabel")}
          </FieldLabel>
        </Field>

        <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            {tCommon("actions.cancel")}
          </Button>
          <Button type="submit" disabled={!canSubmit || isSubmitting}>
            <Wrench />
            <span>{t("submit")}</span>
          </Button>
        </div>
      </form>
    </ResponsiveDialog>
  );
}
