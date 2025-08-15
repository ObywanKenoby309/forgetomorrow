// components/analytics/charts/RecruiterActivity.js
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

/** Tooltip that hides area-series rows and shows only line values */
function OnlyLinesTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  // Filter out any payload entries tagged to hide (the shaded areas)
  const rows = payload.filter((p) => p && p.name !== '__hide_in_tooltip__');
  if (!rows.length) return null;

  return (
    <div className="rounded border bg-white px-2 py-1 text-xs shadow">
      <div className="font-medium">{label}</div>
      {rows.map((r) => (
        <div key={r.dataKey} className="flex items-center gap-1">
          {/* color swatch */}
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
  return (
    <div className="bg-white rounded-2xl shadow p-5 border border-gray-100">
      <div className="text-lg font-semibold mb-3" style={{ color: '#FF7043' }}>
        Recruiter Activity
      </div>

      <div style={{ width: '100%', height: 320 }}>
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

            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis />

            {/* Custom tooltip: only line series are shown */}
            <Tooltip content={OnlyLinesTooltip} />

            {/* Shaded areas (hidden from legend + tooltip) */}
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
              name="Messages"
              stroke={ORANGE}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="responses"
              name="Responses"
              stroke={BLUE}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />

            <Legend />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
