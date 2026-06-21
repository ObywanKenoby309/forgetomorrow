import React, { useEffect, useMemo, useState } from "react";
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

const ORANGE = "#FF7043";
const TEAL = "#0F766E";

function TooltipCard({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const row = payload.find((p) => p.dataKey === "connections");
  return (
    <div style={{
      borderRadius: 10,
      border: "1px solid #ECEFF1",
      background: "#fff",
      padding: "7px 10px",
      fontSize: 12,
      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    }}>
      <div style={{ fontWeight: 800, marginBottom: 4 }}>{label}</div>
      <div style={{ color: "#475569" }}>Connections: {Number(row?.value || 0).toLocaleString()}</div>
    </div>
  );
}

export default function ConnectionsMiniChart({ labels = [], data = [] }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const rows = useMemo(() => {
    const safeLabels = Array.isArray(labels) && labels.length ? labels : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const safeData = Array.isArray(data) ? data : [];
    return safeLabels.map((day, index) => ({
      day,
      connections: Number(safeData[index] || 0),
    }));
  }, [labels, data]);

  if (!rows.length) {
    return (
      <div style={{ padding: "32px 0", textAlign: "center", color: "#94A3B8", fontSize: 13 }}>
        No connection data yet.
      </div>
    );
  }

  return (
    <div className="ft-chart-wrap" style={{ width: "100%", height: isMobile ? 220 : "clamp(220px, 30vw, 320px)" }}>
      <style>{`.ft-chart-wrap > div > div > svg { background: transparent !important; }`}</style>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rows}
          margin={isMobile ? { top: 8, right: 4, bottom: 20, left: -18 } : { top: 8, right: 12, bottom: 28, left: 0 }}
          barSize={isMobile ? 24 : 38}
          barCategoryGap={isMobile ? 12 : 22}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#ECEFF1" />
          <XAxis
            dataKey="day"
            interval={0}
            tickMargin={isMobile ? 8 : 12}
            tick={{ fill: "#607D8B", fontSize: isMobile ? 10 : 12 }}
          />
          <YAxis
            allowDecimals={false}
            width={isMobile ? 24 : 36}
            tick={{ fill: "#607D8B", fontSize: isMobile ? 10 : 12 }}
          />
          <Tooltip content={TooltipCard} />
          <Bar dataKey="connections" radius={[8, 8, 0, 0]} isAnimationActive={false}>
            {rows.map((_, index) => (
              <Cell key={index} fill={index % 2 === 0 ? ORANGE : TEAL} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}