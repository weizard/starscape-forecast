// 中央氣象署（CWA）鄉鎮天氣預報 — 取夜間雲量/天氣現象、降雨機率與風向。
// 純伺服器端呼叫（需要 CWA_API_KEY）；未設 key 時回空，頁面照常運作。
// 資料來源：F-D0047-091 鄉鎮天氣預報（臺灣未來 3 天，3 小時間隔）。

const CWA_BASE =
  "https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-D0047-091";

export interface DayWeather {
  date: string; // YYYY-MM-DD（當地）
  wx: string; // 天氣現象文字，如「晴時多雲」
  pop: number | null; // 降雨機率 %
  windDir: string; // 風向，如「偏北風」
  windSpeed: number | null; // 風速 m/s
}

/** 從景點/活動的 region（如「嘉義縣阿里山鄉」「新北市瑞芳區」）拆出鄉鎮名。 */
export function townshipOf(region: string | null): string {
  if (!region) return "";
  // 去掉前面的縣/市（含直轄市三字），留下鄉/鎮/市/區
  const m = region.match(/^(?:台北市|臺北市|新北市|桃園市|台中市|臺中市|台南市|臺南市|高雄市|基隆市|新竹市|嘉義市|新竹縣|苗栗縣|彰化縣|南投縣|雲林縣|嘉義縣|屏東縣|宜蘭縣|花蓮縣|台東縣|臺東縣|澎湖縣|金門縣|連江縣)?(.+?[鄉鎮市區])/);
  return m ? m[1] : region;
}

interface CwaTimeEntry {
  StartTime?: string;
  ElementValue?: Array<Record<string, string>>;
}
interface CwaElement {
  ElementName?: string;
  Time?: CwaTimeEntry[];
}

const localDate = (iso: string) => {
  // CWA 時間已是當地時間（+08:00），取日期部分
  return iso.slice(0, 10);
};
const hourOf = (iso: string) => Number(iso.slice(11, 13));

/**
 * 抓某鄉鎮未來數日的每日夜間天氣（取傍晚 18–21 時的時段為代表，最貼近拍攝時間）。
 * 未設 CWA_API_KEY 或抓取失敗時回空陣列，呼叫端據此不顯示天氣。
 */
export async function fetchDailyWeather(township: string): Promise<DayWeather[]> {
  const key = process.env.CWA_API_KEY;
  if (!key || !township) return [];
  const url =
    `${CWA_BASE}?Authorization=${encodeURIComponent(key)}` +
    `&LocationName=${encodeURIComponent(township)}` +
    `&ElementName=${encodeURIComponent("天氣現象,3小時降雨機率,風向,風速")}`;
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } }); // 快取 1 小時
    if (!res.ok) return [];
    const json = await res.json();
    const loc = json?.records?.Locations?.[0]?.Location?.[0];
    if (!loc?.WeatherElement) return [];

    const byName: Record<string, CwaElement> = {};
    for (const el of loc.WeatherElement as CwaElement[]) {
      if (el.ElementName) byName[el.ElementName] = el;
    }
    // 以日期彙整；每個元素取傍晚（18–21 時）時段，雨機率取當日夜間最大值
    const days: Record<string, DayWeather> = {};
    const ensure = (d: string): DayWeather =>
      (days[d] ??= { date: d, wx: "", pop: null, windDir: "", windSpeed: null });
    const isEvening = (h: number) => h >= 18 && h <= 21;

    for (const t of byName["天氣現象"]?.Time ?? []) {
      if (!t.StartTime || !isEvening(hourOf(t.StartTime))) continue;
      const v = t.ElementValue?.[0]?.Weather;
      if (v) ensure(localDate(t.StartTime)).wx ||= v;
    }
    for (const t of byName["3小時降雨機率"]?.Time ?? []) {
      if (!t.StartTime) continue;
      const h = hourOf(t.StartTime);
      if (!(h >= 18 || h <= 3)) continue; // 夜間時段
      const raw = t.ElementValue?.[0]?.ProbabilityOfPrecipitation;
      const n = raw != null && raw !== "-" ? Number(raw) : null;
      if (n == null || Number.isNaN(n)) continue;
      const d = ensure(localDate(t.StartTime));
      d.pop = d.pop == null ? n : Math.max(d.pop, n);
    }
    for (const t of byName["風向"]?.Time ?? []) {
      if (!t.StartTime || !isEvening(hourOf(t.StartTime))) continue;
      const v = t.ElementValue?.[0]?.WindDirection;
      if (v) ensure(localDate(t.StartTime)).windDir ||= v;
    }
    for (const t of byName["風速"]?.Time ?? []) {
      if (!t.StartTime || !isEvening(hourOf(t.StartTime))) continue;
      const raw = t.ElementValue?.[0]?.WindSpeed;
      const n = raw != null && raw !== "-" ? Number(raw) : null;
      const d = ensure(localDate(t.StartTime));
      if (n != null && !Number.isNaN(n) && d.windSpeed == null) d.windSpeed = n;
    }
    return Object.values(days).sort((a, b) => a.date.localeCompare(b.date));
  } catch {
    return [];
  }
}

/** 天氣現象 → 是否適合觀星（晴朗）；供銀河頁上色。 */
export function isClearSky(wx: string): boolean {
  return /晴/.test(wx) && !/陰/.test(wx);
}

/** 天氣現象 → emoji 圖示 */
export function wxIcon(wx: string): string {
  if (/雷/.test(wx)) return "⛈️";
  if (/雨/.test(wx)) return "🌧️";
  if (/陰/.test(wx)) return "☁️";
  if (/多雲/.test(wx)) return "⛅";
  if (/晴/.test(wx)) return "☀️";
  return "🌡️";
}
