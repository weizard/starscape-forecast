# Starscape Forecast — 台灣銀河攝影預報

計算台灣各攝影景點**每晚的銀河可拍時段**、**銀心走位**與**最佳拍攝時刻**。
純天文計算（不依賴外部 API），可安裝為手機 App，**離線也能使用** —— 在深山沒訊號時特別實用。

## 功能

- **銀河季總覽**：3–10 月可拍、5–8 月最佳、12–1 月休季，首頁色帶標示當月狀態
- **自訂出發地**：用目前位置、常用車站或座標設定 base，景點依直線距離排序、標示「附近」
- **自訂景點**：可新增自己的私房點（名稱／座標／海拔／光害），與內建景點一起排序計算
- **景點列表 + 地圖**：25 個台灣熱門銀河景點，含海拔／光害（Bortle）／拍攝方位
- **每晚可拍時段**：天文暮光後 ∩ 銀心仰角 > 5.4° ∩ 月亮在地平線下
- **銀心走位**：升起／過中天（最高）／落下時刻與方位，附**指北針視覺化**
- **最佳拍攝時刻**：銀心過中天（穿越大氣最少、最銳利）並夾在可拍時段內
- **月曆表**：逐日月出沒／方位／過中天／月相％／銀心資訊／可拍時段
- **天氣疊加**（選用）：中央氣象署 CWA 近 3 天夜間天氣、降雨機率、風向
- **PWA**：可加到手機主畫面，銀河計算離線可用

## 演算法

以 [astronomy-engine](https://github.com/cosinekitty/astronomy) 計算，銀心以
`DefineStar(RA 17h45m40s, Dec −29°00′28″)` 定義，由引擎處理歲差／章動；
觀測點帶入經緯度**與海拔**（地平視差）。

判定門檻：

| 參數 | 值 | 說明 |
|---|---|---|
| `GC_MIN_ALT` | 5.4° | 銀心可拍最低仰角，由參考表反推校準 |
| `SUN_DARK_ALT` | −18° | 天文暮光（天全黑） |
| `MIN_WINDOW_MIN` | 20 分 | 短於此的碎片時段視為不可拍 |

門檻 5.4° 是對照一份既有的月亮/銀河時刻表反推校正而得；逐格比對結果為月亮事件誤差 ≤4 分、時段結束誤差 ≤3 分。

## 開發

```bash
npm install
npm run dev        # http://localhost:3000（prebuild 會自動同步景點資料）
npm run build
npm run typecheck
```

景點資料的單一真實來源是 `data/milkyway-spots.json`；
`scripts/sync-data.mjs` 會在 dev/build 前複製到 `lib/spots-data.json` 供 bundler import。
**新增景點請改 `data/`**，不要直接改 `lib/spots-data.json`。

## 資料儲存

出發地與自訂景點都存在瀏覽器的 `localStorage`，**不會上傳到任何伺服器**，也不會在裝置之間同步：

| 鍵 | 內容 |
|---|---|
| `starscape:base` | 使用者設定的出發地 |
| `starscape:custom-spots` | 使用者新增的自訂景點 |

清除瀏覽器資料或更換裝置後這些設定會消失。自訂景點因伺服器不知其存在，
詳細頁走用戶端渲染（`/my/[id]`），天文計算完全正常，但沒有 CWA 天氣資料。

## 環境變數

| 變數 | 必要 | 用途 |
|---|---|---|
| `CWA_API_KEY` | 選用 | 中央氣象署開放資料授權碼；未設定時天氣區塊自動隱藏，其餘功能不受影響 |

申請：[opendata.cwa.gov.tw](https://opendata.cwa.gov.tw) 註冊後於會員專區取得授權碼。

## 部署

Vercel（或任何支援 Next.js 的平台）：匯入此 repo 即可，Root Directory 用預設根目錄。
需要天氣功能時在環境變數加入 `CWA_API_KEY`。

## 結構

```
app/          Next.js App Router（首頁景點列表、景點詳細頁、manifest）
components/   SpotDetail（月曆/精華卡）、SpotsMap、CoreCompass（指北針）等
lib/          astro（天文核心）、weather（CWA）、spots、lunar、types
data/         milkyway-spots.json — 景點資料（單一真實來源）
astro/        天文計算 PoC（獨立腳本，app 不依賴）
public/       PWA 圖示與 service worker
```

## 已知粗糙處

- 景點座標／Bortle 為粗估，需逐一實地校正
- 距離為直線距離，非實際車程（山路差異可能很大）
- 部分園區（如阿里山、東眼山）有夜間管制，實際可拍點位需再確認
- CWA 預報僅到未來 3 天，較遠的最佳夜不會有天氣標示

## 第三方服務與授權

| 項目 | 授權／政策 | 注意事項 |
|---|---|---|
| [astronomy-engine](https://github.com/cosinekitty/astronomy) | MIT | 天文計算核心 |
| [lunar-javascript](https://github.com/6tail/lunar-javascript) | MIT | 農曆換算 |
| [Leaflet](https://leafletjs.com/) | BSD-2-Clause | 地圖引擎 |
| [react-leaflet](https://react-leaflet.js.org/) | **Hippocratic 2.1** | 非 OSI 認可的開源授權，含人權相關使用限制。僅用於 `components/SpotsMap.tsx` 的 4 個元件；若需完全 OSI 相容的相依樹，可改用原生 Leaflet 重寫該檔案 |
| 地圖圖磚 | [OSM Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/) | 目前直接使用 `tile.openstreetmap.org`。該伺服器由 OSM 基金會以捐款營運，**不允許高流量的正式使用**；流量成長後應改接 MapTiler／Stadia／Protomaps 或自架。被限流時地圖會空白，但天文計算不受影響 |
| 天氣資料 | 中央氣象署開放資料 | 使用前請確認並遵循其開放資料授權條款的標示要求 |

地圖圖磚版權：© OpenStreetMap contributors

## 授權

MIT License — 見 [LICENSE](LICENSE)。歡迎自由使用、修改與散布。
