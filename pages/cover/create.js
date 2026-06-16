// pages/cover/create.js
// Cover Letter Builder — aligned with Resume Builder toolbar, styling, and mobile Hammer drawer
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import ResumeBuilderLayout from '@/components/layouts/ResumeBuilderLayout';
import SeekerTitleCard from '@/components/seeker/SeekerTitleCard';
import { getTimeGreeting } from '@/lib/dashboardGreeting';
import { ResumeContext } from '@/context/ResumeContext';
import { extractTextFromFile, normalizeJobText } from '@/lib/jd/ingest';
import { uploadJD } from '@/lib/jd/uploadToApi';
import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';
import CoverPDFButton from '@/components/cover-letter/export/CoverPDFButton';

const CoverLetterTemplate = dynamic(() => import('@/components/cover-letter/CoverLetterTemplate'), { ssr: false });

const ORANGE = '#FF7043';

const GLASS_CARD = {
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.22)',
  background: 'rgba(255,255,255,0.58)',
  boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};

const GROUP_LABEL = {
  fontSize: 10,
  fontWeight: 900,
  color: '#94A3B8',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  whiteSpace: 'nowrap',
};

const PILL_BUTTON = {
  borderRadius: 999,
  padding: '5px 11px',
  fontSize: 12,
  border: '1px solid rgba(0,0,0,0.12)',
  background: 'rgba(255,255,255,0.80)',
  color: '#334155',
  fontWeight: 800,
  cursor: 'pointer',
};

// ─── Portal-based dropdown menu ─────────────────────────────────────────────
// Matches the resume builder toolbar behavior: one open menu at a time and
// menus render into document.body so they sit above the editor.
function DropdownMenu({ id, label, openMenu, setOpenMenu, align = 'left', children }) {
  const anchorRef = useRef(null);
  const panelRef = useRef(null);
  const [coords, setCoords] = useState(null);
  const isOpen = openMenu === id;

  useEffect(() => {
    if (!isOpen) return;

    function place() {
      const el = anchorRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 7,
        left: align === 'right' ? undefined : rect.left,
        right: align === 'right' ? window.innerWidth - rect.right : undefined,
        minWidth: rect.width,
      });
    }

    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [isOpen, align]);

  useEffect(() => {
    if (!isOpen) return;
    function onClickOutside(e) {
      if (anchorRef.current?.contains(e.target)) return;
      if (panelRef.current?.contains(e.target)) return;
      setOpenMenu(null);
    }
    function onEscape(e) {
      if (e.key === 'Escape') setOpenMenu(null);
    }
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, [isOpen, setOpenMenu]);

  return (
    <div className="ft-menu" ref={anchorRef}>
      <button
        type="button"
        className="ft-menu-summary"
        onClick={() => setOpenMenu(isOpen ? null : id)}
        aria-expanded={isOpen}
      >
        {label} <span style={{ display: 'inline-block', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }}>▾</span>
      </button>

      {isOpen && coords && typeof document !== 'undefined' && createPortal(
        <div
          ref={panelRef}
          className="ft-menu-panel-portal"
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            right: coords.right,
            minWidth: Math.max(coords.minWidth, 190),
          }}
          onClick={() => setOpenMenu(null)}
        >
          {children}
        </div>,
        document.body
      )}
    </div>
  );
}

