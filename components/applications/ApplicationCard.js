// components/applications/ApplicationCard.js
import React from 'react';
import { FaEye, FaEdit, FaTrash } from 'react-icons/fa';

const DEFAULT_STAGES = ['Pinned', 'Applied', 'Interviewing', 'Offers', 'Rejected'];

export default function ApplicationCard({
  job,
  stage,
  onView,
  onEdit,
  onDelete,
  dragListeners,
  dragAttributes,
}) {
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
          alignItems: 'center',
        }}
      >
        {/* Drag handle */}
        <div
          {...dragAttributes}
          {...dragListeners}
          style={{
            cursor: 'grab',
            padding: '0 8px',
            fontSize: 18,
            color: '#90A4AE',
          }}
        >
          ⋮⋮
        </div>

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