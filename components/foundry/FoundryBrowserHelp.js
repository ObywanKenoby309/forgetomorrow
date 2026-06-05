// components/foundry/FoundryBrowserHelp.js
// Reusable Foundry browser help panel.
// Used anywhere Foundry needs browser/device troubleshooting guidance.

import { useState } from 'react';

const ORANGE = '#FF7043';
const SLATE = '#334155';
const DARK = '#112033';

const S = {
  infoBox: {
    borderRadius: 12,
    padding: '12px 14px',
    background: 'rgba(255,112,67,0.08)',
    border: '1px solid rgba(255,112,67,0.18)',
    color: SLATE,
    fontSize: 12,
    lineHeight: 1.6,
    fontWeight: 600,
    marginBottom: 14,
  },
  browserHelpGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
    gap: 8,
    marginBottom: 14,
  },
  browserHelpBtn: {
    background: 'rgba(255,255,255,0.74)',
    border: '1px solid rgba(255,112,67,0.28)',
    color: ORANGE,
    borderRadius: 10,
    padding: '10px 12px',
    fontSize: 12,
    fontWeight: 800,
    cursor: 'pointer',
    fontFamily: 'inherit',
    letterSpacing: '0.01em',
  },
  helpBackdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15,23,42,0.42)',
    zIndex: 9998,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  helpPanel: {
    width: 'min(620px, 94vw)',
    maxHeight: '82vh',
    overflowY: 'auto',
    background: 'rgba(255,255,255,0.96)',
    border: '1px solid rgba(255,255,255,0.32)',
    borderRadius: 18,
    boxShadow: '0 24px 70px rgba(15,23,42,0.28)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
  },
  helpHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    padding: '18px 20px 12px',
    borderBottom: '1px solid rgba(15,23,42,0.08)',
  },
  helpTitle: { fontSize: 18, fontWeight: 900, color: DARK, margin: 0, lineHeight: 1.2 },
  helpSub: { fontSize: 12, color: '#475569', margin: '5px 0 0', lineHeight: 1.55, fontWeight: 600 },
  helpClose: {
    background: 'rgba(15,23,42,0.06)',
    border: '1px solid rgba(15,23,42,0.08)',
    color: SLATE,
    borderRadius: 999,
    width: 34,
    height: 34,
    fontSize: 20,
    lineHeight: '30px',
    cursor: 'pointer',
    flexShrink: 0,
  },
  helpBody: { padding: '14px 20px 20px', display: 'grid', gap: 12 },
  helpSection: {
    background: 'rgba(248,250,252,0.86)',
    border: '1px solid rgba(15,23,42,0.08)',
    borderRadius: 12,
    padding: '12px 14px',
  },
  helpSectionTitle: { fontSize: 12, fontWeight: 900, color: DARK, margin: '0 0 7px' },
  helpList: { margin: 0, paddingLeft: 18, color: '#475569', fontSize: 12, lineHeight: 1.65, fontWeight: 600 },
};

