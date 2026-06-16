// pages/resume/create.js
// World-class resume builder: inline editing on the resume + permanent Forge Hammer rail
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import SeekerTitleCard from '@/components/seeker/SeekerTitleCard';
import { getTimeGreeting } from '@/lib/dashboardGreeting';
import { ResumeContext } from '@/context/ResumeContext';
import { extractTextFromFile, normalizeJobText } from '@/lib/jd/ingest';
import { uploadJD } from '@/lib/jd/uploadToApi';
import SignalResumeTestTemplate from '@/components/resume-form/templates/SignalResumeTestTemplate';
import ReverseResumeTemplate from '@/components/resume-form/templates/ReverseResumeTemplate';
import HybridResumeTemplate from '@/components/resume-form/templates/HybridResumeTemplate';

const ForgeHammerPanel = dynamic(() => import('@/components/hammer/ForgeHammerPanel'), { ssr: false });
const ReverseATSButton = dynamic(() => import('@/components/resume-form/export/ReverseATSButton'), { ssr: false });
const HybridATSButton = dynamic(() => import('@/components/resume-form/export/HybridATSButton'), { ssr: false });
const DesignedPDFButton = dynamic(() => import('@/components/resume-form/export/DesignedPDFButton'), { ssr: false });

function ResumeBuildIsolationShell({ children }) {
  return (
    <main style={{ minHeight: '100vh', padding: 16 }}>
      {children}
    </main>
  );
}

