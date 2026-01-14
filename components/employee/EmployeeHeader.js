// components/employee/EmployeeHeader.js
import React, { useMemo } from 'react';

const ORANGE = '#FF7043';
const ORANGE_SOFT_BG = 'rgba(255,112,67,0.10)';
const BORDER = '1px solid rgba(17, 24, 39, 0.10)';

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
  headerSubtitle = '',
  employee = false,
  department = '',

  // Routing state (kept for later)
  active = 'dashboard',

  // Hat + actions
  hat = 'seeker',
  onHatChange = () => {},
  isMobile = false,
  onOpenTools = () => {},
}) {
  const normalizedHat = normalizeHat(hat);

  const bar = useMemo(() => {
    return (
      <header
        aria-label="Employee Suite header"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          width: '100%',
          background: '#FFFFFF',
          borderBottom: BORDER,
        }}
      >
        <div
          style={{
            width: '100%',
            padding: '10px 14px',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr auto',
              alignItems: 'center',
              gap: 12,
              minWidth: 0,
            }}
          >
            {/* LEFT: Brand + Suite badge + Access tag */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <a
                href="/internal/dashboard"
                style={{
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  minWidth: 0,
                  cursor: 'pointer',
                }}
                aria-label="Go to Employee Suite dashboard"
              >
                {/* Full-color watermark icon (safe fallback if missing) */}
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 9,
                    border: '1px solid rgba(255,112,67,0.30)',
                    background: 'rgba(255,112,67,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    flex: '0 0 auto',
                  }}
                  title="ForgeTomorrow"
                >
                  <img
                    src="/brand/forge-watermark-fullcolor.png"
                    alt="ForgeTomorrow"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      // fallback to a simple mark without breaking layout
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent && !parent.dataset.fallbackApplied) {
                        parent.dataset.fallbackApplied = '1';
                        parent.style.background = 'rgba(255,112,67,0.12)';
                        parent.style.color = ORANGE;
                        parent.style.fontWeight = 950;
                        parent.style.fontSize = '14px';
                        parent.textContent = '⌁';
                      }
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 950,
                      color: '#111827',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    ForgeTomorrow
                  </div>

                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      height: 22,
                      padding: '0 10px',
                      borderRadius: 999,
                      border: '1px solid rgba(17,24,39,0.12)',
                      background: 'rgba(17,24,39,0.04)',
                      fontSize: 11,
                      fontWeight: 950,
                      letterSpacing: '0.10em',
                      textTransform: 'uppercase',
                      color: 'rgba(17,24,39,0.70)',
                      whiteSpace: 'nowrap',
                    }}
                    title="Employees only"
                  >
                    Employee Suite
                  </div>

                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      height: 22,
                      padding: '0 10px',
                      borderRadius: 999,
                      border: employee ? '1px solid rgba(16,185,129,0.22)' : '1px solid rgba(245,158,11,0.22)',
                      background: employee ? 'rgba(16,185,129,0.10)' : 'rgba(245,158,11,0.10)',
                      fontSize: 11,
                      fontWeight: 950,
                      color: employee ? 'rgba(16,185,129,0.95)' : 'rgba(245,158,11,0.95)',
                      whiteSpace: 'nowrap',
                    }}
                    title={department ? `Dept: ${department}` : ''}
                  >
                    {employee ? 'EMPLOYEE' : 'LIMITED'}
                    {department ? ` • ${department}` : ''}
                  </div>
                </div>
              </a>

              {/* Quiet subtitle row removed from the bar (kept available via headerSubtitle below if needed) */}
            </div>

            {/* MIDDLE: intentionally empty (no redundant nav; sidebar is the nav) */}
            <div style={{ minWidth: 0 }} />

            {/* RIGHT: Hat + Open Forge Site + Tools + Avatar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                justifyContent: 'flex-end',
                minWidth: 0,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {!isMobile ? (
                  <div style={{ fontSize: 12, fontWeight: 900, color: 'rgba(17,24,39,0.65)' }}>View as</div>
                ) : null}
                <select
                  value={normalizedHat}
                  onChange={(e) => onHatChange(normalizeHat(e.target.value))}
                  aria-label="Select Forge Site view (hat)"
                  style={{
                    border: '1px solid rgba(17,24,39,0.18)',
                    borderRadius: 12,
                    padding: '8px 10px',
                    fontSize: 13,
                    fontWeight: 900,
                    background: '#fff',
                    cursor: 'pointer',
                    height: 40,
                  }}
                >
                  <option value="seeker">Seeker</option>
                  <option value="coach">Coach</option>
                  <option value="recruiter-smb">Recruiter SMB</option>
                  <option value="recruiter-ent">Recruiter ENT</option>
                </select>
              </div>

              <a
                href={`/seeker-dashboard?chrome=${encodeURIComponent(normalizedHat)}`}
                style={{
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 12,
                  padding: '0 12px',
                  height: 40,
                  background: ORANGE,
                  color: '#fff',
                  fontWeight: 950,
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

              {isMobile ? (
                <button
                  type="button"
                  onClick={onOpenTools}
                  style={{
                    borderRadius: 12,
                    padding: '0 12px',
                    height: 40,
                    background: '#111827',
                    color: '#fff',
                    fontWeight: 950,
                    fontSize: 13,
                    border: '1px solid rgba(0,0,0,0.10)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                  aria-label="Open employee navigation"
                >
                  Tools
                </button>
              ) : null}

              {/* Avatar placeholder */}
              <div
                aria-label="Employee profile"
                title="Profile (placeholder)"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 999,
                  border: '1px solid rgba(17,24,39,0.14)',
                  background: 'rgba(17,24,39,0.06)',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.06)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 950,
                  color: 'rgba(17,24,39,0.55)',
                  userSelect: 'none',
                }}
              >
                {/* empty on purpose */}
              </div>
            </div>
          </div>

          {/* Optional thin subtitle row (kept quiet) */}
          {headerSubtitle ? (
            <div
              style={{
                marginTop: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                color: 'rgba(17,24,39,0.60)',
                fontSize: 12,
                fontWeight: 800,
                lineHeight: 1.25,
              }}
            >
              <span style={{ color: 'rgba(17,24,39,0.45)' }}>{headerTitle}</span>
              <span style={{ color: 'rgba(17,24,39,0.30)' }}>•</span>
              <span>{headerSubtitle}</span>
            </div>
          ) : null}
        </div>
      </header>
    );
  }, [headerTitle, headerSubtitle, employee, department, active, normalizedHat, onHatChange, isMobile, onOpenTools]);

  return bar;
}
