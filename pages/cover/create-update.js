// pages/cover/create-update.js
// Cover Letter Builder — mirrors resume builder layout exactly
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
import { normalizeJobText } from '@/lib/jd/ingest';

const CoverLetterTemplate = dynamic(() => import('@/components/cover-letter/CoverLetterTemplate'), { ssr: false });

const ORANGE = '#FF7043';
const MAX_RESUMES = 4;

const DRAFT_KEYS = {
  LAST_JOB_TEXT: 'ft_last_job_text',
  ATS_PACK: 'forge-ats-pack',
  LAST_UPLOADED_RESUME_TEXT: 'ft_last_uploaded_resume_text',
};

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

const TOOL_GROUP = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  flexWrap: 'wrap',
  padding: '6px 8px',
  borderRadius: 14,
  background: 'rgba(255,255,255,0.46)',
  border: '1px solid rgba(15,23,42,0.07)',
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


export default function CoverLetterPage() {
  const router = useRouter();
  const chrome = String(router.query.chrome || '').toLowerCase();
  const withChrome = (path) => (chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path);

  const fileInputRef = useRef(null);
  const dropRef = useRef(null);
  const hasAppliedUploadRef = useRef(false);
  const autoSaveTimer = useRef(null);
  const resumeDataRef = useRef(null);

  const {
    formData, setFormData,
    summary,
    experiences,
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
  const [coverId, setCoverId] = useState(null);
  const draftBusyRef = useRef(false);
  const didLoadDraftRef = useRef(false);

  const [jd, setJd] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [jdLoading, setJdLoading] = useState(false);
  const [jdStatus, setJdStatus] = useState('');
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [saveState, setSaveState] = useState('idle');

  // ─── Resume data ──────────────────────────────────────────────────────────
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

  // ─── Cover draft load on mount ────────────────────────────────────────────
  useEffect(() => {
    if (didLoadDraftRef.current) return;
    didLoadDraftRef.current = true;
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
  }, []);

  // ─── Sync portfolio from formData ─────────────────────────────────────────
  useEffect(() => {
    if (portfolio) return;
    const next = formData?.portfolio || formData?.forgeUrl || formData?.ftProfile || '';
    if (next) setPortfolio(next);
  }, [portfolio, formData?.portfolio, formData?.forgeUrl, formData?.ftProfile]);

  // ─── Cover save ──────────────────────────────────────────────────────────
  const coverName = (() => {
    const c = (company || '').trim();
    const r = (role || '').trim();
    if (c && r) return `${c} — ${r}`;
    if (c) return `${c} — Cover Letter`;
    if (r) return `${r} — Cover Letter`;
    return 'General Cover Letter';
  })();

  const saveCoverDraft = useCallback(async (isAutosave = false) => {
    if (isAutosave && draftBusyRef.current) return;
    try {
      if (isAutosave) draftBusyRef.current = true;
      await fetch('/api/drafts/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'cover:draft',
          content: { fields: { recipient, company, role, greeting, opening, body, closing, signoff, portfolio }, coverId: coverId || null, savedAt: new Date().toISOString() },
        }),
      });
    } catch {} finally { draftBusyRef.current = false; }
  }, [recipient, company, role, greeting, opening, body, closing, signoff, portfolio, coverId]);

  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => saveCoverDraft(true), 1400);
  }, [saveCoverDraft]);

  const saveCoverToDb = async () => {
    setSaveState('saving');
    try {
      const res = await fetch('/api/cover/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: coverId, name: coverName,
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

  // ─── AI Tailor ────────────────────────────────────────────────────────────
  const runAITailor = useCallback(async () => {
    if (!jd?.trim()) return;
    setIsAiLoading(true);
    try {
      const expText = (experiences || [])
        .map((exp) => `${exp.jobTitle || exp.title || 'Role'} at ${exp.company || 'Company'}: ${exp.bullets?.join('. ') || ''}`)
        .filter(Boolean).join('\n');
      const prompt = [
        'You are a brutal, direct cover letter AI. Write:',
        '- 1 opening sentence (12 words max)',
        '- 3 bullet points (10 words max each)',
        '- 1 closing sentence (8 words max)',
        'Use ONLY real candidate achievements with numbers. Match job exactly. No fluff.',
        'JOB:', jd,
        'CANDIDATE:', expText || 'No experience data',
        'OUTPUT FORMAT:', 'OPENING: ...', 'BULLET1: ...', 'BULLET2: ...', 'BULLET3: ...', 'CLOSING: ...',
      ].join('\n');
      const res = await fetch('/api/ai-tailor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) });
      const text = await res.text();
      const lines = text.split('
').map((l) => l.trim());
      const openingLine = lines.find((l) => l.startsWith('OPENING:'))?.replace('OPENING:', '').trim() || '';
      const bullets = lines.filter((l) => l.match(/^BULLET[1-3]:/)).map((l) => l.replace(/^BULLET\d+:/, '').trim()).filter(Boolean);
      const closingLine = lines.find((l) => l.startsWith('CLOSING:'))?.replace('CLOSING:', '').trim() || '';
      setOpening(openingLine); setBody(bullets.join('
')); setClosing(closingLine);
      triggerAutoSave();
    } catch { alert('AI Tailor failed. Try again.'); }
    finally { setIsAiLoading(false); }
  }, [jd, experiences, triggerAutoSave]);

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const getDraft = async (key) => {
    try {
      const res = await fetch(`/api/drafts/get?key=${encodeURIComponent(key)}`);
      if (!res.ok) return null;
      return (await res.json())?.draft?.content ?? null;
    } catch { return null; }
  };

  const saveDraft = async (key, content) => {
    try { await fetch('/api/drafts/set', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({key,content}) }); } catch {}
  };

  const showBriefToast = (msg) => {
    setToastMsg(msg); setShowToast(true);
    setTimeout(() => setShowToast(false), 2400);
  };

  const normalizeSavedResumePayload = (payload) => {
    if (!payload || typeof payload !== 'object') return null;

    const row = payload.resume || payload.item || payload.document || payload;

    if (row?.content) {
      try {
        const parsed = typeof row.content === 'string' ? JSON.parse(row.content) : row.content;
        if (parsed?.data && typeof parsed.data === 'object') return parsed.data;
        if (parsed && typeof parsed === 'object') return parsed;
      } catch {
        return row;
      }
    }

    if (row?.data && typeof row.data === 'object') return row.data;

    return row;
  };

  const applyResumePayloadToState = (payload) => {
    const source = normalizeSavedResumePayload(payload);
    if (!source || typeof source !== 'object') return false;

    const sf = source.formData || source.personalInfo || source.contact || {};
    setFormData((prev) => ({
      ...prev,
      ...(sf || {}),
      fullName: sf.fullName || sf.name || source.fullName || source.name || prev.fullName || prev.name || '',
      targetedRole: sf.targetedRole ?? source.targetedRole ?? prev.targetedRole ?? '',
      email: sf.email ?? source.email ?? prev.email ?? '',
      phone: sf.phone ?? source.phone ?? prev.phone ?? '',
      location: sf.location ?? source.location ?? prev.location ?? '',
      portfolio: sf.portfolio ?? source.portfolio ?? prev.portfolio ?? '',
      forgeUrl: sf.ftProfile ?? sf.forgeUrl ?? source.ftProfile ?? source.forgeUrl ?? prev.forgeUrl ?? '',
      ftProfile: sf.ftProfile ?? sf.forgeUrl ?? source.ftProfile ?? source.forgeUrl ?? prev.ftProfile ?? '',
    }));

    if (typeof source.summary === 'string') setSummary(source.summary);
    if (Array.isArray(source.experiences || source.workExperiences)) setExperiences(source.experiences || source.workExperiences);
    if (Array.isArray(source.educationList || source.education)) setEducationList(source.educationList || source.education);
    if (Array.isArray(source.skills)) setSkills(source.skills);
    if (Array.isArray(source.projects)) setProjects(source.projects);
    if (Array.isArray(source.certifications)) setCertifications(source.certifications);
    if (Array.isArray(source.customSections)) setCustomSections(source.customSections);
    if (Array.isArray(source.languages)) setLanguages(source.languages);
    return true;
  };

  const fetchResumeById = async (resumeId) => {
    const id = String(resumeId || '').trim();
    if (!id) return null;

    try {
      const res = await fetch('/api/resume/list');
      if (!res.ok) return null;

      const json = await res.json();
      return (json?.resumes || []).find((r) => String(r?.id) === id) || null;
    } catch {
      return null;
    }
  };

;

  const clearJobFire = () => { setJd(''); setJdStatus(''); };

  const resetResumeBuilder = async () => {
    if (!confirm('Start a fresh resume draft? Unsaved changes on this draft may be lost.')) return;

    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);

    const preservedName = formData.fullName || formData.name || '';
    const preservedEmail = formData.email || '';
    const preservedPhone = formData.phone || '';
    const preservedLocation = formData.location || '';
    const preservedForgeUrl = formData.forgeUrl || formData.ftProfile || '';
    const preservedExternalUrl = formData.externalurl || '';
    const preservedGithub = formData.github || '';
    const preservedPortfolio = formData.portfolio || '';

    setSelectedResumeId('');
    .current = false;
    hasAppliedUploadRef.current = false;

    setFormData((prev) => ({
      ...prev,
      fullName: preservedName,
      name: preservedName,
      email: preservedEmail,
      phone: preservedPhone,
      location: preservedLocation,
      externalurl: preservedExternalUrl,
      github: preservedGithub,
      portfolio: preservedPortfolio,
      forgeUrl: preservedForgeUrl,
      ftProfile: preservedForgeUrl,
      targetedRole: '',
    }));

    setSummary('');
    setExperiences([]);
    setProjects([]);
    if (typeof setVolunteerExperiences === 'function') setVolunteerExperiences([]);
    setEducationList([]);
    setCertifications([]);
    setLanguages([]);
    setSkills([]);
    if (typeof setAchievements === 'function') setAchievements([]);
    setCustomSections([]);

    setSaveState('idle');
    setResumeUploadState('idle');
    setPreviewMode('standard');
    setIsEditMode(true);
    setIsFocusMode(false);

    await clearJobFire();

    try {
      if (typeof deleteResumeDraft === 'function') await deleteResumeDraft();
    } catch {}

    showBriefToast('Fresh resume draft started.');
    await router.push(withChrome(`/resume/create?template=${isHybrid ? 'hybrid' : 'reverse'}`));
  };

  // ─── Effects ──────────────────────────────────────────────────────────────
  useEffect(()=>{
    const prevent=(e)=>{e.preventDefault();e.stopPropagation();};
    window.addEventListener('dragover',prevent); window.addEventListener('drop',prevent);
    return ()=>{window.removeEventListener('dragover',prevent);window.removeEventListener('drop',prevent);};
  },[]);

  useEffect(()=>{ if(saveEventAt) showBriefToast(`Saved at ${new Date(saveEventAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}`); },[saveEventAt]);

  // ─── Effects ──────────────────────────────────────────────────────────────
  useEffect(()=>{
    const prevent=(e)=>{e.preventDefault();e.stopPropagation();};
    window.addEventListener('dragover',prevent); window.addEventListener('drop',prevent);
    return ()=>{window.removeEventListener('dragover',prevent);window.removeEventListener('drop',prevent);};
  },[]);

  useEffect(()=>{ if(saveEventAt) showBriefToast(`Saved at ${new Date(saveEventAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}`); },[saveEventAt]);

  // Load profile identity if missing
  useEffect(()=>{
    if(!router.isReady||formData.forgeUrl||formData.ftProfile||formData.fullName) return;
    fetch('/api/profile/header').then(async(res)=>{
      if(!res.ok) return; const data=await res.json();
      const derivedName=data?.name||[data?.firstName,data?.lastName].filter(Boolean).join(' ')||'';
      const slug=data?.slug;
      setFormData((prev)=>({...prev,fullName:prev.fullName||derivedName||prev.name||'',forgeUrl:prev.forgeUrl||(slug?`https://forgetomorrow.com/u/${slug}`:''),ftProfile:prev.ftProfile||(slug?`https://forgetomorrow.com/u/${slug}`:'')}));
    }).catch(()=>{});
  },[router.isReady]);

  // Load last saved JD fire
  useEffect(()=>{
    if(!router.isReady) return;
    async function loadLastJd(){
      try{const res=await fetch('/api/drafts/get?key=ft_last_job_text');if(!res.ok) return;const json=await res.json();const last=json?.draft?.content;if(typeof last==='string'&&last){setJd(last);setJdStatus('Loaded: Last saved job fire');}}catch{}
    }
    if(!jd) loadLastJd();
  },[router.isReady]);

  // ─── File handler ─────────────────────────────────────────────────────────
  const handleFile = async(file)=>{
    if(!file) return;
    setJdLoading(true); setJdStatus('Processing…');
    try{
      let raw=await extractTextFromFile(file);
      if(!raw||!String(raw).trim()) raw=await uploadJD(file);
      const clean=normalizeJobText(raw);
      if(!clean||!String(clean).trim()){setJdStatus('Failed: PDF appears scanned/unreadable');return;}
      setJd(clean); await saveDraft(DRAFT_KEYS.LAST_JOB_TEXT,clean); setJdStatus('Loaded: Job fire from file');
    }catch(e){setJdStatus(`Failed: ${e?.message||'Unknown error'}`);}
    finally{if(fileInputRef.current) fileInputRef.current.value=''; setJdLoading(false);}
  };


  // ─── Derived ──────────────────────────────────────────────────────────────
  
  const guessedFireTitle = jd ? jd.split('\n').map(s => s.trim()).filter(Boolean)[0]?.slice(0, 80) || 'Job description' : 'Job description';
  const fireTitle = fireMeta?.title || guessedFireTitle;
  const greeting = getTimeGreeting();
  const savedTime = saveEventAt ? new Date(saveEventAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : '';

  const hasCoverContent = !!(company || role || opening || body);
  const coverStatus = !hasCoverContent ? 'Draft' : jd ? 'Targeted' : 'In Progress';
  const coverStatusStyles = coverStatus==='Targeted'
    ? {color:'#0EA5E9',background:'rgba(14,165,233,0.10)',border:'1px solid rgba(14,165,233,0.30)'}
    : coverStatus==='In Progress'
    ? {color:ORANGE,background:'rgba(255,112,67,0.10)',border:`1px solid rgba(255,112,67,0.30)`}
    : {color:'#94A3B8',background:'rgba(148,163,184,0.10)',border:'1px solid rgba(148,163,184,0.30)'};
  // ─── Cover save handler ───────────────────────────────────────────────────
  const handleSaveClick = async () => { await saveCoverToDb(); };

  // ─── Derived ──────────────────────────────────────────────────────────────

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <ResumeBuilderLayout title="Cover Letter Builder | ForgeTomorrow">
      <style jsx global>{`
        html, body { overflow-x: hidden; }
        @media (max-width: 1100px) { .ft-rb-main { grid-template-columns: 1fr !important; } }
      `}</style>

      <div style={{width:'100%',boxSizing:'border-box'}} className="overflow-x-hidden">

        {/* TOP: title + command card */}
        <div style={{display:'grid',gridTemplateColumns:isFocusMode?'1fr':'1fr 220px',gap:12,alignItems:'start',marginBottom:8,width:'100%'}}>
          <div style={{minWidth:0,display:'grid',gap:8}}>
            <SeekerTitleCard
              greeting={greeting}
              title="Cover Letter Builder"
              subtitle="1 letter. 3 bullets. 100% tailored. No generic paragraphs. Only your real wins. Beats 3-paragraph letters every time."
            />
            <div style={{...GLASS_CARD,padding:'14px 18px'}}>
              {/* Row 1 — step indicator + cover name */}
              <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:8}}>
                <button type="button" onClick={()=>router.push(withChrome('/resume/create'))}
                  style={{borderRadius:999,padding:'5px 14px',fontSize:12,border:'1px solid rgba(0,0,0,0.12)',background:'rgba(255,255,255,0.80)',color:'#334155',fontWeight:800,cursor:'pointer'}}>
                  ← Resume
                </button>
                <span style={{fontSize:11,color:'#94A3B8',fontWeight:700}}>→</span>
                <span style={{borderRadius:999,padding:'5px 14px',fontSize:12,background:'rgba(255,112,67,0.12)',color:ORANGE,border:`1px solid rgba(255,112,67,0.30)`,fontWeight:900}}>
                  ✍️ Cover Letter
                </span>
                <span style={{width:1,height:20,background:'rgba(0,0,0,0.10)',margin:'0 4px',flexShrink:0}}/>
                <span style={{fontWeight:900,fontSize:13,color:'#111827',whiteSpace:'nowrap'}}>Cover:</span>
                <span style={{fontSize:13,fontWeight:700,color:'#334155',maxWidth:220,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{coverName}</span>
                {savedTime&&<span style={{fontSize:11,color:'#94A3B8',fontWeight:600}}>· Saved {savedTime}</span>}
              </div>
              {/* Row 2 — actions */}
              <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                <button type="button" onClick={handleSaveClick}
                  style={{background:'#16A34A',color:'white',padding:'5px 11px',borderRadius:999,fontWeight:800,fontSize:12,border:'none',cursor:'pointer'}}>
                  {saveState==='saving'?'Saving…':saveState==='saved'?'✓ Saved':'Save Cover'}
                </button>
                <CoverPDFButton templateId="cover-pdf" data={letterData}>
                  <div style={{background:ORANGE,color:'white',padding:'5px 11px',borderRadius:999,fontWeight:800,fontSize:12,cursor:'pointer'}}>Designed PDF</div>
                </CoverPDFButton>
                <span style={{width:1,height:20,background:'rgba(0,0,0,0.10)',margin:'0 4px',flexShrink:0}}/>
                <button type="button" onClick={()=>setIsFocusMode(v=>!v)}
                  style={{borderRadius:999,padding:'5px 11px',fontSize:12,border:isFocusMode?`2px solid ${ORANGE}`:'1px solid rgba(0,0,0,0.12)',background:isFocusMode?'rgba(255,112,67,0.12)':'rgba(255,255,255,0.80)',color:isFocusMode?'#C2410C':'#334155',fontWeight:800,cursor:'pointer',transition:'all 0.2s'}}>
                  {isFocusMode?'← Exit Focus':'🎯 Focus'}
                </button>
              </div>
            </div>
          </div>

          {/* AD RAIL */}
          {!isFocusMode&&(
            <div style={{width:'220px',height:295,flexShrink:0,overflow:'hidden',borderRadius:14}}>
              <div style={{width:280,transform:'scale(0.78)',transformOrigin:'top left'}}>
                <RightRailPlacementManager slot="right_rail_1"/>
              </div>
            </div>
          )}
        </div>

        {/* EDITOR + INTELLIGENCE GRID */}
        <div className="ft-rb-main" style={{display:'grid',gridTemplateColumns:isFocusMode?'1fr':'minmax(0,1fr) 340px',gap:8,alignItems:'start'}}>

          {/* LEFT: Cover Letter Editor */}
          <div style={{...GLASS_CARD,overflow:'hidden'}}>
            <div style={{padding:'10px 16px',background:'linear-gradient(180deg, rgba(38,50,56,0.92), rgba(38,50,56,0.70))',color:'white',fontWeight:900,fontSize:13,letterSpacing:0.4}}>
              ✍️ COVER LETTER EDITOR
            </div>
            <div id="cover-pdf" style={{padding:20,background:'#fff',minHeight:760,overflowY:'auto'}}>
              <CoverLetterTemplate data={letterData} />
            </div>
          </div>

          {/* RIGHT: Cover Intelligence Rail */}
          {!isFocusMode&&(
            <div style={{display:'flex',flexDirection:'column',gap:12,position:'sticky',top:20,alignSelf:'start'}}>

              {/* Identity + Job Target */}
              <div style={{...GLASS_CARD,overflow:'hidden'}}>
                <div style={{padding:'12px 16px',background:'linear-gradient(135deg, rgba(255,112,67,0.15), rgba(255,112,67,0.05))',borderBottom:'1px solid rgba(255,112,67,0.15)'}}>
                  <div style={{fontWeight:900,fontSize:15,color:ORANGE}}>✍️ Cover Intelligence</div>
                  <div style={{fontSize:11,color:'#64748B',fontWeight:600,marginTop:2}}>letter fields + job fire + AI tailor</div>
                </div>

                {/* Fields */}
                <div style={{padding:'12px 16px',borderBottom:'1px solid rgba(0,0,0,0.06)',display:'grid',gap:8}}>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                    <div>
                      <label style={{display:'block',fontWeight:700,fontSize:11,color:'#64748B',marginBottom:3}}>Company</label>
                      <input value={company} onChange={e=>setCompany(e.target.value)} placeholder="Company XYZ"
                        style={{width:'100%',padding:'7px 10px',border:'1px solid rgba(0,0,0,0.10)',borderRadius:8,fontSize:12,color:'#37474F',background:'rgba(255,255,255,0.9)',outline:'none',boxSizing:'border-box'}}/>
                    </div>
                    <div>
                      <label style={{display:'block',fontWeight:700,fontSize:11,color:'#64748B',marginBottom:3}}>Role</label>
                      <input value={role} onChange={e=>setRole(e.target.value)} placeholder="Job title"
                        style={{width:'100%',padding:'7px 10px',border:'1px solid rgba(0,0,0,0.10)',borderRadius:8,fontSize:12,color:'#37474F',background:'rgba(255,255,255,0.9)',outline:'none',boxSizing:'border-box'}}/>
                    </div>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                    <div>
                      <label style={{display:'block',fontWeight:700,fontSize:11,color:'#64748B',marginBottom:3}}>Recipient</label>
                      <input value={recipient} onChange={e=>setRecipient(e.target.value)} placeholder="Hiring Manager"
                        style={{width:'100%',padding:'7px 10px',border:'1px solid rgba(0,0,0,0.10)',borderRadius:8,fontSize:12,color:'#37474F',background:'rgba(255,255,255,0.9)',outline:'none',boxSizing:'border-box'}}/>
                    </div>
                    <div>
                      <label style={{display:'block',fontWeight:700,fontSize:11,color:'#64748B',marginBottom:3}}>Greeting</label>
                      <input value={greeting} onChange={e=>setGreeting(e.target.value)} placeholder="Dear Hiring Manager,"
                        style={{width:'100%',padding:'7px 10px',border:'1px solid rgba(0,0,0,0.10)',borderRadius:8,fontSize:12,color:'#37474F',background:'rgba(255,255,255,0.9)',outline:'none',boxSizing:'border-box'}}/>
                    </div>
                  </div>
                  <div>
                    <label style={{display:'block',fontWeight:700,fontSize:11,color:'#64748B',marginBottom:3}}>Opening <span style={{fontWeight:500,color:'#94A3B8'}}>— 1 strong sentence</span></label>
                    <textarea value={opening} onChange={e=>{setOpening(e.target.value);triggerAutoSave();}} placeholder="One strong sentence. Lead with your biggest win." rows={2}
                      style={{width:'100%',padding:'7px 10px',border:'1px solid rgba(0,0,0,0.10)',borderRadius:8,fontSize:12,color:'#37474F',background:'rgba(255,255,255,0.9)',outline:'none',resize:'vertical',fontFamily:'inherit',boxSizing:'border-box'}}/>
                  </div>
                  <div>
                    <label style={{display:'block',fontWeight:700,fontSize:11,color:'#64748B',marginBottom:3}}>Body <span style={{fontWeight:500,color:'#94A3B8'}}>— 3 bullets with numbers</span></label>
                    <textarea value={body} onChange={e=>{setBody(e.target.value);triggerAutoSave();}} placeholder={'• Win with a number
• Win with a number
• Win with a number'} rows={4}
                      style={{width:'100%',padding:'7px 10px',border:'1px solid rgba(0,0,0,0.10)',borderRadius:8,fontSize:12,color:'#37474F',background:'rgba(255,255,255,0.9)',outline:'none',resize:'vertical',fontFamily:'inherit',boxSizing:'border-box'}}/>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                    <div>
                      <label style={{display:'block',fontWeight:700,fontSize:11,color:'#64748B',marginBottom:3}}>Closing</label>
                      <textarea value={closing} onChange={e=>{setClosing(e.target.value);triggerAutoSave();}} placeholder="Let's talk." rows={2}
                        style={{width:'100%',padding:'7px 10px',border:'1px solid rgba(0,0,0,0.10)',borderRadius:8,fontSize:12,color:'#37474F',background:'rgba(255,255,255,0.9)',outline:'none',resize:'vertical',fontFamily:'inherit',boxSizing:'border-box'}}/>
                    </div>
                    <div>
                      <label style={{display:'block',fontWeight:700,fontSize:11,color:'#64748B',marginBottom:3}}>Sign-off</label>
                      <input value={signoff} onChange={e=>setSignoff(e.target.value)} placeholder="Sincerely,"
                        style={{width:'100%',padding:'7px 10px',border:'1px solid rgba(0,0,0,0.10)',borderRadius:8,fontSize:12,color:'#37474F',background:'rgba(255,255,255,0.9)',outline:'none',boxSizing:'border-box'}}/>
                    </div>
                  </div>
                  <div>
                    <label style={{display:'block',fontWeight:700,fontSize:11,color:'#64748B',marginBottom:3}}>Portfolio <span style={{fontWeight:500,color:'#94A3B8'}}>(optional)</span></label>
                    <input type="url" value={portfolio} onChange={e=>setPortfolio(e.target.value)} placeholder="https://yourwebsite.com"
                      style={{width:'100%',padding:'7px 10px',border:'1px solid rgba(0,0,0,0.10)',borderRadius:8,fontSize:12,color:'#37474F',background:'rgba(255,255,255,0.9)',outline:'none',boxSizing:'border-box'}}/>
                  </div>
                </div>

                {/* JD Fire */}
                <div style={{padding:'12px 16px',borderBottom:'1px solid rgba(0,0,0,0.06)'}}>
                  {jd ? (
                    <>
                      <div style={{fontWeight:800,fontSize:13,color:'#0D47A1',marginBottom:4}}>🔥 Job fire loaded</div>
                      <div style={{fontSize:12,color:'#334155',marginBottom:4}}>{jd.split(/\s+/).filter(Boolean).length} words · ready to tailor</div>
                      <button type="button" onClick={clearJobFire} style={{background:'transparent',border:'none',color:'#B91C1C',fontWeight:800,fontSize:12,cursor:'pointer',textDecoration:'underline',padding:0}}>Clear loaded job</button>
                    </>
                  ) : (
                    <>
                      <div style={{fontWeight:800,fontSize:13,color:ORANGE,marginBottom:6}}>🔥 Add the fire.</div>
                      <div style={{fontSize:12,color:'#475569',lineHeight:1.6}}>Paste a job description to unlock AI tailoring for this cover letter.</div>
                    </>
                  )}
                </div>

                {/* JD Drop zone */}
                <div ref={dropRef} onClick={()=>{if(fileInputRef.current) fileInputRef.current.value=''; fileInputRef.current?.click();}}
                  onDragOver={(e)=>{e.preventDefault();e.stopPropagation();e.currentTarget.style.background='rgba(187,222,251,0.95)';}}
                  onDragLeave={(e)=>{e.preventDefault();e.stopPropagation();e.currentTarget.style.background='rgba(227,242,253,0.85)';}}
                  onDrop={(e)=>{e.preventDefault();e.stopPropagation();e.currentTarget.style.background='rgba(227,242,253,0.85)';const f=e.dataTransfer.files?.[0];if(f) handleFile(f);}}
                  style={{margin:'12px 16px',padding:'14px 16px',border:'2px dashed rgba(144,202,249,0.95)',borderRadius:12,textAlign:'center',background:'rgba(227,242,253,0.85)',cursor:'pointer'}}>
                  <p style={{margin:0,fontSize:12,fontWeight:800,color:'#334155'}}>
                    Drop a job description here<br/>or{' '}
                    <button type="button" onClick={(e)=>{e.preventDefault();e.stopPropagation();if(fileInputRef.current) fileInputRef.current.value='';fileInputRef.current?.click();}}
                      style={{color:ORANGE,background:'none',border:0,fontWeight:900,textDecoration:'underline',cursor:'pointer',fontSize:12}}>upload file</button>
                  </p>
                  <input ref={fileInputRef} type="file" accept=".pdf,.PDF,.docx,.DOCX,.txt,.TXT"
                    onChange={(e)=>{const f=e.target.files?.[0];if(f) handleFile(f);e.target.value='';}}
                    style={{display:'none'}}/>
                  {(jdLoading||jdStatus)&&<div style={{marginTop:8,fontSize:12,fontWeight:800,color:jdStatus?.startsWith?.('Failed')?'#B91C1C':'#0D47A1'}}>{jdLoading?'Processing…':jdStatus}</div>}
                </div>

                {/* AI Tailor */}
                {jd&&(
                  <div style={{padding:'0 16px 12px'}}>
                    <button type="button" onClick={runAITailor} disabled={isAiLoading}
                      style={{width:'100%',background:isAiLoading?'#9CA3AF':ORANGE,color:'white',padding:'12px 16px',borderRadius:12,fontWeight:900,fontSize:14,border:'none',cursor:isAiLoading?'not-allowed':'pointer',boxShadow:'0 4px 14px rgba(255,112,67,0.35)'}}>
                      {isAiLoading?'✍️ Tailoring…':'⚡ AI Tailor to Job'}
                    </button>
                    <div style={{marginTop:6,fontSize:11,color:'#64748B',lineHeight:1.5}}>
                      Uses your resume experience + this JD to write your opening, bullets, and close.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {showToast&&(
        <div style={{position:'fixed',right:28,bottom:28,background:ORANGE,color:'white',padding:'12px 22px',borderRadius:12,fontWeight:700,boxShadow:'0 10px 30px rgba(0,0,0,0.3)',zIndex:1000,fontSize:14}}>
          {toastMsg}
        </div>
      )}
    </ResumeBuilderLayout>
  );
}