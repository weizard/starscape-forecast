// 使用者自訂景點：只存在這台裝置的 localStorage，不會上傳到任何伺服器。
import type { Spot } from "./types";

const KEY = "starscape:custom-spots";
export const CUSTOM_PREFIX = "my-";

export const isCustom = (s: Spot) => s.id.startsWith(CUSTOM_PREFIX);

function isValid(s: unknown): s is Spot {
  const o = s as Spot;
  return (
    !!o &&
    typeof o.id === "string" &&
    typeof o.name === "string" &&
    typeof o.lat === "number" &&
    typeof o.lng === "number" &&
    Math.abs(o.lat) <= 90 &&
    Math.abs(o.lng) <= 180
  );
}

export function loadCustomSpots(): Spot[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const arr: unknown = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter(isValid) : [];
  } catch {
    return [];
  }
}

function persist(list: Spot[]): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* 空間不足或隱私模式：忽略 */
  }
}

export function addCustomSpot(input: {
  name: string;
  lat: number;
  lng: number;
  altitude_m?: number;
  bortle?: number;
  region?: string;
  facing?: string;
  access_notes?: string;
}): Spot {
  const spot: Spot = {
    id: `${CUSTOM_PREFIX}${Date.now().toString(36)}`,
    name: input.name.trim(),
    region: input.region?.trim() || "自訂地點",
    lat: input.lat,
    lng: input.lng,
    altitude_m: input.altitude_m ?? 0,
    bortle: input.bortle ?? 4,
    facing: input.facing?.trim() || "",
    access_notes: input.access_notes?.trim() || "",
  };
  persist([...loadCustomSpots(), spot]);
  return spot;
}

export function removeCustomSpot(id: string): void {
  persist(loadCustomSpots().filter((s) => s.id !== id));
}

export function findCustomSpot(id: string): Spot | undefined {
  return loadCustomSpots().find((s) => s.id === id);
}
