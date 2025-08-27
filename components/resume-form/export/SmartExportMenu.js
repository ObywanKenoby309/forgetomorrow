// components/resume-form/export/SmartExportMenu.jsx
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';

// ---- layout knobs ----
const MODAL_MAX_W = 520;           // tweak to 460/480 if you want slimmer
const MODAL_SIDE_PADDING = 16;     // viewport padding so it never touches edges
const MODAL_MAX_H = '85vh';        // scroll inside the card if content is taller

// Plain, ATS-safe styles (single column)
const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 11, lineHeight: 1.4 },
  h1: { fontSize: 16, marginBottom: 4, fontWeight: 700 },
  h2: { fontSize: 12, marginTop: 10, marginBottom: 4, fontWeight: 700 },
  meta: { color: '#455A64', marginBottom: 6 },
  li: { marginLeft: 12, marginBottom: 2 },
  row: { marginBottom: 4 },
});

function fileSafe(name, fallback = 'Document') {
  return (name || fallback).trim().replace(/\s+/g, '_').replace(/[^A-Za-z0-9_\-]/g, '');
}

function ResumeAtsPage({
  formData = {}, summary = '', experiences = [], projects = [],
  volunteerExperiences = [], educationList = [], certifications = [],
  languages = [], skills = [], achievements = [], customSections = [],
}) {
  const name = formData?.fullName || formData?.name || 'Your Name';
  const meta = [formData?.email, formData?.phone, formData?.location].filter(Boolean).join(' · ');

  return (
    <Page size="LETTER" style={styles.page}>
      <Text style={styles.h1}>{name}</Text>
      {meta ? <Text style={styles.meta}>{meta}</Text> : null}

      {summary ? (<><Text style={styles.h2}>Professional Summary</Text><Text>{summary}</Text></>) : null}

      {!!experiences?.length && (
        <>
          <Text style={styles.h2}>Work Experience</Text>
          {experiences.map((e, i) => (
            <View key={i} style={styles.row}>
              <Text>{(e?.title || '')}{e?.company ? ` — ${e.company}` : ''}</Text>
              {e?.dateRange || e?.range ? <Text style={styles.meta}>{e?.dateRange || e?.range}</Text> : null}
              {(e?.highlights || e?.bullets || []).map((b, j) => <Text key={j} style={styles.li}>• {b}</Text>)}
            </View>
          ))}
        </>
      )}

      {!!projects?.length && (
        <>
          <Text style={styles.h2}>Projects</Text>
          {projects.map((p, i) => (
            <Text key={i} style={styles.li}>• {(p?.title || p?.name || 'Project')}{p?.summary ? ` — ${p.summary}` : ''}</Text>
          ))}
        </>
      )}

      {!!volunteerExperiences?.length && (
        <>
          <Text style={styles.h2}>Volunteer Experience</Text>
          {volunteerExperiences.map((v, i) => (
            <Text key={i} style={styles.li}>• {(v?.title || '')}{v?.organization ? ` — ${v.organization}` : ''}</Text>
          ))}
        </>
      )}

      {!!educationList?.length && (
        <>
          <Text style={styles.h2}>Education</Text>
          {educationList.map((ed, i) => (
            <Text key={i} style={styles.li}>• {(ed?.degree || ed?.program || '')}{ed?.institution ? ` — ${ed.institution}` : ''}</Text>
          ))}
        </>
      )}

      {!!skills?.length && (<><Text style={styles.h2}>Skills</Text><Text>{skills.join(', ')}</Text></>)}

      {!!achievements?.length && (
        <>
          <Text style={styles.h2}>Achievements</Text>
          {achievements.map((a, i) => <Text key={i} style={styles.li}>• {a}</Text>)}
        </>
      )}

      {!!certifications?.length && (
        <>
          <Text style={styles.h2}>Certifications</Text>
          {certifications.map((c, i) => <Text key={i} style={styles.li}>• {c?.name || c}</Text>)}
        </>
      )}

      {!!customSections?.length && (
        <>
          <Text style={styles.h2}>Additional</Text>
          {customSections.map((c, i) => <Text key={i} style={styles.li}>• {c?.title || c?.name || 'Item'}</Text>)}
        </>
      )}
    </Page>
  );
}

