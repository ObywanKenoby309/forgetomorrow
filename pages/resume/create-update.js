// pages/resume/create-update.js
// World-class resume builder: inline editing on the resume + permanent Forge Hammer rail
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
import SignalResumeTestTemplate from '@/components/resume-form/templates/SignalResumeTestTemplate';
import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';
import ReverseATSButton from '@/components/resume-form/export/ReverseATSButton';
import HybridATSButton from '@/components/resume-form/export/HybridATSButton';
import DesignedPDFButton from '@/components/resume-form/export/DesignedPDFButton';
import ReverseResumeTemplate from '@/components/resume-form/templates/ReverseResumeTemplate';
import HybridResumeTemplate from '@/components/resume-form/templates/HybridResumeTemplate';

const ForgeHammerPanel = dynamic(() => import('@/components/hammer/ForgeHammerPanel'), { ssr: false });

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

export default function CreateResumePage() {
  const router = useRouter();
  const chrome = String(router.query.chrome || '').toLowerCase();
  const withChrome = (path) => (chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path);

  const fileInputRef = useRef(null);
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
    certifications, setCertifications,
    customSections, setCustomSections,
    languages, setLanguages,
    saveEventAt, setSaveEventAt,
    saveResume,
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
  const [atsJobMeta, setAtsJobMeta] = useState(null);
  const [atsAppliedFromContext, setAtsAppliedFromContext] = useState(false);
  const [jobMeta, setJobMeta] = useState(null);
  const [isEditMode, setIsEditMode] = useState(true);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [saveState, setSaveState] = useState('idle');

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
    educationList,
    certifications,
    skills,
    languages,
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

  const applyResumePayloadToState = (payload) => {
    if (!payload || typeof payload !== 'object') return false;
    const source = payload.resume || payload.data || payload.item || payload.document || payload;
    const sf = source.formData || source.personalInfo || source.contact || {};
    setFormData((prev) => ({ ...prev, ...(sf||{}), fullName: sf.fullName||sf.name||source.fullName||source.name||prev.fullName||prev.name||'' }));
    if (typeof source.summary==='string') setSummary(source.summary);
    if (Array.isArray(source.experiences||source.workExperiences)) setExperiences(source.experiences||source.workExperiences);
    if (Array.isArray(source.educationList||source.education)) setEducationList(source.educationList||source.education);
    if (Array.isArray(source.skills)) setSkills(source.skills);
    if (Array.isArray(source.projects)) setProjects(source.projects);
    if (Array.isArray(source.certifications)) setCertifications(source.certifications);
    if (Array.isArray(source.customSections)) setCustomSections(source.customSections);
    if (Array.isArray(source.languages)) setLanguages(source.languages);
    return true;
  };

  const fetchResumeById = async (resumeId) => {
    const id = String(resumeId||'').trim();
    if (!id) return null;
    for (const url of [`/api/resume/get?id=${encodeURIComponent(id)}`,`/api/resume?id=${encodeURIComponent(id)}`,`/api/resume/list`]) {
      try {
        const res = await fetch(url); if (!res.ok) continue;
        const json = await res.json();
        if (url.includes('/list')) { const found=(json?.resumes||[]).find((r)=>String(r?.id)===id); if(found) return found; continue; }
        return json;
      } catch {}
    }
    return null;
  };

  const buildResumeCreateHref = (template) => {
    const params = new URLSearchParams();
    Object.entries(router.query||{}).forEach(([k,v])=>{ if(!v&&v!==0) return; if(Array.isArray(v)) v.forEach((x)=>params.append(k,String(x))); else params.set(k,String(v)); });
    params.set('template',template);
    return withChrome(`/resume/create${params.toString()?`?${params.toString()}`:''}`);
  };

  const clearJobFire = async () => {
    setJd(''); setJdStatus(''); setAtsPack(null); setAtsJobMeta(null); setJobMeta(null);
    setAtsAppliedFromContext(true); hasAppliedUploadRef.current=false;
    try { await saveDraft(DRAFT_KEYS.LAST_JOB_TEXT,''); await saveDraft(DRAFT_KEYS.ATS_PACK,null); } catch {}
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
        if(!selectedResumeId&&list.length>0) { const cur=String(router.query.resumeId||'').trim(); setSelectedResumeId(cur||String(list[0].id)); }
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

  // ─── Derived ──────────────────────────────────────────────────────────────
  const isHybrid = router.query.template==='hybrid';
  const fireMeta = atsJobMeta||jobMeta;
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

  const handleLoadSelectedResume=async()=>{ if(!selectedResumeId) return; await router.push(withChrome(`/resume/create?resumeId=${encodeURIComponent(selectedResumeId)}&template=${isHybrid?'hybrid':'reverse'}`)); };
  const handleCreateNewResume=async()=>{ setSelectedResumeId(''); hasAppliedResumeLoadRef.current=false; await router.push(withChrome(`/resume/create?template=${isHybrid?'hybrid':'reverse'}`)); };

  // ─── Save Modal ───────────────────────────────────────────────────────────
  const saveModal = typeof window!=='undefined'&&showSaveModal ? createPortal(
    <div style={{position:'fixed',inset:0,zIndex:999999,background:'rgba(0,0,0,0.50)',display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>setShowSaveModal(false)}>
      <div style={{background:'white',borderRadius:20,padding:32,width:'min(520px,92vw)',boxShadow:'0 24px 60px rgba(0,0,0,0.28)'}} onClick={(e)=>e.stopPropagation()}>
        <div style={{fontWeight:900,fontSize:20,marginBottom:6,color:'#111827'}}>Save Resume</div>
        <div style={{color:'#64748B',fontSize:14,marginBottom:24}}>Up to {MAX_RESUMES} resumes. Set one as primary to feature it on your public profile.</div>
        {existingResumes.length<MAX_RESUMES ? (
          <button onClick={handleSaveNew} style={{width:'100%',padding:'13px 16px',background:ORANGE,color:'white',border:'none',borderRadius:12,fontWeight:800,fontSize:15,cursor:'pointer',marginBottom:20}}>+ Save as new resume</button>
        ) : (
          <div style={{padding:'10px 14px',background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.20)',borderRadius:10,marginBottom:20,fontSize:13,color:'#B91C1C',fontWeight:700}}>{MAX_RESUMES}-resume limit reached. Overwrite an existing resume below.</div>
        )}
        {existingResumes.length>0&&(
          <>
            <div style={{fontWeight:700,fontSize:11,color:'#94A3B8',marginBottom:10,letterSpacing:0.5,textTransform:'uppercase'}}>Overwrite Existing</div>
            <div style={{display:'grid',gap:8}}>
              {existingResumes.map((r)=>(
                <div key={r.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'white',border:'1px solid #E2E8F0',borderRadius:10}}>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:14,color:'#1F2937'}}>{r.name||'Untitled Resume'}</div>
                    <div style={{fontSize:12,color:'#94A3B8',marginTop:2}}>{r.isPrimary?'⭐ Primary · ':''}{r.updatedAt?`Updated ${new Date(r.updatedAt).toLocaleDateString()}`:''}</div>
                  </div>
                  <button onClick={()=>handleOverwrite(r.id,r.name||'Resume',false)} style={{padding:'6px 12px',background:'white',border:'1px solid #E2E8F0',borderRadius:8,fontWeight:700,fontSize:12,cursor:'pointer',color:'#334155'}}>Overwrite</button>
                  <button onClick={()=>handleOverwrite(r.id,r.name||'Resume',true)} style={{padding:'6px 12px',background:ORANGE,border:'none',borderRadius:8,fontWeight:700,fontSize:12,cursor:'pointer',color:'white'}} title="Save and set as primary">⭐ Set Primary</button>
                </div>
              ))}
            </div>
          </>
        )}
        <button onClick={()=>setShowSaveModal(false)} style={{marginTop:16,width:'100%',padding:10,background:'transparent',border:'none',color:'#94A3B8',fontWeight:700,cursor:'pointer'}}>Cancel</button>
      </div>
    </div>,
    document.body
  ) : null;

  // ─── Template selection ───────────────────────────────────────────────────
  const TemplateComponent = previewMode==='signal-test' ? SignalResumeTestTemplate : isHybrid ? HybridResumeTemplate : ReverseResumeTemplate;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <ResumeBuilderLayout title="Resume Builder | ForgeTomorrow">
      <style jsx global>{`
        html, body { overflow-x: hidden; }
        @media (max-width: 1100px) { .ft-rb-main { grid-template-columns: 1fr !important; } }
      `}</style>

      <div style={{width:'100%',boxSizing:'border-box'}} className="overflow-x-hidden">

        {/* OUTER GRID: all content left | ad rail right */}
        <div style={{display:'grid',gridTemplateColumns:isFocusMode?'1fr':'1fr 200px',gap:16,alignItems:'start',width:'100%'}}>

          {/* LEFT COLUMN: title + command card + resume/hammer */}
          <div style={{minWidth:0,display:'grid',gap:8}}>

            {/* TITLE */}
            <div style={{marginBottom:0}}>
              <SeekerTitleCard
                greeting={greeting}
                title="Resume Builder"
                subtitle="Build your resume once. Export anywhere. Reverse Chronological and Hybrid for traditional markets — ForgeFormat for people with real careers."
              />
            </div>

            {/* COMMAND CARD */}
            <div style={{...GLASS_CARD,padding:'14px 18px'}}>
              {/* Row 1: Resume + Status */}
              <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:8}}>
                <span style={{fontWeight:900,fontSize:13,color:'#111827',whiteSpace:'nowrap'}}>Resume:</span>
                <select value={selectedResumeId} onChange={(e)=>setSelectedResumeId(e.target.value)}
                  style={{minWidth:190,maxWidth:260,height:34,borderRadius:999,border:'1px solid rgba(0,0,0,0.10)',background:'rgba(255,255,255,0.85)',padding:'0 12px',fontSize:13,fontWeight:700,color:'#334155',outline:'none'}}>
                  {existingResumes.length===0?<option value="">No saved resumes yet</option>
                    :existingResumes.map((r)=><option key={r.id} value={String(r.id)}>{r.name||r.resumeName||'Untitled Resume'}{r.isPrimary?' ⭐':''}</option>)}
                </select>
                <button type="button" onClick={handleLoadSelectedResume} style={{borderRadius:999,padding:'5px 11px',fontSize:12,border:'1px solid rgba(0,0,0,0.12)',background:'rgba(255,255,255,0.80)',color:'#334155',fontWeight:800,cursor:'pointer'}}>Load</button>
                <button type="button" onClick={handleCreateNewResume} style={{borderRadius:999,padding:'5px 11px',fontSize:12,border:'1px solid rgba(0,0,0,0.12)',background:'rgba(255,255,255,0.80)',color:'#334155',fontWeight:800,cursor:'pointer'}}>New</button>
                <span style={{width:1,height:20,background:'rgba(0,0,0,0.10)',margin:'0 4px',flexShrink:0}}/>
                <span style={{fontSize:11,fontWeight:700,color:'#94A3B8',textTransform:'uppercase',letterSpacing:'0.06em',whiteSpace:'nowrap'}}>Status:</span>
                <span style={{fontSize:12,fontWeight:900,borderRadius:999,padding:'4px 10px',...statusStyles}}>{statusLabel}</span>
              </div>

              {/* Row 2: Base + View + Edit + Focus + Exports + Progress */}
              <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                <span style={{fontWeight:700,color:'#475569',fontSize:12,whiteSpace:'nowrap'}}>Base:</span>
                <button onClick={()=>router.push(buildResumeCreateHref('reverse'))} style={{borderRadius:999,padding:'4px 10px',fontSize:12,border:!isHybrid?`1px solid ${ORANGE}`:'1px solid rgba(0,0,0,0.10)',background:!isHybrid?'rgba(255,112,67,0.10)':'rgba(255,255,255,0.70)',color:!isHybrid?'#C2410C':'#64748B',fontWeight:!isHybrid?900:700,cursor:'pointer'}}>Reverse</button>
                <button onClick={()=>router.push(buildResumeCreateHref('hybrid'))} style={{borderRadius:999,padding:'4px 10px',fontSize:12,border:isHybrid?`1px solid ${ORANGE}`:'1px solid rgba(0,0,0,0.10)',background:isHybrid?'rgba(255,112,67,0.10)':'rgba(255,255,255,0.70)',color:isHybrid?'#C2410C':'#64748B',fontWeight:isHybrid?900:700,cursor:'pointer'}}>Hybrid</button>
                <span style={{width:1,height:20,background:'rgba(0,0,0,0.10)',margin:'0 4px',flexShrink:0}}/>
                <span style={{fontWeight:700,color:'#475569',fontSize:12,whiteSpace:'nowrap'}}>View:</span>
                <button type="button" onClick={()=>setPreviewMode('standard')} style={{borderRadius:999,padding:'4px 10px',fontSize:12,border:previewMode==='standard'?`1px solid ${ORANGE}`:'1px solid rgba(0,0,0,0.10)',background:previewMode==='standard'?'rgba(255,112,67,0.10)':'rgba(255,255,255,0.70)',color:previewMode==='standard'?'#C2410C':'#475569',fontWeight:800,cursor:'pointer'}}>Standard</button>
                <button type="button" onClick={()=>setPreviewMode('signal-test')} style={{borderRadius:999,padding:'4px 10px',fontSize:12,border:previewMode==='signal-test'?`1px solid ${ORANGE}`:'1px solid rgba(0,0,0,0.10)',background:previewMode==='signal-test'?'rgba(255,112,67,0.10)':'rgba(255,255,255,0.70)',color:previewMode==='signal-test'?'#C2410C':'#475569',fontWeight:800,cursor:'pointer'}}>ForgeFormat</button>
                <span style={{width:1,height:20,background:'rgba(0,0,0,0.10)',margin:'0 4px',flexShrink:0}}/>
                <button type="button" onClick={()=>setIsEditMode(true)} style={{borderRadius:999,padding:'5px 11px',fontSize:12,border:isEditMode?`1px solid rgba(255,112,67,0.40)`:'1px solid rgba(0,0,0,0.12)',background:isEditMode?'rgba(255,112,67,0.10)':'rgba(255,255,255,0.80)',color:isEditMode?'#C2410C':'#334155',fontWeight:800,cursor:'pointer'}}>✏️ Edit</button>
                <button type="button" onClick={()=>setIsEditMode(false)} style={{borderRadius:999,padding:'5px 11px',fontSize:12,border:!isEditMode?`1px solid rgba(255,112,67,0.40)`:'1px solid rgba(0,0,0,0.12)',background:!isEditMode?'rgba(255,112,67,0.10)':'rgba(255,255,255,0.80)',color:!isEditMode?'#C2410C':'#334155',fontWeight:800,cursor:'pointer'}}>👁 View</button>
                <button type="button" onClick={()=>setIsFocusMode((v)=>!v)} style={{borderRadius:999,padding:'5px 11px',fontSize:12,border:isFocusMode?`2px solid ${ORANGE}`:'1px solid rgba(0,0,0,0.12)',background:isFocusMode?'rgba(255,112,67,0.12)':'rgba(255,255,255,0.80)',color:isFocusMode?'#C2410C':'#334155',fontWeight:800,cursor:'pointer',transition:'all 0.2s'}}>{isFocusMode?'← Exit Focus':'🎯 Focus'}</button>
                <span style={{width:1,height:20,background:'rgba(0,0,0,0.10)',margin:'0 4px',flexShrink:0}}/>
                {isHybrid
                  ? <HybridATSButton data={resumeData}><div style={{background:'#0F766E',color:'white',padding:'5px 11px',borderRadius:999,fontWeight:800,fontSize:12,cursor:'pointer'}}>System PDF</div></HybridATSButton>
                  : <ReverseATSButton data={resumeData}><div style={{background:'#0F766E',color:'white',padding:'5px 11px',borderRadius:999,fontWeight:800,fontSize:12,cursor:'pointer'}}>System PDF</div></ReverseATSButton>}
                <DesignedPDFButton data={resumeData} template={isHybrid?'hybrid':'reverse'}>
                  <div style={{background:ORANGE,color:'white',padding:'5px 11px',borderRadius:999,fontWeight:800,fontSize:12,cursor:'pointer'}}>Designed PDF</div>
                </DesignedPDFButton>
                <button type="button" onClick={handleSaveClick} style={{background:'#16A34A',color:'white',padding:'5px 11px',borderRadius:999,fontWeight:800,fontSize:12,border:'none',cursor:'pointer'}}>
                  {saveState==='saving'?'Saving…':saveState==='saved'?'✓ Saved':'Save Resume'}
                </button>
                <span style={{width:1,height:20,background:'rgba(0,0,0,0.10)',margin:'0 4px',flexShrink:0}}/>
                <div style={{display:'flex',alignItems:'center',gap:5}}>
                  <div style={{position:'relative',width:26,height:26}}>
                    <svg width="26" height="26" viewBox="0 0 26 26">
                      <circle cx="13" cy="13" r="10" fill="none" stroke="#E5E7EB" strokeWidth="2.5"/>
                      <circle cx="13" cy="13" r="10" fill="none" stroke="#10B981" strokeWidth="2.5"
                        strokeDasharray={`${(progress/100)*62.8} 62.8`} strokeLinecap="round"
                        style={{transition:'stroke-dasharray 0.5s ease',transformOrigin:'center',transform:'rotate(-90deg)'}}/>
                    </svg>
                    <span style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,fontWeight:900,color:'#374151'}}>{progress}%</span>
                  </div>
                  <span style={{fontSize:12,fontWeight:700,color:'#374151'}}>Ready</span>
                </div>
              </div>
            </div>

            {/* RESUME + HAMMER GRID — no gap from command card */}
            <div className="ft-rb-main" style={{display:'grid',gridTemplateColumns:isFocusMode?'1fr':'minmax(0, 1fr) 340px',gap:8,alignItems:'start'}}>

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

              {/* RIGHT: Forge Hammer permanent rail */}
              {!isFocusMode&&(
                <div style={{display:'flex',flexDirection:'column',gap:12,position:'sticky',top:20}}>
                  <div style={{...GLASS_CARD,overflow:'hidden'}}>
                    <div style={{padding:'12px 16px',background:'linear-gradient(135deg, rgba(255,112,67,0.15), rgba(255,112,67,0.05))',borderBottom:'1px solid rgba(255,112,67,0.15)'}}>
                      <div style={{fontWeight:900,fontSize:15,color:ORANGE}}>🔨 The Forge Hammer</div>
                      <div style={{fontSize:11,color:'#64748B',fontWeight:600,marginTop:2}}>AI hammer + resume steel + job fire</div>
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
                          <div style={{fontSize:12,color:'#334155'}}><strong>{fireMeta?.title||'Job'}</strong>{fireMeta?.company?` at ${fireMeta.company}`:''}</div>
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
                    <div ref={dropRef} onClick={()=>{if(fileInputRef.current) fileInputRef.current.value=''; fileInputRef.current?.click();}}
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
                    <div style={{...GLASS_CARD,padding:'12px 16px',overflowY:'auto',maxHeight:'60vh'}}>
                      <ForgeHammerPanel
                        jdText={jd}
                        resumeData={resumeData}
                        summary={summary}
                        skills={skills}
                        experiences={experiences}
                        education={educationList}
                        jobMeta={fireMeta||null}
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
          </div>{/* end left column */}

          {/* RIGHT: Ad rail */}
          {!isFocusMode&&(
            <div style={{width:'200px',flexShrink:0,transformOrigin:'top right',transform:'scale(0.75)',marginRight:'-10px',maxHeight:320,overflow:'hidden',borderRadius:12}}>
              <RightRailPlacementManager slot="right_rail_1"/>
            </div>
          )}
        </div>{/* end outer grid */}
      </div>

      {/* Toast */}
      {showToast&&(
        <div style={{position:'fixed',right:28,bottom:28,background:ORANGE,color:'white',padding:'12px 22px',borderRadius:12,fontWeight:700,boxShadow:'0 10px 30px rgba(0,0,0,0.3)',zIndex:1000,fontSize:14}}>
          {toastMsg}
        </div>
      )}

      {saveModal}
    </ResumeBuilderLayout>
  );
}