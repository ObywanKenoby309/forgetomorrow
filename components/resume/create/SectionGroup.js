import React, { useEffect, useState } from 'react';
import { FaChevronDown, FaChevronRight } from 'react-icons/fa';

/**
 * Props:
 * - title: string
 * - defaultOpen: boolean (group open state; defaults to false)
 * - density: 'compact' | 'comfortable'
 * - itemStyle: 'flat' | 'expando'   <-- NEW (default 'flat')
 * - items: Array<{ key: string, title?: string, render: () => React.ReactNode }>
 */
export default function SectionGroup({
  title,
  defaultOpen = false,
  density = 'compact',
  itemStyle = 'flat',
  items = [],
}) {
  // Group open/closed
  const [isGroupOpen, setIsGroupOpen] = useState(!!defaultOpen);

  // Stable per-item open state (only used when itemStyle='expando')
  const [openMap, setOpenMap] = useState(() => {
    const init = {};
    for (const it of items) init[String(it.key || it.title)] = false;
    return init;
  });

  useEffect(() => {
    setOpenMap((prev) => {
      const next = { ...prev };
      const keysNow = new Set(items.map((it) => String(it.key || it.title)));
      for (const it of items) {
        const k = String(it.key || it.title);
        if (!(k in next)) next[k] = false;
      }
      for (const k of Object.keys(next)) {
        if (!keysNow.has(k)) delete next[k];
      }
      return next;
    });
  }, [items]);

  const toggleItem = (k) => setOpenMap((m) => ({ ...m, [k]: !m[k] }));
  const bodyPad = density === 'compact' ? 'px-3 pb-3' : 'px-4 pb-4';

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:p-5 space-y-3">
      <button
        type="button"
        className="w-full flex items-center justify-between"
        onClick={() => setIsGroupOpen((o) => !o)}
      >
        <h3 className="text-sm font-semibold text-slate-700 tracking-wide">{title}</h3>
        {isGroupOpen ? <FaChevronDown className="text-[#FF7043]" /> : <FaChevronRight className="text-[#FF7043]" />}
      </button>

      {isGroupOpen && (
        <div className="space-y-3">
          {items.map((it) => {
            const k = String(it.key || it.title || Math.random());
            return (
              <div key={k} className="rounded-lg border border-slate-200">
                {itemStyle === 'expando' && it.title ? (
                  <>
                    <button
                      type="button"
                      className="w-full flex items-center justify-between px-3 py-2"
                      onClick={() => toggleItem(k)}
                    >
                      <span className="text-sm font-medium text-slate-800">{it.title}</span>
                      {openMap[k] ? <FaChevronDown className="text-[#FF7043]" /> : <FaChevronRight className="text-[#FF7043]" />}
                    </button>
                    {openMap[k] && <div className={bodyPad}>{it.render()}</div>}
                  </>
                ) : (
                  // FLAT: no extra header/chevron—just render the content
                  <div className={bodyPad}>{it.render()}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