function CoverTextPage({ cover }) {
  const f = cover?.fields || {};
  const lines = [];
  if (f.signatureContact) lines.push(f.signatureContact);
  if (f.recipient || f.company) lines.push([f.recipient, f.company].filter(Boolean).join(', '));
  if (f.greeting) lines.push(f.greeting);
  if (f.opening) lines.push(f.opening);
  if (Array.isArray(f.body)) f.body.filter(Boolean).forEach(b => lines.push(`• ${b}`));
  if (f.valueProp) lines.push(f.valueProp);
  if (f.closing) lines.push(f.closing);
  if (f.signoff) lines.push(f.signoff);
  if (f.signatureName) lines.push(f.signatureName);

  return (
    <Page size="LETTER" style={styles.page}>
      <Text style={styles.h1}>Cover Letter</Text>
      {lines.length ? lines.map((ln, i) => <Text key={i} style={{ marginBottom: 6 }}>{ln}</Text>)
                    : <Text>(No cover letter content saved yet.)</Text>}
    </Page>
  );
}

function CombinedAtsDoc({ order = 'resume-first', resumeProps, cover }) {
  const children = order === 'cover-first'
    ? [<CoverTextPage key="c" cover={cover} />, <ResumeAtsPage key="r" {...resumeProps} />]
    : [<ResumeAtsPage key="r" {...resumeProps} />, <CoverTextPage key="c" cover={cover} />];
  return <Document>{children}</Document>;
}
function ResumeAtsDoc({ resumeProps }) {
  return <Document><ResumeAtsPage {...resumeProps} /></Document>;
}

