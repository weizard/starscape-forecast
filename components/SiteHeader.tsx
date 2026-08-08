"use client";
import Link from "next/link";
import { useI18n, LOCALES, LOCALE_LABEL } from "@/lib/i18n";

export default function SiteHeader() {
  const { locale, setLocale, t } = useI18n();
  return (
    <header className="sticky top-0 z-[1100] border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-wide text-slate-50">
          🌌 Starscape Forecast
        </Link>
        <span className="hidden text-sm text-slate-500 sm:inline">{t("app.subtitle")}</span>
        <div className="ml-auto flex shrink-0 gap-1 rounded-full bg-slate-900 p-0.5">
          {LOCALES.map((l) => (
            <button
              key={l}
              onClick={() => setLocale(l)}
              aria-pressed={locale === l}
              className={`rounded-full px-2.5 py-1 text-xs transition ${
                locale === l
                  ? "bg-slate-100 font-medium text-slate-900"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {LOCALE_LABEL[l]}
            </button>
          ))}
        </div>
      </nav>
    </header>
  );
}
