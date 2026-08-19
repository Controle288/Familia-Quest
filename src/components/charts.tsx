import React from 'react';

export interface BarItem {
  label: string;
  value: number;
  color?: string;
}

/** Horizontal bar chart (pure SVG-free divs). */
export const BarChart: React.FC<{ items: BarItem[]; unit?: string }> = ({ items, unit = '' }) => {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="space-y-3">
      {items.map((it, i) => (
        <div key={i}>
          <div className="flex justify-between text-xs font-semibold mb-1">
            <span className="text-slate-700 dark:text-slate-200 truncate">{it.label}</span>
            <span className="text-slate-500 dark:text-slate-400 shrink-0 ml-2">
              {it.value}
              {unit}
            </span>
          </div>
          <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${(it.value / max) * 100}%`,
                background: it.color || 'linear-gradient(90deg,#3525cd,#8455ef)',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export interface RingSegment {
  value: number;
  color: string;
  label: string;
}

/** Donut/ring chart built from SVG stroke segments. */
export const RingChart: React.FC<{
  segments: RingSegment[];
  size?: number;
  stroke?: number;
  centerLabel?: string;
}> = ({ segments, size = 168, stroke = 18, centerLabel }) => {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          className="text-slate-100 dark:text-slate-700"
          strokeWidth={stroke}
        />
        {segments.map((s, i) => {
          const len = (s.value / total) * circ;
          const el = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeDasharray={`${len} ${circ - len}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
            />
          );
          offset += len;
          return el;
        })}
      </g>
      {centerLabel && (
        <text
          x="50%"
          y="50%"
          dominantBaseline="central"
          textAnchor="middle"
          className="fill-[#0b1c30] dark:fill-slate-100 font-heading"
          style={{ fontSize: 22, fontWeight: 800 }}
        >
          {centerLabel}
        </text>
      )}
    </svg>
  );
};

/** Vertical sparkline-style bars (e.g. last-7-days activity). */
export const SparkBars: React.FC<{
  values: number[];
  labels?: string[];
  color?: string;
}> = ({ values, labels, color = '#3525cd' }) => {
  const max = Math.max(1, ...values);
  return (
    <div className="flex items-end gap-1.5 h-28">
      {values.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1">
          <div
            className="w-full rounded-t-md transition-all duration-700"
            style={{
              height: `${Math.max(v > 0 ? 6 : 2, (v / max) * 100)}%`,
              background: v > 0 ? color : '#e2e8f0',
            }}
            title={`${labels?.[i] ?? ''}: ${v}`}
          />
          {labels && (
            <span className="text-[9px] text-slate-400 dark:text-slate-500 truncate w-full text-center">
              {labels[i]}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};
