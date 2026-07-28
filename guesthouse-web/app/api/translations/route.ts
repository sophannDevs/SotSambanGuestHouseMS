import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { SUPPORTED_LOCALES, isSupportedLocale, type Locale } from "@/i18n/config";

const messagesPath = (locale: Locale) => path.join(process.cwd(), "messages", `${locale}.json`);

async function readMessages(locale: Locale): Promise<Record<string, unknown>> {
  const raw = await fs.readFile(messagesPath(locale), "utf-8");
  return JSON.parse(raw) as Record<string, unknown>;
}

function setNestedValue(target: Record<string, unknown>, key: string, value: string): void {
  const segments = key.split(".");
  let node: Record<string, unknown> = target;

  for (let i = 0; i < segments.length - 1; i++) {
    const segment = segments[i]!;
    const current = node[segment];
    if (typeof current !== "object" || current === null) {
      const next: Record<string, unknown> = {};
      node[segment] = next;
      node = next;
    } else {
      node = current as Record<string, unknown>;
    }
  }

  node[segments[segments.length - 1]!] = value;
}

export async function GET() {
  const entries = await Promise.all(
    SUPPORTED_LOCALES.map(async (locale) => [locale, await readMessages(locale)] as const)
  );

  return NextResponse.json(Object.fromEntries(entries));
}

interface TranslationChange {
  key: string;
  locale: Locale;
  value: string;
}

export async function PUT(request: Request) {
  const body = (await request.json()) as { changes?: TranslationChange[] };
  const changes = body.changes ?? [];

  if (changes.length === 0) {
    return NextResponse.json({ error: "No changes provided" }, { status: 400 });
  }

  if (changes.some((change) => !isSupportedLocale(change.locale) || !change.key)) {
    return NextResponse.json({ error: "Invalid change entry" }, { status: 400 });
  }

  const changesByLocale = new Map<Locale, TranslationChange[]>();
  for (const change of changes) {
    const list = changesByLocale.get(change.locale) ?? [];
    list.push(change);
    changesByLocale.set(change.locale, list);
  }

  for (const [locale, localeChanges] of changesByLocale) {
    const messages = await readMessages(locale);
    for (const change of localeChanges) {
      setNestedValue(messages, change.key, change.value);
    }
    await fs.writeFile(messagesPath(locale), `${JSON.stringify(messages, null, 2)}\n`, "utf-8");
  }

  return NextResponse.json({ success: true });
}