const BROWSER_HELP = {
  chrome: {
    label: 'Chrome',
    subtitle: 'Recommended for most Foundry users on Windows, Mac, and Android.',
    sections: [
      {
        title: 'Camera Permissions',
        items: [
          'Click the lock icon beside the website address.',
          'Open Site settings or Permissions.',
          'Set Camera to Allow.',
          'Refresh ForgeTomorrow after changing the setting.',
        ],
      },
      {
        title: 'Microphone Permissions',
        items: [
          'Click the lock icon beside the website address.',
          'Set Microphone to Allow.',
          'Confirm Chrome also has microphone permission in your operating system settings.',
          'Refresh the Foundry page.',
        ],
      },
      {
        title: 'Screen Sharing',
        items: [
          'Click Test screen share or Share Screen inside Foundry.',
          'Choose a screen, window, or browser tab.',
          'For audio sharing, Chrome is most reliable when sharing a browser tab with tab audio enabled.',
        ],
      },
      {
        title: 'Downloads',
        items: [
          'Use Chrome directly instead of opening Foundry inside Gmail or another in-app browser.',
          'If downloads are blocked, open Chrome settings and allow downloads for ForgeTomorrow.',
        ],
      },
      {
        title: 'Known Limitations',
        items: [
          'System audio support can vary by operating system.',
          'Virtual backgrounds depend on browser and device support.',
          'Android screen sharing and background effects may be limited by device/browser support.',
        ],
      },
    ],
  },
  edge: {
    label: 'Edge',
    subtitle: 'Recommended when system audio sharing is important on Windows.',
    sections: [
      {
        title: 'Camera Permissions',
        items: [
          'Click the lock icon beside the website address.',
          'Open Permissions for this site.',
          'Set Camera to Allow.',
          'Refresh ForgeTomorrow after changing the setting.',
        ],
      },
      {
        title: 'Microphone Permissions',
        items: [
          'Click the lock icon beside the website address.',
          'Set Microphone to Allow.',
          'Confirm Edge also has microphone permission in Windows privacy settings.',
          'Refresh the Foundry page.',
        ],
      },
      {
        title: 'Screen Sharing',
        items: [
          'Click Test screen share or Share Screen inside Foundry.',
          'Choose a screen, window, or tab.',
          'Enable system audio sharing when Edge offers that option.',
        ],
      },
      {
        title: 'Downloads',
        items: [
          'Use Edge directly instead of an in-app browser.',
          'If downloads are blocked, allow downloads for ForgeTomorrow in Edge site permissions.',
        ],
      },
      {
        title: 'Known Limitations',
        items: [
          'Some employer-managed devices may block camera, microphone, or screen recording by policy.',
          'Virtual backgrounds depend on device performance and browser support.',
        ],
      },
    ],
  },
  safari: {
    label: 'Safari (Mac)',
    subtitle: 'Supported for Mac users, with macOS privacy permissions required.',
    sections: [
      {
        title: 'Camera Permissions',
        items: [
          'Open Safari settings.',
          'Go to Websites, then Camera.',
          'Set ForgeTomorrow to Allow.',
          'Refresh the Foundry page.',
        ],
      },
      {
        title: 'Microphone Permissions',
        items: [
          'Open Safari settings.',
          'Go to Websites, then Microphone.',
          'Set ForgeTomorrow to Allow.',
          'Refresh the Foundry page.',
        ],
      },
      {
        title: 'Screen Sharing',
        items: [
          'Click Test screen share or Share Screen inside Foundry.',
          'If macOS asks for permission, open System Settings.',
          'Go to Privacy & Security, then Screen Recording, and allow Safari.',
          'Restart Safari if macOS requires it.',
        ],
      },
      {
        title: 'Downloads',
        items: [
          'Use Safari directly instead of opening Foundry inside Mail or another app wrapper.',
          'Allow downloads from ForgeTomorrow if Safari asks.',
        ],
      },
      {
        title: 'Known Limitations',
        items: [
          'System audio sharing may be limited compared with Edge or Chrome.',
          'Virtual background support may vary by macOS and Safari version.',
        ],
      },
    ],
  },
  firefox: {
    label: 'Firefox',
    subtitle: 'Supported as a best-effort option for camera, microphone, and screen sharing.',
    sections: [
      {
        title: 'Camera Permissions',
        items: [
          'Click the permissions icon beside the website address.',
          'Allow Camera access for ForgeTomorrow.',
          'Refresh the Foundry page if prompted.',
        ],
      },
      {
        title: 'Microphone Permissions',
        items: [
          'Click the permissions icon beside the website address.',
          'Allow Microphone access for ForgeTomorrow.',
          'Confirm Firefox has microphone access in your operating system settings.',
        ],
      },
      {
        title: 'Screen Sharing',
        items: [
          'Click Test screen share or Share Screen inside Foundry.',
          'Choose a screen or window when Firefox prompts you.',
          'Audio sharing support may vary by operating system.',
        ],
      },
      {
        title: 'Downloads',
        items: [
          'Use Firefox directly instead of an in-app browser.',
          'Allow downloads for ForgeTomorrow if Firefox blocks the file.',
        ],
      },
      {
        title: 'Known Limitations',
        items: [
          'Some screen audio and virtual background features may be less consistent than Chrome or Edge.',
          'Employer-managed Firefox installs may block device permissions.',
        ],
      },
    ],
  },
};

function BrowserHelpPanel({ browserKey, isMobile, onClose }) {
  const browser = BROWSER_HELP[browserKey];
  if (!browser) return null;

  return (
    <div style={S.helpBackdrop} onClick={!isMobile ? onClose : undefined}>
      <div style={S.helpPanel} onClick={(e) => e.stopPropagation()}>
        <div style={S.helpHeader}>
          <div>
            <h3 style={S.helpTitle}>{browser.label}</h3>
            <p style={S.helpSub}>{browser.subtitle}</p>
          </div>
          <button type="button" style={S.helpClose} onClick={onClose} aria-label="Close browser help">
            ×
          </button>
        </div>

        <div style={S.helpBody}>
          {browser.sections.map((section) => (
            <div key={section.title} style={S.helpSection}>
              <h4 style={S.helpSectionTitle}>{section.title}</h4>
              <ul style={S.helpList}>
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function FoundryBrowserHelp({ isMobile = false }) {
  const [browserHelpOpen, setBrowserHelpOpen] = useState(null);

  return (
    <>
      <div style={S.infoBox}>
        For the best Foundry experience, ForgeTomorrow currently recommends Chrome, Edge, Safari (Mac), or Firefox. Browser support for camera access, microphone access, screen sharing, system audio, downloads, and background effects may vary by browser, device, and operating system.
      </div>

      <div style={S.browserHelpGrid}>
        <button type="button" style={S.browserHelpBtn} onClick={() => setBrowserHelpOpen('chrome')}>Chrome</button>
        <button type="button" style={S.browserHelpBtn} onClick={() => setBrowserHelpOpen('edge')}>Edge</button>
        <button type="button" style={S.browserHelpBtn} onClick={() => setBrowserHelpOpen('safari')}>Safari</button>
        <button type="button" style={S.browserHelpBtn} onClick={() => setBrowserHelpOpen('firefox')}>Firefox</button>
      </div>

      {browserHelpOpen && (
        <BrowserHelpPanel
          browserKey={browserHelpOpen}
          isMobile={isMobile}
          onClose={() => setBrowserHelpOpen(null)}
        />
      )}
    </>
  );
}
