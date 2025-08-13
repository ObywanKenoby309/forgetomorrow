// components/recruiter/AnalyticsCharts.js
/**
 * Lightweight SVG charts for V1 without external libs.
 * Props are simple numbers/arrays; fallback placeholders if empty.
 */

export function SourceBreakdown({ sources = [] }) {
  // sources: [{label, value}]
  const total = sources.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div className="space-y-3">
      <ul className="space-y-1 text-sm">
        {sources.map((s) => (
          <li key={s.label} className="flex items-center justify-between">
            <span className="text-slate-600">{s.label}</span>
            <span className="font-medium">{s.value}</span>
          </li>
        ))}
        {sources.length === 0 && <li className="text-slate-500 text-sm">No source data yet.</li>}
      </ul>
      {/* Bar row */}
      <div className="flex gap-1 h-3 rounded overflow-hidden border">
        {sources.map((s) => {
          const w = `${(s.value / total) * 100}%`;
          return <div key={s.label} style={{ width: w }} className="bg-slate-300" title={`${s.label}: ${s.value}`} />;
        })}
      </div>
    </div>
  );
}

export function Funnel({ stages = [] }) {
  // stages: [{label, value}] from top→bottom
  const max = stages.reduce((m, s) => Math.max(m, s.value), 0) || 1;

  return (
    <div className="space-y-2">
      {stages.map((s, i) => {
        const pct = Math.max(8, Math.round((s.value / max) * 100)); // ensure visible min width
        return (
          <div key={i} className="flex items-center gap-2">
            <div className="text-xs text-slate-600 w-28">{s.label}</div>
            <div className="flex-1">
              <div className="h-6 bg-slate-200 rounded">
                <div className="h-6 bg-slate-400 rounded" style={{ width: `${pct}%` }} title={`${s.label}: ${s.value}`} />
              </div>
            </div>
            <div className="w-12 text-right text-sm font-medium">{s.value}</div>
          </div>
        );
      })}
      {stages.length === 0 && <div className="text-slate-500 text-sm">No funnel data yet.</div>}
    </div>
  );
}

export function TrendLine({ points = [] }) {
  // points: array of numbers (equal-spaced)
  const W = 520, H = 160, P = 16;
  const max = points.reduce((m, v) => Math.max(m, v), 0) || 1;
  const step = (W - P * 2) / Math.max(points.length - 1, 1);

  const path = points
    .map((v, i) => {
      const x = P + i * step;
      const y = H - P - (v / max) * (H - P * 2);
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      <rect x="0" y="0" width={W} height={H} fill="white" />
      <path d={path} stroke="#9ca3af" strokeWidth="2" fill="none" />
    </svg>
  );
}
