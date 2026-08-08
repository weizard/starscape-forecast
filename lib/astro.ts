// 天文計算核心：月亮資訊 + 銀河可見時段。
// 全部純計算（astronomy-engine），不依賴任何外部 API，可在瀏覽器執行。
// 可拍時段計算使用精確的事件搜尋
// （dusk/dawn、銀心升降越過門檻、月出月沒）取代逐分掃描，速度快一個數量級。
import * as A from "astronomy-engine";
import type { MoonDayInfo, NightWindow, Spot } from "./types";

// 銀心仰角門檻 5.4°：對照一份既有的月亮/銀河時刻表（南投，2026-08）反推校正而得 —
// 該表中所有「因銀心過低而結束」的時段，其終點時刻的銀心仰角都落在 5.3–5.5°，故取中值。
// 當時逐格比對的結果：月亮事件誤差 ≤4 分、時段結束誤差 ≤3 分。
// 校準用的驗證腳本為一次性用途，已移除；此處保留數值來由供日後調整參考。
export const GC_MIN_ALT = 5.4;
export const MIN_WINDOW_MIN = 20; // 短於此的零碎時段視為不可拍
export const SUN_DARK_ALT = -18; // 天文暮光
const TZ = "Asia/Taipei";

// 銀河中心（人馬座 A*，J2000）— DefineStar 後歲差/章動由引擎處理
A.DefineStar(A.Body.Star1, 17.7611, -29.0078, 26000);

const observerOf = (s: Spot) => new A.Observer(s.lat, s.lng, s.altitude_m);

/** 當地（UTC+8）某日 12:00 的 AstroTime，作為「這一夜」的搜尋起點 */
function localNoon(y: number, m: number, d: number): A.AstroTime {
  return new A.AstroTime(new Date(Date.UTC(y, m - 1, d, 4))); // 12:00 台灣 = 04:00 UTC
}

function altOf(body: A.Body, obs: A.Observer, t: A.AstroTime): number {
  const eq = A.Equator(body, t, obs, true, true);
  return A.Horizon(t, obs, eq.ra, eq.dec, "normal").altitude;
}

function azOf(body: A.Body, obs: A.Observer, t: A.AstroTime): number {
  const eq = A.Equator(body, t, obs, true, true);
  return Math.round(A.Horizon(t, obs, eq.ra, eq.dec, "normal").azimuth);
}

