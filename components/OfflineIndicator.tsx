"use client";
import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";

/** 斷網時顯示提示：銀河計算為本地運算仍可用，天氣需連網。 */
export default function OfflineIndicator() {
  const t = useT();
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-[1200] bg-amber-600/95 px-4 py-2 text-center text-xs font-medium text-white shadow-lg">
      {t("offline.banner")}
    </div>
  );
}
