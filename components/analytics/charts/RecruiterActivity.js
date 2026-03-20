// components/analytics/charts/RecruiterActivity.js
//
// Renders the chart content only — no outer card wrapper.
// Always embedded inside a GLASS section card on the analytics pages.

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

const ORANGE = '#FF9800';
const BLUE   = '#2196F3';

/** Tooltip that shows only the line series, not the shaded areas */
function OnlyLinesTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  const rows = payload.filter((p) => p && p.name !== '__hide_in_tooltip__');
  if (!rows.length) return null;

  return (
    <div style={{ borderRadius: 10, border: '1px solid #ECEFF1', background: '#fff', padding: '6px 10px', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
      {rows.map((r) => (
        <div key={r.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              background: r.color,
              borderRadius: 999,
            }}
          />
          <span>{r.name || r.dataKey}: {r.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function RecruiterActivity({ data = [] }) {
  if (!data.length) {
    return (
      <div style={{ padding: '32px 0', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
        No activity data yet.
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 'clamp(160px, 30vw, 260px)' }}>
      <ResponsiveContainer>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="areaOrange" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ORANGE} stopOpacity={0.28} />
              <stop offset="100%" stopColor={ORANGE} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="areaBlue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={BLUE} stopOpacity={0.28} />
              <stop offset="100%" stopColor={BLUE} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#ECEFF1" />
          <XAxis dataKey="week" tick={{ fill: '#607D8B', fontSize: 12 }} />
          <YAxis tick={{ fill: '#607D8B', fontSize: 12 }} />

          <Tooltip content={OnlyLinesTooltip} />

          {/* Shaded areas — hidden from legend + tooltip */}
          <Area
            type="monotone"
            dataKey="messages"
            stroke="none"
            fill="url(#areaOrange)"
            legendType="none"
            name="__hide_in_tooltip__"
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="responses"
            stroke="none"
            fill="url(#areaBlue)"
            legendType="none"
            name="__hide_in_tooltip__"
            isAnimationActive={false}
          />

          {/* Lines with legend names */}
          <Line
            type="monotone"
            dataKey="messages"
            name="Applications"
            stroke={ORANGE}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="responses"
            name="Interviews"
            stroke={BLUE}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />

          <Legend wrapperStyle={{ fontSize: 12, color: '#607D8B' }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}