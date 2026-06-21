import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const ORANGE = "#FF7043";

function TooltipCard({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const row = payload.find((p) => p.dataKey === "views");
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
      <div style={{ color: "#475569" }}>Profile views: {Number(row?.value || 0).toLocaleString()}</div>
    </div>
  );
}

export default function ViewsChart({ labels = [], data = [] }) {
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
      views: Number(safeData[index] || 0),
    }));
  }, [labels, data]);

  return (
    <div className="ft-chart-wrap" style={{ width: "100%", height: isMobile ? 220 : "clamp(220px, 30vw, 320px)" }}>
      <style>{`.ft-chart-wrap svg rect:first-of-type { fill: transparent !important; }`}</style>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={isMobile ? { top: 8, right: 6, bottom: 8, left: -18 } : { top: 8, right: 12, bottom: 8, left: 0 }}>
          <defs>
            <linearGradient id="profileViewsOrange" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ORANGE} stopOpacity={0.30} />
              <stop offset="100%" stopColor={ORANGE} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#ECEFF1" />
          <XAxis dataKey="day" tick={{ fill: "#607D8B", fontSize: isMobile ? 10 : 12 }} />
          <YAxis allowDecimals={false} width={isMobile ? 24 : 36} tick={{ fill: "#607D8B", fontSize: isMobile ? 10 : 12 }} />
          <Tooltip content={TooltipCard} />
          <Area type="monotone" dataKey="views" stroke="none" fill="url(#profileViewsOrange)" isAnimationActive={false} />
          <Line type="monotone" dataKey="views" stroke={ORANGE} strokeWidth={2.5} dot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}