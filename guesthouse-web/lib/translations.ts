import type { Locale } from "@/i18n/config";

export type MessageTree = { [key: string]: string | MessageTree };

export interface TranslationRow {
  key: string;
  namespace: string;
  en: string;
  km: string;
}

function flatten(tree: MessageTree, prefix = ""): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [segment, value] of Object.entries(tree)) {
    const key = prefix ? `${prefix}.${segment}` : segment;
    if (typeof value === "string") {
      result[key] = value;
    } else {
      Object.assign(result, flatten(value, key));
    }
  }

  return result;
}

export function buildTranslationRows(en: MessageTree, km: MessageTree): TranslationRow[] {
  const enFlat = flatten(en);
  const kmFlat = flatten(km);
  const keys = new Set([...Object.keys(enFlat), ...Object.keys(kmFlat)]);

  return Array.from(keys)
    .sort()
    .map((key) => ({
      key,
      namespace: key.split(".")[0] ?? key,
      en: enFlat[key] ?? "",
      km: kmFlat[key] ?? "",
    }));
}

export interface TranslationChange {
  key: string;
  locale: Locale;
  value: string;
}
