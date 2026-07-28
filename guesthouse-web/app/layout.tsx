import type { Metadata } from "next";
import "@/app/globals.css";
import { Providers } from "@/components/providers";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Geist, Koh_Santepheap } from "next/font/google";
import { cn } from "@/lib/utils";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });
const kohSantepheap = Koh_Santepheap({
  subsets: ['khmer'],
  weight: ['400', '700'],
  variable: '--font-khmer',
});

export const metadata: Metadata = {
  title: "Guest House Manager",
  description: "Locally-run property management system for small owner-operated guest houses",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning className={cn("font-sans", geist.variable, kohSantepheap.variable)}>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary selection:text-primary-foreground">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>
            <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
