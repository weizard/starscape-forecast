"use client";
import { useEffect, useMemo, useState } from "react";
import { bestNights, fmtHM, fmtMD, moonDayInfo, nightWindow } from "@/lib/astro";
import { lunarStr } from "@/lib/lunar";
import { wxIcon, isClearSky, type DayWeather } from "@/lib/weather";
import CoreCompass from "@/components/CoreCompass";
import { distanceKm, fmtKm, loadBase, type BaseLocation } from "@/lib/base";
import type { NightWindow, Spot } from "@/lib/types";
import { useT } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n";

const fmtDur = (min: number) => `${Math.floor(min / 60)}h${String(min % 60).padStart(2, "0")}m`;

// 銀心方位（8 方位中文）：可拍時段起訖方位不同時顯示範圍，如「南→西南」
const COMPASS8_KEYS: MessageKey[] = ["dir.N", "dir.NE", "dir.E", "dir.SE", "dir.S", "dir.SW", "dir.W", "dir.NW"];
// 最佳時刻 = 銀心過中天（最高點），但夾在可拍時段內（過中天若落在月光/白天則取時段端點）
const bestMomentMs = (w: NightWindow) => {
  if (w.gcCulmMs == null || w.startMs == null || w.endMs == null) return null;
  return Math.min(Math.max(w.gcCulmMs, w.startMs), w.endMs);
};

/** 可拍時段長度 → 顯示樣式（黃底 = 當月好日子，同參考表慣例） */
const rowTone = (status: string, dur: number) =>
  status !== "ok" ? "text-slate-500"
  : dur >= 120 ? "bg-yellow-500/10 text-yellow-200"
  : dur >= 60 ? "text-slate-200"
  : "text-slate-400";

function WeatherBadge({ w, t }: { w: DayWeather; t: ReturnType<typeof useT> }) {
  const clear = isClearSky(w.wx);
  const dry = w.pop == null || w.pop <= 20;
  const cls = clear && dry ? "text-emerald-300" : w.pop != null && w.pop >= 60 ? "text-rose-300" : "text-slate-300";
  return (
    <span className={`text-xs ${cls}`}>
      {wxIcon(w.wx)} {w.wx}
      {w.pop != null ? t("weather.rain", { pct: w.pop }) : ""}
    </span>
  );
}

