// components/profile/ProfileSectionShell.js
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

export default function ProfileSectionShell({
  title,
  sectionKey,              // string id for this section
  openSection,             // current open section id (or null)
  setOpenSection,          // setter from the page
  summary = 'Not started', // small helper line when collapsed
  children,                // editor content
  hint = null,             // <SectionHint ... />
  hintOnlyWhenOpen = true, // default: hide hint until expanded
  cardClassName = '',      // optional overrides
}) {
  const isOpen = openSection === sectionKey;

  const toggle = () => {
    setOpenSection(isOpen ? null : sectionKey);
  };

  // Smooth expand/collapse (height animation)
  const innerRef = useRef(null);
  const [maxH, setMaxH] = useState(0);

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;

    if (isOpen) {
      // Measure content
      const next = el.scrollHeight || 0;
      setMaxH(next);

      // Re-measure shortly after paint to catch dynamic content (dropdowns, etc.)
      const t = setTimeout(() => {
        const again = el.scrollHeight || 0;
        setMaxH(again);
      }, 50);

      return () => clearTimeout(t);
    } else {
      setMaxH(0);
    }
  }, [isOpen, children]);

  const showHint = useMemo(() => {
    if (!hint) return false;
    if (!hintOnlyWhenOpen) return true;
    return isOpen;
  }, [hint, hintOnlyWhenOpen, isOpen]);

  return (
    <div className="grid md:grid-cols-3 items-start gap-4">
      {/* LEFT (2 cols) */}
      <div className="md:col-span-2">
        <section
          className={[
            // Frosted, but not a full page overlay
            'rounded-2xl border border-white/30 bg-white/70 backdrop-blur-md shadow-sm',
            'transition-colors duration-200',
            cardClassName,
          ].join(' ')}
        >
          {/* Header row */}
          <button
            type="button"
            onClick={toggle}
            className="w-full flex items-center justify-between text-left px-4 py-3"
            aria-expanded={isOpen}
            aria-controls={`profile-section-${sectionKey}`}
          >
            <div className="min-w-0">
              <div className="font-semibold text-slate-800">{title}</div>
              <div className="text-xs text-slate-500 mt-0.5">{summary}</div>
            </div>

            <div
              className={[
                'text-slate-500 transition-transform duration-300',
                isOpen ? 'rotate-180' : '',
              ].join(' ')}
              aria-hidden="true"
            >
              ▾
            </div>
          </button>

          {/* Body (animated) */}
          <div
            id={`profile-section-${sectionKey}`}
            className="px-4"
            style={{
              overflow: 'hidden',
              maxHeight: isOpen ? `${maxH}px` : '0px',
              transition: 'max-height 320ms ease',
            }}
          >
            <div
              ref={innerRef}
              style={{
                opacity: isOpen ? 1 : 0,
                transform: isOpen ? 'translateY(0px)' : 'translateY(-4px)',
                transition: 'opacity 220ms ease, transform 220ms ease',
                paddingBottom: 16,
              }}
            >
              {children}
            </div>
          </div>
        </section>
      </div>

      {/* RIGHT (hint "curtain") */}
      {showHint ? (
        <div
          className={[
            'transition-all duration-300 ease-out',
            'opacity-100 translate-x-0',
          ].join(' ')}
          style={{ willChange: 'transform, opacity' }}
        >
          {hint}
        </div>
      ) : (
        // Keep grid alignment on desktop without showing anything
        <div className="hidden md:block" />
      )}
    </div>
  );
}
