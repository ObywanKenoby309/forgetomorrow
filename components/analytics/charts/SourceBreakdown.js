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
  "ForgeTomorrow": "#FB923C",        // strong orange (brand aligned)
  "Referrals": "#2563EB",            // strong blue
  "Direct Outreach": "#0F766E",      // deeper teal
  "Company Careers": "#B45309",      // FIXED (dark amber, readable)
  "Staffing Partner": "#16A34A",     // green (darker)
  "Talent Community": "#475569",     // slate (stronger than gray)
  "University Outreach": "#7C3AED",  // purple (kept)
  "Other": "#0891B2",                // stronger cyan
};

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
        <PieChart margin={isMobile ? { top: 0, right: 0, bottom: 0, left: 0 } : { top: 0, right: 0, bottom: 0, left: 0 }}>
          <Pie
  data={data}
  dataKey="value"
  nameKey="name"
  cx="50%"
  cy="50%"
  outerRadius={isMobile ? 62 : 100}
  innerRadius={isMobile ? 26 : 0}
  label={isMobile ? false : ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
  labelLine={false}
>
  {data.map((entry, idx) => (
    <Cell
      key={`cell-${idx}`}
      fill={
        {
          ForgeTomorrow: "#FB923C",
          Referrals: "#2563EB",
          "Direct Outreach": "#0F766E",
          "Company Careers": "#B45309",
          "Staffing Partner": "#16A34A",
          "Talent Community": "#475569",
          "University Outreach": "#7C3AED",
          Other: "#0891B2",
        }[entry.name] || COLORS[idx % COLORS.length]
      }
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