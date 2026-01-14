// components/employee/EmployeeHeader.js
import React, { useMemo } from 'react';

const CARD = {
  border: '1px solid rgba(17, 24, 39, 0.10)',
  background: '#FFFFFF',
  boxShadow: '0 10px 22px rgba(0,0,0,0.06)',
  borderRadius: 14,
};

const ORANGE = '#FF7043';

const ALLOWED_HATS = new Set(['seeker', 'coach', 'recruiter-smb', 'recruiter-ent']);
function normalizeHat(input) {
  const raw = String(input || '').toLowerCase().trim();
  if (ALLOWED_HATS.has(raw)) return raw;
  if (raw === 'recruiter') return 'recruiter-smb';
  if (raw === 'enterprise' || raw === 'ent') return 'recruiter-ent';
  if (raw === 'smb') return 'recruiter-smb';
  return 'seeker';
}

export default function EmployeeHeader({
  headerTitle = 'Employee Suite',
  headerSubtitle = 'ServiceNow-lite for ForgeTomorrow (UI preview)',
  employee = false,
  department = '',
  hat = 'seeker',
  onHatChange = () => {},
  isMobile = false,
  onOpenTools = () => {},
}) {
  const topBar = useMemo(() => {
    return (
      <section
        style={{
          ...CARD,
          padding: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          minWidth: 0,
        }}
        aria-label="Employee suite header"
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#111827', lineHeight: 1.2 }}>
            {headerTitle}
          </div>

          {headerSubtitle ? (
            <div style={{ marginTop: 4, fontSize: 13, fontWeight: 700, color: 'rgba(17,24,39,0.65)' }}>
              {headerSubtitle}
            </div>
          ) : null}

          <div style={{ marginTop: 6, fontSize: 12, fontWeight: 800, color: 'rgba(17,24,39,0.55)' }}>
            {employee ? 'Employee Access' : 'Limited Access'} {department ? `• ${department}` : ''}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {/* Hat switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: 'rgba(17,24,39,0.65)' }}>View as</div>
            <select
              value={normalizeHat(hat)}
              onChange={(e) => onHatChange(normalizeHat(e.target.value))}
              aria-label="Select Forge Site view (hat)"
              style={{
                border: '1px solid rgba(17,24,39,0.18)',
                borderRadius: 12,
                padding: '8px 10px',
                fontSize: 13,
                fontWeight: 800,
                background: '#fff',
                cursor: 'pointer',
              }}
            >
              <option value="seeker">Seeker</option>
              <option value="coach">Coach</option>
              <option value="recruiter-smb">Recruiter SMB</option>
              <option value="recruiter-ent">Recruiter ENT</option>
            </select>
          </div>

          {/* Jump to Forge Site */}
          <a
            href={`/seeker-dashboard?chrome=${encodeURIComponent(normalizeHat(hat))}`}
            style={{
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 12,
              padding: '9px 12px',
              background: ORANGE,
              color: '#fff',
              fontWeight: 900,
              fontSize: 13,
              border: '1px solid rgba(0,0,0,0.08)',
              boxShadow: '0 10px 18px rgba(0,0,0,0.10)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
            aria-label="Open Forge Site with selected hat"
          >
            Open Forge Site
          </a>

          {/* Mobile tools */}
          {isMobile ? (
            <button
              type="button"
              onClick={onOpenTools}
              style={{
                borderRadius: 12,
                padding: '9px 12px',
                background: '#111827',
                color: '#fff',
                fontWeight: 900,
                fontSize: 13,
                border: '1px solid rgba(0,0,0,0.08)',
                cursor: 'pointer',
              }}
              aria-label="Open employee navigation"
            >
              Tools
            </button>
          ) : null}
        </div>
      </section>
    );
  }, [headerTitle, headerSubtitle, employee, department, hat, isMobile, onHatChange, onOpenTools]);

  return topBar;
}
