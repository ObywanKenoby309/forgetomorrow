// components/employee/InternalHeaderDark.js
import React, { useMemo } from 'react';

export default function InternalHeaderDark({
  suiteLabel = 'Employee Suite',
  accessLabel = 'Limited', // "Employee" | "Limited"
  accessTitle = '',
  currentPage = 'Dashboard',

  // View-as (internal roles)
  viewAsValue = 'Agent',
  viewAsOptions = ['Agent', 'Manager', 'Admin'],
  onViewAsChange = null, // optional

  // Public site bridge
  openSiteHref = '/seeker-dashboard',
  openSiteLabel = 'Open Forge Site',

  // Branding
  brandName = 'ForgeTomorrow',
  logoSrc = '/brand/forge-watermark-fullcolor.png',

  // Avatar
  avatarUrl = '',
  userInitials = 'U',
}) {
  const accessIsEmployee = String(accessLabel || '').toLowerCase() === 'employee';

  const header = useMemo(() => {
    return (
      <>
        {/* TOP NAV */}
        <nav className="topnav" aria-label="Employee Suite top navigation">
          <div className="logo" aria-label="ForgeTomorrow brand">
            <div className="logo-mark" title={brandName}>
              {/* Prefer image logo; fallback to "F" */}
              <img
                src={logoSrc}
                alt={brandName}
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 7 }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent && !parent.dataset.fallbackApplied) {
                    parent.dataset.fallbackApplied = '1';
                    parent.textContent = 'F';
                  }
                }}
              />
            </div>
            <span className="logo-name">{brandName}</span>
          </div>

          <span className="nav-badge badge-suite">{suiteLabel}</span>

          <span
            className={`nav-badge ${accessIsEmployee ? 'badge-employee' : 'badge-limited'}`}
            title={accessTitle || ''}
          >
            {String(accessLabel || '').toUpperCase()}
          </span>

          <div className="nav-spacer" />

          <div className="nav-right">
            <div className="view-as">
              <span>View as</span>
              <select
                className="view-select"
                value={viewAsValue}
                onChange={(e) => {
                  if (typeof onViewAsChange === 'function') onViewAsChange(e.target.value);
                }}
                aria-label="Select internal view"
              >
                {viewAsOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <a href={openSiteHref} className="btn-site" aria-label="Open Forge Site">
              {openSiteLabel}
            </a>

            {/* Avatar */}
            <div className="avatar" aria-label="Employee profile">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent && !parent.dataset.fallbackApplied) {
                      parent.dataset.fallbackApplied = '1';
                      parent.textContent = userInitials;
                    }
                  }}
                />
              ) : (
                userInitials
              )}
            </div>
          </div>
        </nav>

        {/* BREADCRUMB */}
        <div className="breadcrumb" aria-label="Breadcrumb">
          <span className="crumb">{suiteLabel}</span>
          <span className="crumb-sep">›</span>
          <span className="crumb-current">{currentPage}</span>
        </div>
      </>
    );
  }, [
    suiteLabel,
    accessLabel,
    accessTitle,
    currentPage,
    viewAsValue,
    viewAsOptions,
    onViewAsChange,
    openSiteHref,
    openSiteLabel,
    brandName,
    logoSrc,
    avatarUrl,
    userInitials,
    accessIsEmployee,
  ]);

  return header;
}