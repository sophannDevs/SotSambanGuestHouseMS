"use server";

import { cookies } from "next/headers";
import { LOCALE_COOKIE, type Locale, isSupportedLocale } from "@/i18n/config";

export async function setLocale(locale: Locale) {
  if (!isSupportedLocale(locale)) return;

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
