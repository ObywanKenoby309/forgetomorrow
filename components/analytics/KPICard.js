// components/analytics/KPICard.js
import React from 'react';

export default function KPICard({
  label,
  value,
  labelColor = '#FF7043', // Forge orange
  valueColor = '#263238',  // dark neutral
}) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="text-sm font-medium" style={{ color: labelColor }}>
        {label}
      </div>
      <div className="text-2xl font-semibold mt-1" style={{ color: valueColor }}>
        {value}
      </div>
    </div>
  );
}
