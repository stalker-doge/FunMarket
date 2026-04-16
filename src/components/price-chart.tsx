"use client";

import { useState, useRef, useCallback, useMemo } from "react";

interface PriceChartProps {
  snapshots: { time: string; prices: number[] }[];
  outcomeLabels: string[];
  outcomeColors: string[];
}

/* ---- Helpers ---- */

function parseTime(iso: string | undefined): number {
  if (!iso) return 0;
  return new Date(iso + "Z").getTime();
}

function formatTimeShort(iso: string | undefined): string {
  if (!iso) return "";
  try {
    const d = new Date(iso + "Z");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch { return iso; }
}

function formatTimeFull(iso: string | undefined): string {
  if (!iso) return "";
  try {
    const d = new Date(iso + "Z");
    return d.toLocaleDateString("en-US", {
      month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
    });
  } catch { return iso; }
}

function formatTooltipTime(iso: string | undefined): string {
  if (!iso) return "";
  try {
    const d = new Date(iso + "Z");
    return d.toLocaleDateString("en-US", {
      month: "short", day: "numeric", hour: "numeric", minute: "2-digit", second: "2-digit",
    });
  } catch { return iso; }
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function smoothPath(points: [number, number][], tension = 0.3): string {
  if (points.length < 2) return "";
  if (points.length === 2) {
    return `M${points[0][0]},${points[0][1]} L${points[1][0]},${points[1][1]}`;
  }
  const moveTo = `M${points[0][0]},${points[0][1]}`;
  const segments: string[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = i > 0 ? points[i - 1] : points[i];
    const [x1, y1] = points[i];
    const [x2, y2] = points[i + 1];
    const [x3, y3] = i < points.length - 2 ? points[i + 2] : points[i + 1];
    const cp1x = x1 + (x2 - x0) * tension;
    const cp1y = y1 + (y2 - y0) * tension;
    const cp2x = x2 - (x3 - x1) * tension;
    const cp2y = y2 - (y3 - y1) * tension;
    segments.push(`C${cp1x},${cp1y} ${cp2x},${cp2y} ${x2},${y2}`);
  }
  return `${moveTo} ${segments.join(" ")}`;
}

interface ResampledPoint {
  time: string;
  prices: number[];
  ms: number;
}

function resampleSnapshots(
  raw: { time: string; prices: number[] }[],
  numPoints: number
): ResampledPoint[] {
  if (raw.length < 2) {
    return raw.map((s) => ({ ...s, ms: parseTime(s.time) }));
  }

  const rawMs = raw.map((s) => parseTime(s.time));
  const tMin = rawMs[0];
  const tMax = rawMs[rawMs.length - 1];

  if (tMin === tMax) return raw.map((s) => ({ ...s, ms: parseTime(s.time) }));

  function pricesAt(ms: number): number[] {
    let lo = 0, hi = raw.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (rawMs[mid] <= ms) lo = mid;
      else hi = mid - 1;
    }
    return raw[lo].prices;
  }

  const result: ResampledPoint[] = [];
  const step = (tMax - tMin) / (numPoints - 1);
  let rawIdx = 0;

  for (let i = 0; i < numPoints; i++) {
    const t = i === numPoints - 1 ? tMax : tMin + step * i;

    while (rawIdx < raw.length && rawMs[rawIdx] < t && rawMs[rawIdx] > (result.length > 0 ? result[result.length - 1].ms : -Infinity)) {
      result.push({
        time: raw[rawIdx].time,
        prices: raw[rawIdx].prices,
        ms: rawMs[rawIdx],
      });
      rawIdx++;
    }

    if (result.length > 0 && t - result[result.length - 1].ms < step * 0.3) {
      continue;
    }

    result.push({
      time: new Date(t).toISOString().replace("Z", ""),
      prices: pricesAt(t),
      ms: t,
    });
  }

  const lastRaw = raw[raw.length - 1];
  if (result[result.length - 1].ms < tMax) {
    result.push({ time: lastRaw.time, prices: lastRaw.prices, ms: tMax });
  } else {
    result[result.length - 1] = { time: lastRaw.time, prices: lastRaw.prices, ms: tMax };
  }

  return result;
}

function pickTickIndices(count: number, maxTicks: number): number[] {
  if (count <= maxTicks) return Array.from({ length: count }, (_, i) => i);
  const ticks: number[] = [];
  const step = (count - 1) / (maxTicks - 1);
  for (let i = 0; i < maxTicks; i++) {
    ticks.push(Math.round(i * step));
  }
  return ticks;
}

export function PriceChart({
  snapshots,
  outcomeLabels,
  outcomeColors,
}: PriceChartProps) {
  const rawLatest = snapshots[snapshots.length - 1]?.prices ?? [];
  const hasHistory = snapshots.length > 1;

  const W = 520;
  const H = 200;
  const PAD_L = 36;
  const PAD_R = 12;
  const PAD_T = 8;
  const PAD_B = 24;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  const gridY = [0, 0.25, 0.5, 0.75, 1];

  const points = useMemo(() => {
    if (!hasHistory) return [];
    return resampleSnapshots(snapshots, 40);
  }, [snapshots, hasHistory]);

  function xPos(i: number) {
    if (points.length <= 1) return PAD_L;
    return PAD_L + (i / (points.length - 1)) * plotW;
  }
  function yPos(v: number) {
    return PAD_T + plotH - v * plotH;
  }

  const tickIndices = useMemo(() => {
    if (!hasHistory) return [];
    return pickTickIndices(points.length, 7);
  }, [points.length, hasHistory]);

  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg || points.length < 2) return;

      const rect = svg.getBoundingClientRect();
      const viewBoxX = (e.clientX - rect.left) / rect.width * W;

      const ratio = (viewBoxX - PAD_L) / plotW;
      const idx = Math.round(ratio * (points.length - 1));
      const clamped = Math.max(0, Math.min(points.length - 1, idx));

      if (viewBoxX >= PAD_L - 10 && viewBoxX <= W - PAD_R + 10) {
        setHoverIdx(clamped);
      } else {
        setHoverIdx(null);
      }
    },
    [points.length, W, PAD_L, PAD_R, plotW]
  );

  const handleMouseLeave = useCallback(() => setHoverIdx(null), []);

  const hovered = hoverIdx !== null ? points[hoverIdx] : null;
  const latest = points.length > 0 ? points[points.length - 1].prices : rawLatest;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-lg relative space-y-5">
      {/* Top gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-purple-500 to-primary" />

      {/* ---- Stacked probability bar ---- */}
      <div>
        <div className="flex h-9 rounded-lg overflow-hidden shadow-inner">
          {(hovered ? hovered.prices : latest).map((price, i) => {
            const pct = price * 100;
            return (
              <div
                key={i}
                className="relative flex items-center justify-center transition-all duration-300 ease-out"
                style={{
                  width: `${Math.max(pct, 1.5)}%`,
                  background: `linear-gradient(180deg, ${hexToRgba(outcomeColors[i], 0.95)} 0%, ${hexToRgba(outcomeColors[i], 0.7)} 100%)`,
                }}
              >
                {pct > 10 && (
                  <span
                    className="text-[11px] font-semibold tracking-wide text-white"
                    style={{ textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}
                  >
                    {pct.toFixed(0)}%
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend row */}
        <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3">
          {outcomeLabels.map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <span
                className="block h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor: outcomeColors[i],
                  boxShadow: `0 0 0 2px ${hexToRgba(outcomeColors[i], 0.3)}, 0 0 6px ${hexToRgba(outcomeColors[i], 0.4)}`,
                }}
              />
              <span className="text-sm text-muted-foreground">{label}</span>
              <span
                className="text-sm font-mono font-semibold tabular-nums"
                style={{ color: outcomeColors[i] }}
              >
                {((hovered ? hovered.prices[i] : latest[i]) * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ---- Line chart ---- */}
      {hasHistory ? (
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">
            Price History
          </div>

          <div className="relative">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${W} ${H}`}
              className="w-full cursor-crosshair"
              style={{ height: "auto", minHeight: 160 }}
              preserveAspectRatio="xMidYMid meet"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <defs>
                {outcomeColors.map((color, i) => (
                  <linearGradient key={`grad-${i}`} id={`fill-${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                    <stop offset="100%" stopColor={color} stopOpacity="0.01" />
                  </linearGradient>
                ))}
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Grid lines */}
              {gridY.map((v) => {
                const y = yPos(v);
                const isHalf = v === 0.5;
                return (
                  <g key={`grid-${v}`}>
                    <line
                      x1={PAD_L} y1={y} x2={W - PAD_R} y2={y}
                      stroke="currentColor"
                      strokeWidth={isHalf ? "1" : "0.5"}
                      className={v === 0 || v === 1 ? "text-border" : isHalf ? "text-muted-foreground/40" : "text-border/50"}
                      strokeDasharray={v === 0 || v === 1 ? "none" : "4 3"}
                    />
                    <text
                      x={PAD_L - 6} y={y}
                      textAnchor="end" dominantBaseline="middle"
                      className={isHalf ? "fill-foreground" : "fill-muted-foreground"}
                      fontSize={isHalf ? "9" : "8"}
                      fontFamily="ui-monospace, monospace"
                      fontWeight={isHalf ? "bold" : "normal"}
                    >
                      {Math.round(v * 100)}%
                    </text>
                  </g>
                );
              })}

              {/* X-axis tick marks + labels */}
              {tickIndices.map((idx, ti) => {
                const x = xPos(idx);
                const isFirst = ti === 0;
                const isLast = ti === tickIndices.length - 1;
                const anchor = isFirst ? "start" as const : isLast ? "end" as const : "middle" as const;
                const p = points[idx];
                const timeStr = isFirst || isLast
                  ? formatTimeShort(p?.time)
                  : formatTimeFull(p?.time);

                return (
                  <g key={`tick-${idx}`}>
                    <line
                      x1={x} y1={PAD_T + plotH}
                      x2={x} y2={PAD_T + plotH + 3}
                      className="stroke-muted-foreground/50"
                      strokeWidth="0.5"
                    />
                    <text
                      x={x} y={H - 4}
                      textAnchor={anchor}
                      className="fill-muted-foreground"
                      fontSize="7"
                      fontFamily="ui-monospace, monospace"
                    >
                      {timeStr}
                    </text>
                  </g>
                );
              })}

              {/* Outcome lines + areas */}
              {outcomeLabels.map((_, i) => {
                const pts: [number, number][] = points.map((p, j) => [
                  xPos(j),
                  yPos(p.prices[i]),
                ]);
                const linePath = smoothPath(pts);
                const areaPath = `${linePath} L${xPos(points.length - 1)},${yPos(0)} L${xPos(0)},${yPos(0)} Z`;

                return (
                  <g key={`outcome-${i}`}>
                    <path d={areaPath} fill={`url(#fill-${i})`} />
                    <path
                      d={linePath} fill="none"
                      stroke={outcomeColors[i]} strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round"
                      filter="url(#glow)" opacity="0.9"
                    />
                    <path
                      d={linePath} fill="none"
                      stroke={outcomeColors[i]} strokeWidth="1.5"
                      strokeLinecap="round" strokeLinejoin="round"
                    />
                  </g>
                );
              })}

              {/* Hover crosshair */}
              {hovered !== null && hoverIdx !== null && (
                <g>
                  <line
                    x1={xPos(hoverIdx)} y1={PAD_T}
                    x2={xPos(hoverIdx)} y2={PAD_T + plotH}
                    className="stroke-muted-foreground/50"
                    strokeWidth="0.75"
                    strokeDasharray="2 2"
                  />
                  {outcomeLabels.map((_, i) => (
                    <g key={`hover-dot-${i}`}>
                      <circle
                        cx={xPos(hoverIdx)}
                        cy={yPos(hovered.prices[i])}
                        r="5"
                        fill={outcomeColors[i]}
                        opacity="0.25"
                      />
                      <circle
                        cx={xPos(hoverIdx)}
                        cy={yPos(hovered.prices[i])}
                        r="3"
                        fill={outcomeColors[i]}
                        stroke="var(--color-card)"
                        strokeWidth="1.5"
                      />
                    </g>
                  ))}
                </g>
              )}
            </svg>

            {/* HTML tooltip */}
            {hovered !== null && hoverIdx !== null && (() => {
              const pctX = (xPos(hoverIdx) / W) * 100;
              // Flip left when past 60% to avoid right-edge overflow
              const flipLeft = pctX > 60;
              // Clamp so tooltip never exceeds the chart bounds
              const clampedX = Math.max(5, Math.min(pctX, 95));
              return (
              <div
                className="absolute top-0 pointer-events-none z-10"
                style={{
                  left: `${clampedX}%`,
                  transform: flipLeft ? "translateX(calc(-100% - 12px))" : "translateX(12px)",
                  paddingTop: "4px",
                }}
              >
                <div className="rounded-xl bg-card/95 border border-border/50 backdrop-blur-md px-3 py-2 shadow-2xl">
                  <div className="text-[10px] font-mono text-muted-foreground mb-1.5">
                    {formatTooltipTime(hovered.time)}
                  </div>
                  <div className="space-y-1">
                    {outcomeLabels.map((label, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span
                          className="block h-1.5 w-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: outcomeColors[i] }}
                        />
                        <span className="text-muted-foreground">{label}</span>
                        <span
                          className="font-mono font-semibold tabular-nums ml-auto pl-2"
                          style={{ color: outcomeColors[i] }}
                        >
                          {(hovered.prices[i] * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              );
            })()}
          </div>
        </div>
      ) : (
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">
            Price History
          </div>
          <div className="flex items-center justify-center py-12 text-center">
            <div>
              <svg width="120" height="60" viewBox="0 0 120 60" className="mx-auto mb-4 text-muted-foreground/30">
                <line x1="0" y1="30" x2="120" y2="30" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
                <path d="M10 40 Q30 35 50 25 T90 20 T110 15" stroke="currentColor" strokeWidth="1.5" fill="none" strokeDasharray="6 3" opacity="0.5" />
                <circle cx="10" cy="40" r="2" fill="currentColor" opacity="0.3" />
                <circle cx="110" cy="15" r="2" fill="currentColor" opacity="0.3" />
              </svg>
              <p className="text-sm text-muted-foreground font-medium">Waiting for first trade...</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Price history will appear here</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
