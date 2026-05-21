// components/search/SearchCategoryScroller.js
import React, { useRef } from 'react';

const ORANGE = '#FF7043';

export default function SearchCategoryScroller({
  types = [],
  activeType = 'all',
  counts = {},
  onChange,
}) {
  const rowRef = useRef(null);

  const scrollBy = (amount) => {
    if (!rowRef.current) return;
    rowRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  };

  return (
    <div style={{ position: 'relative', minWidth: 0 }}>
      <button
        type="button"
        aria-label="Scroll categories left"
        onClick={() => scrollBy(-240)}
        style={{
          position: 'absolute',
          left: -4,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 2,
          width: 30,
          height: 30,
          borderRadius: 999,
          border: '1px solid rgba(255,255,255,0.42)',
          background: 'rgba(255,255,255,0.88)',
          color: '#263238',
          fontSize: 22,
          lineHeight: '26px',
          fontWeight: 900,
          cursor: 'pointer',
          boxShadow: '0 8px 18px rgba(0,0,0,0.14)',
        }}
      >
        ‹
      </button>

      <div
        ref={rowRef}
        style={{
          display: 'flex',
          flexWrap: 'nowrap',
          overflowX: 'auto',
          gap: 10,
          padding: '0 36px 2px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          scrollBehavior: 'smooth',
        }}
      >
        {types.map((type) => {
          const active = activeType === type.key;
          const count = counts[type.key] || 0;

          return (
            <button
              key={type.key}
              type="button"
              onClick={() => onChange?.(type.key)}
              style={{
                border: 'none',
                borderRadius: 999,
                padding: '8px 13px',
                background: active ? ORANGE : 'rgba(255,255,255,0.78)',
                color: active ? '#fff' : '#34495E',
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: active
                  ? '0 10px 20px rgba(255,112,67,0.22)'
                  : '0 6px 14px rgba(0,0,0,0.08)',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {type.label} {count ? `(${count})` : ''}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        aria-label="Scroll categories right"
        onClick={() => scrollBy(240)}
        style={{
          position: 'absolute',
          right: -4,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 2,
          width: 30,
          height: 30,
          borderRadius: 999,
          border: '1px solid rgba(255,255,255,0.42)',
          background: 'rgba(255,255,255,0.88)',
          color: '#263238',
          fontSize: 22,
          lineHeight: '26px',
          fontWeight: 900,
          cursor: 'pointer',
          boxShadow: '0 8px 18px rgba(0,0,0,0.14)',
        }}
      >
        ›
      </button>
    </div>
  );
}
