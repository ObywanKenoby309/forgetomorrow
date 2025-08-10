// components/applications/ApplicationDetailsModal.js
import React, { useEffect } from 'react';

export default function ApplicationDetailsModal({
  job,
  stage,
  onClose,
  onEdit,    // optional: (job, stage) => void
  onDelete,  // optional: (id, stage) => void
}) {
  useEffect(() => {
    const onEsc = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [onClose]);

  if (!job) return null;

  const Row = ({ label, value }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 10 }}>
      <div style={{ color: '#607D8B', fontSize: 12 }}>{label}</div>
      <div style={{ fontSize: 14 }}>{value || <span style={{ color: '#B0BEC5' }}>—</span>}</div>
    </div>
  );

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 560,
          background: 'white',
          borderRadius: 12,
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Sticky header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid #eee',
            position: 'sticky',
            top: 0,
            background: 'white',
          }}
        >
          <h3 style={{ margin: 0, color: '#FF7043' }}>Application Details</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1.5rem',
              color: '#999',
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 20, display: 'grid', gap: 12 }}>
          <Row label="Stage" value={stage} />
          <Row label="Title" value={job.title} />
          <Row label="Company" value={job.company} />
          <Row label="Location" value={job.location} />
          <Row label="Date Added" value={job.dateAdded} />
          <Row
            label="Link"
            value={
              job.link ? (
                <a href={job.link} target="_blank" rel="noreferrer" style={{ color: '#1E88E5' }}>
                  {job.link}
                </a>
              ) : null
            }
          />
          <div>
            <div style={{ color: '#607D8B', fontSize: 12, marginBottom: 4 }}>Notes</div>
            <div
              style={{
                border: '1px solid #DADCE0',
                borderRadius: 8,
                padding: '10px 12px',
                minHeight: 60,
                whiteSpace: 'pre-wrap',
                background: '#fafafa',
              }}
            >
              {job.notes || <span style={{ color: '#B0BEC5' }}>No notes.</span>}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
            padding: '12px 20px 20px',
          }}
        >
          {onDelete && (
            <button
              onClick={() => onDelete(job.id, stage)}
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid #E53935',
                background: 'white',
                color: '#E53935',
                cursor: 'pointer',
              }}
              title="Delete application"
            >
              Delete
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(job, stage)}
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid #ccc',
                background: 'white',
                cursor: 'pointer',
              }}
              title="Edit application"
            >
              Edit
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#FF7043',
              color: 'white',
              border: 'none',
              padding: '8px 14px',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
