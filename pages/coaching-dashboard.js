// pages/coaching-dashboard.js
// Layout strategy — identical blueprint to Seeker and Recruiter dashboards:
//   - CoachingLayout receives NO header prop, NO right prop
//   - contentFullBleed passed so main overflowX clipping removed for this page only
//   - DashboardBody owns the full internal grid
//   - Right rail (Sponsored + CSAT Pulse) lives INSIDE the internal grid, spans rows 1-3
//   - Bottom 3 cards use marginLeft: -252 to extend under sidebar
//
// Visual structure:
// ┌─────────────────────────────┬──────────────┐
// │ Title Card       (row 1)    │  Sponsored   │
// ├─────────────────────────────│  (rows 1-3)  │
// │ KPI Row          (row 2)    │              │
// ├─────────────────────────────│  CSAT Pulse  │
// │ Action Center    (row 3)    │              │
// ├─────────────────────────────┴──────────────┤
// │ Clients       │ Docs & Tools │ Upcoming    │  ← full width incl. under sidebar
// └────────────────────────────────────────────┘

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { getTimeGreeting } from "@/lib/dashboardGreeting";
import { useRouter } from 'next/router';
import CoachingLayout from '@/components/layouts/CoachingLayout';
import CoachingTitleCard from '@/components/coaching/CoachingTitleCard';
import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';

// ─── Date helpers ─────────────────────────────────────────────────────────────
function localISODate(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function toLocalDateTime(dateStr, timeStr = '00:00') {
  const [y,m,d] = String(dateStr||'').split('-').map(Number);
  const [hh,mm] = String(timeStr||'00:00').split(':').map(Number);
  return new Date(y||1970,(m||1)-1,d||1,hh||0,mm||0);
}
function getStatusStyles(status) {
  if (status === 'At Risk')    return { background:'#FDECEA', color:'#C62828' };
  if (status === 'New Intake') return { background:'#E3F2FD', color:'#1565C0' };
  return                              { background:'#E8F5E9', color:'#2E7D32' };
}
function safeText(v) { return typeof v==='string' ? v : v==null ? '' : String(v); }
function pickActionBucket(n) {
  const haystack = `${safeText(n?.title)} ${safeText(n?.body)} ${safeText(n?.metadata?.type||n?.metadata?.event||n?.metadata?.kind||'')}`.toLowerCase();
  if (haystack.includes('feedback')||haystack.includes('csat')||haystack.includes('rating')||haystack.includes('survey')) return 'feedback';
  if (haystack.includes('session request')||haystack.includes('appointment')||haystack.includes('booking')||haystack.includes('book')) return 'requests';
  if (haystack.includes('calendar')||haystack.includes('invite')||haystack.includes('session')||haystack.includes('resched')||haystack.includes('schedule')) return 'calendar';
  if (haystack.includes('message')||haystack.includes('inbox')||haystack.includes('dm')||haystack.includes('signal')) return 'messages';
  return 'messages';
}

// ─── Shared styles ────────────────────────────────────────────────────────────
const GLASS = {
  borderRadius:14, border:'1px solid rgba(255,255,255,0.22)',
  background:'rgba(255,255,255,0.58)', boxShadow:'0 10px 24px rgba(0,0,0,0.12)',
  backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)',
};
const KPI_GLASS = {
  ...GLASS,
  background:'rgba(255,255,255,0.68)',
  boxShadow:'0 12px 28px rgba(0,0,0,0.14)',
};
const WHITE_CARD = {
  background:'rgba(255,255,255,0.92)', border:'1px solid rgba(0,0,0,0.08)',
  borderRadius:12, boxShadow:'0 2px 10px rgba(0,0,0,0.08)', boxSizing:'border-box',
};
const ORANGE_HEADING_LIFT = {
  textShadow:'0 2px 4px rgba(15,23,42,0.65), 0 1px 2px rgba(0,0,0,0.4)',
  fontWeight:900,
};
const GAP = 16;
const RIGHT_COL_WIDTH = 280;

