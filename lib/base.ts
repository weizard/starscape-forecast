// 使用者自訂出發地（base）：存在瀏覽器 localStorage，用來計算各景點的距離與排序。
// 車程需要路網資料才算得準（尤其山路），這裡只提供誠實的「直線距離」。

export interface BaseLocation {
  name: string;
  lat: number;
  lng: number;
}

const KEY = "starscape:base";

/** 常見出發地，方便一鍵選擇（涵蓋各區域主要車站/都會）。 */
export const PRESET_BASES: BaseLocation[] = [
  { name: "台北車站", lat: 25.0478, lng: 121.5170 },
  { name: "板橋車站", lat: 25.0143, lng: 121.4637 },
  { name: "桃園高鐵站", lat: 25.0128, lng: 121.2148 },
  { name: "新竹／竹北", lat: 24.8387, lng: 121.0043 },
  { name: "台中車站", lat: 24.1369, lng: 120.6857 },
  { name: "嘉義車站", lat: 23.4791, lng: 120.4415 },
  { name: "台南車站", lat: 22.9971, lng: 120.2126 },
  { name: "高雄／左營", lat: 22.6870, lng: 120.3075 },
  { name: "宜蘭車站", lat: 24.7546, lng: 121.7581 },
  { name: "花蓮車站", lat: 23.9930, lng: 121.6015 },
  { name: "台東車站", lat: 22.7930, lng: 121.1233 },
];

export function loadBase(): BaseLocation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const b = JSON.parse(raw) as BaseLocation;
    if (typeof b?.lat === "number" && typeof b?.lng === "number" && b.name) return b;
    return null;
  } catch {
    return null;
  }
}

export function saveBase(b: BaseLocation): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(b));
  } catch {
    /* 隱私模式等情況忽略 */
  }
}

export function clearBase(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/** 兩點間大圓（直線）距離，公里。 */
export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export const fmtKm = (km: number) => (km < 10 ? km.toFixed(1) : Math.round(km).toString());
