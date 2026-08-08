"use client";
import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";

// Chrome/Edge 的安裝事件（非標準，TS lib 未內建）
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "starscape:install-dismissed";

/** 已在獨立視窗（已安裝）執行？ */
function isStandalone(): boolean {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari 專有
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function detectIOS(): boolean {
  const ua = navigator.userAgent;
  // iPadOS 13+ 會偽裝成 Macintosh，用觸控點數辨識
  return /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

function isMobile(): boolean {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || navigator.maxTouchPoints > 1;
}

export default function InstallPrompt() {
  const t = useT();
  const [show, setShow] = useState(false);
  const [ios, setIos] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isStandalone() || !isMobile()) return;
    try {
      if (localStorage.getItem(DISMISS_KEY)) return;
    } catch {
      /* 隱私模式：照常顯示 */
    }

    const onIOS = detectIOS();
    setIos(onIOS);

    if (onIOS) {
      // iOS 無安裝 API，直接顯示手動步驟（延遲一下，別一進站就打斷）
      const timer = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(timer);
    }

    // Android/Chrome：等瀏覽器判定可安裝才顯示
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    setShow(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    dismiss();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-[1300] rounded-xl border border-slate-700 bg-slate-900/95 p-3 shadow-2xl backdrop-blur sm:mx-auto sm:max-w-md">
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon-192.png" alt="" className="h-10 w-10 shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-100">{t("install.title")}</p>
          {ios ? (
            <p className="mt-1 text-xs leading-relaxed text-slate-400">{t("install.ios")}</p>
          ) : (
            <p className="mt-1 text-xs leading-relaxed text-slate-400">{t("install.android")}</p>
          )}
          <div className="mt-2 flex gap-2">
            {!ios && (
              <button
                onClick={install}
                className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-500"
              >
                {t("install.cta")}
              </button>
            )}
            <button
              onClick={dismiss}
              className="rounded-lg px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
            >
              {t("install.dismiss")}
            </button>
          </div>
        </div>
        <button
          onClick={dismiss}
          aria-label={t("install.close")}
          className="shrink-0 text-slate-500 hover:text-slate-300"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
