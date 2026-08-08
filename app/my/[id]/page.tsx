"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import SpotDetail from "@/components/SpotDetail";
import { findCustomSpot } from "@/lib/customSpots";
import type { Spot } from "@/lib/types";
import { useT } from "@/lib/i18n";

/**
 * 自訂景點的詳細頁。自訂景點只存在瀏覽器 localStorage，
 * 伺服器不知道它們的存在，因此整頁在用戶端渲染（也拿不到 CWA 天氣，需自行查看）。
 */
export default function MySpotPage({ params }: { params: Promise<{ id: string }> }) {
  const t = useT();
  const { id } = use(params);
  const [spot, setSpot] = useState<Spot | null | undefined>(undefined);

  useEffect(() => {
    setSpot(findCustomSpot(id) ?? null);
  }, [id]);

  if (spot === undefined) {
    return <div className="py-20 text-center text-sm text-slate-500">{t("common.loading")}</div>;
  }

  if (spot === null) {
    return (
      <div className="space-y-4 py-20 text-center">
        <p className="text-slate-300">{t("custom.notFound")}</p>
        <p className="text-sm text-slate-500">{t("custom.notFoundHint")}</p>
        <Link href="/" className="inline-block text-sm text-sky-400 hover:underline">
          {t("nav.back")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/" className="text-sm text-slate-400 hover:text-white">{t("nav.back")}</Link>
      <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-2 text-xs text-amber-200/80">{t("custom.pageNote")}</div>
      <SpotDetail spot={spot} />
    </div>
  );
}
