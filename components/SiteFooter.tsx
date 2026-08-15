"use client";
import { useT } from "@/lib/i18n";

const SUPPORT_URL = "https://portaly.cc/weizard/support";

export default function SiteFooter() {
  const t = useT();
  return (
    <footer className="mx-auto max-w-6xl space-y-4 px-4 py-8">
      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <p className="text-sm text-slate-300">{t("support.text")}</p>
        <a
          href={SUPPORT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-200 transition hover:bg-amber-500/20"
        >
          {t("support.cta")}
        </a>
        <p className="mt-2 text-xs text-slate-500">{t("support.note")}</p>
      </section>
      <p className="text-xs text-slate-500">{t("app.footer")}</p>
    </footer>
  );
}
