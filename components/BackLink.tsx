"use client";
import Link from "next/link";
import { useT } from "@/lib/i18n";

export default function BackLink() {
  const t = useT();
  return (
    <Link href="/" className="text-sm text-slate-400 hover:text-white">
      {t("nav.back")}
    </Link>
  );
}
