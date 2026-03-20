// components/analytics/charts/SourceBreakdown.js
//
// Renders the chart content only — no outer card wrapper.
// Always embedded inside a GLASS section card on the analytics pages.

import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';

const COLORS = [
  '#FF9800', // Orange (primary)
  '#2196F3', // Blue
  '#4DB6AC', // Teal
  '#FFB74D', // Light orange
  '#90A4AE', // Blue-gray (neutral/Other)
  '#7E57C2', // Soft purple
  '#66BB6A', // Green
  '#29B6F6', // Light blue
];

export default function SourceBreakdown({ data = [] }) {
  if (!data.length) {
    return (
      <div style={{ padding: '32px 0', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
        No source data yet.
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 280 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            outerRadius={100}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {data.map((_, idx) => (
              <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>

          <Tooltip
            contentStyle={{ borderRadius: 10, borderColor: '#ECEFF1' }}
            formatter={(v) => v.toLocaleString()}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: '#607D8B' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}