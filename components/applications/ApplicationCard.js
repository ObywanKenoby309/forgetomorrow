// components/applications/ApplicationCard.js
import React from 'react';
import { FaArrowLeft, FaArrowRight, FaTrash, FaEdit } from 'react-icons/fa';

const STAGES = ["Pinned", "Applied", "Interviewing", "Offers", "Rejected"];

export default function ApplicationCard({ job, stage, onMove, onDelete, onEdit }) {
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
        {job.company}{job.location ? ` • ${job.location}` : ''}
      </div>
      <div style={{ fontSize: 12, color: '#607D8B' }}>Added: {job.dateAdded}</div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => onMove(job.id, stage, -1)}
            disabled={currentIndex === 0}
            title="Move left"
            style={{ background: 'none', border: '1px solid #eee', borderRadius: 6, padding: 6, cursor: currentIndex === 0 ? 'not-allowed' : 'pointer' }}
          >
            <FaArrowLeft color={currentIndex === 0 ? '#ccc' : '#FF7043'} />
          </button>
          <button
            onClick={() => onMove(job.id, stage, 1)}
            disabled={currentIndex === STAGES.length - 1}
            title="Move right"
            style={{ background: 'none', border: '1px solid #eee', borderRadius: 6, padding: 6, cursor: currentIndex === STAGES.length - 1 ? 'not-allowed' : 'pointer' }}
          >
            <FaArrowRight color={currentIndex === STAGES.length - 1 ? '#ccc' : '#FF7043'} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => onEdit(job, stage)}
            title="Edit"
            style={{ background: 'none', border: '1px solid #eee', borderRadius: 6, padding: 6, cursor: 'pointer' }}
          >
            <FaEdit color="#546E7A" />
          </button>
          <button
            onClick={() => onDelete(job.id, stage)}
            title="Delete"
            style={{ background: 'none', border: '1px solid #eee', borderRadius: 6, padding: 6, cursor: 'pointer' }}
          >
            <FaTrash color="#E53935" />
          </button>
        </div>
      </div>
    </div>
  );
}
