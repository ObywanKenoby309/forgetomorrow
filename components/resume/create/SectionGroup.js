// /components/resume/create/SectionGroup.js
import { useEffect, useMemo, useState } from 'react';
import { FaChevronDown, FaChevronRight } from 'react-icons/fa';

/**
 * SectionGroup
 * - Keeps each item body mounted to preserve focus while typing
 * - Uses stable keys only (item.key)
 * - Syncs new items via useEffect (no state updates during render)
 * - Keeps the same light visual shell you’re using now
 */
export default function SectionGroup({
  title,
  items = [],          // [{ key, title, render }]
  defaultOpen = true,  // kept for parity
  density = 'compact', // kept for parity; no visual change
  shell = 'ghost',     // kept for parity; no visual change
}) {
  // Initialize open map once from the initial items list
  const initialOpen = useMemo(() => {
    const obj = {};
    for (const it of items) {
      if (it?.key != null) obj[it.key] = true;
    }
    return obj;
  }, []); // only once

  const [openMap, setOpenMap] = useState(initialOpen);

  // If new items are introduced later, add them to the open map
  useEffect(() => {
    setOpenMap(prev => {
      let changed = false;
      const next = { ...prev };
      for (const it of items) {
        const k = it?.key;
        if (k != null && !(k in next)) {
          next[k] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [items]);

  const toggle = (k) => setOpenMap(m => ({ ...m, [k]: !m[k] }));

  return (
    <section
      style={{
        background: 'white',
        border: '1px solid #eee',
        borderRadius: 12,
        padding: 12,
        boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
        display: 'grid',
        gap: 10,
      }}
    >
      {title ? (
        <div
          style={{
            padding: '2px 4px',
            color: '#546E7A',
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: 0.2,
          }}
        >
          {title}
        </div>
      ) : null}

      <div style={{ display: 'grid', gap: 8 }}>
        {items.map((it) => {
          const key = it.key; // must be stable
          const isOpen = !!openMap[key];

          return (
            <div
              key={key}
              style={{
                background: 'white',
                border: '1px solid #eee',
                borderRadius: 12,
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              }}
            >
              <button
                type="button"
                onClick={() => toggle(key)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  fontSize: 14,
                  color: '#374151',
                  fontWeight: 600,
                }}
              >
                <span>{it.title}</span>
                {isOpen ? (
                  <FaChevronDown className="text-[#FF7043]" />
                ) : (
                  <FaChevronRight className="text-[#FF7043]" />
                )}
              </button>

              {/* Keep mounted; just hide/show to preserve focus */}
              <div style={{ display: isOpen ? 'block' : 'none', padding: '0 12px 12px 12px' }}>
                {typeof it.render === 'function' ? it.render() : it.render}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