export default function SmartExportMenu({
  formData = {}, summary = '', experiences = [], projects = [],
  volunteerExperiences = [], educationList = [], certifications = [],
  languages = [], skills = [], achievements = [], customSections = [],
  coverStorageKey = 'ft_cover_draft',
}) {
  const [open, setOpen] = useState(false);
  const [cover, setCover] = useState(null);
  const [combined, setCombined] = useState(false);
  const [order, setOrder] = useState('resume-first');

  // portal root
  const portalRef = useRef(null);
  useEffect(() => {
    const el = document.createElement('div');
    el.setAttribute('id', 'smart-export-portal');
    document.body.appendChild(el);
    portalRef.current = el;
    return () => { document.body.removeChild(el); };
  }, []);

  // refresh cover on modal open
  useEffect(() => {
    if (!open) return;
    try {
      const raw = localStorage.getItem(coverStorageKey);
      const parsed = raw ? JSON.parse(raw) : null;
      setCover(parsed || null);
      setCombined(!!parsed);
    } catch {
      setCover(null);
      setCombined(false);
    }
  }, [open, coverStorageKey]);

  const resumeProps = useMemo(() => ({
    formData, summary, experiences, projects, volunteerExperiences,
    educationList, certifications, languages, skills, achievements, customSections,
  }), [formData, summary, experiences, projects, volunteerExperiences,
      educationList, certifications, languages, skills, achievements, customSections]);

  const safeName = fileSafe(formData?.fullName || formData?.name || 'Candidate', 'Candidate');
  const CombinedDoc = <CombinedAtsDoc order={order} resumeProps={resumeProps} cover={cover} />;
  const ResumeDoc   = <ResumeAtsDoc resumeProps={resumeProps} />;
  const combinedName = `${safeName}_${order === 'cover-first' ? 'Cover_Resume' : 'Resume_Cover'}_ATS.pdf`;
  const resumeName   = `${safeName}_Resume_ATS.pdf`;
  const combinedDisabled = !cover;

  // modal (rendered via portal so it's centered on the viewport)
  const modal = !open ? null : (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100000,
        display: 'grid',
        placeItems: 'center',
        padding: MODAL_SIDE_PADDING,
        boxSizing: 'border-box',
      }}
      aria-modal="true"
      role="dialog"
    >
      <div
        onClick={() => setOpen(false)}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }}
      />
      <div
        style={{
          position: 'relative',
          width: `min(${MODAL_MAX_W}px, calc(100vw - ${MODAL_SIDE_PADDING * 2}px))`,
          maxWidth: MODAL_MAX_W,
          maxHeight: MODAL_MAX_H,
          overflowY: 'auto',
          background: 'white',
          border: '1px solid #eee',
          borderRadius: 12,
          boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
          padding: 16,
          display: 'grid',
          gap: 12,
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 800, color: '#37474F' }}>ATS-safe Export</div>
          <button
            onClick={() => setOpen(false)}
            style={{ background: 'white', border: '1px solid #E0E0E0', borderRadius: 10, padding: '6px 10px', fontWeight: 800, cursor: 'pointer' }}
          >
            Close
          </button>
        </div>

        <label
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            border: '1px solid #eee', borderRadius: 10, padding: 10,
            opacity: combinedDisabled ? 0.7 : 1,
          }}
          title={combinedDisabled ? 'No cover saved yet (create on /cover/create).' : undefined}
        >
          <input
            type="checkbox"
            checked={combined && !combinedDisabled}
            onChange={(e) => setCombined(e.target.checked)}
            disabled={combinedDisabled}
          />
          <div>
            <div style={{ fontWeight: 700 }}>Combined PDF (Cover + Resume)</div>
            <div style={{ fontSize: 12, color: '#607D8B' }}>
              {combinedDisabled
                ? 'No cover saved yet (create on /cover/create).'
                : 'Includes your saved cover draft + ATS resume.'}
            </div>
          </div>
        </label>

        <div
          style={{
            display: 'grid', gap: 8,
            opacity: combined && !combinedDisabled ? 1 : 0.5,
            pointerEvents: combined && !combinedDisabled ? 'auto' : 'none',
          }}
        >
          <div style={{ fontWeight: 700, color: '#37474F' }}>Order</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="radio" name="order" value="resume-first"
                checked={order === 'resume-first'} onChange={() => setOrder('resume-first')}
              />
              Resume first
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="radio" name="order" value="cover-first"
                checked={order === 'cover-first'} onChange={() => setOrder('cover-first')}
              />
              Cover first
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          {combined && !combinedDisabled ? (
            <PDFDownloadLink document={CombinedDoc} fileName={combinedName}>
              {({ loading }) => (
                <button
                  type="button"
                  style={{ background: '#FF7043', color: 'white', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 10, padding: '10px 14px', fontWeight: 800, cursor: 'pointer' }}
                >
                  {loading ? 'Preparing…' : 'Download Combined (ATS)'}
                </button>
              )}
            </PDFDownloadLink>
          ) : (
            <PDFDownloadLink document={ResumeDoc} fileName={resumeName}>
              {({ loading }) => (
                <button
                  type="button"
                  style={{ background: '#FF7043', color: 'white', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 10, padding: '10px 14px', fontWeight: 800, cursor: 'pointer' }}
                >
                  {loading ? 'Preparing…' : 'Download Resume (ATS)'}
                </button>
              )}
            </PDFDownloadLink>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ marginTop: 8, borderTop: '1px dashed #CFD8DC', paddingTop: 10 }}>
      <div style={{ fontWeight: 700, color: '#37474F', marginBottom: 6, fontSize: 13 }}>
        Advanced Export (ATS-safe)
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{ background: 'white', border: '1px solid #E0E0E0', borderRadius: 10, padding: '8px 12px', fontWeight: 800, cursor: 'pointer' }}
          title="Combine Cover + Resume in an ATS-friendly PDF"
        >
          Configure & Download
        </button>
      </div>

      {/* render modal into the body to avoid clipping/transform issues */}
      {open && portalRef.current ? createPortal(modal, portalRef.current) : null}
    </div>
  );
}
