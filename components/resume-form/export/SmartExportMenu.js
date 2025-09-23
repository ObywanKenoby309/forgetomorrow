// components/resume-form/export/SmartExportMenu.jsx
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Document, PDFDownloadLink } from '@react-pdf/renderer';

/* Reuse the same two template PDFs we declared in ClientPDFButton */
import ReactPDF from '@react-pdf/renderer';

/* Inline copies of the two PDF page components so this menu is self-contained.
   If you'd rather not duplicate, you can export them from ClientPDFButton and import here. */
const { Page, Text, View, StyleSheet } = ReactPDF;

const base = StyleSheet.create({
  page: { padding: 36, fontSize: 11, lineHeight: 1.4 },
  h1: { fontSize: 16, marginBottom: 2, fontWeight: 700 },
  meta: { color: '#455A64', marginBottom: 8 },
  hr: { borderBottomWidth: 1, borderBottomColor: '#E0E0E0', marginVertical: 8 },
  h2: { fontSize: 12, marginBottom: 4, fontWeight: 700, color: '#37474F' },
  li: { marginLeft: 12, marginBottom: 2 },
  row: { marginBottom: 6 },
});

function ReversePage(props) {
  const {
    formData = {}, summary = '', experiences = [], projects = [],
    volunteerExperiences = [], educationList = [], certifications = [],
    languages = [], skills = [], achievements = [], customSections = [],
  } = props;
  const name = formData?.fullName || formData?.name || 'Your Name';
  const meta = [formData?.location, formData?.email, formData?.phone, formData?.portfolio]
    .filter(Boolean).join(' • ');
  return (
    <Page size="LETTER" style={base.page}>
      <Text style={base.h1}>{name}</Text>
      {meta ? <Text style={base.meta}>{meta}</Text> : null}

      {summary ? (<><Text style={base.h2}>Career Summary</Text><Text>{summary}</Text><View style={base.hr} /></>) : null}

      {!!experiences?.length && (
        <>
          <Text style={base.h2}>Professional Experience</Text>
          {experiences.map((e, i) => (
            <View key={i} style={base.row}>
              <Text>{(e?.title || e?.jobTitle || 'Role')}{e?.company ? `, ${e.company}` : ''}</Text>
              <Text style={base.meta}>
                {[e?.location, e?.dateRange || e?.range || `${e?.startDate || ''} – ${e?.endDate || 'Present'}`]
                  .filter(Boolean).join(' • ')}
              </Text>
              {(e?.highlights || e?.bullets || (e?.description ? String(e.description).split('\n') : [])).map((b, j) => (
                <Text key={j} style={base.li}>• {b}</Text>
              ))}
            </View>
          ))}
          <View style={base.hr} />
        </>
      )}

      {!!projects?.length && (
        <>
          <Text style={base.h2}>Projects</Text>
          {projects.map((p, i) => (
            <Text key={i} style={base.li}>• {(p?.title || p?.name || 'Project')}{p?.description ? ` — ${p.description}` : ''}</Text>
          ))}
          <View style={base.hr} />
        </>
      )}

      {!!educationList?.length && (
        <>
          <Text style={base.h2}>Education</Text>
          {educationList.map((ed, i) => (
            <View key={i} style={base.row}>
              <Text>{(ed?.degree || ed?.program || '')}{ed?.school ? `, ${ed.school}` : (ed?.institution ? `, ${ed?.institution}` : '')}</Text>
              <Text style={base.meta}>{
                [ed?.startDate, ed?.endDate].filter(Boolean).join(' – ')
              }</Text>
            </View>
          ))}
          <View style={base.hr} />
        </>
      )}

      {!!languages?.length && (
        <>
          <Text style={base.h2}>Languages</Text>
          {languages.map((l, i) => {
            const obj = typeof l === 'string' ? { language: l } : l || {};
            const detail = [obj.proficiency || null, obj.years ? `${obj.years} years` : null]
              .filter(Boolean).join(' | ');
            return <Text key={i} style={base.li}>• {obj.language || 'Language'}{detail ? ` | ${detail}` : ''}</Text>;
          })}
          <View style={base.hr} />
        </>
      )}

      {!!skills?.length && (<><Text style={base.h2}>Skills</Text><Text>{skills.join(', ')}</Text></>)}
    </Page>
  );
}

