"use client";

import Link from "next/link";
import { useLang } from "./LangProvider";
import { useProfile } from "./useProfile";

export function Header() {
  const { t, lang, setLang } = useLang();
  const { profile } = useProfile();
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          {t("brand")}
        </Link>
        <nav className="flex items-center gap-4 text-[15px] sm:gap-5">
          <Link href="/pricing" className="text-mute hover:text-ink">{t("nav.pricing")}</Link>
          <button
            type="button"
            onClick={() => setLang(lang === "en" ? "ur" : "en")}
            className="text-mute hover:text-ink"
            aria-label={lang === "en" ? "Switch to Urdu" : "Switch to English"}
            lang={lang === "en" ? "ur" : "en"}
          >
            {t("nav.switch")}
          </button>
          {profile ? (
            <Link href="/dashboard" className="rounded-full bg-ink px-4 py-1.5 text-white hover:bg-black">
              {t("nav.plan")}
            </Link>
          ) : (
            <Link href="/start" className="rounded-full bg-ink px-4 py-1.5 text-white hover:bg-black">
              {t("nav.start")}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