export default function CoverLetterPage() {
  const router = useRouter();
  const chrome = String(router.query.chrome || '').toLowerCase();
  const withChrome = (path) => (chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path);
  const isFreshNav = String(router.query?.fresh || '') === '1';

  const fileInputRef = useRef(null);
  const dropRef = useRef(null);
  const autoSaveTimer = useRef(null);
  const resumeDataRef = useRef(null);
  const draftBusyRef = useRef(false);
  const didLoadDraftRef = useRef(false);

  const {
    formData, setFormData,
    summary,
    experiences,
    skills,
    educationList,
    saveEventAt, setSaveEventAt,
  } = useContext(ResumeContext);

  // ─── Cover letter fields ──────────────────────────────────────────────────
  const [recipient, setRecipient] = useState('Hiring Manager');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [greeting, setGreeting] = useState('Dear Hiring Manager,');
  const [opening, setOpening] = useState('');
  const [body, setBody] = useState('');
  const [closing, setClosing] = useState('');
  const [signoff, setSignoff] = useState('Sincerely,');
  const [portfolio, setPortfolio] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showPhilosophy, setShowPhilosophy] = useState(false);
  const [coverId, setCoverId] = useState(null);

  const [jd, setJd] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [jdLoading, setJdLoading] = useState(false);
  const [jdStatus, setJdStatus] = useState('');
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isEditMode, setIsEditMode] = useState(true);
  const [saveState, setSaveState] = useState('idle');
  const [hammerOpen, setHammerOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState(null); // 'actions' | 'view' | 'export' | null

  const letterData = {
    fullName: formData?.fullName || formData?.name || 'Your Name',
    email: formData?.email || '',
    phone: formData?.phone || '',
    location: formData?.location || '',
    portfolio: portfolio || formData?.portfolio || formData?.forgeUrl || '',
    recipient: recipient || 'Hiring Manager',
    company: company || 'the company',
    role: role || 'the position',
    greeting: greeting || 'Dear Hiring Manager,',
    opening: opening || '',
    body: body || '',
    closing: closing || '',
    signoff: signoff || 'Sincerely,',
  };

  useEffect(() => { resumeDataRef.current = letterData; });

  const coverName = (() => {
    const c = (company || '').trim();
    const r = (role || '').trim();
    if (c && r) return `${c} — ${r}`;
    if (c) return `${c} — Cover Letter`;
    if (r) return `${r} — Cover Letter`;
    return 'General Cover Letter';
  })();

  const savedTime = saveEventAt ? new Date(saveEventAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  const greetingText = getTimeGreeting();
  const hasCoverContent = !!(company || role || opening || body);
  const coverStatus = !hasCoverContent ? 'Draft' : jd ? 'Targeted' : 'In Progress';
  const progressItems = [!!(company || role), !!opening, !!body, !!closing, !!jd];
  const progress = Math.round((progressItems.filter(Boolean).length / progressItems.length) * 100);

  const saveCoverDraft = useCallback(async (isAutosave = false) => {
    if (isAutosave && draftBusyRef.current) return;
    try {
      if (isAutosave) draftBusyRef.current = true;
      await fetch('/api/drafts/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'cover:draft',
          content: {
            fields: { recipient, company, role, greeting, opening, body, closing, signoff, portfolio },
            coverId: coverId || null,
            savedAt: new Date().toISOString(),
          },
        }),
      });
    } catch {} finally { draftBusyRef.current = false; }
  }, [recipient, company, role, greeting, opening, body, closing, signoff, portfolio, coverId]);

  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => saveCoverDraft(true), 1400);
  }, [saveCoverDraft]);

  const showBriefToast = (msg) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2400);
  };

  const resetCoverBuilder = () => {
    setRecipient('Hiring Manager');
    setCompany('');
    setRole('');
    setGreeting('Dear Hiring Manager,');
    setOpening('');
    setBody('');
    setClosing('');
    setSignoff('Looking forward to speaking with you,');
    setPortfolio('');
    setCoverId(null);
    setSaveState('idle');
    showBriefToast('Fresh cover draft started.');
    triggerAutoSave();
  };

  const clearJobFire = () => {
    setJd('');
    setJdStatus('');
    triggerAutoSave();
  };

  const saveCoverToDb = async () => {
    setSaveState('saving');
    try {
      const res = await fetch('/api/cover/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: coverId,
          name: coverName,
          content: JSON.stringify({ ...letterData, fields: { recipient, company, role, greeting, opening, body, closing, signoff, portfolio } }),
          setPrimary: true,
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      const data = await res.json();
      if (data?.cover?.id) setCoverId(data.cover.id);
      setSaveState('saved');
      setSaveEventAt(new Date().toISOString());
      setTimeout(() => setSaveState('idle'), 2000);
    } catch {
      setSaveState('error');
      setTimeout(() => setSaveState('idle'), 3000);
    }
  };

  const handleSaveClick = async () => { await saveCoverToDb(); };

  const handleCoverUpdate = useCallback((field, value) => {
    switch (field) {
      case 'recipient': setRecipient(value); break;
      case 'company': setCompany(value); break;
      case 'greeting': setGreeting(value); break;
      case 'opening': setOpening(value); break;
      case 'body': setBody(value); break;
      case 'closing': setClosing(value); break;
      case 'signoff': setSignoff(value); break;
      case 'portfolio': setPortfolio(value); break;
      default: break;
    }
    triggerAutoSave();
  }, [triggerAutoSave]);

  const handleFireFieldChange = (setter) => (e) => {
    setter(e.target.value);
    triggerAutoSave();
  };

  const runAITailor = useCallback(async () => {
    if (!jd?.trim()) return;
    setIsAiLoading(true);
    try {
      const name = formData?.fullName || formData?.name || '';
      const resumeSummary = summary || '';

      const res = await fetch('/api/ats-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jdText: jd,
          resumeData: { summary: resumeSummary, skills, workExperiences: experiences, educationList },
          context: { section: 'overview', keyword: null },
          missing: {},
          coverLetterMode: true,
          coverLetterCompany: company,
          coverLetterRole: role,
          coverLetterName: name,
        }),
      });

      if (!res.ok) throw new Error('Coach unavailable');
      const data = await res.json();

      if (data?.coverLetter) {
        if (data.coverLetter.opening) setOpening(data.coverLetter.opening);
        if (data.coverLetter.body) setBody(data.coverLetter.body);
        if (data.coverLetter.closing) setClosing(data.coverLetter.closing);
        triggerAutoSave();
        return;
      }

      const openaiRes = await fetch('/api/cover/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jd,
          resume: { summary: resumeSummary, experiences, skills },
          company,
          role,
          name,
        }),
      });

      if (openaiRes.ok) {
        const generated = await openaiRes.json();
        if (generated.opening) setOpening(generated.opening);
        if (generated.body) setBody(generated.body);
        if (generated.closing) setClosing(generated.closing);
        if (generated.signoff) setSignoff(generated.signoff);
        triggerAutoSave();
      } else {
        alert('AI Tailor failed. Please try again.');
      }
    } catch (err) {
      console.error('AI Tailor failed:', err);
      alert('AI Tailor failed. Please try again.');
    } finally {
      setIsAiLoading(false);
    }
  }, [jd, experiences, summary, skills, educationList, formData, company, role, triggerAutoSave]);

  const handleFile = async (file) => {
    if (!file) return;
    setJdLoading(true);
    setJdStatus('Processing…');
    try {
      let raw = await extractTextFromFile(file);
      if (!raw || !String(raw).trim()) raw = await uploadJD(file);
      const clean = normalizeJobText(raw);
      if (!clean || !String(clean).trim()) {
        setJdStatus('Failed: PDF appears scanned/unreadable');
        return;
      }
      setJd(clean);
      setJdStatus('Loaded: Job fire from file');
      triggerAutoSave();
    } catch (e) {
      setJdStatus(`Failed: ${e?.message || 'Unknown error'}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
      setJdLoading(false);
    }
  };

  useEffect(() => {
    if (!router.isReady) return;
    if (didLoadDraftRef.current) return;
    didLoadDraftRef.current = true;

    if (isFreshNav) {
      setOpening('');
      setBody('');
      setClosing('');
      setSignoff('Looking forward to speaking with you,');
      return;
    }

    (async () => {
      try {
        const res = await fetch('/api/drafts/get?key=cover%3Adraft');
        if (!res.ok) return;
        const json = await res.json();
        const f = json?.draft?.content?.fields;
        if (!f) return;
        if (typeof f.recipient === 'string') setRecipient(f.recipient);
        if (typeof f.company === 'string') setCompany(f.company);
        if (typeof f.role === 'string') setRole(f.role);
        if (typeof f.greeting === 'string') setGreeting(f.greeting);
        if (typeof f.opening === 'string') setOpening(f.opening);
        if (typeof f.body === 'string') setBody(f.body);
        if (typeof f.closing === 'string') setClosing(f.closing);
        if (typeof f.signoff === 'string') setSignoff(f.signoff);
        if (typeof f.portfolio === 'string') setPortfolio(f.portfolio);
        if (json?.draft?.content?.coverId) setCoverId(json.draft.content.coverId);
      } catch {}
    })();
  }, [router.isReady, isFreshNav]);

  useEffect(() => {
    if (portfolio) return;
    const next = formData?.portfolio || formData?.forgeUrl || formData?.ftProfile || '';
    if (next) setPortfolio(next);
  }, [portfolio, formData?.portfolio, formData?.forgeUrl, formData?.ftProfile]);

  useEffect(() => {
    const prevent = (e) => { e.preventDefault(); e.stopPropagation(); };
    window.addEventListener('dragover', prevent);
    window.addEventListener('drop', prevent);
    return () => {
      window.removeEventListener('dragover', prevent);
      window.removeEventListener('drop', prevent);
    };
  }, []);

  useEffect(() => {
    if (saveEventAt) showBriefToast(`Saved at ${new Date(saveEventAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
  }, [saveEventAt]);

  useEffect(() => {
    if (!router.isReady || formData.forgeUrl || formData.ftProfile || formData.fullName) return;
    fetch('/api/profile/header').then(async (res) => {
      if (!res.ok) return;
      const data = await res.json();
      const derivedName = data?.name || [data?.firstName, data?.lastName].filter(Boolean).join(' ') || '';
      const slug = data?.slug;
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || derivedName || prev.name || '',
        forgeUrl: prev.forgeUrl || (slug ? `https://forgetomorrow.com/u/${slug}` : ''),
        ftProfile: prev.ftProfile || (slug ? `https://forgetomorrow.com/u/${slug}` : ''),
      }));
    }).catch(() => {});
  }, [router.isReady, formData.forgeUrl, formData.ftProfile, formData.fullName, setFormData]);

  useEffect(() => {
    if (!router.isReady) return;
    async function loadLastJd() {
      try {
        const res = await fetch('/api/drafts/get?key=ft_last_job_text');
        if (!res.ok) return;
        const json = await res.json();
        const last = json?.draft?.content;
        if (typeof last === 'string' && last) {
          setJd(last);
          setJdStatus('Loaded: Last saved job fire');
        }
      } catch {}
    }
    if (!jd) loadLastJd();
  }, [router.isReady, jd]);

  const coverIntelligenceContent = (dark = false) => (
    <>
      <div style={{ padding: '12px 16px', background: dark ? 'rgba(255,255,255,0.04)' : 'linear-gradient(135deg, rgba(255,112,67,0.15), rgba(255,112,67,0.05))', borderBottom: dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,112,67,0.15)' }}>
        <div style={{ fontWeight: 900, fontSize: 15, color: ORANGE }}>🔨 Cover Intelligence</div>
        <div style={{ fontSize: 11, color: dark ? 'rgba(255,255,255,0.55)' : '#64748B', fontWeight: 600, marginTop: 2 }}>AI tailor + resume steel + job fire</div>
      </div>

      <div style={{ padding: '12px 16px', borderBottom: dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)', display: 'grid', gap: 8 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: 11, color: dark ? 'rgba(255,255,255,0.58)' : '#64748B', marginBottom: 3 }}>Company</label>
            <input
              value={company}
              onChange={handleFireFieldChange(setCompany)}
              placeholder="Company XYZ"
              style={{ width: '100%', padding: '6px 8px', border: dark ? '1px solid rgba(255,255,255,0.14)' : '1px solid rgba(0,0,0,0.10)', borderRadius: 7, fontSize: 12, color: dark ? 'rgba(255,255,255,0.90)' : '#37474F', background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: 11, color: dark ? 'rgba(255,255,255,0.58)' : '#64748B', marginBottom: 3 }}>Role</label>
            <input
              value={role}
              onChange={handleFireFieldChange(setRole)}
              placeholder="Job title"
              style={{ width: '100%', padding: '6px 8px', border: dark ? '1px solid rgba(255,255,255,0.14)' : '1px solid rgba(0,0,0,0.10)', borderRadius: 7, fontSize: 12, color: dark ? 'rgba(255,255,255,0.90)' : '#37474F', background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: 700, fontSize: 11, color: dark ? 'rgba(255,255,255,0.58)' : '#64748B', marginBottom: 3 }}>Portfolio <span style={{ fontWeight: 500, color: dark ? 'rgba(255,255,255,0.38)' : '#94A3B8' }}>(optional)</span></label>
          <input
            type="url"
            value={portfolio}
            onChange={handleFireFieldChange(setPortfolio)}
            placeholder="https://yourwebsite.com"
            style={{ width: '100%', padding: '6px 8px', border: dark ? '1px solid rgba(255,255,255,0.14)' : '1px solid rgba(0,0,0,0.10)', borderRadius: 7, fontSize: 12, color: dark ? 'rgba(255,255,255,0.90)' : '#37474F', background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      <div style={{ padding: '12px 16px', borderBottom: dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)' }}>
        {jd ? (
          <>
            <div style={{ fontWeight: 800, fontSize: 13, color: dark ? '#60A5FA' : '#0D47A1', marginBottom: 4 }}>🔥 Job fire loaded</div>
            <div style={{ fontSize: 12, color: dark ? 'rgba(255,255,255,0.75)' : '#334155', marginBottom: 4 }}>{jd.split(/\s+/).filter(Boolean).length} words · ready to tailor</div>
            <button type="button" onClick={clearJobFire} style={{ background: 'transparent', border: 'none', color: dark ? '#F87171' : '#B91C1C', fontWeight: 800, fontSize: 12, cursor: 'pointer', textDecoration: 'underline', padding: 0, fontFamily: 'inherit' }}>Clear loaded job</button>
          </>
        ) : (
          <>
            <div style={{ fontWeight: 800, fontSize: 13, color: ORANGE, marginBottom: 6 }}>🔥 Add the fire.</div>
            <div style={{ fontSize: 12, color: dark ? 'rgba(255,255,255,0.60)' : '#475569', lineHeight: 1.6 }}>Paste or upload a job description to unlock AI tailoring.</div>
          </>
        )}
      </div>

      <div
        ref={dropRef}
        onClick={() => { if (fileInputRef.current) fileInputRef.current.value = ''; fileInputRef.current?.click(); }}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.08)' : 'rgba(187,222,251,0.95)'; }}
        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.04)' : 'rgba(227,242,253,0.85)'; }}
        onDrop={(e) => { e.preventDefault(); e.stopPropagation(); e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.04)' : 'rgba(227,242,253,0.85)'; const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
        style={{ margin: '12px 16px', padding: '14px 16px', border: dark ? '2px dashed rgba(144,202,249,0.40)' : '2px dashed rgba(144,202,249,0.95)', borderRadius: 12, textAlign: 'center', background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(227,242,253,0.85)', cursor: 'pointer' }}
      >
        <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: dark ? 'rgba(255,255,255,0.70)' : '#334155' }}>
          Drop a job description here<br />or{' '}
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (fileInputRef.current) fileInputRef.current.value = ''; fileInputRef.current?.click(); }}
            style={{ color: ORANGE, background: 'none', border: 0, fontWeight: 900, textDecoration: 'underline', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}
          >upload file</button>
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.PDF,.docx,.DOCX,.txt,.TXT"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
          style={{ display: 'none' }}
        />
        {(jdLoading || jdStatus) && <div style={{ marginTop: 8, fontSize: 12, fontWeight: 800, color: jdStatus?.startsWith?.('Failed') ? (dark ? '#F87171' : '#B91C1C') : (dark ? '#60A5FA' : '#0D47A1') }}>{jdLoading ? 'Processing…' : jdStatus}</div>}
      </div>

      {jd && (
        <div style={{ padding: '0 16px 12px' }}>
          <button
            type="button"
            onClick={runAITailor}
            disabled={isAiLoading}
            style={{ width: '100%', background: isAiLoading ? '#9CA3AF' : ORANGE, color: 'white', padding: '12px 16px', borderRadius: 12, fontWeight: 900, fontSize: 14, border: 'none', cursor: isAiLoading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(255,112,67,0.35)', fontFamily: 'inherit' }}
          >
            {isAiLoading ? '✍️ Tailoring…' : '⚡ AI Tailor to Job'}
          </button>
          <div style={{ marginTop: 6, fontSize: 11, color: dark ? 'rgba(255,255,255,0.50)' : '#64748B', lineHeight: 1.5 }}>
            Uses your resume experience + this JD to write your opening, bullets, and close.
          </div>
        </div>
      )}
    </>
  );

  return (
    <ResumeBuilderLayout title="Cover Letter Builder | ForgeTomorrow">
      <style jsx global>{`
        html, body { overflow-x: hidden; }
        .ft-compact-toolbar {
          display: grid;
          gap: 8px;
          width: 100%;
          min-width: 0;
        }
        .ft-toolbar-main-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          width: 100%;
          min-width: 0;
        }
        .ft-cover-name-group {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1 1 340px;
          min-width: 260px;
          padding: 6px 8px;
          border-radius: 14px;
          background: rgba(255,255,255,0.46);
          border: 1px solid rgba(15,23,42,0.07);
        }
        .ft-cover-name-text {
          flex: 1 1 auto;
          min-width: 0;
          height: 30px;
          display: flex;
          align-items: center;
          border-radius: 999px;
          border: 1px solid rgba(0,0,0,0.10);
          background: rgba(255,255,255,0.88);
          padding: 0 10px;
          font-size: 12px;
          font-weight: 800;
          color: #334155;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .ft-menu {
          position: relative;
          flex: 0 0 auto;
        }
        .ft-menu-summary {
          border-radius: 999px;
          padding: 6px 12px;
          font-size: 12px;
          border: 1px solid rgba(0,0,0,0.12);
          background: rgba(255,255,255,0.84);
          color: #334155;
          font-weight: 900;
          cursor: pointer;
          user-select: none;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(15,23,42,0.06);
          font-family: inherit;
        }
        .ft-menu-summary[aria-expanded="true"] {
          border-color: rgba(255,112,67,0.36);
          background: rgba(255,112,67,0.10);
          color: #C2410C;
        }
        .ft-menu-panel-portal {
          z-index: 9999;
          display: grid;
          gap: 6px;
          padding: 8px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.28);
          background: rgba(255,255,255,0.98);
          box-shadow: 0 18px 45px rgba(15,23,42,0.28);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
        .ft-menu-panel-portal button,
        .ft-menu-action {
          width: 100%;
          text-align: left;
          border-radius: 10px;
          border: 1px solid rgba(15,23,42,0.08);
          background: rgba(255,255,255,0.88);
          color: #334155;
          padding: 8px 10px;
          font-size: 12px;
          font-weight: 850;
          cursor: pointer;
          font-family: inherit;
        }
        .ft-menu-panel-portal button:hover,
        .ft-menu-action:hover {
          background: rgba(255,112,67,0.08);
          border-color: rgba(255,112,67,0.22);
          color: #C2410C;
        }
        .ft-status-inline {
          display: flex;
          align-items: center;
          gap: 5px;
          flex: 0 0 auto;
          padding: 5px 9px;
          border-radius: 999px;
          background: rgba(255,255,255,0.62);
          border: 1px solid rgba(15,23,42,0.08);
          white-space: nowrap;
        }
        @media (max-width: 1100px) {
          .ft-toolbar-main-row { gap: 7px; }
          .ft-cover-name-group {
            flex: 1 1 100%;
            min-width: 0;
            width: 100%;
          }
          .ft-menu {
            flex: 1 1 calc(50% - 8px);
            min-width: 132px;
          }
          .ft-menu-summary {
            width: 100%;
            text-align: center;
            padding: 8px 9px;
            font-size: 12px;
          }
          .ft-menu-panel-portal {
            min-width: min(260px, 92vw) !important;
          }
          .ft-status-inline {
            flex: 1 1 auto;
            justify-content: center;
          }
          .ft-resume-inline {
            flex: 1 1 auto !important;
            text-align: center !important;
            justify-content: center;
          }
        }
        @media (max-width: 1100px) {
          .ft-rb-main { grid-template-columns: 1fr !important; }
          .ft-cover-toprow, .ft-cover-philosophy { grid-template-columns: 1fr !important; }
          .ft-ad-rail-outer { display: none !important; }
          .ft-cover-intel-rail { display: none !important; }
        }
        .ft-hammer-tab {
          display: none;
        }
        .ft-hammer-backdrop {
          display: none;
        }
        .ft-hammer-drawer {
          display: none;
        }
        @media (max-width: 1100px) {
          .ft-hammer-tab {
            display: flex;
            position: fixed; right: 0; top: 50%; transform: translateY(-50%);
            z-index: 220;
            flex-direction: column; align-items: center; justify-content: center;
            width: 42px; height: 140px; padding: 0;
            border-radius: 10px 0 0 10px; border: none;
            background: linear-gradient(135deg, ${ORANGE}, #FF8A65);
            color: #fff; font-family: inherit; font-size: 18px;
            cursor: pointer;
            box-shadow: -4px 0 16px rgba(255,112,67,0.45);
            transition: right 0.3s cubic-bezier(0.32,0.72,0,1), background 0.15s;
          }
          .ft-hammer-tab.open {
            right: min(85vw, 380px);
            background: rgba(13,27,42,0.94);
            box-shadow: -6px 0 20px rgba(0,0,0,0.35);
            border: 1px solid rgba(255,112,67,0.45); border-right: none;
          }
          .ft-hammer-backdrop {
            display: block;
            position: fixed; inset: 0; z-index: 218;
            background: rgba(0,0,0,0.50); backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px);
            opacity: 0; pointer-events: none; transition: opacity 0.25s ease;
          }
          .ft-hammer-backdrop.open { opacity: 1; pointer-events: all; }
          .ft-hammer-drawer {
            position: fixed; top: 0; right: 0; bottom: 0; z-index: 219;
            width: min(85vw, 380px); max-width: 100vw;
            background: rgba(10,18,30,0.98); border-left: 1px solid rgba(255,255,255,0.10);
            box-shadow: -12px 0 40px rgba(0,0,0,0.50);
            display: flex; flex-direction: column;
            padding-top: env(safe-area-inset-top, 14px);
            padding-bottom: calc(env(safe-area-inset-bottom, 16px) + 80px);
            transform: translateX(100%);
            transition: transform 0.3s cubic-bezier(0.32,0.72,0,1);
            overflow-y: auto;
          }
          .ft-hammer-drawer.open { transform: translateX(0); }
        }
      `}</style>

      <div style={{ width: '100%', boxSizing: 'border-box' }} className="overflow-x-hidden">
        {/* TOP: title + command card */}
        <div className="ft-cover-toprow" style={{ display: 'grid', gridTemplateColumns: isFocusMode ? '1fr' : '1fr 220px', gap: 12, alignItems: 'start', marginBottom: 8, width: '100%' }}>
          <div style={{ minWidth: 0, overflow: 'visible', display: 'grid', gap: 8 }}>
            <SeekerTitleCard
              greeting={greetingText}
              title="Cover Letter Builder"
              subtitle="1 letter. 3 bullets. 100% tailored. No generic paragraphs. Only your real wins. Beats 3-paragraph letters every time."
            />
            <div style={{ ...GLASS_CARD, padding: '12px 14px', minWidth: 0, overflow: 'visible' }}>
              <div className="ft-compact-toolbar">
                <div className="ft-toolbar-main-row">
                  <div className="ft-cover-name-group">
                    <span style={GROUP_LABEL}>Cover</span>
                    <div className="ft-cover-name-text" title={coverName}>{coverName}</div>
                  </div>

                  <DropdownMenu id="actions" label="Actions" openMenu={openMenu} setOpenMenu={setOpenMenu}>
                    <button type="button" onClick={resetCoverBuilder}>New Cover</button>
                    <button type="button" onClick={handleSaveClick} style={{ background: '#16A34A', color: 'white', borderColor: 'rgba(22,163,74,0.28)' }}>
                      {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? '✓ Saved' : 'Save Cover'}
                    </button>
                  </DropdownMenu>

                  <DropdownMenu id="view" label={isFocusMode ? 'Focus' : isEditMode ? 'Edit' : 'Preview'} openMenu={openMenu} setOpenMenu={setOpenMenu}>
                    <button type="button" onClick={() => setIsEditMode(true)} style={isEditMode ? { color: '#C2410C', borderColor: 'rgba(255,112,67,0.30)', background: 'rgba(255,112,67,0.08)' } : {}}>✏️ Edit</button>
                    <button type="button" onClick={() => setIsEditMode(false)} style={!isEditMode ? { color: '#C2410C', borderColor: 'rgba(255,112,67,0.30)', background: 'rgba(255,112,67,0.08)' } : {}}>👁 Preview</button>
                    <button type="button" onClick={() => setIsFocusMode((v) => !v)} style={isFocusMode ? { color: '#C2410C', borderColor: 'rgba(255,112,67,0.30)', background: 'rgba(255,112,67,0.08)' } : {}}>{isFocusMode ? '← Exit Focus' : '🎯 Focus'}</button>
                  </DropdownMenu>

                  <DropdownMenu id="export" label="Export / Info" align="right" openMenu={openMenu} setOpenMenu={setOpenMenu}>
                    <CoverPDFButton templateId="cover-pdf" data={letterData}>
                      <div className="ft-menu-action" style={{ background: ORANGE, color: 'white', borderColor: 'rgba(255,112,67,0.28)' }}>↓ Designed PDF</div>
                    </CoverPDFButton>
                    <button type="button" onClick={() => setShowPhilosophy((v) => !v)} style={showPhilosophy ? { color: '#C2410C', borderColor: 'rgba(255,112,67,0.30)', background: 'rgba(255,112,67,0.08)' } : {}}>ℹ️ Philosophy</button>
                  </DropdownMenu>

                  <div title={coverStatus} className="ft-status-inline">
                    <div style={{ position: 'relative', width: 22, height: 22, flexShrink: 0 }}>
                      <svg width="22" height="22" viewBox="0 0 22 22">
                        <circle cx="11" cy="11" r="8" fill="none" stroke="#E5E7EB" strokeWidth="2.5" />
                        <circle
                          cx="11"
                          cy="11"
                          r="8"
                          fill="none"
                          stroke={coverStatus === 'Targeted' ? '#0EA5E9' : coverStatus === 'In Progress' ? ORANGE : '#CBD5E1'}
                          strokeWidth="2.5"
                          strokeDasharray={`${(progress / 100) * 50.3} 50.3`}
                          strokeLinecap="round"
                          style={{ transformOrigin: 'center', transform: 'rotate(-90deg)' }}
                        />
                      </svg>
                      <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 6, fontWeight: 900, color: '#374151' }}>{progress}%</span>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#64748B' }}>{coverStatus}</span>
                  </div>

                  <button
                    type="button"
                    className="ft-resume-inline"
                    onClick={() => router.push(withChrome('/resume/create'))}
                    style={{ ...PILL_BUTTON, background: 'rgba(255,112,67,0.08)', color: ORANGE, border: `1px solid rgba(255,112,67,0.25)`, fontWeight: 900, fontSize: 11, padding: '6px 11px', whiteSpace: 'nowrap', flex: '0 0 auto' }}
                    title="Return to Resume Builder"
                  >
                    ← Resume
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* AD RAIL */}
          {!isFocusMode && (
            <div className="ft-ad-rail-outer" style={{ width: '220px', height: 295, flexShrink: 0, overflow: 'hidden', borderRadius: 14 }}>
              <div className="ft-ad-rail-inner" style={{ width: 280, transform: 'scale(0.78)', transformOrigin: 'top left' }}>
                <RightRailPlacementManager slot="right_rail_1" />
              </div>
            </div>
          )}
        </div>

        {/* Philosophy panel */}
        {showPhilosophy && (
          <div className="ft-cover-philosophy" style={{ display: 'grid', gridTemplateColumns: isFocusMode ? '1fr' : '1fr 220px', gap: 12, marginBottom: 8, marginTop: -4 }}>
            <div style={{ ...GLASS_CARD, padding: '16px 20px', borderLeft: `3px solid ${ORANGE}`, borderTopLeftRadius: 0, borderTopRightRadius: 0, borderTop: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontWeight: 900, fontSize: 14, color: ORANGE }}>The Forge Cover Letter Philosophy</div>
                <button type="button" onClick={() => setShowPhilosophy(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>✕</button>
              </div>
              <div style={{ display: 'grid', gap: 8, fontSize: 13, color: '#334155', lineHeight: 1.6 }}>
                <div><strong style={{ color: '#111827' }}>Short = Strong.</strong> Recruiters spend <strong>6 seconds</strong> on your letter. We remove fluff, keep metrics, and make every word count.</div>
                <div><strong style={{ color: '#111827' }}>Bullets = Scan-proof.</strong> Humans don't read — they <strong>scan</strong>. 3 bullets with numbers beat 3 paragraphs every time.</div>
                <div><strong style={{ color: '#111827' }}>No "excited." Just impact.</strong> Your resume tells the story. This letter <strong>lands the punch</strong>.</div>
              </div>
            </div>
            {!isFocusMode && <div />}
          </div>
        )}

        {/* EDITOR + INTELLIGENCE GRID */}
        <div className="ft-rb-main" style={{ display: 'grid', gridTemplateColumns: isFocusMode ? '1fr' : 'minmax(0,1fr) 340px', gap: 8, alignItems: 'start' }}>
          {/* LEFT: Inline Editable Cover Letter */}
          <div style={{ ...GLASS_CARD, overflow: 'hidden' }}>
            <div style={{
              padding: '12px 18px',
              background: 'linear-gradient(135deg, rgba(255,112,67,0.16), rgba(255,138,101,0.06))',
              borderBottom: '1px solid rgba(255,112,67,0.15)',
              color: '#7A3C1E',
              fontWeight: 900,
              fontSize: 13,
              letterSpacing: 0.3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ fontSize: 15 }}>{isEditMode ? '✍️' : '👁'}</span>
                {isEditMode ? 'Live Cover Letter Editor' : 'Cover Letter Preview'}
              </span>
              {isEditMode && <span style={{ fontSize: 11, fontWeight: 700, color: '#9A5A36', opacity: 0.85 }}>Click any section to edit</span>}
            </div>
            <div id="cover-pdf" style={{ padding: isEditMode ? 20 : 32, background: '#fff', minHeight: 760, overflowY: 'auto' }}>
              <CoverLetterTemplate
                data={letterData}
                isEditMode={isEditMode}
                onUpdate={handleCoverUpdate}
              />
            </div>
          </div>

          {/* RIGHT: Cover Intelligence Rail — desktop only */}
          {!isFocusMode && (
            <div className="ft-cover-intel-rail" style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 20, alignSelf: 'start' }}>
              <div style={{ ...GLASS_CARD, overflow: 'hidden' }}>
                {coverIntelligenceContent(false)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile Hammer pull-tab + drawer ───────────────────────────────────── */}
      <button
        type="button"
        className={`ft-hammer-tab${hammerOpen ? ' open' : ''}`}
        onClick={() => setHammerOpen((o) => !o)}
        aria-label="Toggle Cover Intelligence"
      >
        <img
          src="/icons/hammer-tab.png"
          alt="Forge Hammer"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      </button>

      <div
        className={`ft-hammer-backdrop${hammerOpen ? ' open' : ''}`}
        onClick={() => setHammerOpen(false)}
      />

      <div className={`ft-hammer-drawer${hammerOpen ? ' open' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 16, color: ORANGE }}>🔨 Cover Intelligence</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.50)', marginTop: 2 }}>AI tailor + resume steel + job fire</div>
          </div>
          <button onClick={() => setHammerOpen(false)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: 'rgba(255,255,255,0.60)', width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontFamily: 'inherit' }}>×</button>
        </div>
        {coverIntelligenceContent(true)}
      </div>

      {/* Toast */}
      {showToast && (
        <div style={{ position: 'fixed', right: 28, bottom: 28, background: ORANGE, color: 'white', padding: '12px 22px', borderRadius: 12, fontWeight: 700, boxShadow: '0 10px 30px rgba(0,0,0,0.3)', zIndex: 1000, fontSize: 14 }}>
          {toastMsg}
        </div>
      )}
    </ResumeBuilderLayout>
  );
}
