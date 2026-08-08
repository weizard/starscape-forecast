import type { Metadata, Viewport } from "next";
import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import OfflineIndicator from "@/components/OfflineIndicator";
import InstallPrompt from "@/components/InstallPrompt";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { I18nProvider } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Starscape Forecast — 台灣銀河攝影預報",
  description:
    "計算台灣各景點每晚的銀河可拍時段、銀心走位與最佳拍攝時刻；可安裝為手機 App，離線也能使用。",
  manifest: "/manifest.webmanifest",
  applicationName: "銀河預報",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "銀河預報" },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#05091a",
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-200 antialiased">
        <I18nProvider>
          <ServiceWorkerRegister />
          <OfflineIndicator />
          <InstallPrompt />
          <SiteHeader />
          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
          <SiteFooter />
        </I18nProvider>
      </body>
    </html>
  );
}
