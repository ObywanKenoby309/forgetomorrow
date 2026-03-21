// components/analytics/charts/ApplicationFunnel.js
//
// Renders the chart content only — no outer card wrapper.
// This component is always embedded inside a GLASS section card
// on the analytics pages; wrapping it again creates double-boxing.

import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";

const ORANGE_DARK = "#F57C00";
const ORANGE_LIGHT = "#FFB74D";

export default function ApplicationFunnel({ data = [] }) {
  const rows = Array.isArray(data) ? data : [];
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (!rows.length) {
    return (
      <div style={{ padding: "32px 0", textAlign: "center", color: "#94A3B8", fontSize: 13 }}>
        No funnel data yet.
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: isMobile ? 220 : "clamp(160px, 30vw, 320px)" }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rows}
          margin={isMobile ? { top: 8, right: 4, bottom: 20, left: -18 } : { top: 8, right: 12, bottom: 36, left: 12 }}
          barSize={isMobile ? 24 : 44}
          barCategoryGap={isMobile ? 12 : 24}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#ECEFF1" />
          <XAxis
            dataKey="stage"
            interval={0}
            height={isMobile ? 32 : 46}
            tickMargin={isMobile ? 8 : 16}
            tick={{ fill: "#607D8B", fontSize: isMobile ? 10 : 12 }}
          />
          <YAxis
            allowDecimals={false}
            width={isMobile ? 24 : 36}
            tick={{ fill: "#607D8B", fontSize: isMobile ? 10 : 12 }}
          />
          <Tooltip
            cursor={{ fill: "rgba(0,0,0,0.03)" }}
            contentStyle={{ borderRadius: 10, borderColor: "#ECEFF1" }}
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