export default function SpotDetail({ spot, weather = [] }: { spot: Spot; weather?: DayWeather[] }) {
  const t = useT();
  const compass = (az: number | null) => (az == null ? "" : t(COMPASS8_KEYS[Math.round(az / 45) % 8]));
  const coreDir = (w: { coreAzStart: number | null; coreAzEnd: number | null }) => {
    if (w.coreAzStart == null) return "";
    const a = compass(w.coreAzStart);
    const b = compass(w.coreAzEnd);
    return a === b ? a : `${a}→${b}`;
  };
  const today = new Date();
  const [base, setBase] = useState<BaseLocation | null>(null);
  useEffect(() => setBase(loadBase()), []);
  const wxByDate: Record<string, DayWeather> = {};
  for (const w of weather) wxByDate[w.date] = w;
  const [ym, setYm] = useState({ y: today.getFullYear(), m: today.getMonth() + 1 });

  const monthRows = useMemo(() => {
    const days = new Date(ym.y, ym.m, 0).getDate();
    return Array.from({ length: days }, (_, i) => {
      const d = i + 1;
      return {
        d,
        lunar: lunarStr(ym.y, ym.m, d),
        moon: moonDayInfo(spot, ym.y, ym.m, d),
        win: nightWindow(spot, ym.y, ym.m, d),
      };
    });
  }, [spot, ym]);

  const top = useMemo(() => bestNights(spot, today, 30).slice(0, 5), [spot]); // eslint-disable-line react-hooks/exhaustive-deps

  // 未來 30 天首選夜的白話摘要（把分析直接放到頁面上，不用讀整張表）
  const headline = useMemo(() => {
    const w = top[0];
    if (!w) return null;
    const [yy, mm, dd] = w.date.split("-").map(Number);
    return { w, illum: moonDayInfo(spot, yy, mm, dd).illumination };
  }, [spot, top]);

  const shiftMonth = (delta: number) => {
    const dt = new Date(ym.y, ym.m - 1 + delta, 1);
    setYm({ y: dt.getFullYear(), m: dt.getMonth() + 1 });
  };

  return (
    <div className="space-y-8">
      <section>
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="text-2xl font-bold text-slate-50">{spot.name}</h1>
          <span className="text-sm text-slate-400">{spot.region}・{spot.altitude_m}m・Bortle {spot.bortle}</span>
        </div>
        <p className="mt-2 text-sm text-slate-300">{spot.facing}</p>
        <p className="mt-1 text-sm text-slate-500">{spot.access_notes}</p>
        {base && (
          <div className="mt-2 text-sm text-slate-400">
            {t("spot.distanceFrom", { name: base.name })} <span className="text-slate-200">{fmtKm(distanceKm(base, spot))} km</span>
            <span className="ml-1 text-xs text-slate-600">{t("spot.driveNote")}</span>
          </div>
        )}
      </section>

      {weather.length > 0 && (
        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
          <div className="mb-1 text-xs text-slate-400">{t("spot.weatherTitle", { region: spot.region })}</div>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
            {weather.slice(0, 4).map((w) => (
              <span key={w.date} className="whitespace-nowrap">
                <span className="text-slate-300">{fmtMD(w.date)}</span> <WeatherBadge w={w} t={t} />
                {w.windDir && <span className="ml-1 text-xs text-slate-500">{w.windDir}{w.windSpeed != null ? ` ${w.windSpeed}m/s` : ""}</span>}
              </span>
            ))}
          </div>
        </section>
      )}

      {headline && (
        <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <h2 className="text-lg font-semibold text-amber-200">{t("spot.headline")}</h2>
          <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 text-sm">
            <span className="text-lg font-bold text-slate-50">{fmtMD(headline.w.date)}</span>
            <span className="text-slate-400">{t("spot.moonPhase", { pct: headline.illum })}</span>
            <span className="font-medium text-amber-300">
              {t("spot.bestMoment", { time: fmtHM(bestMomentMs(headline.w)) })}
              {headline.w.gcCulmAlt != null ? t("spot.coreMaxAlt", { alt: headline.w.gcCulmAlt }) : ""}
            </span>
            <span className="text-yellow-200">
              {t("spot.shootable", { start: fmtHM(headline.w.startMs), end: fmtHM(headline.w.endMs), dur: fmtDur(headline.w.durationMin) })}
            </span>
            <span className="text-sky-300">{t("spot.core", { dir: coreDir(headline.w) })}</span>
            {wxByDate[headline.w.date] && <WeatherBadge w={wxByDate[headline.w.date]} t={t} />}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            {t("spot.headlineNote", { time: fmtHM(bestMomentMs(headline.w)) })}
          </p>
          <details className="mt-3 text-xs text-slate-400">
            <summary className="cursor-pointer text-slate-300 hover:text-white">{t("spot.howTitle")}</summary>
            <div className="mt-2 space-y-1.5 border-l-2 border-slate-700 pl-3 leading-relaxed">
              <p><span className="text-slate-200">{t("spot.how1Label")}</span>{t("spot.how1")}</p>
              <p><span className="text-slate-200">{t("spot.how2Label")}</span>{t("spot.how2a")}<span className="text-amber-300">{t("spot.how2b")}</span>{t("spot.how2c")}<span className="text-sky-300">{t("spot.how2d")}</span>{t("spot.how2e")}</p>
              <p><span className="text-slate-200">{t("spot.how3Label")}</span>{t("spot.how3")}</p>
              <p className="text-slate-500">{t("spot.howTip")}</p>
            </div>
          </details>
            </div>
            {headline.w.coreAzStart != null && headline.w.coreAzEnd != null && (
              <div className="flex shrink-0 flex-col items-center">
                <CoreCompass
                  azStart={headline.w.coreAzStart}
                  azEnd={headline.w.coreAzEnd}
                  culmAlt={headline.w.gcCulmAlt}
                  labels={{ N: t("dir.N"), E: t("dir.E"), S: t("dir.S"), W: t("dir.W") }}
                  title={t("compass.title")}
                  maxLabel={headline.w.gcCulmAlt != null ? t("compass.max", { alt: headline.w.gcCulmAlt }) : ""}
                  aria={t("compass.aria")}
                />
                <span className="text-[11px] text-slate-500">{t("spot.compassCaption")}</span>
              </div>
            )}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-100">{t("spot.top5")}</h2>
        {top.length === 0 ? (
          <p className="text-sm text-slate-500">{t("spot.noNights")}</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {top.map((w, i) => (
              <div key={w.date} className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                <div className="text-xs text-slate-500">#{i + 1}</div>
                <div className="text-lg font-semibold text-slate-100">{fmtMD(w.date)}</div>
                <div className="mt-1 text-sm text-yellow-200">{fmtHM(w.startMs)} → {fmtHM(w.endMs)}</div>
                <div className="text-xs text-slate-400">{t("card.shootable", { dur: fmtDur(w.durationMin) })}</div>
                <div className="mt-1 text-xs font-medium text-amber-300">
                  {t("spot.bestShort", { time: fmtHM(bestMomentMs(w)) })}{w.gcCulmAlt != null ? ` · ${t("spot.maxAltShort", { alt: w.gcCulmAlt })}` : ""}
                </div>
                <div className="text-xs text-sky-300">{t("spot.core", { dir: coreDir(w) || "—" })}</div>
                {wxByDate[w.date] && <div className="mt-0.5"><WeatherBadge w={wxByDate[w.date]} t={t} /></div>}
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center gap-3">
          <h2 className="text-lg font-semibold text-slate-100">{t("spot.calendar")}</h2>
          <div className="flex items-center gap-2 text-sm">
            <button onClick={() => shiftMonth(-1)} className="rounded bg-slate-900 px-2 py-1 hover:bg-slate-800">←</button>
            <span className="w-20 text-center text-slate-200">{ym.y}-{String(ym.m).padStart(2, "0")}</span>
            <button onClick={() => shiftMonth(1)} className="rounded bg-slate-900 px-2 py-1 hover:bg-slate-800">→</button>
          </div>
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-slate-900 text-left text-xs text-slate-400">
              <tr>
                <th className="px-3 py-2">{t("th.date")}</th>
                <th className="px-3 py-2">{t("th.lunar")}</th>
                <th className="px-3 py-2">{t("th.moonrise")}</th>
                <th className="px-2 py-2">{t("th.azimuth")}</th>
                <th className="px-3 py-2">{t("th.culmination")}</th>
                <th className="px-2 py-2">{t("th.altitude")}</th>
                <th className="px-3 py-2">{t("th.moonset")}</th>
                <th className="px-2 py-2">{t("th.azimuth")}</th>
                <th className="px-2 py-2">{t("th.moonPhase")}</th>
                <th className="px-3 py-2">{t("th.coreRise")}</th>
                <th className="px-3 py-2">{t("th.coreSet")}</th>
                <th className="px-3 py-2">{t("th.coreAz")}</th>
                <th className="px-3 py-2">{t("th.window")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {monthRows.map((r) => (
                <tr key={r.d} className={rowTone(r.win.status, r.win.durationMin)}>
                  <td className="px-3 py-1.5 tabular-nums">{ym.m}/{r.d}</td>
                  <td className="px-3 py-1.5">{r.lunar}</td>
                  <td className="px-3 py-1.5 tabular-nums">{r.moon.riseHM}</td>
                  <td className="px-2 py-1.5 tabular-nums">{r.moon.riseAz ?? ""}</td>
                  <td className="px-3 py-1.5 tabular-nums">{r.moon.culmHM}</td>
                  <td className="px-2 py-1.5 tabular-nums">
                    {r.moon.culmAlt != null ? `${r.moon.culmAlt}°${r.moon.culmDir}` : ""}
                  </td>
                  <td className="px-3 py-1.5 tabular-nums">{r.moon.setHM}</td>
                  <td className="px-2 py-1.5 tabular-nums">{r.moon.setAz ?? ""}</td>
                  <td className="px-2 py-1.5 tabular-nums">{r.moon.illumination}%</td>
                  <td className="px-3 py-1.5 tabular-nums">{fmtHM(r.win.gcRiseMs) || "—"}</td>
                  <td className="px-3 py-1.5 tabular-nums">{fmtHM(r.win.gcSetMs) || "—"}</td>
                  <td className="px-3 py-1.5 tabular-nums text-sky-300/90">{coreDir(r.win) || "—"}</td>
                  <td className="px-3 py-1.5 tabular-nums">
                    {r.win.status === "ok"
                      ? `${fmtHM(r.win.startMs)} → ${fmtHM(r.win.endMs)}（${fmtDur(r.win.durationMin)}）`
                      : r.win.status === "moon-blocked" ? t("status.moonBlocked")
                      : r.win.status === "gc-low" ? t("status.gcLow")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          <span className="text-sky-300/90">{t("legend.core")}</span>{t("legend.coreDesc")}
          <span className="text-slate-300">{t("legend.coreRise")}</span>{t("legend.coreRiseDesc")}
          <span className="text-slate-300">{t("legend.coreSet")}</span>{t("legend.coreSetDesc")}
          <span className="text-slate-300">{t("legend.coreAz")}</span>{t("legend.coreAzDesc")}
          {t("legend.rest")}
        </p>
      </section>
    </div>
  );
}
