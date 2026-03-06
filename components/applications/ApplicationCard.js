// components/applications/ApplicationCard.js
import React, { useEffect, useMemo, useState } from 'react';
import { FaEye, FaEdit, FaTrash, FaExchangeAlt } from 'react-icons/fa';

const STAGES = ['Pinned', 'Applied', 'Interviewing', 'Offers', 'Closed Out'];

export default function ApplicationCard({
  job,
  stage,
  onView,
  onEdit,
  onDelete,
  onMove,
  dragListeners,
  dragAttributes,
}) {
  const [isMobile, setIsMobile] = useState(false);
  const [showMoveSelect, setShowMoveSelect] = useState(false);

  useEffect(() => {
    const updateIsMobile = () => setIsMobile(window.innerWidth <= 768);
    updateIsMobile();
    window.addEventListener('resize', updateIsMobile);
    return () => window.removeEventListener('resize', updateIsMobile);
  }, []);

  const moveOptions = useMemo(() => STAGES.filter((s) => s !== stage), [stage]);

  const handleMoveChange = (e) => {
    const nextStage = e.target.value;
    if (!nextStage) {
      setShowMoveSelect(false);
      return;
    }

    if (onMove) {
      onMove(job.id, stage, nextStage, job.pinnedId || null);
    }

    setShowMoveSelect(false);
  };

  return (
    <div
      style={{
        border: '1px solid #eee',
        borderRadius: '10px',
        padding: '10px',
        marginBottom: '10px',
        background: '#fafafa',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        position: 'relative',
        minWidth: 0,
        boxSizing: 'border-box',
      }}
    >
      <div style={{ fontWeight: 600, minWidth: 0, overflowWrap: 'anywhere' }}>{job.title}</div>

      <div style={{ color: '#546E7A', fontSize: 13, minWidth: 0, overflowWrap: 'anywhere' }}>
        {job.company}
        {job.location ? ` • ${job.location}` : ''}
      </div>

      <div style={{ fontSize: 12, color: '#607D8B' }}>Added: {job.dateAdded}</div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 10,
          marginTop: 4,
          flexWrap: 'wrap',
        }}
      >
        {isMobile ? (
          <>
            <button
              onClick={() => setShowMoveSelect((prev) => !prev)}
              title="Move"
              style={{
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #eee',
                borderRadius: 6,
                background: 'white',
                cursor: 'pointer',
              }}
            >
              <FaExchangeAlt color="#FF7043" />
            </button>

            {showMoveSelect && (
              <select
                defaultValue=""
                onChange={handleMoveChange}
                onBlur={() => setShowMoveSelect(false)}
                autoFocus
                style={{
                  height: 32,
                  border: '1px solid #eee',
                  borderRadius: 6,
                  background: 'white',
                  color: '#546E7A',
                  fontSize: 13,
                  padding: '0 8px',
                  maxWidth: '100%',
                }}
              >
                <option value="" disabled>
                  Move to...
                </option>
                {moveOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            )}
          </>
        ) : (
          <div
            {...dragAttributes}
            {...dragListeners}
            style={{
              cursor: 'grab',
              fontSize: 24,
              fontWeight: 900,
              lineHeight: 1,
              color: '#FF7043',
              padding: '0 6px',
              userSelect: 'none',
            }}
            title="Drag to move"
            aria-label="Drag to move"
          >
            ↔
          </div>
        )}

        {onView && (
          <button
            onClick={() => onView(job, stage)}
            title="View details"
            style={{
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #eee',
              borderRadius: 6,
              background: 'white',
              cursor: 'pointer',
            }}
          >
            <FaEye color="#546E7A" />
          </button>
        )}

        <button
          onClick={() => onEdit(job, stage)}
          title="Edit"
          style={{
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #eee',
            borderRadius: 6,
            background: 'white',
            cursor: 'pointer',
          }}
        >
          <FaEdit color="#546E7A" />
        </button>

        <button
          onClick={() => onDelete(job, stage)}
          title="Delete"
          style={{
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #eee',
            borderRadius: 6,
            background: 'white',
            cursor: 'pointer',
          }}
        >
          <FaTrash color="#FF7043" />
        </button>
      </div>
    </div>
  );
}