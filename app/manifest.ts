import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Starscape Forecast — 台灣銀河攝影預報",
    short_name: "銀河預報",
    description: "台灣各景點的銀河可拍時段、銀心走位與最佳拍攝時刻（離線也能使用）",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#05091a",
    theme_color: "#05091a",
    lang: "zh-TW",
    categories: ["photography", "weather", "travel"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
