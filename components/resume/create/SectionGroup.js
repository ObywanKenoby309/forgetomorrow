// components/resume/create/SectionGroup.js
import { useState } from 'react';
import { FaChevronDown, FaChevronUp, FaChevronRight } from 'react-icons/fa';

export default function SectionGroup({
  title,
  subtitle,               // optional
  defaultOpen = true,
  items = [],             // [{key,title,render}]
  density = 'compact',    // 'compact' | 'cozy'
  shell = 'ghost',        // 'ghost' keeps the outer panel subtle
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  const padY = density === 'compact' ? 'py-2' : 'py-3';

  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* group header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <div className="text-[15px] font-semibold text-gray-800">{title}</div>
          {!!subtitle && (
            <div className="text-xs text-gray-500 mt-0.5">{subtitle}</div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="text-[13px] font-medium border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50"
        >
          {open ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {/* rows */}
      {open && (
        <div className="px-3 pb-3">
          {items.map(({ key, title, render }) => (
            <details
              key={key}
              open={false}
              className="group bg-white rounded-lg border border-gray-200 mb-2"
            >
              <summary className={`list-none cursor-pointer select-none flex items-center justify-between px-3 ${padY}`}>
                <span className="text-[16px] font-semibold text-gray-800">{title}</span>
                <FaChevronRight className="text-gray-400 group-open:hidden" />
                <FaChevronDown className="text-gray-400 hidden group-open:block" />
              </summary>
              <div className="border-t border-gray-200 p-4">
                {typeof render === 'function' ? render() : render}
              </div>
            </details>
          ))}
        </div>
      )}
    </section>
  );
}
