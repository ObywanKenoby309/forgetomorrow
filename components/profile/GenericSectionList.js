// components/profile/GenericSectionList.js
import React from 'react';

export default function GenericSectionList({
  title,
  items = [],
  labelFields = (x) => x.title || 'Untitled',
  subLabel = (x) => '',
  description = (x) => x.description || '',
  onAddClick,
  onDelete,
  addLabel = '+ Add',           // ← NEW
}) {
  return (
    <section
      style={{
        background: 'white',
        borderRadius: 12,
        padding: 16,
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        border: '1px solid #eee',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <h2 style={{ color: '#FF7043', fontSize: 22, fontWeight: 700, margin: 0 }}>{title}</h2>
        {onAddClick && (
          <button
            type="button"
            onClick={onAddClick}
            style={{
              background: 'white',
              color: '#FF7043',
              border: '1px solid #FF7043',
              borderRadius: 10,
              padding: '8px 12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {addLabel}
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div style={{ color: '#607D8B' }}>No items yet.</div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
          {items.map((it) => (
            <li
              key={it.id}
              style={{
                border: '1px solid #eee',
                borderRadius: 10,
                padding: 12,
                background: '#FAFAFA',
                display: 'grid',
                gap: 6,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ fontWeight: 800, color: '#263238' }}>{labelFields(it)}</div>
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(it.id)}
                    style={{
                      background: 'white',
                      color: '#C62828',
                      border: '1px solid #C62828',
                      borderRadius: 8,
                      padding: '4px 8px',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
              {subLabel(it) && <div style={{ color: '#607D8B', fontSize: 13 }}>{subLabel(it)}</div>}
              {description(it) && <div style={{ color: '#455A64', whiteSpace: 'pre-wrap' }}>{description(it)}</div>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
