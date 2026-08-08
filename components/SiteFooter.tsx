"use client";
import { useT } from "@/lib/i18n";

export default function SiteFooter() {
  const t = useT();
  return (
    <footer className="mx-auto max-w-6xl px-4 py-8 text-xs text-slate-500">{t("app.footer")}</footer>
  );
}
