// 把 data/ 的景點資料（single source of truth）複製進 lib/ 供 bundler import。
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, "..", "data", "milkyway-spots.json");
const dst = join(here, "..", "lib", "spots-data.json");
mkdirSync(dirname(dst), { recursive: true });
copyFileSync(src, dst);
console.log(`synced ${src} -> ${dst}`);
