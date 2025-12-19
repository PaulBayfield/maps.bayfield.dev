import "../globals.css";
import Header from "@/components/header";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import UmamiProvider from "next-umami";
import { Roboto } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Providers } from "./providers";

const font = Roboto({
  subsets: ["latin"],
});

const APP_NAME = "Paul Bayfield • Maps";
const APP_DEFAULT_TITLE = "Paul Bayfield • Maps";
const APP_TITLE_TEMPLATE = "Paul Bayfield • %s ";
const APP_DESCRIPTION = "A few places I've been to, all around the world.";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_DEFAULT_TITLE,
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
    images: { url: process.env.WEB_URL + "/images/avatar.png" },
    url: process.env.WEB_URL,
  },
  twitter: {
    card: "summary",
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
    images: { url: process.env.WEB_URL + "/images/avatar.png" },
  },
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <UmamiProvider
          websiteId="bdafc5fa-3629-4d6e-ba54-2eb9e7b8cf0e"
          src="https://analytics.bayfield.dev/script.js"
        />
      </head>
      <body
        className={cn(
          "h-screen w-screen overflow-hidden bg-background antialiased relative",
          font.className
        )}
      >
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <main className="h-dvh bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50 antialiased">
              <Header />
              {children}
            </main>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