// ─── Desktop helpers ──────────────────────────────────────────────────────────
function Section({ title, children, action=null, style={} }) {
  return (
    <section style={{ ...GLASS, padding:20, ...style }}>
      <div style={{ marginBottom:12, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontSize:18, color:'#FF7043', lineHeight:1.25, letterSpacing:'-0.01em', ...ORANGE_HEADING_LIFT }}>{title}</div>
        {action}
      </div>
      <div>{children}</div>
    </section>
  );
}
function Card({ title, children }) {
  return (
    <div style={{
      ...WHITE_CARD,
      padding:16,
      minHeight:120,
      display:'flex',
      flexDirection:'column',
      justifyContent:'center',
      alignItems:'center',
      textAlign:'center'
    }}>
      <div style={{ fontWeight:700, marginBottom:8, color:'#112033', fontSize:13 }}>{title}</div>
      {children||<div style={{ color:'#90A4AE', fontSize:13 }}>Coming soon…</div>}
    </div>
  );
}
function KPI({ label, value }) {
  return (
    <div style={{ ...WHITE_CARD, padding:'14px 16px', minHeight:108,
      display:'flex', flexDirection:'column', justifyContent:'space-between', cursor:'pointer' }}>
      <div style={{ fontSize:10, fontWeight:800, color:'#FF7043', textTransform:'uppercase', letterSpacing:'0.08em', lineHeight:1.2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{label}</div>
      <div style={{ fontSize:24, fontWeight:900, color:'#0F172A', lineHeight:1.05, letterSpacing:'-0.02em', marginTop:6, textAlign:'center' }}>{value}</div>
      <div style={{ fontSize:12, color:'#64748B', fontWeight:500, alignSelf:'flex-end' }}>View details</div>
    </div>
  );
}
function ActionLiteCard({ title, items, emptyText, href }) {
  const list = Array.isArray(items) ? items : [];
  return (
    <div style={{ ...WHITE_CARD, padding:16, minHeight:140, display:'grid', gap:10 }}>
      <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', gap:10 }}>
        <div style={{ fontWeight:700, color:'#112033', fontSize:13 }}>{title}</div>
        <Link href={href} style={{ color:'#FF7043', fontWeight:800, fontSize:13, textDecoration:'none', ...ORANGE_HEADING_LIFT }}>View all</Link>
      </div>
      {list.length===0 ? (
        <div style={{ color:'#90A4AE', fontSize:13 }}>{emptyText}</div>
      ) : (
        <div style={{ display:'grid', gap:8 }}>
          {list.map(n => (
            <Link key={n.id} href={href} style={{ display:'block', ...WHITE_CARD,
              padding:'8px 10px', textDecoration:'none' }}>
              <div style={{ fontWeight:700, color:'#112033', fontSize:13 }}>{n.title||'Update'}</div>
              {n.body&&<div style={{ color:'#607D8B', fontSize:12, marginTop:2 }}>{n.body}</div>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
function Th({ children }) {
  return <th style={{ textAlign:'left', padding:'10px 12px', fontSize:13, color:'#546E7A', borderBottom:'1px solid #eee' }}>{children}</th>;
}
function Td({ children, strong=false }) {
  return <td style={{ padding:'10px 12px', fontSize:14, color:'#37474F', fontWeight:strong?600:400, background:'white' }}>{children}</td>;
}
const grid3 = { display:'grid', gridTemplateColumns:'repeat(3,minmax(0,1fr))', gap:12 };
const grid4 = { display:'grid', gridTemplateColumns:'repeat(4,minmax(0,1fr))', gap:12 };

// ─── Mobile Action tile ───────────────────────────────────────────────────────
function MobileActionTile({ title, items, emptyText, href, icon }) {
  const hasItems = items.length > 0;
  return (
    <Link href={href} style={{
      display:'flex', alignItems:'center', gap:12, padding:'12px 14px',
      borderRadius:12, textDecoration:'none',
      background: hasItems ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.55)',
      border: hasItems ? '1px solid rgba(255,112,67,0.22)' : '1px solid rgba(0,0,0,0.06)',
      boxShadow: hasItems ? '0 4px 12px rgba(0,0,0,0.08)' : 'none',
    }}>
      <div style={{ width:40, height:40, borderRadius:10, flexShrink:0,
        background: hasItems ? 'rgba(255,112,67,0.10)' : 'rgba(0,0,0,0.04)',
        display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>
        {icon}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:800, color: hasItems ? '#112033' : '#90A4AE' }}>{title}</div>
        <div style={{ fontSize:12, marginTop:2, color: hasItems ? '#546E7A' : '#B0BEC5',
          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {hasItems ? (items[0].title||'View item') : emptyText}
        </div>
      </div>
      {hasItems ? (
        <div style={{ minWidth:28, height:28, borderRadius:999, flexShrink:0, background:'#FF7043',
          color:'white', display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:13, fontWeight:900, boxShadow:'0 4px 10px rgba(255,112,67,0.40)' }}>
          {items.length}
        </div>
      ) : (
        <div style={{ width:24, height:24, borderRadius:999, flexShrink:0,
          background:'rgba(0,0,0,0.04)', display:'flex', alignItems:'center',
          justifyContent:'center', fontSize:14, color:'#B0BEC5' }}>✓</div>
      )}
    </Link>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CoachingDashboardPage() {
  const router = useRouter();

  const [isMobile, setIsMobile] = useState(null);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Sessions
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sessions, setSessions] = useState([]);

  const loadSessions = useCallback(async () => {
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/coaching/sessions', { method:'GET', headers:{'Content-Type':'application/json'} });
      if (res.status===401) { router.push('/login'); return; }
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setSessions(Array.isArray(data?.sessions) ? data.sessions : []);
    } catch(err) { setError('Unable to load your coaching dashboard right now.'); setSessions([]); }
    finally { setLoading(false); }
  }, [router]);
  useEffect(() => { loadSessions(); }, [loadSessions]);

  // Action Center
  const [actionLoading, setActionLoading] = useState(true);
  const [actionRefreshing, setActionRefreshing] = useState(false);
  const [actionBootstrapped, setActionBootstrapped] = useState(false);
  const [actionItems, setActionItems] = useState([]);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!actionBootstrapped) setActionLoading(true);
      else setActionRefreshing(true);
      try {
        const res = await fetch('/api/notifications/list?scope=COACH&limit=12&includeRead=0',
          { method:'GET', headers:{'Content-Type':'application/json'}, credentials:'include' });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setActionItems(Array.isArray(data?.items) ? data.items : []);
        setActionBootstrapped(true);
      } catch(e) {}
      finally { if (!cancelled) { setActionLoading(false); setActionRefreshing(false); } }
    }
    load();
    const t = setInterval(load, 25000);
    return () => { cancelled=true; clearInterval(t); };
  }, [actionBootstrapped]);

  // CSAT
  const [csat, setCsat] = useState([]);
  const [csatError, setCsatError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const loadCsat = useCallback(async () => {
    setCsatError('');
    try {
      const res = await fetch('/api/coaching/csat', { method:'GET', headers:{'Content-Type':'application/json'} });
      if (res.status===401) return;
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setCsat((Array.isArray(data?.csat)&&data.csat)||(Array.isArray(data?.responses)&&data.responses)||(Array.isArray(data?.items)&&data.items)||[]);
    } catch(err) { setCsat([]); setCsatError('CSAT data unavailable.'); }
  }, []);
  useEffect(() => { loadCsat(); }, [loadCsat]);

  // Derived values
  const todayISO = localISODate();
  const now = new Date();
  const sessionsToday = useMemo(() => sessions.filter(s=>s?.date===todayISO), [sessions,todayISO]);
  const upcomingNext3 = useMemo(() =>
    sessions.filter(s=>s?.date&&s?.time&&toLocalDateTime(s.date,s.time)>=now)
      .sort((a,b)=>toLocalDateTime(a.date,a.time)-toLocalDateTime(b.date,b.time)).slice(0,3),
    [sessions,now]);
  const activeClients = useMemo(() => new Set(sessions.map(s=>(s?.client||'').trim()).filter(Boolean)).size, [sessions]);
  const clients = useMemo(() => {
    const byClient = new Map();
    for (const s of sessions) {
      const name = (s?.client||'').trim(); if (!name) continue;
      const dt = s?.date&&s?.time ? toLocalDateTime(s.date,s.time) : null;
      const ex = byClient.get(name);
      if (!ex) { byClient.set(name,{ id:s?.clientId||name, name, status:s?.status||'Active', nextSession:dt&&dt>=now?dt:null }); continue; }
      ex.status = s?.status||ex.status;
      if (dt&&dt>=now&&(!ex.nextSession||dt<ex.nextSession)) ex.nextSession=dt;
      byClient.set(name,ex);
    }
    return Array.from(byClient.values()).sort((a,b)=>(a.nextSession?.getTime()??Infinity)-(b.nextSession?.getTime()??Infinity));
  }, [sessions,now]);
  const clientsPreview = useMemo(()=>clients.slice(0,3),[clients]);
  const avgScore = csat.length>0
    ? (csat.reduce((s,r)=>s+(Number(r.satisfaction)+Number(r.timeliness)+Number(r.quality))/3,0)/csat.length).toFixed(1) : '—';
  const totalResponses = csat.length;
  const actionBuckets = useMemo(() => {
    const b={messages:[],feedback:[],calendar:[],clients:[],requests:[]};
    for (const n of Array.isArray(actionItems)?actionItems:[]) { const k=pickActionBucket(n); if(b[k]) b[k].push(n); }
    return { messages:b.messages.slice(0,3), feedback:b.feedback.slice(0,3), calendar:b.calendar.slice(0,3), clients:b.clients.slice(0,3), requests:b.requests.slice(0,3) };
  }, [actionItems]);

  const kpis = [
    { label:'Sessions Today',    value:loading?'—':sessionsToday.length, href:'/dashboard/coaching/sessions' },
    { label:'Active Clients',    value:loading?'—':activeClients,        href:'/dashboard/coaching/clients' },
    { label:'Follow-ups Due',    value:0,                                 href:'/action-center?scope=COACH' },
    { label:'Avg Session Rating',value:avgScore==='—'?'—':`${avgScore}/5`,href:'/dashboard/coaching/feedback' },
  ];

  const mobileTiles = [
    { key:'messages', title:'New Messages',        emptyText:'No unread coach inbox items.', href:'/action-center?scope=COACH&chrome=coach',          icon:'💬', items:actionBuckets.messages },
    { key:'requests', title:'Session Requests',    emptyText:'No pending session requests.', href:'/dashboard/coaching/client-hub-update?tab=requests', icon:'📋', items:actionBuckets.requests },
    { key:'calendar', title:'Session Updates',     emptyText:'No calendar updates.',         href:'/dashboard/coaching/sessions',                       icon:'📅', items:actionBuckets.calendar },
    { key:'feedback', title:'New Feedback',        emptyText:'No new feedback yet.',         href:'/dashboard/coaching/feedback',                       icon:'⭐', items:actionBuckets.feedback },
    { key:'clients',  title:'Client Updates',      emptyText:'No new client activity.',      href:'/dashboard/coaching/clients',                        icon:'👤', items:actionBuckets.clients },
  ];
  const sortedMobileTiles = [...mobileTiles].sort((a,b)=>(b.items.length>0?1:0)-(a.items.length>0?1:0));
  const totalActions = mobileTiles.reduce((s,t)=>s+t.items.length,0);

  if (isMobile===null) return <CoachingLayout title="Coaching Dashboard | ForgeTomorrow" activeNav="overview" contentFullBleed sidebarInitialOpen={{coaching:true,seeker:false}}><div style={{minHeight:200}}/></CoachingLayout>;

  // ── MOBILE ────────────────────────────────────────────────────────────────
  if (isMobile) {
    const greeting = getTimeGreeting();

    return (
      <CoachingLayout title="Coaching Dashboard | ForgeTomorrow" activeNav="overview" contentFullBleed sidebarInitialOpen={{coaching:true,seeker:false}}>
        <div style={{ display:'grid', gap:GAP, width:'100%' }}>

          {/* 1. Title card */}
          <CoachingTitleCard
            greeting={greeting}
            title="Your Coaching Dashboard"
            subtitle="Your clients, sessions, and feedback — all in one place."
            isMobile={true}
          />

          {/* 2. Action Center — first, most urgent */}
          <section style={{ ...GLASS, padding:16 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
              <div>
                <div style={{ fontSize:16, fontWeight:900, color:'#FF7043', lineHeight:1.25, letterSpacing:'-0.01em', ...ORANGE_HEADING_LIFT }}>Action Center</div>
                <div style={{ fontSize:12, marginTop:2, fontWeight:totalActions>0?700:500,
                  color:totalActions>0?'#FF7043':'#90A4AE' }}>
                  {totalActions>0 ? `${totalActions} item${totalActions!==1?'s':''} need your attention` : "You're all caught up"}
                </div>
              </div>
              <Link href="/action-center?scope=COACH&chrome=coach" style={{
                fontSize:12, fontWeight:700, color:'#FF7043', textDecoration:'none',
                padding:'6px 12px', borderRadius:999, border:'1px solid rgba(255,112,67,0.30)',
                background:'rgba(255,112,67,0.08)' }}>
                View all
              </Link>
            </div>
            {actionLoading && !actionBootstrapped ? (
              <div style={{ display:'grid', gap:8 }}>
                {[1,2,3,4].map(i=><div key={i} style={{ height:64, borderRadius:12, background:'rgba(255,255,255,0.70)', border:'1px solid rgba(0,0,0,0.06)' }}/>)}
              </div>
            ) : (
              <div style={{ display:'grid', gap:8 }}>
                {sortedMobileTiles.map(t=><MobileActionTile key={t.key} {...t} />)}
              </div>
            )}
          </section>

          {/* 3. KPI strip — horizontal scroll */}
          <section style={{ ...GLASS, padding:'12px 0 12px 12px', overflow:'hidden' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingRight:12, marginBottom:10 }}>
              <span style={{ fontSize:13, fontWeight:800, color:'#112033' }}>Your Numbers</span>
              <Link href="/dashboard/coaching/feedback" style={{ fontSize:12, fontWeight:700, color:'#FF7043', textDecoration:'none' }}>
                Full analytics →
              </Link>
            </div>
            <div style={{ display:'flex', gap:8, overflowX:'auto', paddingRight:12, paddingBottom:4, scrollbarWidth:'none', msOverflowStyle:'none' }}>
              {kpis.map(k=>(
                <Link key={k.label} href={k.href} style={{ flexShrink:0, width:110, ...WHITE_CARD, padding:'10px 12px', textDecoration:'none', display:'block' }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'#FF7043', textTransform:'uppercase', letterSpacing:'0.04em', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {k.label}
                  </div>
                  <div style={{ fontSize:22, fontWeight:900, color:'#112033', lineHeight:1.1, marginTop:4, textAlign:'center' }}>
                    {k.value}
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* 4. Upcoming Sessions */}
          <section style={{ ...GLASS, padding:16 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
              <span style={{ fontSize:18, fontWeight:900, color:'#FF7043', lineHeight:1.25, letterSpacing:'-0.01em', ...ORANGE_HEADING_LIFT }}>Upcoming Sessions</span>
              <Link href="/dashboard/coaching/sessions" style={{ fontSize:12, fontWeight:700, color:'#FF7043', textDecoration:'none', padding:'5px 10px', borderRadius:999, border:'1px solid rgba(255,112,67,0.25)', background:'rgba(255,112,67,0.08)' }}>
                Schedule →
              </Link>
            </div>
            <div style={{ ...WHITE_CARD, padding:12 }}>
              {loading ? (
                <div style={{ color:'#90A4AE', fontSize:13 }}>Loading sessions…</div>
              ) : upcomingNext3.length===0 ? (
                <div style={{ color:'#607D8B', fontSize:13, fontWeight:600 }}>No upcoming sessions. Add one in the calendar.</div>
              ) : (
                <div style={{ display:'grid', gap:8 }}>
                  {upcomingNext3.map(s=>{
                    const { background, color } = getStatusStyles(s.status);
                    return (
                      <div key={s.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:10, border:'1px solid rgba(0,0,0,0.07)', background:'white' }}>
                        <div style={{ width:4, borderRadius:999, alignSelf:'stretch', background:'#FF7043', flexShrink:0 }}/>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13, fontWeight:800, color:'#112033', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.client||'Client'}</div>
                          <div style={{ fontSize:11, color:'#607D8B' }}>{s.date} · {s.time||'—'}</div>
                        </div>
                        <span style={{ fontSize:11, background, color, padding:'2px 8px', borderRadius:999, fontWeight:700, flexShrink:0 }}>{s.status||'Scheduled'}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* 5. Clients snapshot */}
          <section style={{ ...GLASS, padding:16 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
              <span style={{ fontSize:18, fontWeight:900, color:'#FF7043', lineHeight:1.25, letterSpacing:'-0.01em', ...ORANGE_HEADING_LIFT }}>Clients</span>
              <Link href="/dashboard/coaching/clients" style={{ fontSize:12, fontWeight:700, color:'#FF7043', textDecoration:'none', padding:'5px 10px', borderRadius:999, border:'1px solid rgba(255,112,67,0.25)', background:'rgba(255,112,67,0.08)' }}>
                View all →
              </Link>
            </div>
            <div style={{ display:'grid', gap:8 }}>
              {loading ? (
                <div style={{ ...WHITE_CARD, padding:12, color:'#90A4AE', fontSize:13 }}>Loading clients…</div>
              ) : clientsPreview.length===0 ? (
                <div style={{ ...WHITE_CARD, padding:12, color:'#90A4AE', fontSize:13 }}>No clients yet.</div>
              ) : clientsPreview.map(c=>{
                const { background, color } = getStatusStyles(c.status);
                return (
                  <div key={c.id} style={{ ...WHITE_CARD, padding:'10px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:800, color:'#112033', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.name}</div>
                      <div style={{ fontSize:11, color:'#607D8B', marginTop:2 }}>
                        {c.nextSession ? c.nextSession.toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}) : 'No upcoming session'}
                      </div>
                    </div>
                    <span style={{ fontSize:11, background, color, padding:'2px 8px', borderRadius:999, fontWeight:700, flexShrink:0 }}>{c.status}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 6. CSAT Pulse + Sponsored side by side */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:GAP }}>
            <section style={{ ...GLASS, padding:12 }}>
              <div style={{ fontSize:18, fontWeight:900, color:'#FF7043', lineHeight:1.25, letterSpacing:'-0.01em', marginBottom:8, ...ORANGE_HEADING_LIFT }}>CSAT Pulse</div>
              <div style={{ ...WHITE_CARD, padding:10 }}>
                {csatError ? (
                  <div style={{ fontSize:12, color:'#C62828' }}>{csatError}</div>
                ) : (
                  <div style={{ display:'grid', gap:6 }}>
                    <div style={{ display:'flex', alignItems:'baseline', justifyContent:'center', gap:4 }}>
                      <span style={{ fontSize:24, fontWeight:900, color:'#112033' }}>{avgScore}</span>
                      <span style={{ fontSize:12, color:'#90A4AE' }}>/5</span>
                    </div>
                    <div style={{ fontSize:11, color:'#607D8B', textAlign:'center' }}>{totalResponses} response{totalResponses!==1?'s':''}</div>
                    <div style={{ textAlign:'right' }}>
                      <Link href="/dashboard/coaching/feedback" style={{ color:'#FF7043', fontWeight:700, fontSize:12, textDecoration:'none' }}>
                        Open →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </section>
            <section style={{ padding:0 }}>
              <RightRailPlacementManager slot="right_rail_1" />
            </section>
          </div>

          {/* 7. Docs & Tools */}
          <section style={{ ...GLASS, padding:16 }}>
            <div style={{ fontSize:18, fontWeight:900, color:'#FF7043', lineHeight:1.25, letterSpacing:'-0.01em', marginBottom:10, ...ORANGE_HEADING_LIFT }}>Docs & Tools</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {['Templates & Guides','Resource Library','Announcements','Coming Soon'].map(t=>(
                <div key={t} style={{
                  ...WHITE_CARD,
                  padding:12,
                  minHeight:60,
                  display:'flex',
                  flexDirection:'column',
                  justifyContent:'center',
                  alignItems:'center',
                  textAlign:'center'
                }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'#37474F' }}>{t}</div>
                  <div style={{ fontSize:11, color:'#90A4AE', marginTop:4 }}>Coming soon…</div>
                </div>
              ))}
            </div>
          </section>

        </div>
      </CoachingLayout>
    );
  }

  // ── DESKTOP (original, touched only for requested UI refinements) ─────────
  const greeting = getTimeGreeting();
  return (
    <CoachingLayout title="Coaching Dashboard | ForgeTomorrow" activeNav="overview" contentFullBleed sidebarInitialOpen={{coaching:true,seeker:false}}>
      <div style={{ width:'100%', padding:0, margin:0, paddingRight:16, boxSizing:'border-box' }}>
        {error && (
          <div style={{ background:'#FDECEA', borderRadius:8, padding:10, border:'1px solid #FFCDD2', color:'#C62828', fontSize:13, marginBottom:16 }}>{error}</div>
        )}
        <div style={{ display:'grid', gridTemplateColumns:`minmax(0,1fr) ${RIGHT_COL_WIDTH}px`,
          gridTemplateRows:'auto auto auto auto', gap:GAP, width:'100%', minWidth:0, boxSizing:'border-box' }}>

          <CoachingTitleCard
            greeting={greeting}
            title="Your Coaching Dashboard"
            subtitle="Track client progress, manage sessions, and review feedback — all in one place."
            style={{ gridColumn:'1/2', gridRow:'1' }}
          />

          <section style={{ ...KPI_GLASS, padding:'12px 16px 16px 16px', gridColumn:'1/2', gridRow:'2' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
              <h2 style={{ fontSize:18, color:'#FF7043', lineHeight:1.25, letterSpacing:'-0.01em', margin:0, ...ORANGE_HEADING_LIFT }}>KPIs</h2>
              <Link href="/dashboard/coaching/feedback" style={{ color:'#FF7043', fontWeight:800, fontSize:13, lineHeight:1.2, textDecoration:'none', ...ORANGE_HEADING_LIFT }}>Full analytics →</Link>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,minmax(0,1fr))', gap:12 }}>
              {kpis.map(k=>(
                <Link key={k.label} href={k.href} style={{ textDecoration:'none' }}>
                  <KPI label={k.label} value={k.value} />
                </Link>
              ))}
            </div>
          </section>

          <Section title="Action Center" style={{ gridColumn:'1/2', gridRow:'3' }}
            action={
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                {actionRefreshing&&<span style={{ fontSize:12, color:'#90A4AE', fontWeight:600 }}>Updating…</span>}
                <Link href="/action-center?scope=COACH&chrome=coach" style={{ color:'#FF7043', fontWeight:800, fontSize:13, textDecoration:'none', ...ORANGE_HEADING_LIFT }}>View all</Link>
              </div>
            }>
            <div style={{ minHeight:190 }}>
              {actionLoading && !actionBootstrapped ? (
                <div style={{ color:'#90A4AE' }}>Loading updates…</div>
              ) : (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(5,minmax(0,1fr))', gap:12 }}>
                  <ActionLiteCard title="New Messages"     items={actionBuckets.messages} emptyText="No unread coach inbox items." href="/action-center?scope=COACH&chrome=coach" />
                  <ActionLiteCard title="Session Requests" items={actionBuckets.requests} emptyText="No pending session requests." href="/dashboard/coaching/client-hub-update?tab=requests" />
                  <ActionLiteCard title="New Feedback"     items={actionBuckets.feedback} emptyText="No new feedback yet."         href="/dashboard/coaching/feedback" />
                  <ActionLiteCard title="Calendar Updates" items={actionBuckets.calendar} emptyText="No calendar updates."        href="/dashboard/coaching/sessions" />
                  <ActionLiteCard title="Client Updates"   items={actionBuckets.clients}  emptyText="No new client activity."     href="/dashboard/coaching/clients" />
                </div>
              )}
            </div>
          </Section>

          <aside style={{ gridColumn:'2/3', gridRow:'1/4', display:'flex', flexDirection:'column', gap:GAP, alignSelf:'stretch', padding:0, boxSizing:'border-box' }}>
            <div style={{ flex:2, minHeight:180 }}>
              <RightRailPlacementManager slot="right_rail_1" />
            </div>
            <div style={{ ...GLASS, padding:12, flex:'0 0 auto' }}>
              <div style={{ fontSize:15, fontWeight:900, marginBottom:8, color:'#0F172A', lineHeight:1.25, letterSpacing:'-0.01em' }}>CSAT Pulse</div>
              {csatError ? <div style={{ color:'#C62828', fontSize:12 }}>{csatError}</div> : (
                <div style={{ ...WHITE_CARD, padding:12, display:'grid', gap:6 }}>
                  <div style={{ display:'flex', alignItems:'baseline', justifyContent:'center', gap:6 }}>
                    <div style={{ fontSize:24, fontWeight:900, color:'#112033' }}>{avgScore}</div>
                    <div style={{ color:'#90A4AE', fontSize:12 }}>/5</div>
                  </div>
                  <div style={{ color:'#607D8B', fontSize:12, textAlign:'center' }}>Based on {totalResponses} {totalResponses===1?'response':'responses'}</div>
                  <div style={{ marginTop:4, textAlign:'right' }}>
                    <Link href="/dashboard/coaching/feedback" style={{ color:'#FF7043', fontWeight:800, fontSize:13, textDecoration:'none', ...ORANGE_HEADING_LIFT }}>Open feedback</Link>
                  </div>
                </div>
              )}
            </div>
          </aside>

          <div style={{ gridColumn:'1/-1', gridRow:'4', display:'grid',
            gridTemplateColumns:'minmax(0,6fr) minmax(0,4fr) minmax(0,2fr)',
            gap:GAP, marginLeft:-252, boxSizing:'border-box', minWidth:0 }}>

            <Section title="Clients">
              {loading ? (
                <div style={{ color:'#90A4AE', fontSize:14, padding:16, background:'white', borderRadius:10, border:'1px solid #eee' }}>Loading clients…</div>
              ) : clientsPreview.length===0 ? (
                <div style={{ padding:16, background:'white', borderRadius:10, border:'1px solid #eee', color:'#90A4AE', fontSize:14 }}>No clients yet.</div>
              ) : (
                <>
                  <div style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:0, background:'white', border:'1px solid #eee', borderRadius:10, overflow:'hidden' }}>
                      <thead><tr style={{ background:'#FAFAFA' }}><Th>Name</Th><Th>Status</Th><Th>Next Session</Th></tr></thead>
                      <tbody>
                        {clientsPreview.map(c=>{
                          const {background,color}=getStatusStyles(c.status);
                          return (
                            <tr key={c.id} style={{ borderTop:'1px solid #eee' }}>
                              <Td strong>{c.name}</Td>
                              <Td><span style={{ fontSize:12,background,color,padding:'4px 8px',borderRadius:999 }}>{c.status}</span></Td>
                              <Td>{c.nextSession?c.nextSession.toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):'—'}</Td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ textAlign:'right', marginTop:10 }}>
                    <Link href="/dashboard/coaching/clients" style={{ color:'#FF7043', fontWeight:800, fontSize:13, textDecoration:'none', ...ORANGE_HEADING_LIFT }}>View all clients</Link>
                  </div>
                </>
              )}
            </Section>

            <Section title="Docs & Tools">
              <div style={grid3}>
                <Card title="Templates & Guides" />
                <Card title="Resource Library" />
                <Card title="Announcements" />
              </div>
            </Section>

            <Section title="Upcoming Sessions"
              action={<Link href="/dashboard/coaching/sessions" style={{ color:'#FF7043', fontWeight:700, fontSize:13 }}>View schedule</Link>}>
              {loading ? (
                <div style={{ color:'#90A4AE', fontSize:14 }}>Loading…</div>
              ) : upcomingNext3.length===0 ? (
                <div style={{ color:'#607D8B', fontSize:14, fontWeight:600 }}>No upcoming sessions yet.</div>
              ) : (
                <ul style={{ listStyle:'none', padding:0, margin:0, display:'grid', gap:8 }}>
                  {upcomingNext3.map(s=>{
                    const {background,color}=getStatusStyles(s.status);
                    return (
                      <li key={s.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', border:'1px solid #eee', borderRadius:8, padding:'8px 10px', background:'white', gap:10 }}>
                        <span style={{ fontWeight:600, minWidth:72 }}>{s.time||'—'}</span>
                        <div style={{ display:'grid', gap:2, flex:1 }}>
                          <span style={{ color:'#455A64' }}>{s.client||'Client'}</span>
                          <span style={{ color:'#90A4AE', fontSize:12 }}>{s.type||'Session'}</span>
                        </div>
                        <span style={{ fontSize:12, background, color, padding:'4px 8px', borderRadius:999, whiteSpace:'nowrap' }}>{s.status||'Scheduled'}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Section>
          </div>
        </div>
      </div>
    </CoachingLayout>
  );
}