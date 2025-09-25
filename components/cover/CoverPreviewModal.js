// components/cover/CoverPreviewModal.js
import React from 'react';

export default function CoverPreviewModal({ open, onClose, CoverComp, mappedPreviewData, FallbackPreview, fields }) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 1000,
        display: 'grid',
        placeItems: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 12,
          border: '1px solid #E0E0E0',
          width: 'min(940px, 96vw)',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 12px 30px rgba(0,0,0,0.2)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            position: 'sticky',
            top: 0,
            background: 'white',
            borderBottom: '1px solid #F0F0F0',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 2,
          }}
        >
          <div style={{ fontWeight: 900, color: '#263238' }}>Live Preview</div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'white',
              border: '1px solid #E0E0E0',
              borderRadius: 10,
              padding: '6px 10px',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>

        <div style={{ padding: 16 }}>
          {CoverComp ? (
            <CoverComp data={mappedPreviewData} />
          ) : (
            <FallbackPreview fields={fields} />
          )}
        </div>
      </div>
    </div>
  );
}
