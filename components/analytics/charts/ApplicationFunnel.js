// components/analytics/charts/ApplicationFunnel.js
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

  return (
    <div className="bg-white rounded-2xl shadow p-5 border border-gray-100">
      <div className="text-lg font-semibold mb-3" style={{ color: '#FF7043' }}>
        Application Funnel
      </div>

      {/* Give the chart a bit more breathing room horizontally */}
      <div style={{ width: '100%', height: 360 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows}
            margin={{ top: 8, right: 12, bottom: 36, left: 12 }}
            barSize={44}            // wider bars
            barCategoryGap={24}     // more space between bars
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#ECEFF1" />
            <XAxis
              dataKey="stage"
              interval={0}          // show every label
              height={46}           // extra space so labels never clip
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
    </div>
  );
}
