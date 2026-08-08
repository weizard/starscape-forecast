"use client";
import { useEffect } from "react";

/** 註冊 service worker，讓網站可安裝成 PWA 並支援離線。 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}
