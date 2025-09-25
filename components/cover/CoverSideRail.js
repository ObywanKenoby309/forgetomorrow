// components/cover/CoverSideRail.js
import React from 'react';
import AtsCheckBadge from '@/components/resume-form/AtsCheckBadge';

function Button({ children, onClick, variant = 'ghost', style }) {
  const base = {
    borderRadius: 12,
    padding: '12px 16px',
    fontWeight: 800,
    cursor: 'pointer',
    width: '100%',
    border: '1px solid #E0E0E0',
  };
  const variants = {
    ghost: { background: 'white', color: '#37474F' },
    green: { background: '#0F766E', color: 'white', border: '1px solid rgba(0,0,0,0.06)' },
    orange: { background: '#FF7043', color: 'white', border: '1px solid rgba(0,0,0,0.06)' },
    link: { background: 'transparent', color: '#FF7043', border: 'none', padding: 0, textAlign: 'left' },
  };
  return (
    <button type="button" onClick={onClick} style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
}

export default function CoverSideRail({
  // ATS
  atsData,
  onOpenAtsPreview,

  // Export / Download
  includeWithResume,
  setIncludeWithResume,
  onDownloadAtsPdf,     // e.g., cover-only PDF (or window.print() until PDF is wired)
  onDownloadDesignedPdf,
  onExportWord,
  onExportText,
  onSaveCover,
  onConfigureAdvanced,  // optional
  lastSavedLabel,       // string like "Last saved: Sep 23, 2025, 3:46 PM"
  onExportApply,        // go to /resume/create#export

  // Tailor + Live Preview
  onTailorLocal,
  onOpenLivePreview,
}) {
  return (
    <aside style={{ display: 'grid', gap: 16 }}>
      {/* ATS status + Preview */}
      <div style={{
        background: 'white',
        border: '1px solid #E0E0E0',
        borderRadius: 16,
        padding: 14,
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, alignItems: 'center' }}>
          <div style={{
            background: '#E8F5E9',
            border: '1px solid #DDEEDD',
            borderRadius: 16,
            padding: 10,
            textAlign: 'center',
            fontWeight: 800,
            color: '#2E7D32'
          }}>
            ATS<br/>Ready
          </div>
          <div style={{ textAlign: 'center', fontWeight: 900, color: '#263238' }}>ATS<br/>Preview</div>
        </div>

        <div style={{ border: '1px dashed #DFE7EF', borderRadius: 12, padding: 14, marginTop: 14, display: 'grid', gap: 10 }}>
          {/* Keep the same badge component for consistency */}
          <AtsCheckBadge
            formData={atsData.formData}
            summary={atsData.summary}
            experiences={atsData.experiences}
            educationList={atsData.educationList}
            skills={atsData.skills}
          />
          <Button onClick={onOpenAtsPreview}>Open Preview</Button>
        </div>

        {/* Export / Download */}
        <div style={{ marginTop: 14 }}>
          <div style={{ fontWeight: 900, color: '#455A64', marginBottom: 8 }}>Export / Download</div>
          <div style={{ display: 'grid', gap: 10 }}>
            <Button variant="green" onClick={onDownloadAtsPdf}>Download Cover PDF</Button>
            <Button variant="orange" onClick={onDownloadDesignedPdf}>Download Designed PDF</Button>
            <Button variant="orange" onClick={onExportWord}>Export Word</Button>
            <Button variant="orange" onClick={onExportText}>Export Text</Button>
            <Button variant="green" onClick={onSaveCover}>Save Cover</Button>

            {lastSavedLabel ? (
              <div style={{ fontSize: 12, color: '#607D8B' }}>{lastSavedLabel}</div>
            ) : null}

            <div style={{
              border: '1px solid #DFE7EF',
              borderRadius: 12,
              padding: 12,
              display: 'grid',
              gap: 10,
              background: '#FAFCFF'
            }}>
              <div style={{ fontWeight: 900, color: '#37474F' }}>Advanced Export (Template-based)</div>
              <Button onClick={onConfigureAdvanced}>Configure &amp; Download</Button>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                <input
                  type="checkbox"
                  checked={includeWithResume}
                  onChange={(e) => setIncludeWithResume(e.target.checked)}
                />
                Include this cover as the first page of my resume export
              </label>
              <Button variant="green" onClick={onExportApply}>Export / Apply</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Save Snapshot */}
      <div style={{
        background: 'white',
        border: '1px solid #E0E0E0',
        borderRadius: 16,
        padding: 16,
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        display: 'grid',
        gap: 10
      }}>
        <Button variant="orange" onClick={onSaveCover}>Save Snapshot</Button>
        <Button variant="link" onClick={() => onConfigureAdvanced?.('versions')}>View Saved Versions</Button>
      </div>

      {/* Tailor (Local) */}
      <div style={{
        background: 'white',
        border: '1px solid #E0E0E0',
        borderRadius: 16,
        padding: 16,
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        display: 'grid',
        gap: 10
      }}>
        <div style={{ fontWeight: 900, color: '#FF7043' }}>Tailor (Local)</div>
        <div style={{ fontSize: 13, color: '#607D8B' }}>
          Generate an opening &amp; bullets aligned to the JD—no API required.
        </div>
        <Button variant="orange" onClick={onTailorLocal}>Open</Button>
      </div>

      {/* Live Preview */}
      <div style={{
        background: 'white',
        border: '1px solid #E0E0E0',
        borderRadius: 16,
        padding: 16,
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        display: 'grid',
        gap: 10
      }}>
        <div style={{ fontWeight: 900, color: '#FF7043' }}>Live Preview</div>
        <div style={{ fontSize: 13, color: '#607D8B' }}>
          See your cover letter rendered as you edit content.
        </div>
        <Button variant="orange" onClick={onOpenLivePreview}>Open</Button>
      </div>
    </aside>
  );
}
