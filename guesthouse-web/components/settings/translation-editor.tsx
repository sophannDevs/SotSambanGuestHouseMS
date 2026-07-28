"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Search, Save, Undo2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { buildTranslationRows, type TranslationChange } from "@/lib/translations";
import type { MessageTree } from "@/lib/translations";

type TranslationsResponse = Record<"en" | "km", MessageTree>;

async function fetchTranslations(): Promise<TranslationsResponse> {
  const res = await fetch("/api/translations");
  if (!res.ok) throw new Error("Failed to load translations");
  return res.json();
}

async function saveTranslations(changes: TranslationChange[]): Promise<void> {
  const res = await fetch("/api/translations", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ changes }),
  });
  if (!res.ok) throw new Error("Failed to save translations");
}

type PendingEdits = Record<string, { en?: string; km?: string }>;

export function TranslationEditor() {
  const t = useTranslations("settings.language");
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [pending, setPending] = React.useState<PendingEdits>({});

  const { data, isLoading, isError } = useQuery({
    queryKey: ["translations"],
    queryFn: fetchTranslations,
  });

  const mutation = useMutation({
    mutationFn: saveTranslations,
    onSuccess: () => {
      toast.success(t("savedSuccess"));
      setPending({});
      queryClient.invalidateQueries({ queryKey: ["translations"] });
      router.refresh();
    },
    onError: () => {
      toast.error(t("saveError"));
    },
  });

  const rows = React.useMemo(() => {
    if (!data) return [];
    return buildTranslationRows(data.en, data.km);
  }, [data]);

  const displayedRows = React.useMemo(() => {
    return rows.map((row) => ({
      ...row,
      en: pending[row.key]?.en ?? row.en,
      km: pending[row.key]?.km ?? row.km,
    }));
  }, [rows, pending]);

  const filteredRows = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return displayedRows;
    return displayedRows.filter(
      (row) =>
        row.key.toLowerCase().includes(query) ||
        row.en.toLowerCase().includes(query) ||
        row.km.toLowerCase().includes(query)
    );
  }, [displayedRows, search]);

  const groupedRows = React.useMemo(() => {
    const groups = new Map<string, typeof filteredRows>();
    for (const row of filteredRows) {
      const list = groups.get(row.namespace) ?? [];
      list.push(row);
      groups.set(row.namespace, list);
    }
    return Array.from(groups.entries());
  }, [filteredRows]);

  const dirtyCount = Object.keys(pending).length;

  const handleEdit = (key: string, locale: "en" | "km", value: string) => {
    setPending((prev) => ({
      ...prev,
      [key]: { ...prev[key], [locale]: value },
    }));
  };

  const handleDiscard = () => setPending({});

  const handleSave = () => {
    const changes: TranslationChange[] = [];
    for (const [key, edit] of Object.entries(pending)) {
      if (edit.en !== undefined) changes.push({ key, locale: "en", value: edit.en });
      if (edit.km !== undefined) changes.push({ key, locale: "km", value: edit.km });
    }
    mutation.mutate(changes);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold">{t("editorHeading")}</h3>
        <p className="text-xs text-muted-foreground mt-1">{t("editorDescription")}</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="h-10 pl-9"
          />
        </div>

        {dirtyCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
              {t("unsavedChangesLabel", { count: dirtyCount })}
            </span>
            <Button type="button" variant="outline" size="sm" onClick={handleDiscard} disabled={mutation.isPending}>
              <Undo2 />
              {t("discard")}
            </Button>
            <Button type="button" size="sm" onClick={handleSave} disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="animate-spin" /> : <Save />}
              {t("saveChanges")}
            </Button>
          </div>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      )}

      {isError && <p className="text-sm text-destructive py-4">{t("loadError")}</p>}

      {!isLoading && !isError && filteredRows.length === 0 && (
        <p className="text-sm text-muted-foreground py-8 text-center">{t("noMatches")}</p>
      )}

      {!isLoading && !isError && filteredRows.length > 0 && (
        <div className="rounded-2xl border border-border/60 overflow-hidden">
          <div className="grid grid-cols-[minmax(140px,1fr)_minmax(0,1.4fr)_minmax(0,1.4fr)] gap-px bg-border/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <div className="bg-muted/60 px-3 py-2">{t("columnKey")}</div>
            <div className="bg-muted/60 px-3 py-2">{t("columnEnglish")}</div>
            <div className="bg-muted/60 px-3 py-2">{t("columnKhmer")}</div>
          </div>

          <div className="max-h-[560px] overflow-y-auto divide-y divide-border/40">
            {groupedRows.map(([namespace, namespaceRows]) => (
              <div key={namespace}>
                <div className="bg-muted/30 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-primary sticky top-0">
                  {namespace}
                </div>
                {namespaceRows.map((row) => (
                  <div
                    key={row.key}
                    className="grid grid-cols-[minmax(140px,1fr)_minmax(0,1.4fr)_minmax(0,1.4fr)] gap-px bg-border/20"
                  >
                    <div className="bg-card px-3 py-2 text-xs font-mono text-muted-foreground break-all self-center">
                      {row.key}
                    </div>
                    <div className="bg-card p-1.5">
                      <textarea
                        value={row.en}
                        onChange={(e) => handleEdit(row.key, "en", e.target.value)}
                        rows={1}
                        className="w-full resize-y rounded-lg border border-border/50 bg-muted/30 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div className="bg-card p-1.5">
                      <textarea
                        value={row.km}
                        onChange={(e) => handleEdit(row.key, "km", e.target.value)}
                        rows={1}
                        className="w-full resize-y rounded-lg border border-border/50 bg-muted/30 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
