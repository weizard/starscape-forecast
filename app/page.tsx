"use client";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { spots } from "@/lib/spots";
import { bestNights, fmtHM, fmtMD } from "@/lib/astro";
import { distanceKm, fmtKm, loadBase, type BaseLocation } from "@/lib/base";
import BasePicker from "@/components/BasePicker";
import CustomSpotForm from "@/components/CustomSpotForm";
import { loadCustomSpots, removeCustomSpot, isCustom } from "@/lib/customSpots";
import type { NightWindow, Spot } from "@/lib/types";
import { useI18n } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n";

const SpotsMap = dynamic(() => import("@/components/SpotsMap"), {
  ssr: false,
  loading: () => <div className="h-[420px] animate-pulse rounded-xl bg-slate-900" />,
});

type Filter = "all" | "near" | "dark";
const NEAR_KM = 100; // 「附近」門檻（直線距離）

const bortleColor = (b: number) =>
  b <= 2 ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
  : b === 3 ? "bg-sky-500/20 text-sky-300 border-sky-500/40"
  : b === 4 ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
  : "bg-orange-500/20 text-orange-300 border-orange-500/40";

// 台灣（約北緯 23.5°）銀河核心季 — 由天文引擎逐月計算暗夜期間核心最高仰角校準
const MONTH_STATUS: Record<number, { tag: MessageKey; cell: string; text: string }> = {
  1: { tag: "season.tag.off", cell: "bg-slate-700/40", text: "text-slate-400" },
  2: { tag: "season.tag.start", cell: "bg-sky-500/40", text: "text-sky-300" },
  3: { tag: "season.tag.peak", cell: "bg-amber-500/50", text: "text-amber-300" },
  4: { tag: "season.tag.peak", cell: "bg-amber-500/50", text: "text-amber-300" },
  5: { tag: "season.tag.best", cell: "bg-emerald-500/60", text: "text-emerald-300" },
  6: { tag: "season.tag.best", cell: "bg-emerald-500/60", text: "text-emerald-300" },
  7: { tag: "season.tag.best", cell: "bg-emerald-500/60", text: "text-emerald-300" },
  8: { tag: "season.tag.best", cell: "bg-emerald-500/60", text: "text-emerald-300" },
  9: { tag: "season.tag.peak", cell: "bg-amber-500/50", text: "text-amber-300" },
  10: { tag: "season.tag.end", cell: "bg-sky-500/40", text: "text-sky-300" },
  11: { tag: "season.tag.end", cell: "bg-slate-600/40", text: "text-slate-400" },
  12: { tag: "season.tag.off", cell: "bg-slate-700/40", text: "text-slate-400" },
};
const monthNote = (m: number) => `season.note.${m}` as MessageKey;

function SeasonBanner() {
  const { t, locale } = useI18n();
  const now = new Date();
  const m = now.getMonth() + 1;
  // 中文用「8 月」，英文用月份名稱，避免出現 "Now in 8"
  const monthLabel =
    locale === "zh-TW" ? `${m} 月` : new Intl.DateTimeFormat("en", { month: "long" }).format(now);
  const cur = MONTH_STATUS[m];
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="text-sm">
          <span className="font-semibold text-slate-100">{t("season.title")}</span>
          <span className="ml-2 text-slate-400">{t("season.summary")}</span>
        </div>
        <div className={`text-sm font-medium ${cur.text}`}>
          {t("season.now", { month: monthLabel, tag: t(cur.tag), note: t(monthNote(m)) })}
        </div>
      </div>
      <div className="mt-3 flex gap-1">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((mm) => (
          <div
            key={mm}
            title={`${t(MONTH_STATUS[mm].tag)} — ${t(monthNote(mm))}`}
            className={`flex-1 rounded py-1 text-center text-xs ${MONTH_STATUS[mm].cell} ${
              mm === m ? "ring-2 ring-white/70 font-bold text-white" : "text-slate-200"
            }`}
          >
            {mm}
          </div>
        ))}
      </div>
    </section>
  );
}

const fmtDur = (min: number) => `${Math.floor(min / 60)}h${String(min % 60).padStart(2, "0")}m`;
const bestMomentMs = (w: NightWindow) =>
  w.gcCulmMs == null || w.startMs == null || w.endMs == null
    ? null
    : Math.min(Math.max(w.gcCulmMs, w.startMs), w.endMs);

