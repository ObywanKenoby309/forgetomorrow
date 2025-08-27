// components/resume-form/AtsCheckBadge.js
import React, { useMemo } from 'react';

/**
 * Lightweight ATS readiness badge.
 * Status:
 *  - PASS: contact ok, >=1 experience OR education, skills present
 *  - WARN: contact ok but missing either skills OR exp/edu
 *  - BLOCK: missing contact or everything empty
 */
export default function AtsCheckBadge({
  formData = {},
  summary = '',
  experiences = [],
  educationList = [],
  skills = [],
  style = {},
}) {
  const status = useMemo(() => {
    const name = (formData?.name || formData?.fullName || '').trim();
    const email = (formData?.email || '').trim();
    const phone = (formData?.phone || '').trim();

    const hasContact = !!(name && (email || phone));
    const hasCore = (experiences?.length || 0) > 0 || (educationList?.length || 0) > 0;
    const hasSkills = (skills?.length || 0) > 0;

    if (!hasContact) return 'BLOCK';
    if (hasCore && hasSkills) return 'PASS';
    if (hasCore || hasSkills) return 'WARN';
    return 'BLOCK';
  }, [formData, experiences, educationList, skills]);

  const label = status === 'PASS' ? 'ATS Ready' : status === 'WARN' ? 'Needs Attention' : 'Fix Required';
  const bg = status === 'PASS' ? '#E8F5E9' : status === 'WARN' ? '#FFF8E1' : '#FFEBEE';
  const fg = status === 'PASS' ? '#1B5E20' : status === 'WARN' ? '#8D6E00' : '#B71C1C';
  const dot = status === 'PASS' ? '#43A047' : status === 'WARN' ? '#F9A825' : '#E53935';

  return (
    <div
      title="Quick ATS readiness check"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        background: bg,
        color: fg,
        border: `1px solid ${status === 'PASS' ? '#C8E6C9' : status === 'WARN' ? '#FFECB3' : '#FFCDD2'}`,
        borderRadius: 999,
        padding: '6px 10px',
        fontSize: 12,
        fontWeight: 800,
        ...style,
      }}
    >
      <span
        aria-hidden
        style={{
          width: 8, height: 8, borderRadius: 999, background: dot,
          boxShadow: `0 0 0 2px ${bg}`,
        }}
      />
      {label}
    </div>
  );
}
