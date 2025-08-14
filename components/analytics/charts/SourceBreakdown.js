// components/analytics/charts/SourceBreakdown.js
import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';

// Palette: Orange + Blue + Teal (plus soft supporting tints)
const COLORS = [
  '#FF9800', // Orange (primary)
  '#2196F3', // Blue
  '#4DB6AC', // Teal
  '#FFB74D', // Light orange
  '#90A4AE', // Blue-gray (neutral/Other)
  '#7E57C2', // Soft purple accent
  '#66BB6A', // Green accent
  '#29B6F6', // Light blue accent
];

export default function SourceBreakdown({ data = [] }) {
  return (
    <div className="bg-white rounded-2xl shadow p-5 border border-gray-100">
      <div className="text-lg font-semibold mb-3" style={{ color: '#FF7043' }}>
        Source Breakdown
      </div>

      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              outerRadius={110}
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
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
