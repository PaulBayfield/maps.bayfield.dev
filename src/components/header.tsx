"use client";

import ModeToggle from "@/components/theme-switcher";
import LocaleToggle from "@/components/locale-switcher";
import AuthButton from "@/components/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useUmami } from "next-umami";

export default function Header() {
  const t = useTranslations("Header");
  const umami = useUmami();

  return (
    <header className="absolute top-0 left-0 w-full z-500 backdrop-blur supports-[backdrop-filter]:bg-white/50 dark:supports-[backdrop-filter]:bg-zinc-950/50 bg-white/70 dark:bg-zinc-950/70 border-b border-zinc-200/60 dark:border-zinc-800/60">
      <div className="mx-auto max-w-6xl px-5 md:px-8 py-4 flex items-center justify-between">
        <Link href="https://bayfield.dev" onClick={() => umami.event("Header.Portfolio")}>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 ring-2 ring-zinc-200 dark:ring-zinc-800">
              <AvatarImage src="/images/avatar.png" alt="Paul Bayfield" />
              <AvatarFallback>maps.bayfield.dev</AvatarFallback>
            </Avatar>
            <div className="leading-tight">
              <p className="hidden sm:flex text-lg font-semibold tracking-tight">
                maps.bayfield.dev
              </p>
              <p className="hidden sm:flex text-sm text-zinc-500">
                {t("sub-title")}
              </p>
            </div>
          </div>
        </Link>
        <nav className="flex items-center gap-2">
          <AuthButton />
          <ModeToggle />
          <LocaleToggle />
        </nav>
      </div>
    </header>
  );
}