function RightRailPlacementManagerPlaceholder() {
  return (
    <div style={{ width: '100%', height: 295, borderRadius: 14, background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(15,23,42,0.08)' }} />
  );
}

// ─── SSR-safe mobile hook ─────────────────────────────────────────────────────
function useIsMobile(bp = 1100) {
  const [v, setV] = useState(false);
  useEffect(() => {
    const check = () => setV(window.innerWidth < bp);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [bp]);
  return v;
}

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


export default function CreateResumePage() {
  const router = useRouter();
  const chrome = String(router.query.chrome || '').toLowerCase();
  const withChrome = (path) => (chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path);

  const fileInputRef = useRef(null);
  const resumeFileInputRef = useRef(null);
  const dropRef = useRef(null);
  const hasAppliedUploadRef = useRef(false);
  const hasAppliedResumeLoadRef = useRef(false);
  const autoSaveTimer = useRef(null);
  const resumeDataRef = useRef(null);

  const {
    formData, setFormData,
    summary, setSummary,
    experiences, setExperiences,
    educationList, setEducationList,
    skills, setSkills,
    projects, setProjects,
    volunteerExperiences, setVolunteerExperiences,
    certifications, setCertifications,
    customSections, setCustomSections,
    languages, setLanguages,
    achievements, setAchievements,
    saveEventAt, setSaveEventAt,
    saveResume,
    deleteResumeDraft,
  } = useContext(ResumeContext);

  const [previewMode, setPreviewMode] = useState('standard');
  const [jd, setJd] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [existingResumes, setExistingResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [jdLoading, setJdLoading] = useState(false);
  const [jdStatus, setJdStatus] = useState('');
  const [atsPack, setAtsPack] = useState(null);
  const [incomingWhyScore, setIncomingWhyScore] = useState(null);
  const [atsJobMeta, setAtsJobMeta] = useState(null);
  const [atsAppliedFromContext, setAtsAppliedFromContext] = useState(false);
  const [jobMeta, setJobMeta] = useState(null);
  const [isEditMode, setIsEditMode] = useState(true);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [saveState, setSaveState] = useState('idle');
  const [resumeUploadState, setResumeUploadState] = useState('idle'); // idle | uploading | done | error
  const isMobile = useIsMobile();
  const [hammerOpen, setHammerOpen] = useState(false);
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);

  // ─── Resume data ──────────────────────────────────────────────────────────
  const resumeData = {
    personalInfo: {
      name: formData.fullName || formData.name || 'Your Name',
      targetedRole: formData.targetedRole || '',
      email: formData.email || '',
      phone: formData.phone || '',
      location: formData.location || '',
      externalurl: formData.externalurl || '',
      github: formData.github || '',
      portfolio: formData.portfolio || '',
      ftProfile: formData.forgeUrl || formData.ftProfile || '',
    },
    summary: summary || '',
    workExperiences: experiences,
    projects,
    volunteerExperiences: volunteerExperiences || [],
    educationList,
    certifications,
    skills,
    languages,
    achievements: achievements || [],
    customSections,
  };

  useEffect(() => { resumeDataRef.current = resumeData; });

  // ─── Auto-save ────────────────────────────────────────────────────────────
  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      if (!selectedResumeId) return;
      setSaveState('saving');
      try {
        const res = await fetch('/api/resume/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: selectedResumeId,
            content: { template: router.query.template === 'hybrid' ? 'hybrid' : 'reverse', data: resumeDataRef.current },
            setPrimary: false,
          }),
        });
        if (!res.ok) throw new Error('auto-save failed');
        setSaveState('saved');
        setSaveEventAt(new Date().toISOString());
        setTimeout(() => setSaveState('idle'), 2000);
      } catch {
        setSaveState('error');
        setTimeout(() => setSaveState('idle'), 3000);
      }
    }, 1400);
  }, [selectedResumeId, router.query.template, setSaveEventAt]);

  // ─── onUpdate: wires inline editing to context ────────────────────────────
  const handleResumeUpdate = useCallback((field, value) => {
    switch (field) {
      case 'personalInfo':
        setFormData((prev) => ({ ...prev, fullName: value.name || prev.fullName, targetedRole: value.targetedRole ?? prev.targetedRole, email: value.email ?? prev.email, phone: value.phone ?? prev.phone, location: value.location ?? prev.location, portfolio: value.portfolio ?? prev.portfolio }));
        break;
      case 'summary': setSummary(value); break;
      case 'workExperiences': setExperiences(value); break;
      case 'projects': setProjects(value); break;
      case 'educationList': setEducationList(value); break;
      case 'certifications': setCertifications(value); break;
      case 'skills': setSkills(value); break;
      case 'languages': setLanguages(value); break;
      case 'customSections': setCustomSections(value); break;
    }
    triggerAutoSave();
  }, [triggerAutoSave, setFormData, setSummary, setExperiences, setProjects, setEducationList, setCertifications, setSkills, setLanguages, setCustomSections]);

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

  const buildResumeCreateHref = (template) => {
    const params = new URLSearchParams();
    Object.entries(router.query||{}).forEach(([k,v])=>{ if(!v&&v!==0) return; if(Array.isArray(v)) v.forEach((x)=>params.append(k,String(x))); else params.set(k,String(v)); });
    params.set('template',template);
    return withChrome(`/resume/create${params.toString()?`?${params.toString()}`:''}`);
  };

  const clearJobFire = async () => {
    setJd(''); setJdStatus(''); setAtsPack(null); setIncomingWhyScore(null); setAtsJobMeta(null); setJobMeta(null);
    setAtsAppliedFromContext(true); hasAppliedUploadRef.current=false;
    try { await saveDraft(DRAFT_KEYS.LAST_JOB_TEXT,''); await saveDraft(DRAFT_KEYS.ATS_PACK,null); } catch {}
  };

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
    hasAppliedResumeLoadRef.current = false;
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

  useEffect(()=>{
    async function loadList() {
      try {
        const res=await fetch('/api/resume/list'); if(!res.ok) return;
        const json=await res.json(); const list=json?.resumes||[];
        setExistingResumes(list);

        const cur=String(router.query.resumeId||'').trim();
        if (cur) {
          setSelectedResumeId(cur);
          return;
        }

        if(!selectedResumeId&&list.length>0) {
          setSelectedResumeId(String(list[0].id));
        }
      } catch {}
    }
    loadList();
  },[router.query.resumeId]);

  useEffect(()=>{
    if(!router.isReady) return;
    const resumeId=String(router.query.resumeId||'').trim();
    if(!resumeId||hasAppliedResumeLoadRef.current===resumeId) return;
    let cancelled=false;
    fetchResumeById(resumeId).then((payload)=>{
      if(cancelled||!payload) return;
      if(applyResumePayloadToState(payload)){ hasAppliedResumeLoadRef.current=resumeId; hasAppliedUploadRef.current=true; setSelectedResumeId(resumeId); }
    });
    return ()=>{cancelled=true;};
  },[router.isReady,router.query.resumeId]);

  useEffect(()=>{
    if(!router.isReady||formData.forgeUrl||formData.ftProfile||formData.fullName) return;
    fetch('/api/profile/header').then(async(res)=>{
      if(!res.ok) return; const data=await res.json();
      const derivedName=data?.name||[data?.firstName,data?.lastName].filter(Boolean).join(' ')||'';
      const slug=data?.slug;
      setFormData((prev)=>({...prev,fullName:prev.fullName||derivedName||prev.name||'',forgeUrl:prev.forgeUrl||(slug?`https://forgetomorrow.com/u/${slug}`:''),ftProfile:prev.ftProfile||(slug?`https://forgetomorrow.com/u/${slug}`:'')}));
    }).catch(()=>{});
  },[router.isReady]);

  useEffect(()=>{
    if(!router.isReady) return;
    const jobId=String(router.query.jobId||'').trim(); if(!jobId){setJobMeta(null);return;}
    let cancelled=false;
    fetch(`/api/jobs?jobId=${encodeURIComponent(jobId)}`).then(async(res)=>{
      if(!res.ok||cancelled) return; const data=await res.json(); const job=data?.job;
      if(!job||cancelled) return; setJobMeta({title:job.title||'',company:job.company||'',location:job.location||''});
    }).catch(()=>{});
    return ()=>{cancelled=true;};
  },[router.isReady,router.query.jobId]);

  useEffect(()=>{
    if(!router.isReady||atsAppliedFromContext) return;
    const {from}=router.query||{};
    async function applyAtsContext(){
      let applied=false;
      if(String(from||'').toLowerCase()==='ats'){
        try{
          const pack=await getDraft(DRAFT_KEYS.ATS_PACK);
          if(pack){
            setAtsPack(pack||null);
            if(typeof pack?.whyScore === 'number') setIncomingWhyScore(pack.whyScore);
            else setIncomingWhyScore(null);
            if(pack?.job) setAtsJobMeta({title:pack.job.title||'',company:pack.job.company||'',location:pack.job.location||''});
            if(pack?.job?.description&&!jd){const clean=normalizeJobText(pack.job.description);setJd(clean);await saveDraft(DRAFT_KEYS.LAST_JOB_TEXT,clean);setJdStatus('Loaded: Job fire from ATS context');applied=true;}
          }
        }catch{}
      }
      if(!applied&&!jd){try{const last=await getDraft(DRAFT_KEYS.LAST_JOB_TEXT);if(typeof last==='string'&&last){setJd(last);setJdStatus('Loaded: Last saved job fire');}}catch{}}
      setAtsAppliedFromContext(true);
    }
    applyAtsContext();
  },[router.isReady,router.query,jd,atsAppliedFromContext]);

  useEffect(()=>{
    if(!router.isReady||hasAppliedUploadRef.current) return;
    const {uploaded,resumeId}=router.query||{};
    if(resumeId) return;
    if(String(uploaded||'').toLowerCase()!=='1'&&String(uploaded||'').toLowerCase()!=='true') return;
    async function applyUploaded(){
      try{
        const raw=await getDraft(DRAFT_KEYS.LAST_UPLOADED_RESUME_TEXT);
        const text=typeof raw==='string'?raw:(raw&&typeof raw==='object'&&typeof raw.text==='string'?raw.text:'');
        if(!text) return;
        const res=await fetch('/api/resume/parse',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text})});
        if(res.ok){const parsed=await res.json();applyResumePayloadToState(parsed);}
        hasAppliedUploadRef.current=true;
      }catch{}
    }
    applyUploaded();
  },[router.isReady,router.query]);

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

  // ─── Resume upload handler ───────────────────────────────────────────────
  const handleResumeFile = async (file) => {
    if (!file) return;
    setResumeUploadState('uploading');
    try {
      // Extract text from the uploaded resume file
      let raw = await extractTextFromFile(file);
      if (!raw || !String(raw).trim()) {
        setResumeUploadState('error');
        showBriefToast('Could not read this file. Try a .docx or text-based PDF.');
        return;
      }

      // Parse the resume text into structured data
      const res = await fetch('/api/resume/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: raw.trim() }),
      });

      if (!res.ok) {
        setResumeUploadState('error');
        showBriefToast('Resume parsing failed. Try again.');
        return;
      }

      const parsed = await res.json();
      const applied = applyResumePayloadToState(parsed);

      if (applied) {
        setResumeUploadState('done');
        showBriefToast('Resume imported — review and edit below.');
        hasAppliedUploadRef.current = true;
        triggerAutoSave();
      } else {
        setResumeUploadState('error');
        showBriefToast('Could not parse resume fields. Try editing manually.');
      }
    } catch (e) {
      setResumeUploadState('error');
      showBriefToast(`Upload failed: ${e?.message || 'Unknown error'}`);
    } finally {
      if (resumeFileInputRef.current) resumeFileInputRef.current.value = '';
      setTimeout(() => setResumeUploadState('idle'), 3000);
    }
  };

  // ─── Derived ──────────────────────────────────────────────────────────────
  const isHybrid = router.query.template==='hybrid';
  const fireMeta = atsJobMeta||jobMeta;
  const guessedFireTitle = jd ? jd.split('\n').map(s => s.trim()).filter(Boolean)[0]?.slice(0, 80) || 'Job description' : 'Job description';
  const fireTitle = fireMeta?.title || guessedFireTitle;
  const greeting = getTimeGreeting();
  const hasRealAts = !!(atsPack?.ats&&typeof atsPack.ats.score==='number'&&!/demo|sample/i.test(atsPack.ats.summary||''));
  const savedTime = saveEventAt?new Date(saveEventAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):'';

  const hasAnyContent=(formData&&(formData.email||formData.phone||formData.location||formData.fullName))||(summary&&summary.trim().length>0)||(skills&&skills.length>0)||(experiences&&experiences.some((e)=>e.title||e.company));
  const isUsable=!!(hasAnyContent&&(summary?.trim()||experiences?.length>0)&&(skills?.length>0||experiences?.length>0));
  const isTargeted=!!jd;
  const isReadyToSend=!!(jd&&(summary?.trim()||experiences?.length>0)&&experiences?.length>0&&skills?.length>0);
  const statusLabel=!hasAnyContent?'Draft':isReadyToSend?'Ready to Send':isTargeted?'Targeted':isUsable?'Usable':'Draft';
  const statusStyles=statusLabel==='Ready to Send'?{color:'#10B981',background:'rgba(16,185,129,0.10)',border:'1px solid rgba(16,185,129,0.30)'}
    :statusLabel==='Targeted'?{color:'#0EA5E9',background:'rgba(14,165,233,0.10)',border:'1px solid rgba(14,165,233,0.30)'}
    :statusLabel==='Usable'?{color:ORANGE,background:'rgba(255,112,67,0.10)',border:`1px solid rgba(255,112,67,0.30)`}
    :{color:'#94A3B8',background:'rgba(148,163,184,0.10)',border:'1px solid rgba(148,163,184,0.30)'};

  const progressItems=[!!(formData.fullName||formData.name),!!formData.email,!!formData.location,!!(summary?.trim()),!!(experiences?.length>0),!!(skills?.length>0),!!(educationList?.length>0),!!jd];
  const progress=Math.round((progressItems.filter(Boolean).length/progressItems.length)*100);

  // ─── Save handlers ────────────────────────────────────────────────────────
  const handleSaveClick=async()=>{
    try{const res=await fetch('/api/resume/list');if(res.ok){const json=await res.json();const list=json.resumes||[];setExistingResumes(list);if(!selectedResumeId&&list.length>0)setSelectedResumeId(String(list[0].id));}}catch{setExistingResumes([]);}
    setShowSaveModal(true);
  };

  const handleSaveNew=async()=>{
    if(existingResumes.length>=MAX_RESUMES){alert(`You can save up to ${MAX_RESUMES} resumes. Please overwrite an existing one.`);return;}
    setShowSaveModal(false); await saveResume();
  };

  const handleOverwrite=async(resumeId,resumeName,setPrimary)=>{
    setShowSaveModal(false);
    try{
      const res=await fetch('/api/resume/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:resumeId,name:resumeName,content:{template:isHybrid?'hybrid':'reverse',data:resumeData},setPrimary:!!setPrimary})});
      if(!res.ok) throw new Error('Save failed');
      setSaveEventAt(new Date().toISOString());
      if(setPrimary) showBriefToast('Saved & set as primary resume ⭐');
    }catch{alert('Save failed. Try again.');}
  };

  const handleDeleteResume = async (resumeId) => {
    if (!confirm('Delete this resume? This cannot be undone.')) return;

    try {
      const res = await fetch('/api/resume/save', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: resumeId }),
      });

      if (!res.ok) throw new Error('Delete failed');

      setExistingResumes((prev) =>
        prev.filter((r) => String(r.id) !== String(resumeId))
      );

      if (String(selectedResumeId) === String(resumeId)) {
        setSelectedResumeId('');
      }

      showBriefToast('Resume deleted.');
    } catch {
      alert('Could not delete resume. Try again.');
    }
  };

  const handleLoadSelectedResume=async()=>{
    if(!selectedResumeId) return;

    const payload = await fetchResumeById(selectedResumeId);
    if(payload && applyResumePayloadToState(payload)) {
      hasAppliedResumeLoadRef.current=String(selectedResumeId);
      hasAppliedUploadRef.current=true;
    }

    await router.push(withChrome(`/resume/create?resumeId=${encodeURIComponent(selectedResumeId)}&template=${isHybrid?'hybrid':'reverse'}`));
  };
  const handleCreateNewResume=async()=>{ await resetResumeBuilder(); };

  // ─── Save Modal ───────────────────────────────────────────────────────────
  const saveModal = typeof window!=='undefined'&&showSaveModal ? createPortal(
    <div style={{position:'fixed',inset:0,zIndex:999999,background:'rgba(0,0,0,0.50)',display:'flex',alignItems:'center',justifyContent:'center',padding:16}} onClick={()=>setShowSaveModal(false)}>
      <div style={{background:'white',borderRadius:18,padding:18,width:'min(440px,92vw)',maxHeight:'78vh',overflowY:'auto',boxShadow:'0 24px 60px rgba(0,0,0,0.28)'}} onClick={(e)=>e.stopPropagation()}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,marginBottom:12}}>
          <div>
            <div style={{fontWeight:900,fontSize:18,color:'#111827'}}>Save Resume</div>
            <div style={{color:'#64748B',fontSize:12,marginTop:3}}>Save new, overwrite, set primary, or delete saved resumes.</div>
          </div>
          <button onClick={()=>setShowSaveModal(false)} style={{width:28,height:28,borderRadius:999,border:'1px solid #E2E8F0',background:'white',color:'#64748B',fontWeight:900,cursor:'pointer',lineHeight:1}}>×</button>
        </div>

        {existingResumes.length<MAX_RESUMES ? (
          <button onClick={handleSaveNew} style={{width:'100%',padding:'10px 14px',background:ORANGE,color:'white',border:'none',borderRadius:12,fontWeight:900,fontSize:13,cursor:'pointer',marginBottom:12}}>+ Save as new resume</button>
        ) : (
          <div style={{padding:'9px 12px',background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.20)',borderRadius:10,marginBottom:12,fontSize:12,color:'#B91C1C',fontWeight:800}}>
            {MAX_RESUMES}-resume limit reached. Overwrite or delete one below.
          </div>
        )}

        {existingResumes.length>0&&(
          <>
            <div style={{fontWeight:800,fontSize:10,color:'#94A3B8',marginBottom:8,letterSpacing:0.6,textTransform:'uppercase'}}>Saved Resumes</div>
            <div style={{display:'grid',gap:8}}>
              {existingResumes.map((r)=>(
                <div key={r.id} style={{display:'grid',gridTemplateColumns:'1fr auto',alignItems:'center',gap:10,padding:'10px 12px',background:'white',border:'1px solid #E2E8F0',borderRadius:12}}>
                  <div style={{minWidth:0}}>
                    <div style={{fontWeight:850,fontSize:13,color:'#1F2937',lineHeight:1.25,wordBreak:'break-word'}}>{r.name||'Untitled Resume'}</div>
                    <div style={{fontSize:11,color:'#94A3B8',marginTop:4}}>
                      {r.isPrimary?'⭐ Primary · ':''}{r.updatedAt?`Updated ${new Date(r.updatedAt).toLocaleDateString()}`:''}
                    </div>
                  </div>

                  <div style={{display:'grid',gridTemplateColumns:'1fr',gap:6,minWidth:104}}>
                    <button onClick={()=>handleOverwrite(r.id,r.name||'Resume',false)} style={{padding:'5px 9px',background:'white',border:'1px solid #E2E8F0',borderRadius:8,fontWeight:800,fontSize:11,cursor:'pointer',color:'#334155'}}>Overwrite</button>
                    <button onClick={()=>handleOverwrite(r.id,r.name||'Resume',true)} style={{padding:'5px 9px',background:ORANGE,border:'none',borderRadius:8,fontWeight:800,fontSize:11,cursor:'pointer',color:'white'}} title="Save and set as primary">⭐ Primary</button>
                    <button onClick={()=>handleDeleteResume(r.id)} style={{padding:'5px 9px',background:'white',border:'1px solid #FECACA',borderRadius:8,fontWeight:800,fontSize:11,cursor:'pointer',color:'#DC2626'}} title="Delete this resume">🗑 Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  ) : null;

  // ─── Template selection ───────────────────────────────────────────────────
  const TemplateComponent = previewMode==='signal-test' ? SignalResumeTestTemplate : isHybrid ? HybridResumeTemplate : ReverseResumeTemplate;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <ResumeBuildIsolationShell>
      <style jsx global>{`
        html, body { overflow-x: hidden; }
        @media (max-width: 1100px) {
          .ft-rb-main { grid-template-columns: 1fr !important; }
          .ft-rb-toprow { grid-template-columns: 1fr !important; }
          .ft-ad-rail-outer { display: none !important; }
          .ft-rb-intel-rail { display: none !important; }
          .ft-rb-status-col { display: none !important; }
          .ft-rb-toolbar-row { grid-template-columns: 1fr !important; }
          .ft-rb-toolbar-inner { min-width: 0 !important; overflow: hidden !important; }
        }

        /* ─── Mobile More sheet ───────────────────────────────────────── */
        .ft-more-backdrop {
          display: none;
        }
        .ft-more-sheet {
          display: none;
        }
        @media (max-width: 1100px) {
          .ft-more-backdrop {
            display: block;
            position: fixed; inset: 0; z-index: 230;
            background: rgba(0,0,0,0.55); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
            opacity: 0; pointer-events: none; transition: opacity 0.25s ease;
          }
          .ft-more-backdrop.open { opacity: 1; pointer-events: all; }
          .ft-more-sheet {
            display: flex;
            position: fixed; left: 0; right: 0; bottom: 0; z-index: 231;
            flex-direction: column;
            background: rgba(252,252,253,0.99);
            border-radius: 20px 20px 0 0;
            border-top: 1px solid rgba(255,112,67,0.15);
            box-shadow: 0 -24px 60px rgba(0,0,0,0.20);
            max-height: 80vh;
            transform: translateY(100%);
            transition: transform 0.32s cubic-bezier(0.4,0,0.2,1);
            padding-bottom: env(safe-area-inset-bottom, 16px);
          }
          .ft-more-sheet.open { transform: translateY(0); }
        }

        /* ─── Hammer pull-tab (mobile only) ──────────────────────────── */
        .ft-hammer-tab {
          display: none;
        }
        @media (max-width: 1100px) {
          .ft-hammer-tab {
            display: flex;
            position: fixed; right: 0; top: 50%; transform: translateY(-50%);
            z-index: 220;
            flex-direction: column; align-items: center; justify-content: center;
            width: 32px; padding: 14px 0;
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

      <div style={{width:'100%',boxSizing:'border-box'}} className="overflow-x-hidden">

        {/* TOP: title + command card | compact ad rail — ad no longer controls page spacing */}
        <div className="ft-rb-toprow" style={{display:'grid',gridTemplateColumns:isFocusMode?'1fr':'1fr 220px',gap:12,alignItems:'start',marginBottom:8,width:'100%'}}>
          <div style={{minWidth:0, overflow:'hidden', display:'grid', gap:8}}>
            <SeekerTitleCard
              greeting={greeting}
              title="Resume Builder"
              subtitle="Build your resume once. Export anywhere. Reverse Chronological and Hybrid for traditional markets — ForgeFormat for people with real careers."
            />
            <div style={{...GLASS_CARD, padding:'12px 14px', minWidth:0, overflow:'hidden'}}>

              {/* ── MOBILE TOOLBAR (≤1100px) ─────────────────────────────────── */}
              {isMobile && (
                <div style={{display:'flex',flexDirection:'column',gap:8}}>

                  {/* Row 1: Draft selector + Save */}
                  <div style={{display:'flex',alignItems:'center',gap:8,minWidth:0}}>
                    <select
                      value={selectedResumeId}
                      onChange={(e)=>setSelectedResumeId(e.target.value)}
                      style={{flex:1,minWidth:0,height:34,borderRadius:10,border:'1px solid rgba(0,0,0,0.12)',background:'rgba(255,255,255,0.90)',padding:'0 10px',fontSize:13,fontWeight:700,color:'#334155',outline:'none'}}
                    >
                      {existingResumes.length===0
                        ? <option value="">No saved resumes yet</option>
                        : existingResumes.map((r)=>(
                          <option key={r.id} value={String(r.id)}>
                            {r.name||r.resumeName||'Untitled'}{r.isPrimary?' ⭐':''}
                          </option>
                        ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleSaveClick}
                      style={{flexShrink:0,background:'#16A34A',color:'white',padding:'7px 14px',borderRadius:10,fontWeight:900,fontSize:13,border:'none',cursor:'pointer',whiteSpace:'nowrap'}}
                    >
                      {saveState==='saving'?'Saving…':saveState==='saved'?'✓ Saved':'Save'}
                    </button>
                  </div>

                  {/* Row 2: Workspace mode + More */}
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <button
                      type="button"
                      onClick={()=>{setPreviewMode('standard');setIsEditMode(true);}}
                      style={{flex:1,padding:'8px 4px',borderRadius:10,border:isEditMode&&previewMode==='standard'?`1.5px solid ${ORANGE}`:'1px solid rgba(0,0,0,0.10)',background:isEditMode&&previewMode==='standard'?'rgba(255,112,67,0.10)':'rgba(255,255,255,0.80)',color:isEditMode&&previewMode==='standard'?'#C2410C':'#334155',fontWeight:800,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}
                    >✏️ Edit</button>
                    <button
                      type="button"
                      onClick={()=>{setPreviewMode('standard');setIsEditMode(false);}}
                      style={{flex:1,padding:'8px 4px',borderRadius:10,border:!isEditMode&&previewMode==='standard'?`1.5px solid ${ORANGE}`:'1px solid rgba(0,0,0,0.10)',background:!isEditMode&&previewMode==='standard'?'rgba(255,112,67,0.10)':'rgba(255,255,255,0.80)',color:!isEditMode&&previewMode==='standard'?'#C2410C':'#334155',fontWeight:800,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}
                    >👁 Preview</button>
                    <button
                      type="button"
                      onClick={()=>setIsFocusMode(v=>!v)}
                      style={{flex:1,padding:'8px 4px',borderRadius:10,border:isFocusMode?`1.5px solid ${ORANGE}`:'1px solid rgba(0,0,0,0.10)',background:isFocusMode?'rgba(255,112,67,0.12)':'rgba(255,255,255,0.80)',color:isFocusMode?'#C2410C':'#334155',fontWeight:800,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}
                    >{isFocusMode?'← Exit':'🎯 Focus'}</button>
                    <button
                      type="button"
                      onClick={()=>setMoreSheetOpen(true)}
                      style={{flexShrink:0,padding:'8px 12px',borderRadius:10,border:'1px solid rgba(0,0,0,0.12)',background:'rgba(255,255,255,0.80)',color:'#334155',fontWeight:900,fontSize:15,cursor:'pointer',fontFamily:'inherit'}}
                    >⋯</button>
                  </div>

                  {/* Status mini + Cover Letter — compact row */}
                  <div style={{display:'flex',alignItems:'center',gap:10,paddingTop:2}}>
                    <div style={{display:'flex',alignItems:'center',gap:5}}>
                      <div style={{position:'relative',width:20,height:20,flexShrink:0}}>
                        <svg width="20" height="20" viewBox="0 0 20 20">
                          <circle cx="10" cy="10" r="7" fill="none" stroke="#E5E7EB" strokeWidth="2.5"/>
                          <circle cx="10" cy="10" r="7" fill="none"
                            stroke={statusLabel==='Ready to Send'?'#10B981':statusLabel==='Targeted'?'#0EA5E9':statusLabel==='Usable'?ORANGE:'#CBD5E1'}
                            strokeWidth="2.5"
                            strokeDasharray={`${(progress/100)*44} 44`}
                            strokeLinecap="round"
                            style={{transformOrigin:'center',transform:'rotate(-90deg)'}}/>
                        </svg>
                        <span style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:5,fontWeight:900,color:'#374151'}}>{progress}%</span>
                      </div>
                      <span style={{fontSize:11,fontWeight:700,color:'#64748B'}}>{statusLabel}</span>
                    </div>
                    <button
                      type="button"
                      onClick={()=>{
                        const params=new URLSearchParams();
                        params.set('fresh','1');
                        if(chrome) params.set('chrome',chrome);
                        if(router.query.jobId) params.set('jobId',String(router.query.jobId));
                        router.push(`/cover/create${params.toString()?`?${params.toString()}`:''}`)
                      }}
                      style={{fontSize:12,fontWeight:800,padding:'4px 10px',borderRadius:8,border:`1px solid rgba(255,112,67,0.25)`,background:'rgba(255,112,67,0.08)',color:ORANGE,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap'}}
                    >✍️ Cover Letter →</button>
                  </div>

                </div>
              )}

              {/* ── DESKTOP TOOLBAR (>1100px) — unchanged ────────────────────── */}
              {!isMobile && (
              <div className="ft-rb-toolbar-row" style={{display:'grid',gridTemplateColumns:'1fr auto',gap:10,alignItems:'start'}}>

                {/* LEFT — three rows, all same width */}
                <div className="ft-rb-toolbar-inner" style={{display:'grid',gap:6,minWidth:0}}>

                  {/* Row 1: Resume */}
                  <div style={{...TOOL_GROUP}}>
                    <span style={GROUP_LABEL}>Resume</span>
                    <select value={selectedResumeId} onChange={(e)=>setSelectedResumeId(e.target.value)}
                      style={{flex:1,minWidth:0,height:30,borderRadius:999,border:'1px solid rgba(0,0,0,0.10)',background:'rgba(255,255,255,0.88)',padding:'0 10px',fontSize:12,fontWeight:800,color:'#334155',outline:'none'}}>
                      {existingResumes.length===0?<option value="">No saved resumes yet</option>
                        :existingResumes.map((r)=><option key={r.id} value={String(r.id)}>{r.name||r.resumeName||'Untitled Resume'}{r.isPrimary?' ⭐':''}</option>)}
                    </select>
                    <button type="button" onClick={handleLoadSelectedResume} style={PILL_BUTTON}>Load</button>
                    <button type="button" onClick={handleCreateNewResume} style={{...PILL_BUTTON,border:'1px solid rgba(255,112,67,0.28)',color:'#C2410C',background:'rgba(255,112,67,0.08)'}}>New Draft</button>
                    <button type="button" onClick={handleSaveClick} style={{background:'#16A34A',color:'white',padding:'6px 13px',borderRadius:999,fontWeight:900,fontSize:12,border:'none',cursor:'pointer',whiteSpace:'nowrap'}}>
                      {saveState==='saving'?'Saving…':saveState==='saved'?'✓ Saved':'Save / Manage'}
                    </button>
                  </div>

                  {/* Row 2: Format + Workspace */}
                  <div style={{...TOOL_GROUP}}>
                    <span style={GROUP_LABEL}>Format</span>
                    <button onClick={()=>router.push(buildResumeCreateHref('reverse'))} style={{...PILL_BUTTON,padding:'4px 10px',border:!isHybrid&&previewMode!=='signal-test'?`1px solid ${ORANGE}`:'1px solid rgba(0,0,0,0.10)',background:!isHybrid&&previewMode!=='signal-test'?'rgba(255,112,67,0.10)':'rgba(255,255,255,0.70)',color:!isHybrid&&previewMode!=='signal-test'?'#C2410C':'#64748B',fontWeight:!isHybrid&&previewMode!=='signal-test'?900:700}}>Reverse</button>
                    <button onClick={()=>router.push(buildResumeCreateHref('hybrid'))} style={{...PILL_BUTTON,padding:'4px 10px',border:isHybrid&&previewMode!=='signal-test'?`1px solid ${ORANGE}`:'1px solid rgba(0,0,0,0.10)',background:isHybrid&&previewMode!=='signal-test'?'rgba(255,112,67,0.10)':'rgba(255,255,255,0.70)',color:isHybrid&&previewMode!=='signal-test'?'#C2410C':'#64748B',fontWeight:isHybrid&&previewMode!=='signal-test'?900:700}}>Hybrid</button>
                    <button type="button" onClick={()=>setPreviewMode('signal-test')} style={{...PILL_BUTTON,padding:'4px 10px',border:previewMode==='signal-test'?`1px solid ${ORANGE}`:'1px solid rgba(0,0,0,0.10)',background:previewMode==='signal-test'?'rgba(255,112,67,0.10)':'rgba(255,255,255,0.70)',color:previewMode==='signal-test'?'#C2410C':'#475569',fontWeight:previewMode==='signal-test'?900:800}}>ForgeFormat</button>
                    <div style={{width:1,height:18,background:'rgba(0,0,0,0.10)',margin:'0 2px',flexShrink:0}}/>
                    <span style={GROUP_LABEL}>Workspace</span>
                    <button type="button" onClick={()=>{setPreviewMode('standard');setIsEditMode(true);}} style={{...PILL_BUTTON,padding:'4px 10px',border:isEditMode&&previewMode==='standard'?`1px solid rgba(255,112,67,0.40)`:'1px solid rgba(0,0,0,0.12)',background:isEditMode&&previewMode==='standard'?'rgba(255,112,67,0.10)':'rgba(255,255,255,0.80)',color:isEditMode&&previewMode==='standard'?'#C2410C':'#334155'}}>✏️ Edit</button>
                    <button type="button" onClick={()=>{setPreviewMode('standard');setIsEditMode(false);}} style={{...PILL_BUTTON,padding:'4px 10px',border:!isEditMode&&previewMode==='standard'?`1px solid rgba(255,112,67,0.40)`:'1px solid rgba(0,0,0,0.12)',background:!isEditMode&&previewMode==='standard'?'rgba(255,112,67,0.10)':'rgba(255,255,255,0.80)',color:!isEditMode&&previewMode==='standard'?'#C2410C':'#334155'}}>👁 Preview</button>
                    <button type="button" onClick={()=>setIsFocusMode((v)=>!v)} style={{...PILL_BUTTON,padding:'4px 10px',border:isFocusMode?`2px solid ${ORANGE}`:'1px solid rgba(0,0,0,0.12)',background:isFocusMode?'rgba(255,112,67,0.12)':'rgba(255,255,255,0.80)',color:isFocusMode?'#C2410C':'#334155',transition:'all 0.2s'}}>{isFocusMode?'← Exit Focus':'🎯 Focus'}</button>
                  </div>

                  {/* Row 3: Export + Import */}
                  <div style={{...TOOL_GROUP}}>
                    <span style={GROUP_LABEL}>Export</span>
                    {isHybrid
                      ? <HybridATSButton data={resumeData}><div style={{background:'#0F766E',color:'white',padding:'5px 11px',borderRadius:999,fontWeight:900,fontSize:12,cursor:'pointer'}}>Clean PDF</div></HybridATSButton>
                      : <ReverseATSButton data={resumeData}><div style={{background:'#0F766E',color:'white',padding:'5px 11px',borderRadius:999,fontWeight:900,fontSize:12,cursor:'pointer'}}>Clean PDF</div></ReverseATSButton>}
                    <DesignedPDFButton data={resumeData} template={isHybrid?'hybrid':'reverse'}>
                      <div style={{background:ORANGE,color:'white',padding:'5px 11px',borderRadius:999,fontWeight:900,fontSize:12,cursor:'pointer'}}>Designed PDF</div>
                    </DesignedPDFButton>
                    <div style={{width:1,height:18,background:'rgba(0,0,0,0.10)',margin:'0 2px',flexShrink:0}}/>
                    <span style={GROUP_LABEL}>Import</span>
                    <button
                      type="button"
                      onClick={()=>{if(resumeFileInputRef.current){resumeFileInputRef.current.value='';resumeFileInputRef.current.click();}}}
                      disabled={resumeUploadState==='uploading'}
                      style={{...PILL_BUTTON,background:resumeUploadState==='done'?'#0F766E':resumeUploadState==='error'?'#B91C1C':'rgba(255,255,255,0.80)',color:resumeUploadState==='idle'?'#334155':'white',cursor:resumeUploadState==='uploading'?'not-allowed':'pointer',opacity:resumeUploadState==='uploading'?0.7:1}}
                      title="Upload an existing resume to auto-fill the builder"
                    >
                      {resumeUploadState==='uploading'?'Importing…':resumeUploadState==='done'?'✓ Imported':'↑ Import Resume'}
                    </button>
                    <input ref={resumeFileInputRef} type="file" accept=".pdf,.PDF,.docx,.DOCX,.txt,.TXT"
                      onChange={(e)=>{const f=e.target.files?.[0];if(f) handleResumeFile(f);}}
                      style={{display:'none'}}/>
                    {/* Status mini-ring + Cover Letter — inline, secondary */}
                    <div style={{width:1,height:18,background:'rgba(0,0,0,0.10)',margin:'0 2px',flexShrink:0}}/>
                    <div title={statusLabel} style={{display:'flex',alignItems:'center',gap:5,flexShrink:0}}>
                      <div style={{position:'relative',width:22,height:22,flexShrink:0}}>
                        <svg width="22" height="22" viewBox="0 0 22 22">
                          <circle cx="11" cy="11" r="8" fill="none" stroke="#E5E7EB" strokeWidth="2.5"/>
                          <circle cx="11" cy="11" r="8" fill="none"
                            stroke={statusLabel==='Ready to Send'?'#10B981':statusLabel==='Targeted'?'#0EA5E9':statusLabel==='Usable'?ORANGE:'#CBD5E1'}
                            strokeWidth="2.5"
                            strokeDasharray={`${(progress/100)*50.3} 50.3`}
                            strokeLinecap="round"
                            style={{transformOrigin:'center',transform:'rotate(-90deg)'}}/>
                        </svg>
                        <span style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:6,fontWeight:900,color:'#374151'}}>{progress}%</span>
                      </div>
                      <span style={{fontSize:10,fontWeight:700,color:'#64748B',whiteSpace:'nowrap'}}>{statusLabel}</span>
                    </div>
                    <div style={{width:1,height:18,background:'rgba(0,0,0,0.10)',margin:'0 2px',flexShrink:0}}/>
                    <button
                      type="button"
                      onClick={()=>{
                        const params=new URLSearchParams();
                        params.set('fresh','1');
                        if(chrome) params.set('chrome',chrome);
                        if(router.query.jobId) params.set('jobId',String(router.query.jobId));
                        router.push(`/cover/create${params.toString()?`?${params.toString()}`:''}`);
                      }}
                      style={{...PILL_BUTTON,background:'rgba(255,112,67,0.08)',color:ORANGE,border:`1px solid rgba(255,112,67,0.25)`,fontWeight:800,fontSize:11,padding:'4px 8px',whiteSpace:'nowrap'}}
                      title="Write a cover letter using this resume"
                    >
                      ✍️ Cover Letter →
                    </button>
                  </div>

              </div>
            </div>
              )} {/* end !isMobile desktop toolbar */}

            </div> {/* end GLASS_CARD toolbar */}

            {/* ── More bottom sheet (mobile) ─────────────────────────────────── */}
            <div className={`ft-more-backdrop${moreSheetOpen?' open':''}`} onClick={()=>setMoreSheetOpen(false)} />
            <div className={`ft-more-sheet${moreSheetOpen?' open':''}`}>
              {/* Handle */}
              <div style={{display:'flex',justifyContent:'center',padding:'12px 0 4px'}}>
                <div style={{width:36,height:4,borderRadius:999,background:'rgba(0,0,0,0.12)'}}/>
              </div>
              {/* Header */}
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 20px 14px',borderBottom:'1px solid rgba(0,0,0,0.07)'}}>
                <span style={{fontWeight:900,fontSize:16,color:'#112033'}}>More Options</span>
                <button onClick={()=>setMoreSheetOpen(false)} style={{background:'rgba(0,0,0,0.06)',border:'none',width:30,height:30,borderRadius:'50%',cursor:'pointer',fontSize:16,fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
              </div>
              {/* Scrollable content */}
              <div style={{overflowY:'auto',WebkitOverflowScrolling:'touch',padding:'16px 20px',display:'grid',gap:20}}>

                {/* FORMAT */}
                <div>
                  <div style={{fontSize:10,fontWeight:900,color:'#94A3B8',letterSpacing:'0.06em',marginBottom:10}}>FORMAT</div>
                  <div style={{display:'grid',gap:8}}>
                    {[
                      {label:'Reverse Chronological',active:!isHybrid&&previewMode!=='signal-test',onClick:()=>router.push(buildResumeCreateHref('reverse'))},
                      {label:'Hybrid',active:isHybrid&&previewMode!=='signal-test',onClick:()=>router.push(buildResumeCreateHref('hybrid'))},
                      {label:'ForgeFormat',active:previewMode==='signal-test',onClick:()=>setPreviewMode('signal-test')},
                    ].map(({label,active,onClick})=>(
                      <button key={label} type="button"
                        onClick={()=>{onClick();setMoreSheetOpen(false);}}
                        style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',borderRadius:12,border:`1.5px solid ${active?ORANGE:'rgba(0,0,0,0.08)'}`,background:active?'rgba(255,112,67,0.08)':'white',color:active?'#C2410C':'#334155',fontWeight:active?900:600,fontSize:14,cursor:'pointer',fontFamily:'inherit',textAlign:'left'}}
                      >
                        <span style={{width:18,height:18,borderRadius:'50%',border:`2px solid ${active?ORANGE:'#CBD5E1'}`,background:active?ORANGE:'transparent',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                          {active&&<span style={{width:8,height:8,borderRadius:'50%',background:'white',display:'block'}}/>}
                        </span>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* EXPORT */}
                <div>
                  <div style={{fontSize:10,fontWeight:900,color:'#94A3B8',letterSpacing:'0.06em',marginBottom:10}}>EXPORT</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                    {isHybrid
                      ? <HybridATSButton data={resumeData}><div onClick={()=>setMoreSheetOpen(false)} style={{background:'#0F766E',color:'white',padding:'12px',borderRadius:12,fontWeight:900,fontSize:13,cursor:'pointer',textAlign:'center'}}>↓ Clean PDF</div></HybridATSButton>
                      : <ReverseATSButton data={resumeData}><div onClick={()=>setMoreSheetOpen(false)} style={{background:'#0F766E',color:'white',padding:'12px',borderRadius:12,fontWeight:900,fontSize:13,cursor:'pointer',textAlign:'center'}}>↓ Clean PDF</div></ReverseATSButton>}
                    <DesignedPDFButton data={resumeData} template={isHybrid?'hybrid':'reverse'}>
                      <div onClick={()=>setMoreSheetOpen(false)} style={{background:ORANGE,color:'white',padding:'12px',borderRadius:12,fontWeight:900,fontSize:13,cursor:'pointer',textAlign:'center'}}>↓ Designed PDF</div>
                    </DesignedPDFButton>
                  </div>
                </div>

                {/* MANAGE */}
                <div>
                  <div style={{fontSize:10,fontWeight:900,color:'#94A3B8',letterSpacing:'0.06em',marginBottom:10}}>MANAGE</div>
                  <div style={{display:'grid',gap:8}}>
                    <button type="button" onClick={()=>{handleLoadSelectedResume();setMoreSheetOpen(false);}}
                      style={{padding:'12px 14px',borderRadius:12,border:'1px solid rgba(0,0,0,0.10)',background:'white',color:'#334155',fontWeight:700,fontSize:14,cursor:'pointer',fontFamily:'inherit',textAlign:'left'}}>
                      Load Selected Draft
                    </button>
                    <button type="button" onClick={()=>{handleCreateNewResume();setMoreSheetOpen(false);}}
                      style={{padding:'12px 14px',borderRadius:12,border:'1px solid rgba(255,112,67,0.25)',background:'rgba(255,112,67,0.06)',color:'#C2410C',fontWeight:700,fontSize:14,cursor:'pointer',fontFamily:'inherit',textAlign:'left'}}>
                      + New Draft
                    </button>
                    <button type="button"
                      onClick={()=>{setMoreSheetOpen(false);if(resumeFileInputRef.current){resumeFileInputRef.current.value='';resumeFileInputRef.current.click();}}}
                      disabled={resumeUploadState==='uploading'}
                      style={{padding:'12px 14px',borderRadius:12,border:'1px solid rgba(0,0,0,0.10)',background:resumeUploadState==='done'?'#0F766E':resumeUploadState==='error'?'#B91C1C':'white',color:resumeUploadState==='idle'?'#334155':'white',fontWeight:700,fontSize:14,cursor:'pointer',fontFamily:'inherit',textAlign:'left'}}
                    >
                      {resumeUploadState==='uploading'?'Importing…':resumeUploadState==='done'?'✓ Imported':'↑ Import Resume'}
                    </button>
                    <input ref={resumeFileInputRef} type="file" accept=".pdf,.PDF,.docx,.DOCX,.txt,.TXT"
                      onChange={(e)=>{const f=e.target.files?.[0];if(f) handleResumeFile(f);}}
                      style={{display:'none'}}/>
                  </div>
                </div>

              </div>
            </div>

          {/* AD RAIL — beside title + command card only, without forcing a tall spacer */}
          {!isFocusMode&&(
            <div className="ft-ad-rail-outer" style={{width:'220px',height:295,flexShrink:0,overflow:'hidden',borderRadius:14}}>
              <div className="ft-ad-rail-inner" style={{width:280,transform:'scale(0.78)',transformOrigin:'top left'}}>
                <RightRailPlacementManagerPlaceholder/>
              </div>
            </div>
          )}
        </div>

        {/* RESUME + HAMMER GRID — full width, no ad rail competing */}
        <div className="ft-rb-main" style={{display:'grid',gridTemplateColumns:isFocusMode?'1fr':'minmax(0,1fr) 340px',gap:8,alignItems:'start'}}>

          {/* CENTER: Resume */}
          <div style={{...GLASS_CARD,overflow:'hidden'}}>
            <div style={{padding:'10px 16px',background:'linear-gradient(180deg, rgba(38,50,56,0.92), rgba(38,50,56,0.70))',color:'white',fontWeight:900,fontSize:13,letterSpacing:0.4,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <span>{isEditMode?'✏️ LIVE RESUME EDITOR':'👁 RESUME PREVIEW'}</span>
              {isEditMode&&<span style={{fontSize:11,fontWeight:600,opacity:0.75}}>
                {saveState==='saving'?'Auto-saving…':saveState==='saved'?'✓ Auto-saved':saveState==='error'?'Auto-save failed':'Click any section to edit'}
              </span>}
            </div>
            <div id="resume-preview" style={{padding:isEditMode?20:32,background:'#fff',minHeight:760,overflowY:'auto'}}>
              {previewMode==='signal-test' ? (
                <SignalResumeTestTemplate data={resumeData}/>
              ) : (
                <TemplateComponent
                  data={resumeData}
                  isEditMode={isEditMode}
                  onUpdate={isEditMode?handleResumeUpdate:undefined}
                />
              )}
            </div>
          </div>


          {/* ── Shared Hammer content (desktop rail + mobile drawer) ──────────── */}
          {/* FORGE HAMMER — desktop right rail (hidden on mobile via CSS) */}
          {!isFocusMode&&(
            <div className="ft-rb-intel-rail" style={{display:'flex',flexDirection:'column',gap:12,position:'sticky',top:20,alignSelf:'start'}}>
              <div style={{...GLASS_CARD,overflow:'hidden'}}>
                <div style={{padding:'12px 16px',background:'linear-gradient(135deg, rgba(255,112,67,0.15), rgba(255,112,67,0.05))',borderBottom:'1px solid rgba(255,112,67,0.15)'}}>
                  <div style={{fontWeight:900,fontSize:15,color:ORANGE}}>🔨 The Forge Hammer</div>
                  <div style={{fontSize:11,color:'#64748B',fontWeight:600,marginTop:2}}>AI resume intelligence + job fire</div>
                </div>
                <div style={{padding:'12px 16px',borderBottom:'1px solid rgba(0,0,0,0.06)'}}>
                  {atsPack ? (
                    <>
                      <div style={{fontWeight:800,fontSize:13,color:'#0D47A1',marginBottom:4}}>🔥 Job fire loaded</div>
                      {atsJobMeta&&<div style={{fontSize:13,color:'#1E293B',marginBottom:4}}><strong>{atsJobMeta.title}</strong>{atsJobMeta.company?` at ${atsJobMeta.company}`:''}</div>}
                      {hasRealAts&&atsPack.ats?.score!==undefined&&<div style={{fontSize:12,color:'#334155'}}>Match: <strong>{atsPack.ats.score}%</strong></div>}
                    </>
                  ) : jd ? (
                    <>
                      <div style={{fontWeight:800,fontSize:13,color:'#0D47A1',marginBottom:4}}>🔥 Job fire loaded</div>
                      <div style={{fontSize:12,color:'#334155'}}><strong>{fireTitle}</strong>{fireMeta?.company?` at ${fireMeta.company}`:''}</div>
                      <div style={{fontSize:11,color:'#64748B',marginTop:4}}>Match insights and keyword coverage are active.</div>
                    </>
                  ) : (
                    <>
                      <div style={{fontWeight:800,fontSize:13,color:ORANGE,marginBottom:6}}>🔥 Add the fire.</div>
                      <div style={{fontSize:12,color:'#475569',lineHeight:1.6}}>Drop a job description to unlock match insights, keyword coverage, and tailored AI guidance.</div>
                    </>
                  )}
                  {(jd||atsPack)&&<button type="button" onClick={clearJobFire} style={{marginTop:8,background:'transparent',border:'none',color:'#B91C1C',fontWeight:800,fontSize:12,cursor:'pointer',textDecoration:'underline',padding:0}}>Clear loaded job</button>}
                </div>
                <div ref={dropRef}
                  onClick={()=>{if(fileInputRef.current) fileInputRef.current.value=''; fileInputRef.current?.click();}}
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
              </div>
              {jd&&(
                <div style={{...GLASS_CARD,padding:'12px 16px'}}>
                  <ForgeHammerPanel
                    jdText={jd}
                    resumeData={resumeData}
                    summary={summary}
                    skills={skills}
                    experiences={experiences}
                    education={educationList}
                    jobMeta={fireMeta||null}
                    whyScore={incomingWhyScore}
                    onAddSkill={(k)=>{setSkills((s)=>[...s,k]);triggerAutoSave();}}
                    onAddSummary={(k)=>{setSummary((s)=>(s?`${s}\n\n${k}`:k));triggerAutoSave();}}
                    onAddBullet={(k)=>{
                      const lastExp=experiences[experiences.length-1];
                      if(lastExp){setExperiences((exp)=>exp.map((e,i)=>i===exp.length-1?{...e,bullets:[...(e.bullets||[]),k]}:e));triggerAutoSave();}
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile Hammer pull-tab + drawer ───────────────────────────────────── */}
      {/* Pull tab — fixed to right edge, vertically centered */}
      <button
        type="button"
        className={`ft-hammer-tab${hammerOpen?' open':''}`}
        onClick={()=>setHammerOpen(o=>!o)}
        aria-label="Toggle Forge Hammer"
      >
        🔨
      </button>

      {/* Backdrop */}
      <div
        className={`ft-hammer-backdrop${hammerOpen?' open':''}`}
        onClick={()=>setHammerOpen(false)}
      />

      {/* Drawer */}
      <div className={`ft-hammer-drawer${hammerOpen?' open':''}`}>
        {/* Drawer header */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px 12px',borderBottom:'1px solid rgba(255,255,255,0.08)',flexShrink:0}}>
          <div>
            <div style={{fontWeight:900,fontSize:16,color:ORANGE}}>🔨 The Forge Hammer</div>
            <div style={{fontSize:11,color:'rgba(255,255,255,0.50)',marginTop:2}}>AI resume intelligence + job fire</div>
          </div>
          <button onClick={()=>setHammerOpen(false)} style={{background:'rgba(255,255,255,0.08)',border:'none',color:'rgba(255,255,255,0.60)',width:30,height:30,borderRadius:'50%',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontFamily:'inherit'}}>×</button>
        </div>

        {/* Job fire status */}
        <div style={{padding:'14px 20px',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
          {atsPack ? (
            <>
              <div style={{fontWeight:800,fontSize:13,color:'#60A5FA',marginBottom:4}}>🔥 Job fire loaded</div>
              {atsJobMeta&&<div style={{fontSize:13,color:'rgba(255,255,255,0.85)',marginBottom:4}}><strong>{atsJobMeta.title}</strong>{atsJobMeta.company?` at ${atsJobMeta.company}`:''}</div>}
              {hasRealAts&&atsPack.ats?.score!==undefined&&<div style={{fontSize:12,color:'rgba(255,255,255,0.60)'}}>Match: <strong style={{color:'white'}}>{atsPack.ats.score}%</strong></div>}
            </>
          ) : jd ? (
            <>
              <div style={{fontWeight:800,fontSize:13,color:'#60A5FA',marginBottom:4}}>🔥 Job fire loaded</div>
              <div style={{fontSize:12,color:'rgba(255,255,255,0.80)'}}><strong>{fireTitle}</strong>{fireMeta?.company?` at ${fireMeta.company}`:''}</div>
              <div style={{fontSize:11,color:'rgba(255,255,255,0.50)',marginTop:4}}>Match insights and keyword coverage are active.</div>
            </>
          ) : (
            <>
              <div style={{fontWeight:800,fontSize:13,color:ORANGE,marginBottom:6}}>🔥 Add the fire.</div>
              <div style={{fontSize:12,color:'rgba(255,255,255,0.60)',lineHeight:1.6}}>Drop or upload a job description to unlock match insights, keyword coverage, and tailored AI guidance.</div>
            </>
          )}
          {(jd||atsPack)&&<button type="button" onClick={clearJobFire} style={{marginTop:8,background:'transparent',border:'none',color:'#F87171',fontWeight:800,fontSize:12,cursor:'pointer',textDecoration:'underline',padding:0,fontFamily:'inherit'}}>Clear loaded job</button>}
        </div>

        {/* Upload zone */}
        <div style={{padding:'14px 20px',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
          <button
            type="button"
            onClick={()=>{if(fileInputRef.current){fileInputRef.current.value='';fileInputRef.current.click();}}}
            style={{width:'100%',padding:'14px',border:'2px dashed rgba(144,202,249,0.40)',borderRadius:12,textAlign:'center',background:'rgba(255,255,255,0.04)',cursor:'pointer',color:'rgba(255,255,255,0.70)',fontSize:12,fontWeight:800,fontFamily:'inherit'}}
          >
            {jdLoading?'Processing…':jd?'↑ Upload new job description':'↑ Upload job description'}
          </button>
          {jdStatus&&<div style={{marginTop:8,fontSize:11,fontWeight:700,color:jdStatus.startsWith('Failed')?'#F87171':'#60A5FA',textAlign:'center'}}>{jdStatus}</div>}
        </div>

        {/* ForgeHammerPanel */}
        {jd&&(
          <div style={{padding:'14px 20px'}}>
            <ForgeHammerPanel
              jdText={jd}
              resumeData={resumeData}
              summary={summary}
              skills={skills}
              experiences={experiences}
              education={educationList}
              jobMeta={fireMeta||null}
              whyScore={incomingWhyScore}
              onAddSkill={(k)=>{setSkills((s)=>[...s,k]);triggerAutoSave();setHammerOpen(false);}}
              onAddSummary={(k)=>{setSummary((s)=>(s?`${s}\n\n${k}`:k));triggerAutoSave();setHammerOpen(false);}}
              onAddBullet={(k)=>{
                const lastExp=experiences[experiences.length-1];
                if(lastExp){setExperiences((exp)=>exp.map((e,i)=>i===exp.length-1?{...e,bullets:[...(e.bullets||[]),k]}:e));triggerAutoSave();setHammerOpen(false);}
              }}
            />
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

      {saveModal}
    </ResumeBuildIsolationShell>
  );
}