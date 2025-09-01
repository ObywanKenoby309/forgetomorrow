import React from 'react';
import { kpiColors } from '@/components/seeker/dashboard/seekerColors';

export default function KpiRow({ applied, viewed, interviewing, offers, rejected, lastApplicationSent }) {
  const Tile = ({ title, value, stage }) => {
    const { bg, text } = kpiColors(stage);
    return (
      <div style={{
        background: bg, color: text, borderRadius: 10, padding: '10px 12px',
        border: '1px solid rgba(0,0,0,0.06)', display: 'grid', gap: 4, minWidth: 0,
      }}>
        <div style={{ fontSize: 12, opacity: 0.9 }}>{title}</div>
        <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1 }}>{value}</div>
      </div>
    );
  };

  return (
    <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(6, minmax(0, 1fr))' }}>
      <Tile title="Applications Sent"   value={applied}            stage="applied" />
      <Tile title="Viewed by Employers" value={viewed}             stage="viewed" />
      <Tile title="Interviews Scheduled"value={interviewing}       stage="interviewing" />
      <Tile title="Offers Received"     value={offers}             stage="offers" />
      <Tile title="Rejected"            value={rejected}           stage="rejected" />
      <Tile title="Last Application Sent" value={lastApplicationSent} stage="info" />
    </div>
  );
}
