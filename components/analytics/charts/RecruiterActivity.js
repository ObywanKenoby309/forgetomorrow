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
            <Tooltip />

            {/* Shaded areas - no legend */}
            <Area
              type="monotone"
              dataKey="messages"
              stroke="none"
              fill="url(#areaOrange)"
              legendType="none"
            />
            <Area
              type="monotone"
              dataKey="responses"
              stroke="none"
              fill="url(#areaBlue)"
              legendType="none"
            />

            {/* Lines with legend names */}
            <Line
              type="monotone"
              dataKey="messages"
              name="Messages"
              stroke={ORANGE}
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="responses"
              name="Responses"
              stroke={BLUE}
              strokeWidth={2}
              dot={false}
            />

            <Legend />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
