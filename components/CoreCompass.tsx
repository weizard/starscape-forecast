// 銀心方位指北針：純 SVG，畫出當晚銀心「升起側 → 過中天(正南) → 落下側」的走位弧線。
// 方位角 0°=北、90°=東、180°=南、270°=西；羅盤北在上、順時針。全本地繪製，離線可用。

const CX = 80;
const CY = 80;
const pt = (az: number, r: number): [number, number] => {
  const rad = (az * Math.PI) / 180;
  return [CX + r * Math.sin(rad), CY - r * Math.cos(rad)];
};

export default function CoreCompass({
  azStart,
  azEnd,
  culmAz = 180,
  culmAlt,
  labels,
  title,
  maxLabel,
  aria,
}: {
  azStart: number;
  azEnd: number;
  culmAz?: number;
  culmAlt?: number | null;
  labels: { N: string; E: string; S: string; W: string };
  title: string;
  maxLabel: string;
  aria: string;
}) {
  const R = 50;
  // 弧線取樣（升起側 → 落下側）
  const lo = Math.min(azStart, azEnd);
  const hi = Math.max(azStart, azEnd);
  const pts: string[] = [];
  for (let a = lo; a <= hi; a += 3) {
    const [x, y] = pt(a, R);
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  const [sx, sy] = pt(azStart, R);
  const [ex, ey] = pt(azEnd, R);
  const [cx, cy] = pt(culmAz, R);
  const cardinals: [string, number][] = [[labels.N, 0], [labels.E, 90], [labels.S, 180], [labels.W, 270]];

  return (
    <svg viewBox="0 0 160 160" className="h-40 w-40 shrink-0" role="img" aria-label={aria}>
      <circle cx={CX} cy={CY} r={64} className="fill-slate-950/40 stroke-slate-700" strokeWidth={1} />
      {/* 十字刻度 */}
      <line x1={CX} y1={16} x2={CX} y2={144} className="stroke-slate-800" strokeWidth={0.5} />
      <line x1={16} y1={CY} x2={144} y2={CY} className="stroke-slate-800" strokeWidth={0.5} />
      {cardinals.map(([label, az]) => {
        const [lx, ly] = pt(az, 72);
        return (
          <text
            key={label}
            x={lx}
            y={ly + 3.5}
            textAnchor="middle"
            className={`fill-slate-400 text-[9px] ${az === 180 ? "font-bold fill-amber-300" : ""}`}
          >
            {label}
          </text>
        );
      })}
      {/* 銀心走位弧線 */}
      <polyline points={pts.join(" ")} fill="none" className="stroke-sky-400" strokeWidth={3} strokeLinecap="round" />
      {/* 升起側 */}
      <circle cx={sx} cy={sy} r={4} className="fill-slate-900 stroke-sky-300" strokeWidth={2} />
      {/* 落下側 */}
      <circle cx={ex} cy={ey} r={4.5} className="fill-sky-300" />
      {/* 過中天（最高）星號 */}
      <text x={cx} y={cy + 4} textAnchor="middle" className="fill-amber-300 text-[13px]">★</text>
      {/* 中心標 */}
      <text x={CX} y={CY - 2} textAnchor="middle" className="fill-slate-500 text-[8px]">{title}</text>
      <text x={CX} y={CY + 8} textAnchor="middle" className="fill-slate-400 text-[8px]">
        {maxLabel}
      </text>
    </svg>
  );
}
