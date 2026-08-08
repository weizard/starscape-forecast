// lunar-javascript 是 CJS，包一層取農曆日字串
// eslint-disable-next-line @typescript-eslint/no-require-imports
import pkg from "lunar-javascript";

const { Lunar } = pkg as unknown as {
  Lunar: { fromDate(d: Date): { getMonthInChinese(): string; getDayInChinese(): string } };
};

/** 傳台灣當地日期（y,m,d）回傳如「六月十九」 */
export function lunarStr(y: number, m: number, d: number): string {
  const l = Lunar.fromDate(new Date(Date.UTC(y, m - 1, d, 4))); // 當地正午
  return `${l.getMonthInChinese()}月${l.getDayInChinese()}`;
}
