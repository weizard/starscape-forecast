export interface Spot {
  id: string;
  name: string;
  region: string;
  lat: number;
  lng: number;
  altitude_m: number;
  bortle: number;
  facing: string;
  access_notes: string;
}

export type WindowStatus = "ok" | "moon-blocked" | "gc-low" | "no-night";

export interface NightWindow {
  /** 當地日期 YYYY-MM-DD（夜晚起始日） */
  date: string;
  status: WindowStatus;
  /** UTC ms */
  startMs: number | null;
  endMs: number | null;
  durationMin: number;
  /** 銀心升起（越過可拍仰角門檻）的時刻 UTC ms；當晚不升起則 null */
  gcRiseMs: number | null;
  /** 銀心落下（跌回可拍仰角門檻以下）的時刻 UTC ms；升起後才有 */
  gcSetMs: number | null;
  /** 銀心過中天（最高點，畫質最佳時刻）UTC ms 與該時仰角（度） */
  gcCulmMs: number | null;
  gcCulmAlt: number | null;
  /** 可拍時段起訖時，銀心的方位角（度，0=北 90=東 180=南 270=西）；無可拍時段為 null */
  coreAzStart: number | null;
  coreAzEnd: number | null;
}

export interface MoonDayInfo {
  lunar: string;
  riseHM: string;
  riseAz: number | null;
  culmHM: string;
  culmAlt: number | null;
  culmDir: "N" | "S" | "";
  setHM: string;
  setAz: number | null;
  illumination: number; // 0-100
}
