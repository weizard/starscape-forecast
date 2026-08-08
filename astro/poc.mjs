#!/usr/bin/env node
// PoC：對任一景點產出「月亮 + 銀河可見時間」月曆表（重現武嶺表格式）。
// 用法: node poc.mjs <spot-id> <YYYY-MM>   例: node poc.mjs yulao 2026-08
import * as A from "astronomy-engine";
import pkg from "lunar-javascript";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const { Lunar } = pkg;
const TZ = 8 * 60; // 台灣 UTC+8（分鐘）

// 銀河中心（人馬座 A* 附近，J2000）。DefineStar 讓 astronomy-engine
// 把它當天體處理，歲差/章動修正都由引擎負責。
const GC_RA_J2000 = 17.7611;   // 17h45m40s
const GC_DEC_J2000 = -29.0078; // -29°00'28"
A.DefineStar(A.Body.Star1, GC_RA_J2000, GC_DEC_J2000, 26000);

const GC_MIN_ALT = 5.4;  // 銀心仰角門檻（度）— 由參考表反推校正（見 verify-reference.mjs）
const SUN_DARK_ALT = -18; // 天文暮光

const [, , spotId = "yulao", ym] = process.argv;
const now = new Date();
const [year, month] = ym
  ? ym.split("-").map(Number)
  : [now.getFullYear(), now.getMonth() + 1];

const dataPath = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "milkyway-spots.json");
const { spots } = JSON.parse(readFileSync(dataPath, "utf8"));
const spot = spots.find((s) => s.id === spotId);
if (!spot) {
  console.error(`找不到景點 ${spotId}，可用: ${spots.map((s) => s.id).join(", ")}`);
  process.exit(1);
}
const observer = new A.Observer(spot.lat, spot.lng, spot.altitude_m);

// ---- 小工具 ----
const localDate = (y, m, d, hh = 0, mm = 0) =>
  new Date(Date.UTC(y, m - 1, d, hh, mm) - TZ * 60 * 1000);
const fmtHM = (t) => {
  if (!t) return "";
  const d = new Date(t.date.getTime() + TZ * 60 * 1000);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
};
const sameLocalDay = (t, y, m, d) => {
  const local = new Date(t.date.getTime() + TZ * 60 * 1000);
  return local.getUTCFullYear() === y && local.getUTCMonth() === m - 1 && local.getUTCDate() === d;
};
const azOf = (body, time) => {
  const eq = A.Equator(body, time, observer, true, true);
  return Math.round(A.Horizon(time, observer, eq.ra, eq.dec, "normal").azimuth);
};
const altOf = (body, time) => {
  const eq = A.Equator(body, time, observer, true, true);
  return A.Horizon(time, observer, eq.ra, eq.dec, "normal").altitude;
};

// ---- 主表 ----
const daysInMonth = new Date(year, month, 0).getDate();
const pad = (s, w) => String(s).padEnd(w, "　".repeat(0) || " ");
console.log(`\n📍 ${spot.name}  (${spot.lat}, ${spot.lng}, ${spot.altitude_m}m)  ${year}-${String(month).padStart(2, "0")}`);
console.log(`   銀心仰角門檻 ${GC_MIN_ALT}°、天文暮光 ${SUN_DARK_ALT}°、時區 UTC+8\n`);
console.log("日期        農曆      月出    方位  過中天  仰角   月沒    方位  | 銀河可見窗口");
console.log("-".repeat(96));

for (let d = 1; d <= daysInMonth; d++) {
  const dayStart = localDate(year, month, d); // 當地 00:00
  const noon = localDate(year, month, d, 12);

  // 農曆
  const lunar = Lunar.fromDate(new Date(Date.UTC(year, month - 1, d, 4))); // 當地正午取農曆日
  const lunarStr = `${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`;

  // 月出 / 月沒 / 過中天（只取「當地這一天」內發生的事件，跨日則留白）
  let rise = A.SearchRiseSet(A.Body.Moon, observer, +1, new A.AstroTime(dayStart), 2);
  if (rise && !sameLocalDay(rise, year, month, d)) rise = null;
  let set = A.SearchRiseSet(A.Body.Moon, observer, -1, new A.AstroTime(dayStart), 2);
  if (set && !sameLocalDay(set, year, month, d)) set = null;
  let culm = A.SearchHourAngle(A.Body.Moon, observer, 0, new A.AstroTime(dayStart), +1);
  if (culm && !sameLocalDay(culm.time, year, month, d)) culm = null;

  const culmAlt = culm ? Math.round(culm.hor.altitude) : null;
  const culmDir = culm ? (culm.hor.azimuth > 90 && culm.hor.azimuth < 270 ? "S" : "N") : "";

  // ---- 銀河可見窗口 ----
  // 夜間範圍：當日天文暮光結束 → 隔日天文晨光開始
  const eveDusk = A.SearchAltitude(A.Body.Sun, observer, -1, new A.AstroTime(noon), 1, SUN_DARK_ALT);
  const dawn = A.SearchAltitude(A.Body.Sun, observer, +1, new A.AstroTime(noon), 1, SUN_DARK_ALT);

  let windowStr = "";
  if (eveDusk && dawn) {
    // 5 分鐘步進掃描：銀心夠高 + 天全黑 + 月亮在地平線下
    const stepMin = 5;
    let winStart = null, winEnd = null, blockedByMoon = false, gcEverUp = false;
    for (let t = eveDusk.date.getTime(); t <= dawn.date.getTime(); t += stepMin * 60 * 1000) {
      const at = new A.AstroTime(new Date(t));
      const gcAlt = altOf(A.Body.Star1, at);
      if (gcAlt < GC_MIN_ALT) { if (winStart && !winEnd) winEnd = at; continue; }
      gcEverUp = true;
      const moonAlt = altOf(A.Body.Moon, at);
      if (moonAlt > -0.5) {
        if (winStart && !winEnd) winEnd = at; // 窗口被月出截斷
        else if (!winStart) blockedByMoon = true;
        continue;
      }
      if (!winStart) { winStart = at; blockedByMoon = false; }
    }
    if (winStart && !winEnd) winEnd = dawn; // 窗口一路到天亮

    if (winStart && winEnd) {
      const endLocal = new Date(winEnd.date.getTime() + TZ * 60 * 1000);
      const crossDay = endLocal.getUTCDate() !== d;
      windowStr = `${fmtHM(winStart)} → ${fmtHM(winEnd)}${crossDay ? "(+1)" : ""}`;
      const durMin = Math.round((winEnd.date - winStart.date) / 60000);
      windowStr += `  (${Math.floor(durMin / 60)}h${String(durMin % 60).padStart(2, "0")}m)`;
    } else if (!gcEverUp) {
      windowStr = "銀心仰角不足";
    } else {
      windowStr = "月光阻擋";
    }
  }

  const row = [
    `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
    lunarStr.padEnd(6, "　"),
    fmtHM(rise).padStart(5) || "     ",
    String(rise ? azOf(A.Body.Moon, rise) : "").padStart(4),
    fmtHM(culm ? culm.time : null).padStart(6),
    `${culmAlt ?? ""}${culmDir}`.padStart(5),
    fmtHM(set).padStart(6),
    String(set ? azOf(A.Body.Moon, set) : "").padStart(4),
    " | " + windowStr,
  ];
  console.log(row.join("  "));
}
console.log();
