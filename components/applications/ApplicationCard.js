// components/applications/ApplicationCard.js
import React from 'react';
import { FaArrowLeft, FaArrowRight, FaEdit, FaEye } from 'react-icons/fa';

const DEFAULT_STAGES = ['Pinned', 'Applied', 'Interviewing', 'Offers', 'Rejected'];

export default function ApplicationCard({
  job,
  stage,
  onMove,
  onEdit,
  onView,
  stages,
}) {
  const STAGES = Array.isArray(stages) && stages.length ? stages : DEFAULT_STAGES;
  const currentIndex = STAGES.indexOf(stage);

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
      }}
    >
      <div style={{ fontWeight: 600 }}>{job.title}</div>
      <div style={{ color: '#546E7A', fontSize: 13 }}>
        {job.company}
        {job.location ? ` • ${job.location}` : ''}
      </div>
      <div style={{ fontSize: 12, color: '#607D8B' }}>
        Added: {job.dateAdded}
      </div>

      {/* Buttons row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: 6,
          marginTop: 4,
        }}
      >
        <button
          onClick={() => onMove(job.id, stage, -1)}
          disabled={currentIndex <= 0}
          title="Move left"
          style={{
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #eee',
            borderRadius: 6,
            background: 'white',
            cursor: currentIndex <= 0 ? 'not-allowed' : 'pointer',
          }}
        >
          <FaArrowLeft color={currentIndex <= 0 ? '#ccc' : '#FF7043'} />
        </button>

        <button
          onClick={() => onMove(job.id, stage, 1)}
          disabled={currentIndex === STAGES.length - 1 || currentIndex === -1}
          title="Move right"
          style={{
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #eee',
            borderRadius: 6,
            background: 'white',
            cursor:
              currentIndex === STAGES.length - 1 || currentIndex === -1
                ? 'not-allowed'
                : 'pointer',
          }}
        >
          <FaArrowRight
            color={
              currentIndex === STAGES.length - 1 || currentIndex === -1
                ? '#ccc'
                : '#FF7043'
            }
          />
        </button>

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
      </div>
    </div>
  );
}
