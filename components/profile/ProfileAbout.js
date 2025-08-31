import React from 'react';
import Collapsible from '@/components/ui/Collapsible';

export default function ProfileAbout({ about, onEdit }) {
  return (
    <Collapsible
      title="About Me"
      defaultOpen
      rightAction={
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.();
          }}
          style={{
            background: 'white',
            color: '#FF7043',
            border: '1px solid #FF7043',
            borderRadius: 10,
            padding: '8px 12px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
          aria-label="Edit About Me"
        >
          Edit
        </button>
      }
    >
      <p style={{ color: '#374151', marginBottom: 0, lineHeight: 1.5 }}>
        {about || 'Tell the world about yourself...'}
      </p>
    </Collapsible>
  );
}
