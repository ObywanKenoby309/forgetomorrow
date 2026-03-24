// components/analytics/charts/SourceBreakdown.js
//
// Renders the chart content only — no outer card wrapper.
// Always embedded inside a GLASS section card on the analytics pages.

import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

const SOURCE_COLORS = {
  ForgeTomorrow: "#FB923C",
  Referrals: "#2563EB",
  "Direct Outreach": "#0F766E",
  "Company Careers": "#B45309",
  "Staffing Partner": "#16A34A",
  "Talent Community": "#475569",
  "University Outreach": "#7C3AED",
  Other: "#0891B2",
};

const RADIAN = Math.PI / 180;

function renderCustomLabel(props) {
  const {
    cx,
    cy,
    midAngle,
    outerRadius,
    percent,
    name,
  } = props;

  if ((percent || 0) < 0.005) return null;

  const radius = outerRadius + (percent < 0.03 ? 26 : 18);
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  const lineStartRadius = outerRadius + 4;
  const lineMidRadius = outerRadius + 12;

  const x1 = cx + lineStartRadius * Math.cos(-midAngle * RADIAN);
  const y1 = cy + lineStartRadius * Math.sin(-midAngle * RADIAN);

  const x2 = cx + lineMidRadius * Math.cos(-midAngle * RADIAN);
  const y2 = cy + lineMidRadius * Math.sin(-midAngle * RADIAN);

  const isRightSide = x >= cx;
  const x3 = isRightSide ? x + (percent < 0.03 ? 16 : 10) : x - (percent < 0.03 ? 16 : 10);
  const anchor = isRightSide ? "start" : "end";

  const labelColor = SOURCE_COLORS[name] || "#334155";

  return (
    <g>
      <path
        d={`M ${x1} ${y1} L ${x2} ${y2} L ${x3} ${y}`}
        stroke="rgba(51,65,85,0.55)"
        strokeWidth="1.5"
        fill="none"
      />
      <text
        x={isRightSide ? x3 + 4 : x3 - 4}
        y={y}
        textAnchor={anchor}
        dominantBaseline="central"
        style={{
          fontSize: 11,
          fontWeight: 700,
          fill: labelColor,
        }}
      >
        {`${name} ${(percent * 100).toFixed(0)}%`}
      </text>
    </g>
  );
}

export default function SourceBreakdown({ data = [] }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (!data.length) {
    return (
      <div style={{ padding: "32px 0", textAlign: "center", color: "#94A3B8", fontSize: 13 }}>
        No source data yet.
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: isMobile ? 220 : "clamp(160px, 30vw, 280px)" }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart
          margin={
            isMobile
              ? { top: 0, right: 0, bottom: 0, left: 0 }
              : { top: 0, right: 0, bottom: 0, left: 0 }
          }
        >
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={isMobile ? 62 : 100}
            innerRadius={isMobile ? 26 : 0}
            label={isMobile ? false : renderCustomLabel}
            labelLine={false}
          >
            {data.map((entry, idx) => (
              <Cell
                key={`cell-${idx}`}
                fill={SOURCE_COLORS[entry.name] || "#94A3B8"}
              />
            ))}
          </Pie>

          <Tooltip
            contentStyle={{ borderRadius: 10, borderColor: "#ECEFF1" }}
            formatter={(v) => v.toLocaleString()}
          />
          {!isMobile && <Legend wrapperStyle={{ fontSize: 12, color: "#607D8B" }} />}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}