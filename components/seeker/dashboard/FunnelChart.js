import React from 'react';
import { STAGE_ORDER, colorFor } from '@/components/seeker/dashboard/seekerColors';

export default function FunnelChart({ data }) {
  const map = {
    applied: 'Applied',
    viewed: 'Viewed',
    interviewing: 'Interviewing',
    offers: 'Offers',
    hired: 'Hired',
  };

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {STAGE_ORDER.map((k) => {
        const c = colorFor(k);
        const val = data?.[k] ?? 0;
        return (
          <div key={k}
            style={{
              background: c.solid, color: 'white', padding: '6px 10px',
              borderRadius: 6, fontWeight: 600, display: 'flex', justifyContent: 'space-between',
            }}>
            <span>{map[k]}</span><span>{val}</span>
          </div>
        );
      })}
    </div>
  );
}
