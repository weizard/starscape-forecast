"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DICTS, LOCALES, type Locale, type MessageKey } from "./dict";

const KEY = "starscape:locale";

function detect(): Locale {
  if (typeof navigator === "undefined") return "zh-TW";
  const langs = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const l of langs) {
    const low = l.toLowerCase();
    if (low.startsWith("zh")) return "zh-TW";
    if (low.startsWith("en")) return "en";
  }
  return "zh-TW";
}

/** 以 {key} 佔位符替換參數。 */
function interpolate(tpl: string, vars?: Record<string, string | number>): string {
  if (!vars) return tpl;
  return tpl.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

interface Ctx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // 伺服器端與首次繪製都用預設語言，掛載後才切換，避免 hydration 不一致
  const [locale, setLocaleState] = useState<Locale>("zh-TW");

  useEffect(() => {
    let initial: Locale | null = null;
    try {
      const saved = window.localStorage.getItem(KEY);
      if (saved && (LOCALES as readonly string[]).includes(saved)) initial = saved as Locale;
    } catch {
      /* ignore */
    }
    setLocaleState(initial ?? detect());
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      window.localStorage.setItem(KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (key: MessageKey, vars?: Record<string, string | number>) =>
      interpolate(DICTS[locale][key] ?? DICTS["zh-TW"][key] ?? key, vars),
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): Ctx {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n 必須在 I18nProvider 內使用");
  return ctx;
}

/** 只取翻譯函式的便利 hook。 */
export function useT() {
  return useI18n().t;
}

export { LOCALES, LOCALE_LABEL } from "./dict";
export type { Locale, MessageKey } from "./dict";