const hybridStyles = StyleSheet.create({
  twoCol: { display: 'flex', flexDirection: 'row', gap: 12 },
  left: { width: '36%' },
  right: { width: '64%' },
});
function HybridPage(props) {
  const {
    formData = {}, summary = '', experiences = [], educationList = [],
    languages = [], skills = [], projects = [],
  } = props;

  const name = formData?.fullName || formData?.name || 'Your Name';
  const meta = [formData?.location, formData?.email, formData?.phone, formData?.portfolio]
    .filter(Boolean).join(' • ');

  return (
    <Page size="LETTER" style={base.page}>
      <Text style={base.h1}>{name}</Text>
      {meta ? <Text style={base.meta}>{meta}</Text> : null}

      <View style={hybridStyles.twoCol}>
        <View style={hybridStyles.left}>
          {!!summary && (<><Text style={base.h2}>Summary</Text><Text>{summary}</Text><View style={base.hr} /></>)}
          {!!skills?.length && (<><Text style={base.h2}>Skills</Text><Text>{skills.join(', ')}</Text><View style={base.hr} /></>)}
          {!!languages?.length && (
            <>
              <Text style={base.h2}>Languages</Text>
              {languages.map((l, i) => {
                const obj = typeof l === 'string' ? { language: l } : l || {};
                const detail = [obj.proficiency || null, obj.years ? `${obj.years} years` : null]
                  .filter(Boolean).join(' | ');
                return <Text key={i} style={base.li}>• {obj.language || 'Language'}{detail ? ` | ${detail}` : ''}</Text>;
              })}
              <View style={base.hr} />
            </>
          )}
          {!!educationList?.length && (
            <>
              <Text style={base.h2}>Education</Text>
              {educationList.map((ed, i) => (
                <View key={i} style={base.row}>
                  <Text>{(ed?.degree || ed?.program || '')}{ed?.school ? `, ${ed.school}` : (ed?.institution ? `, ${ed?.institution}` : '')}</Text>
                  <Text style={base.meta}>{
                    [ed?.startDate, ed?.endDate].filter(Boolean).join(' – ')
                  }</Text>
                </View>
              ))}
            </>
          )}
        </View>

        <View style={hybridStyles.right}>
          {!!experiences?.length && (
            <>
              <Text style={base.h2}>Experience</Text>
              {experiences.map((e, i) => (
                <View key={i} style={base.row}>
                  <Text>{(e?.title || e?.jobTitle || 'Role')}{e?.company ? `, ${e.company}` : ''}</Text>
                  <Text style={base.meta}>
                    {[e?.location, e?.dateRange || e?.range || `${e?.startDate || ''} – ${e?.endDate || 'Present'}`]
                      .filter(Boolean).join(' • ')}
                  </Text>
                  {(e?.highlights || e?.bullets || (e?.description ? String(e.description).split('\n') : [])).map((b, j) => (
                    <Text key={j} style={base.li}>• {b}</Text>
                  ))}
                </View>
              ))}
            </>
          )}

          {!!projects?.length && (
            <>
              <Text style={base.h2}>Projects</Text>
              {projects.map((p, i) => (
                <Text key={i} style={base.li}>• {(p?.title || p?.name || 'Project')}{p?.description ? ` — ${p.description}` : ''}</Text>
              ))}
            </>
          )}
        </View>
      </View>
    </Page>
  );
}

function TemplateDoc({ templateId = 'reverse', resumeProps }) {
  const children = templateId === 'hybrid'
    ? [<HybridPage key="p" {...resumeProps} />]
    : [<ReversePage key="p" {...resumeProps} />];
  return <Document>{children}</Document>;
}

function fileSafe(name, fallback = 'Document') {
  return (name || fallback).trim().replace(/\s+/g, '_').replace(/[^A-Za-z0-9_\-]/g, '');
}

/* ----------------- SmartExportMenu ----------------- */
const MODAL_MAX_W = 520;
const MODAL_SIDE_PADDING = 16;
const MODAL_MAX_H = '85vh';

export default function SmartExportMenu({
  formData = {}, summary = '', experiences = [], projects = [],
  volunteerExperiences = [], educationList = [], certifications = [],
  languages = [], skills = [], achievements = [], customSections = [],
  coverStorageKey = 'ft_cover_draft',
  templateId = 'reverse', // <<< NEW
}) {
  const [open, setOpen] = useState(false);
  const [cover] = useState(null);          // keeping for future combined export (cover builder)
  const [order] = useState('resume-first'); // placeholder to keep UI stable if you re-add cover later

  // portal root
  const portalRef = useRef(null);
  useEffect(() => {
    const el = document.createElement('div');
    el.setAttribute('id', 'smart-export-portal');
    document.body.appendChild(el);
    portalRef.current = el;
    return () => { document.body.removeChild(el); };
  }, []);

  const resumeProps = useMemo(() => ({
    formData, summary, experiences, projects, volunteerExperiences,
    educationList, certifications, languages, skills, achievements, customSections,
  }), [formData, summary, experiences, projects, volunteerExperiences,
      educationList, certifications, languages, skills, achievements, customSections]);

  const safeName = fileSafe(formData?.fullName || formData?.name || 'Candidate', 'Candidate');
  const resumeName = `${safeName}_Resume_${templateId}.pdf`;

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
      <div onClick={() => setOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />
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
          <div style={{ fontWeight: 800, color: '#37474F' }}>Export (Template: {templateId})</div>
          <button
            onClick={() => setOpen(false)}
            style={{ background: 'white', border: '1px solid #E0E0E0', borderRadius: 10, padding: '6px 10px', fontWeight: 800, cursor: 'pointer' }}
          >
            Close
          </button>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <PDFDownloadLink
            document={<TemplateDoc templateId={templateId} resumeProps={resumeProps} />}
            fileName={resumeName}
          >
            {({ loading }) => (
              <button
                type="button"
                style={{ background: '#FF7043', color: 'white', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 10, padding: '10px 14px', fontWeight: 800, cursor: 'pointer' }}
              >
                {loading ? 'Preparing…' : 'Download PDF'}
              </button>
            )}
          </PDFDownloadLink>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ marginTop: 8, borderTop: '1px dashed #CFD8DC', paddingTop: 10 }}>
      <div style={{ fontWeight: 700, color: '#37474F', marginBottom: 6, fontSize: 13 }}>
        Advanced Export (Template-based)
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{ background: 'white', border: '1px solid #E0E0E0', borderRadius: 10, padding: '8px 12px', fontWeight: 800, cursor: 'pointer' }}
          title="Download a PDF that matches your selected template"
        >
          Configure & Download
        </button>
      </div>

      {open && portalRef.current ? createPortal(modal, portalRef.current) : null}
    </div>
  );
}
