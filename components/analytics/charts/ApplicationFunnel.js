// components/analytics/charts/ApplicationFunnel.js
//
// Renders the chart content only — no outer card wrapper.
// This component is always embedded inside a GLASS section card
// on the analytics pages; wrapping it again creates double-boxing.

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';

const ORANGE_DARK  = '#F57C00';
const ORANGE_LIGHT = '#FFB74D';

export default function ApplicationFunnel({ data = [] }) {
  const rows = Array.isArray(data) ? data : [];

  if (!rows.length) {
    return (
      <div style={{ padding: '32px 0', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
        No funnel data yet.
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 320 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rows}
          margin={{ top: 8, right: 12, bottom: 36, left: 12 }}
          barSize={44}
          barCategoryGap={24}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#ECEFF1" />
          <XAxis
            dataKey="stage"
            interval={0}
            height={46}
            tickMargin={16}
            tick={{ fill: '#607D8B', fontSize: 12 }}
          />
          <YAxis allowDecimals={false} tick={{ fill: '#607D8B', fontSize: 12 }} />
          <Tooltip
            cursor={{ fill: 'rgba(0,0,0,0.03)' }}
            contentStyle={{ borderRadius: 10, borderColor: '#ECEFF1' }}
            formatter={(v) => v.toLocaleString()}
          />
          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
            {rows.map((_, i) => (
              <Cell
                key={i}
                fill={i % 2 === 0 ? ORANGE_DARK : ORANGE_LIGHT}
                stroke={i % 2 === 0 ? ORANGE_DARK : ORANGE_LIGHT}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}