export function fmtHM(ms: number | null): string {
  if (ms == null) return "";
  return new Date(ms).toLocaleTimeString("zh-TW", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function fmtMD(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  return `${Number(m)}/${Number(d)}`;
}

const dstr = (y: number, m: number, d: number) =>
  `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

/**
 * 計算某景點某夜的銀河可見時段。
 * 可拍時段 = [天文暮光後, 晨光前] ∩ [銀心仰角>門檻] ∩ [月亮在地平線下]。
 * 月亮在單一夜裡至多出/沒各一次，因此可拍時段取「月沒之後、月出之前」即為最大連續段。
 */
export function nightWindow(spot: Spot, y: number, m: number, d: number): NightWindow {
  const obs = observerOf(spot);
  const noon = localNoon(y, m, d);
  const date = dstr(y, m, d);
  // 銀心升起時刻（越過可拍仰角門檻）— 即攝影師說的「銀心全部出現在空中」。
  // 從當地中午往後找一整夜；夏天入夜就升起、春秋則在凌晨升起。
  const gcRiseEvt = A.SearchAltitude(A.Body.Star1, obs, +1, noon, 1, GC_MIN_ALT);
  const gcRiseMs = gcRiseEvt ? gcRiseEvt.date.getTime() : null;
  // 銀心落下（升起後降到門檻以下）— 那一夜銀心「消失」的時刻，都在西南方低空
  const gcSetEvt = gcRiseEvt ? A.SearchAltitude(A.Body.Star1, obs, -1, gcRiseEvt, 1, GC_MIN_ALT) : null;
  const gcSetMs = gcSetEvt ? gcSetEvt.date.getTime() : null;
  // 銀心過中天（最高點）— 畫質最佳時刻（大氣穿越最少）
  const culmEvt = A.SearchHourAngle(A.Body.Star1, obs, 0, noon, +1);
  const gcCulmMs = culmEvt ? culmEvt.time.date.getTime() : null;
  const gcCulmAlt = culmEvt ? Math.round(culmEvt.hor.altitude) : null;

  const none = (status: NightWindow["status"]): NightWindow => ({
    date, status, startMs: null, endMs: null, durationMin: 0,
    gcRiseMs, gcSetMs, gcCulmMs, gcCulmAlt, coreAzStart: null, coreAzEnd: null,
  });

  const dusk = A.SearchAltitude(A.Body.Sun, obs, -1, noon, 1, SUN_DARK_ALT);
  const dawn = A.SearchAltitude(A.Body.Sun, obs, +1, noon, 1, SUN_DARK_ALT);
  if (!dusk || !dawn) return none("no-night");

  let start = dusk;
  let end = dawn;
  const spanDays = (a: A.AstroTime, b: A.AstroTime) => b.ut - a.ut;

  // 銀心仰角限制
  if (altOf(A.Body.Star1, obs, start) < GC_MIN_ALT) {
    const gcRise = A.SearchAltitude(A.Body.Star1, obs, +1, start, spanDays(start, end), GC_MIN_ALT);
    if (!gcRise || gcRise.ut >= end.ut) return none("gc-low");
    start = gcRise;
  }
  const gcSet = A.SearchAltitude(A.Body.Star1, obs, -1, start, spanDays(start, end), GC_MIN_ALT);
  if (gcSet && gcSet.ut < end.ut) end = gcSet;
  if (end.ut <= start.ut) return none("gc-low");

  // 月光限制：月亮在時段起點還在天上 → 等月沒；月亮中途升起 → 時段被截斷
  if (altOf(A.Body.Moon, obs, start) > -0.25) {
    const moonSet = A.SearchRiseSet(A.Body.Moon, obs, -1, start, spanDays(start, end) + 0.05);
    if (!moonSet || moonSet.ut >= end.ut) return none("moon-blocked");
    start = moonSet;
  }
  const moonRise = A.SearchRiseSet(A.Body.Moon, obs, +1, start, spanDays(start, end) + 0.05);
  if (moonRise && moonRise.ut < end.ut) end = moonRise;

  const durationMin = Math.round((end.ut - start.ut) * 1440);
  if (durationMin < MIN_WINDOW_MIN) return none("moon-blocked");
  return {
    date, status: "ok",
    startMs: start.date.getTime(), endMs: end.date.getTime(), durationMin,
    gcRiseMs, gcSetMs, gcCulmMs, gcCulmAlt,
    coreAzStart: azOf(A.Body.Star1, obs, start),
    coreAzEnd: azOf(A.Body.Star1, obs, end),
  };
}

/** 某景點某日的月亮資訊（月出沒/方位/過中天，僅取當地當日內的事件） */
export function moonDayInfo(spot: Spot, y: number, m: number, d: number): MoonDayInfo {
  const obs = observerOf(spot);
  const dayStart = new A.AstroTime(new Date(Date.UTC(y, m - 1, d) - 8 * 3600 * 1000));
  const inDay = (t: A.AstroTime) => {
    const local = new Date(t.date.getTime() + 8 * 3600 * 1000);
    return local.getUTCFullYear() === y && local.getUTCMonth() === m - 1 && local.getUTCDate() === d;
  };

  let rise: A.AstroTime | null = A.SearchRiseSet(A.Body.Moon, obs, +1, dayStart, 2);
  if (rise && !inDay(rise)) rise = null;
  let set: A.AstroTime | null = A.SearchRiseSet(A.Body.Moon, obs, -1, dayStart, 2);
  if (set && !inDay(set)) set = null;
  const culmEvt = A.SearchHourAngle(A.Body.Moon, obs, 0, dayStart, +1);
  const culm = culmEvt && inDay(culmEvt.time) ? culmEvt : null;

  const noonT = localNoon(y, m, d);
  const illum = Math.round(A.Illumination(A.Body.Moon, noonT).phase_fraction * 100);

  return {
    lunar: "", // 農曆由呼叫端補（lunar-javascript 為 CJS，於 component 載入）
    riseHM: rise ? fmtHM(rise.date.getTime()) : "",
    riseAz: rise ? azOf(A.Body.Moon, obs, rise) : null,
    culmHM: culm ? fmtHM(culm.time.date.getTime()) : "",
    culmAlt: culm ? Math.round(culm.hor.altitude) : null,
    culmDir: culm ? (culm.hor.azimuth > 90 && culm.hor.azimuth < 270 ? "S" : "N") : "",
    setHM: set ? fmtHM(set.date.getTime()) : "",
    setAz: set ? azOf(A.Body.Moon, obs, set) : null,
    illumination: illum,
  };
}

/** 未來 N 天內的可拍夜，依可拍時段長度排序 */
export function bestNights(spot: Spot, fromDate: Date, days: number): NightWindow[] {
  const out: NightWindow[] = [];
  const base = new Date(fromDate.toLocaleDateString("en-US", { timeZone: TZ }));
  for (let i = 0; i < days; i++) {
    const dt = new Date(base.getTime() + i * 86400 * 1000);
    const w = nightWindow(spot, dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
    if (w.status === "ok") out.push(w);
  }
  return out.sort((a, b) => b.durationMin - a.durationMin);
}