function SpotCard({
  s,
  best,
  ready,
  km,
  onRemove,
}: {
  s: Spot;
  best?: NightWindow;
  ready: boolean;
  km: number | null;
  onRemove?: (id: string) => void;
}) {
  const { t } = useI18n();
  const custom = isCustom(s);
  return (
    <Link
      href={custom ? `/my/${s.id}` : `/spots/${s.id}`}
      className="group rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-slate-600 hover:bg-slate-900"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-slate-100 group-hover:text-white">
          {custom && <span className="mr-1 rounded bg-slate-700 px-1.5 py-0.5 text-[10px] text-slate-300">{t("card.custom")}</span>}
          {s.name}
        </h3>
        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs ${bortleColor(s.bortle)}`}>
          Bortle {s.bortle}
        </span>
      </div>
      <p className="mt-1 text-xs text-slate-400">{s.region}・{s.altitude_m}m</p>
      <p className="mt-2 line-clamp-2 text-xs text-slate-500">{s.facing}</p>
      {km != null && (
        <div className="mt-3 text-xs text-slate-400">
          {t("card.distance")} <span className="text-slate-200">{fmtKm(km)} km</span>
          {km <= NEAR_KM && (
            <span className="ml-2 rounded bg-emerald-500/15 px-1.5 text-emerald-300">{t("card.near")}</span>
          )}
        </div>
      )}
      {best ? (
        <div className="mt-3 rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-xs text-amber-200">
          {t("card.bestNight")} <span className="font-semibold">{fmtMD(best.date)}</span>
          {" · ★"}{fmtHM(bestMomentMs(best))}
          <span className="text-amber-200/70"> · {t("card.shootable", { dur: fmtDur(best.durationMin) })}</span>
        </div>
      ) : ready ? (
        <div className="mt-3 text-xs text-slate-600">{t("card.noWindow")}</div>
      ) : (
        <div className="mt-3 h-[26px] animate-pulse rounded-lg bg-slate-800/60" />
      )}
      {custom && onRemove && (
        <button
          onClick={(e) => { e.preventDefault(); onRemove(s.id); }}
          className="mt-2 text-xs text-slate-600 hover:text-rose-400"
        >
          {t("card.delete")}
        </button>
      )}
    </Link>
  );
}

export default function Home() {
  const { t } = useI18n();
  const [filter, setFilter] = useState<Filter>("all");
  const [base, setBase] = useState<BaseLocation | null>(null);
  const [bestBySpot, setBestBySpot] = useState<Map<string, NightWindow | undefined>>(new Map());
  const [ready, setReady] = useState(false);
  const [custom, setCustom] = useState<Spot[]>([]);

  useEffect(() => {
    setBase(loadBase());
    setCustom(loadCustomSpots());
  }, []);

  // 內建 + 自訂景點；自訂的新增/刪除後重算
  const allSpots = useMemo(() => [...spots, ...custom], [custom]);

  useEffect(() => {
    // 首選夜在載入後才算（避免多景點 × 30 天天文計算阻塞首次繪製）
    const now = new Date();
    const m = new Map<string, NightWindow | undefined>();
    for (const s of allSpots) m.set(s.id, bestNights(s, now, 30)[0]);
    setBestBySpot(m);
    setReady(true);
  }, [allSpots]);

  const removeSpot = (id: string) => {
    removeCustomSpot(id);
    setCustom((c) => c.filter((s) => s.id !== id));
  };

  const kmOf = useMemo(() => {
    const m = new Map<string, number>();
    if (base) for (const s of allSpots) m.set(s.id, distanceKm(base, s));
    return m;
  }, [base, allSpots]);

  const shown = useMemo(() => {
    let list = allSpots;
    if (filter === "near" && base) list = list.filter((s) => (kmOf.get(s.id) ?? Infinity) <= NEAR_KM);
    if (filter === "dark") list = list.filter((s) => s.bortle <= 3);
    // 有設出發地就依距離排序，否則依光害（暗的優先）
    return [...list].sort((a, b) =>
      base
        ? (kmOf.get(a.id) ?? Infinity) - (kmOf.get(b.id) ?? Infinity)
        : a.bortle - b.bortle,
    );
  }, [filter, base, kmOf, allSpots]);

  const tab = (f: Filter, label: string, disabled = false) => (
    <button
      onClick={() => setFilter(f)}
      disabled={disabled}
      title={disabled ? t("home.filter.needBase") : undefined}
      className={`rounded-full px-4 py-1.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${
        filter === f
          ? "bg-slate-100 font-medium text-slate-900"
          : "bg-slate-900 text-slate-300 hover:bg-slate-800"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-slate-50">{t("home.title")}</h1>
        <p className="mt-1 text-sm text-slate-400">{t("home.intro")}</p>
      </section>
      <SeasonBanner />
      <BasePicker base={base} onChange={setBase} />
      <div className="flex flex-wrap gap-2">
        {tab("all", t("home.filter.all", { count: allSpots.length }))}
        {tab("near", t("home.filter.near", { km: NEAR_KM }), !base)}
        {tab("dark", t("home.filter.dark"))}
      </div>
      <SpotsMap spots={shown} base={base} />
      <CustomSpotForm onAdded={(s) => setCustom((c) => [...c, s])} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((s) => (
          <SpotCard
            key={s.id}
            s={s}
            best={bestBySpot.get(s.id)}
            ready={ready}
            km={base ? (kmOf.get(s.id) ?? null) : null}
            onRemove={removeSpot}
          />
        ))}
      </div>
    </div>
  );
}
