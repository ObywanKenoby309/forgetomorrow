// components/calendar/RecruiterCalendar.js
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import RecruiterCalendarEventForm from './RecruiterCalendarEventForm';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MAX_PER_DAY = 3;

// ─── Color palette ────────────────────────────────────────────────────────────
function typeColors(type) {
  const t = (type || '').toLowerCase();
  if (t === 'interview')     return { strip: '#1A4B8F', pillBg: '#E3EDF7', pillFg: '#102A43' };
  if (t === 'screen' || t === 'phone screen')
                             return { strip: '#546E7A', pillBg: '#ECEFF1', pillFg: '#263238' };
  if (t === 'offer')         return { strip: '#FF7043', pillBg: '#FFF3E0', pillFg: '#C75B33' };
  if (t === 'sourcing')      return { strip: '#90A4AE', pillBg: '#F5F7FB', pillFg: '#455A64' };
  if (t === 'task' || t === 'appointment')
                             return { strip: '#B0BEC5', pillBg: '#F5F7F9', pillFg: '#37474F' };
  return                            { strip: '#90A4AE', pillBg: '#F5F7FB', pillFg: '#455A64' };
}

// ─── Date utils ───────────────────────────────────────────────────────────────
function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
function addMonths(date, delta) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}
function fmtYMD(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function fmtDayLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const today = fmtYMD(new Date());
  const tomorrow = fmtYMD(new Date(Date.now() + 86400000));
  if (dateStr === today)    return 'Today';
  if (dateStr === tomorrow) return 'Tomorrow';
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

// ─── Normalizers ──────────────────────────────────────────────────────────────
function normalizeEvent(raw) {
  if (!raw) return null;
  const date = raw.date || raw.sessionDate || raw.startDate || null;
  const time = raw.time || raw.sessionTime || raw.startTime || '';
  const candidateName = raw.candidateName || raw.candidate || raw.clientName || raw.client || '';
  const candidateUserId = raw.candidateUserId || raw.clientUserId || raw.userId || null;
  const candidateType = raw.candidateType === 'internal' || raw.candidateType === 'external'
    ? raw.candidateType : candidateUserId ? 'internal' : 'external';
  const rawScope = raw.scope || raw.calendarScope;
  const scope = rawScope === 'personal' || rawScope === 'team' ? rawScope : 'personal';
  return {
    id: raw.id,
    date: date || new Date().toISOString().slice(0,10),
    time: time || '09:00',
    title: raw.title || '',
    type: raw.type || 'Interview',
    status: raw.status || 'Scheduled',
    notes: raw.notes || '',
    candidateName, candidateUserId, candidateType,
    company: raw.company || '',
    jobTitle: raw.jobTitle || raw.job || '',
    req: raw.req || raw.requisition || '',
    scope,
  };
}
function normalizeEvents(list) {
  if (!Array.isArray(list)) return [];
  return list.map(normalizeEvent).filter(Boolean).sort((a,b) =>
    new Date(`${a.date}T${a.time||'00:00'}`) - new Date(`${b.date}T${b.time||'00:00'}`)
  );
}

// ─── SSR-safe mobile hook ─────────────────────────────────────────────────────
function useIsMobile(bp = 768) {
  const [val, setVal] = useState(null);
  useEffect(() => {
    const check = () => setVal(window.innerWidth < bp);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [bp]);
  return val;
}

// ─── Mobile: Mini Month picker ────────────────────────────────────────────────
function MiniMonth({ cursor, setCursor, selectedDate, onSelectDate, eventsByDate }) {
  const days = useMemo(() => {
    const first = startOfMonth(cursor);
    const gridStart = new Date(first);
    gridStart.setDate(first.getDate() - first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      return { date: d, inMonth: d.getMonth() === cursor.getMonth(), key: fmtYMD(d) };
    });
  }, [cursor]);

  const todayStr = fmtYMD(new Date());
  const monthName = cursor.toLocaleString(undefined, { month: 'long', year: 'numeric' });

  return (
    <div style={{
      background: 'rgba(255,255,255,0.95)',
      borderRadius: 16,
      padding: '14px 16px 10px',
      border: '1px solid rgba(255,112,67,0.15)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      marginBottom: 12,
    }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <button onClick={() => setCursor(c => addMonths(c,-1))}
          style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, color:'#607D8B', padding:'0 6px', lineHeight:1 }}>
          ‹
        </button>
        <span style={{ fontWeight:800, fontSize:15, color:'#112033' }}>{monthName}</span>
        <button onClick={() => setCursor(c => addMonths(c,1))}
          style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, color:'#607D8B', padding:'0 6px', lineHeight:1 }}>
          ›
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', marginBottom:4 }}>
        {WEEKDAYS_SHORT.map((d,i) => (
          <div key={i} style={{ textAlign:'center', fontSize:11, fontWeight:700, color:'#90A4AE', textTransform:'uppercase' }}>{d}</div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2 }}>
        {days.map(({ key, date, inMonth }) => {
          const isToday = key === todayStr;
          const isSelected = key === selectedDate;
          const hasEvents = (eventsByDate[key] || []).length > 0;
          return (
            <button key={key} onClick={() => onSelectDate(key)}
              style={{
                background: isSelected ? '#FF7043' : isToday ? 'rgba(255,112,67,0.12)' : 'transparent',
                border: isToday && !isSelected ? '1px solid rgba(255,112,67,0.40)' : '1px solid transparent',
                borderRadius: 8, padding: '5px 0', cursor:'pointer',
                display:'flex', flexDirection:'column', alignItems:'center', gap:2,
              }}>
              <span style={{
                fontSize:12, fontWeight: isToday || isSelected ? 800 : 500,
                color: isSelected ? 'white' : isToday ? '#FF7043' : inMonth ? '#112033' : '#C5CAD0',
              }}>
                {date.getDate()}
              </span>
              {hasEvents && (
                <span style={{
                  width:4, height:4, borderRadius:999,
                  background: isSelected ? 'rgba(255,255,255,0.8)' : '#FF7043',
                }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Mobile: Agenda event row ─────────────────────────────────────────────────
function AgendaEventRow({ event, onEdit }) {
  const { strip, pillBg, pillFg } = typeColors(event.type);
  const titleText = event.title ||
    (event.candidateName && event.type ? `${event.candidateName} – ${event.type}` : event.candidateName || event.type || 'Item');

  return (
    <button onClick={() => event.id && onEdit(event.id)}
      style={{
        width:'100%', textAlign:'left', background:'rgba(255,255,255,0.95)',
        border:'1px solid rgba(0,0,0,0.07)', borderRadius:12,
        padding:'12px 14px 12px 0', cursor:'pointer',
        display:'flex', alignItems:'stretch', gap:0,
        boxShadow:'0 2px 8px rgba(0,0,0,0.06)',
      }}>
      <div style={{ width:4, borderRadius:'4px 0 0 4px', background:strip, flexShrink:0, marginRight:12 }} />
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, marginBottom:4 }}>
          <span style={{ fontWeight:800, fontSize:14, color:'#112033',
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {titleText}
          </span>
          <span style={{ fontSize:12, color:'#607D8B', flexShrink:0, fontWeight:600 }}>
            {event.time || ''}
          </span>
        </div>
        {(event.company || event.jobTitle || event.req) && (
          <div style={{ fontSize:12, color:'#78909C', marginBottom:6,
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {event.company || event.jobTitle || event.req}
          </div>
        )}
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          <span style={{ fontSize:11, background:pillBg, color:pillFg, padding:'2px 8px', borderRadius:999, fontWeight:700 }}>
            {event.type}
          </span>
          <span style={{ fontSize:11,
            background: event.scope === 'personal' ? 'rgba(255,112,67,0.10)' : '#ECEFF1',
            color: event.scope === 'personal' ? '#C75B33' : '#607D8B',
            padding:'2px 8px', borderRadius:999, fontWeight:700 }}>
            {event.scope === 'personal' ? 'Personal' : 'Team'}
          </span>
          {event.status && event.status !== 'Scheduled' && (
            <span style={{ fontSize:11, background:'#F5F7F9', color:'#90A4AE',
              padding:'2px 8px', borderRadius:999, fontWeight:700 }}>
              {event.status}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Mobile: Agenda view ──────────────────────────────────────────────────────
function AgendaView({ scopedEvents, selectedDate, onEdit, onAdd }) {
  const agendaDays = useMemo(() => {
    const start = new Date(selectedDate + 'T00:00:00');
    return Array.from({ length: 60 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return fmtYMD(d);
    });
  }, [selectedDate]);

  const eventsByDate = useMemo(() => {
    const map = {};
    for (const e of scopedEvents) {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    }
    return map;
  }, [scopedEvents]);

  const activeDays = useMemo(() =>
    agendaDays.filter(d => d === selectedDate || (eventsByDate[d] || []).length > 0),
    [agendaDays, selectedDate, eventsByDate]);

  if (activeDays.length === 0) {
    return (
      <div style={{ textAlign:'center', padding:'40px 20px' }}>
        <div style={{ fontSize:40, marginBottom:12 }}>📅</div>
        <div style={{ fontWeight:800, fontSize:16, color:'#112033', marginBottom:8 }}>Nothing scheduled</div>
        <p style={{ color:'#607D8B', fontSize:14, margin:'0 0 20px' }}>No upcoming events. Add one to get started.</p>
      </div>
    );
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {activeDays.map(dateStr => {
        const evs = eventsByDate[dateStr] || [];
        const isToday = dateStr === fmtYMD(new Date());
        const isSelected = dateStr === selectedDate;
        return (
          <div key={dateStr}>
            <div style={{
              display:'flex', alignItems:'center', gap:10, marginBottom:8,
              position:'sticky', top:0, zIndex:10,
              background:'linear-gradient(to bottom,rgba(236,239,241,1) 80%,rgba(236,239,241,0))',
              paddingTop:4, paddingBottom:8,
            }}>
              <div style={{
                width:36, height:36, borderRadius:999, flexShrink:0,
                background: isToday ? '#FF7043' : isSelected ? 'rgba(255,112,67,0.15)' : 'rgba(0,0,0,0.06)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontWeight:800, fontSize:13,
                color: isToday ? 'white' : isSelected ? '#FF7043' : '#455A64',
              }}>
                {new Date(dateStr+'T00:00:00').getDate()}
              </div>
              <div>
                <div style={{ fontWeight:800, fontSize:14, color: isToday ? '#FF7043' : '#112033' }}>
                  {fmtDayLabel(dateStr)}
                </div>
                {evs.length > 0 && (
                  <div style={{ fontSize:11, color:'#90A4AE', fontWeight:600 }}>
                    {evs.length} event{evs.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
            {evs.length === 0 ? (
              <div style={{ padding:'10px 14px', background:'rgba(255,255,255,0.88)',
                backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)',
                borderRadius:10, fontSize:13, color:'#546E7A', fontStyle:'italic',
                fontWeight:600, border:'1px solid rgba(255,255,255,0.50)',
                boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
                No events — tap + to add one
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {evs.map(e => <AgendaEventRow key={e.id||`${dateStr}-${e.time}`} event={e} onEdit={onEdit} />)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Mobile: Week view ────────────────────────────────────────────────────────
function WeekView({ scopedEvents, selectedDate, onSelectDate, onEdit }) {
  const weekDays = useMemo(() => {
    const d = new Date(selectedDate + 'T00:00:00');
    const start = new Date(d);
    start.setDate(d.getDate() - d.getDay());
    return Array.from({ length:7 }, (_, i) => {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      return { key: fmtYMD(day), date: day };
    });
  }, [selectedDate]);

  const eventsByDate = useMemo(() => {
    const map = {};
    for (const e of scopedEvents) {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    }
    return map;
  }, [scopedEvents]);

  const todayStr = fmtYMD(new Date());

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4, marginBottom:16 }}>
        {weekDays.map(({ key, date }) => {
          const isToday = key === todayStr;
          const isSelected = key === selectedDate;
          const hasEvents = (eventsByDate[key] || []).length > 0;
          return (
            <button key={key} onClick={() => onSelectDate(key)}
              style={{
                display:'flex', flexDirection:'column', alignItems:'center', gap:3,
                padding:'8px 0', borderRadius:12, border:'none', cursor:'pointer',
                background: isSelected ? '#FF7043' : isToday ? 'rgba(255,112,67,0.10)' : 'rgba(255,255,255,0.80)',
                boxShadow: isSelected ? '0 4px 12px rgba(255,112,67,0.30)' : '0 1px 4px rgba(0,0,0,0.06)',
              }}>
              <span style={{ fontSize:10, fontWeight:700, textTransform:'uppercase',
                color: isSelected ? 'rgba(255,255,255,0.8)' : '#90A4AE' }}>
                {WEEKDAYS_SHORT[date.getDay()]}
              </span>
              <span style={{ fontSize:15, fontWeight:800,
                color: isSelected ? 'white' : isToday ? '#FF7043' : '#112033' }}>
                {date.getDate()}
              </span>
              {hasEvents && (
                <span style={{ width:4, height:4, borderRadius:999,
                  background: isSelected ? 'rgba(255,255,255,0.8)' : '#FF7043' }} />
              )}
            </button>
          );
        })}
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {(eventsByDate[selectedDate] || []).length === 0 ? (
          <div style={{ textAlign:'center', padding:'24px 20px',
            background:'rgba(255,255,255,0.88)',
            backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)',
            borderRadius:14, border:'1px solid rgba(255,255,255,0.50)',
            boxShadow:'0 2px 8px rgba(0,0,0,0.06)',
            color:'#546E7A', fontSize:14, fontWeight:600 }}>
            No events on this day
          </div>
        ) : (
          (eventsByDate[selectedDate] || []).map(e => (
            <AgendaEventRow key={e.id||`${selectedDate}-${e.time}`} event={e} onEdit={onEdit} />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Mobile wrapper ───────────────────────────────────────────────────────────
function MobileCalendar({ scopedEvents, viewScope, setViewScope, cursor, setCursor, onAdd, onEdit }) {
  const [mobileView, setMobileView] = useState('agenda');
  const [selectedDate, setSelectedDate] = useState(fmtYMD(new Date()));

  const eventsByDate = useMemo(() => {
    const map = {};
    for (const e of scopedEvents) {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    }
    return map;
  }, [scopedEvents]);

  const views = [
    { key:'agenda', label:'Agenda' },
    { key:'week',   label:'Week'   },
    { key:'month',  label:'Month'  },
  ];

  return (
    <div style={{ position:'relative' }}>
      {/* View toggle + scope */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12, gap:8 }}>
        <div style={{ display:'flex', gap:4, background:'rgba(255,255,255,0.70)',
          borderRadius:999, padding:3, border:'1px solid rgba(0,0,0,0.08)' }}>
          {views.map(v => (
            <button key={v.key} onClick={() => setMobileView(v.key)}
              style={{
                padding:'6px 14px', borderRadius:999, border:'none', cursor:'pointer',
                fontWeight:800, fontSize:12,
                background: mobileView === v.key ? '#FF7043' : 'transparent',
                color: mobileView === v.key ? 'white' : '#607D8B',
                boxShadow: mobileView === v.key ? '0 2px 8px rgba(255,112,67,0.30)' : 'none',
                transition:'all 150ms ease',
              }}>
              {v.label}
            </button>
          ))}
        </div>
        <div style={{ display:'flex', gap:4 }}>
          {['personal','team'].map(s => (
            <button key={s} onClick={() => setViewScope(s)}
              style={{
                padding:'5px 10px', borderRadius:999, border:'none', cursor:'pointer',
                fontWeight:700, fontSize:11,
                background: viewScope === s
                  ? (s==='personal' ? 'rgba(255,112,67,0.15)' : 'rgba(26,75,143,0.12)')
                  : 'rgba(255,255,255,0.70)',
                color: viewScope === s ? (s==='personal' ? '#FF7043' : '#1A4B8F') : '#90A4AE',
                border: viewScope === s
                  ? `1px solid ${s==='personal' ? 'rgba(255,112,67,0.30)' : 'rgba(26,75,143,0.25)'}`
                  : '1px solid transparent',
              }}>
              {s === 'personal' ? 'Me' : 'Team'}
            </button>
          ))}
        </div>
      </div>

      {/* Mini month — always visible, synced to selectedDate */}
      <MiniMonth cursor={cursor} setCursor={setCursor}
        selectedDate={selectedDate} onSelectDate={setSelectedDate}
        eventsByDate={eventsByDate} />

      {/* View content */}
      {mobileView === 'agenda' && (
        <AgendaView scopedEvents={scopedEvents} selectedDate={selectedDate}
          onEdit={onEdit} onAdd={onAdd} />
      )}
      {mobileView === 'week' && (
        <WeekView scopedEvents={scopedEvents} selectedDate={selectedDate}
          onSelectDate={setSelectedDate} onEdit={onEdit} />
      )}
      {mobileView === 'month' && (
        <div>
          <div style={{ fontWeight:800, fontSize:15, color:'#112033', marginBottom:10 }}>
            {fmtDayLabel(selectedDate)}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {(eventsByDate[selectedDate] || []).length === 0 ? (
              <div style={{ textAlign:'center', padding:'20px',
                background:'rgba(255,255,255,0.88)',
                backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)',
                borderRadius:12, border:'1px solid rgba(255,255,255,0.50)',
                boxShadow:'0 2px 8px rgba(0,0,0,0.06)',
                color:'#546E7A', fontSize:14, fontWeight:600 }}>
                No events on this day
              </div>
            ) : (
              (eventsByDate[selectedDate] || []).map(e => (
                <AgendaEventRow key={e.id||`${selectedDate}-${e.time}`} event={e} onEdit={onEdit} />
              ))
            )}
          </div>
        </div>
      )}

      {/* Floating add button */}
      <button onClick={onAdd} style={{
        position:'fixed', bottom:100, right:20, zIndex:40,
        width:52, height:52, borderRadius:999,
        background:'#FF7043', border:'none', cursor:'pointer',
        display:'flex', alignItems:'center', justifyContent:'center',
        boxShadow:'0 8px 24px rgba(255,112,67,0.45)',
        fontSize:26, color:'white',
      }}>
        +
      </button>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function RecruiterCalendar({ title = 'Recruiter Calendar', seed = [], storageKey }) {
  const isMobile = useIsMobile(768);

  const [cursor, setCursor]     = useState(() => startOfMonth(new Date()));
  const [viewScope, setViewScope] = useState('personal');
  const [events, setEvents]     = useState(() => normalizeEvents(seed));
  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [modal, setModal]       = useState({ open:false, mode:'add', eventId:null, initial:null });

  const TYPE_CHOICES   = ['Interview','Screen','Sourcing','Offer','Task','Appointment'];
  const STATUS_CHOICES = ['Scheduled','Completed','Rescheduled','Cancelled'];

  const monthName = useMemo(() =>
    cursor.toLocaleString(undefined, { month:'long', year:'numeric' }), [cursor]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch('/api/recruiter/calendar');
        if (!res.ok) return;
        const data = await res.json().catch(() => ({}));
        const raw = Array.isArray(data) ? data : data.events || data.items || [];
        if (!cancelled) setEvents(normalizeEvents(raw));
      } catch (err) { console.warn('Calendar load failed:', err); }
      finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const scopedEvents = useMemo(() =>
    events.filter(e => viewScope === 'team' ? e.scope === 'team' : true),
    [events, viewScope]);

  const eventsByDate = useMemo(() => {
    const map = {};
    for (const e of scopedEvents) {
      if (!e?.date) continue;
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    }
    return map;
  }, [scopedEvents]);

  const openAdd = useCallback(() => {
    const today = new Date().toISOString().slice(0,10);
    const defaultScope = viewScope === 'team' ? 'team' : 'personal';
    setModal({ open:true, mode:'add', eventId:null, initial:{
      title:'', date:today, time:'09:00', type:'Interview', status:'Scheduled',
      notes:'', candidateType:'external', candidateUserId:null, candidateName:'',
      calendarScope:defaultScope, scope:defaultScope,
    }});
  }, [viewScope]);

  const openEdit = useCallback((eventId) => {
    const existing = events.find(e => e.id === eventId);
    if (!existing) return;
    setModal({ open:true, mode:'edit', eventId, initial:{ ...existing, calendarScope:existing.scope }});
  }, [events]);

  const closeModal = () => { setModal({ open:false, mode:'add', eventId:null, initial:null }); setSaving(false); };

  const upsertLocal = (eventData, mode, eventId) => {
    const normalized = normalizeEvent({ ...eventData, id: mode==='edit' ? eventId : (eventData.id||Date.now().toString()) });
    setEvents(prev => {
      if (mode==='edit') return normalizeEvents(prev.map(e => e.id===normalized.id ? normalized : e));
      return normalizeEvents([...prev, normalized]);
    });
  };

  const handleSave = async (formData) => {
    const mode = modal.mode;
    const eventId = modal.eventId || formData.id;
    try {
      setSaving(true);
      const scopeFromForm = formData.calendarScope === 'team' ? 'team' : 'personal';
      const payload = { id:eventId, title:formData.title, date:formData.date, time:formData.time,
        type:formData.type, status:formData.status, notes:formData.notes,
        candidateType:formData.candidateType, candidateUserId:formData.candidateUserId,
        candidateName:formData.candidateName, scope:scopeFromForm };
      let finalEvent = payload;
      try {
        const res = await fetch('/api/recruiter/calendar', {
          method: mode==='edit' ? 'PUT' : 'POST',
          headers: { 'Content-Type':'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          finalEvent = { ...payload, ...(data.event||data.item||data||{}) };
        }
      } catch (err) { console.warn('Save API error:', err); }
      upsertLocal(finalEvent, mode, eventId);
      closeModal();
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    const eventId = modal.eventId;
    if (!eventId) return;
    try {
      setSaving(true);
      try {
        await fetch('/api/recruiter/calendar', { method:'DELETE',
          headers:{'Content-Type':'application/json'}, body:JSON.stringify({ id:eventId }) });
      } catch (err) { console.warn('Delete API error:', err); }
      setEvents(prev => prev.filter(e => e.id !== eventId));
      closeModal();
    } finally { setSaving(false); }
  };

  // Desktop styles (identical to original)
  const shell = { background:'#F4F6F8', borderRadius:16, border:'1px solid #E0E0E0', padding:16, width:'100%', boxSizing:'border-box' };
  const navBtn = { background:'#FFFFFF', border:'1px solid #CFD8DC', color:'#455A64', padding:'4px 8px', borderRadius:999, cursor:'pointer', fontSize:11, fontWeight:600, minWidth:30 };
  const todayBtn = { ...navBtn, border:'1px solid #1A4B8F', color:'#1A4B8F' };
  const addBtn = { background:'#FF7043', border:'none', color:'white', padding:'6px 14px', borderRadius:999, cursor:'pointer', fontWeight:700, fontSize:11, boxShadow:'0 6px 14px rgba(255,112,67,0.35)', whiteSpace:'nowrap' };
  const scopeBtnBase = { padding:'4px 10px', borderRadius:999, border:'1px solid #CFD8DC', fontSize:12, fontWeight:600, cursor:'pointer', background:'#FFFFFF', color:'#455A64' };
  const gridStyle = { display:'grid', gridTemplateColumns:'repeat(7,minmax(0,1fr))', gridAutoRows:'minmax(110px,1fr)', gap:6 };
  const todayStr = fmtYMD(new Date());

  const days = useMemo(() => {
    const first = startOfMonth(cursor);
    const gridStart = new Date(first);
    gridStart.setDate(first.getDate() - first.getDay());
    return Array.from({ length:42 }, (_,i) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      return { date:d, inMonth:d.getMonth()===cursor.getMonth(), key:fmtYMD(d) };
    });
  }, [cursor]);

  const cell = (inMonth, isToday) => ({
    background: isToday ? 'linear-gradient(135deg,#FFFFFF,#E3EDF5)' : inMonth ? '#FFFFFF' : '#F1F3F5',
    borderRadius:12, padding:8,
    border: isToday ? '1px solid rgba(255,112,67,0.75)' : '1px solid #E0E0E0',
    boxShadow: isToday ? '0 0 0 1px rgba(255,112,67,0.35)' : '0 1px 3px rgba(15,23,42,0.06)',
    display:'flex', flexDirection:'column', minWidth:0,
  });

  if (isMobile === null) return <div style={shell} />;

  // ── MOBILE ──
  if (isMobile) {
    return (
      <>
        <div style={{ width:'100%', padding:'0 4px', boxSizing:'border-box' }}>
          <div style={{
            marginBottom:16,
            background:'rgba(255,255,255,0.82)',
            backdropFilter:'blur(10px)',
            WebkitBackdropFilter:'blur(10px)',
            borderRadius:14,
            border:'1px solid rgba(255,255,255,0.40)',
            boxShadow:'0 4px 16px rgba(0,0,0,0.10)',
            padding:'14px 16px',
          }}>
            <div style={{ fontWeight:800, fontSize:18, color:'#112033' }}>{title}</div>
            <div style={{ fontSize:12, color:'#546E7A', marginTop:3, fontWeight:600 }}>
              Tap a date · swipe to browse
            </div>
          </div>
          <MobileCalendar
            scopedEvents={scopedEvents}
            viewScope={viewScope} setViewScope={setViewScope}
            cursor={cursor} setCursor={setCursor}
            onAdd={openAdd} onEdit={openEdit}
          />
        </div>
        {modal.open && (
          <RecruiterCalendarEventForm
            mode={modal.mode} initial={modal.initial}
            onClose={closeModal} onSave={handleSave}
            onDelete={modal.mode==='edit' ? handleDelete : undefined}
            typeChoices={TYPE_CHOICES} statusChoices={STATUS_CHOICES}
            saving={saving}
          />
        )}
      </>
    );
  }

  // ── DESKTOP (original, untouched) ──
  return (
    <>
      <section style={shell}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12, gap:12, flexWrap:'wrap' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
            <div style={{ fontWeight:800, fontSize:18, color:'#112033' }}>{title}</div>
            <div style={{ fontSize:12, color:'#607D8B' }}>{monthName} · Plan interviews, screens, and hiring tasks at a glance.</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
            <button type="button" style={navBtn} onClick={() => setCursor(c=>addMonths(c,-1))} aria-label="Previous month">◀</button>
            <button type="button" style={todayBtn} onClick={() => setCursor(startOfMonth(new Date()))}>Today</button>
            <button type="button" style={navBtn} onClick={() => setCursor(c=>addMonths(c,1))} aria-label="Next month">▶</button>
            <button type="button" style={addBtn} onClick={openAdd}>+ Add Item</button>
          </div>
        </div>

        <div style={{ display:'flex', gap:8, marginBottom:6 }}>
          {['personal','team'].map(s => (
            <button key={s} type="button" onClick={() => setViewScope(s)}
              style={{ ...scopeBtnBase,
                border: viewScope===s ? `1px solid ${s==='personal'?'#FF7043':'#1A4B8F'}` : scopeBtnBase.border,
                background: viewScope===s ? `rgba(${s==='personal'?'255,112,67':'26,75,143'},0.08)` : scopeBtnBase.background,
                color: viewScope===s ? (s==='personal'?'#FF7043':'#1A4B8F') : scopeBtnBase.color,
              }}>
              {s==='personal' ? 'Personal (me)' : 'Team (shared)'}
            </button>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,minmax(0,1fr))', marginBottom:4 }}>
          {WEEKDAYS.map(d => (
            <div key={d} style={{ fontSize:11, color:'#607D8B', textAlign:'center', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em' }}>{d}</div>
          ))}
        </div>

        <div style={gridStyle}>
          {days.map(({ key, date, inMonth }) => {
            const isToday = key === todayStr;
            const list = eventsByDate[key] || [];
            const visible = list.slice(0, MAX_PER_DAY);
            const extra = list.length - visible.length;
            return (
              <div key={key} style={cell(inMonth, isToday)}>
                <div style={{ alignSelf:'flex-end', fontSize:11, fontWeight:800,
                  color:isToday?'#FF7043':'#455A64', background:isToday?'#FFFFFF':'transparent',
                  borderRadius:999, padding:isToday?'2px 8px':0 }}>
                  {date.getDate()}
                </div>
                <div style={{ display:'grid', gap:4, marginTop:4 }}>
                  {visible.map(e => {
                    const { strip, pillBg, pillFg } = typeColors(e.type);
                    const titleText = e.title||(e.candidateName&&e.type?`${e.candidateName} – ${e.type}`:e.candidateName||e.type||'Item');
                    const subtitle = e.company||e.req||e.jobTitle||'';
                    return (
                      <div key={e.id||`${key}-${e.time||''}-${titleText}`}
                        style={{ marginTop:2, padding:'6px 8px 6px 6px', borderRadius:9,
                          border:'1px solid #E0E4EE', background:'#F9FBFF', color:'#263238',
                          fontSize:11, display:'grid', gridTemplateColumns:'3px 1fr', gap:6, cursor:'pointer' }}
                        onClick={() => e.id && openEdit(e.id)}>
                        <div style={{ width:3, borderRadius:999, background:strip }} />
                        <div style={{ display:'flex', flexDirection:'column', gap:2, minWidth:0 }}>
                          <div style={{ display:'flex', justifyContent:'space-between', gap:6, alignItems:'center' }}>
                            <div style={{ fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:11 }}>{titleText}</div>
                            <div style={{ fontSize:11, color:'#546E7A', whiteSpace:'nowrap' }}>{e.time||''}</div>
                          </div>
                          {subtitle && <div style={{ fontSize:10, color:'#78909C', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{subtitle}</div>}
                          <div style={{ display:'flex', gap:4, marginTop:2 }}>
                            {e.type && <span style={{ fontSize:10, background:pillBg, color:pillFg, padding:'2px 6px', borderRadius:999, lineHeight:1.2 }}>{e.type}</span>}
                            <span style={{ fontSize:10, background:e.scope==='personal'?'rgba(255,112,67,0.12)':'#ECEFF1', color:e.scope==='personal'?'#C75B33':'#607D8B', padding:'2px 6px', borderRadius:999, lineHeight:1.2 }}>
                              {e.scope==='personal'?'Personal':'Team'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {extra > 0 && <div style={{ marginTop:2, fontSize:10, color:'#90A4AE' }}>+{extra} more</div>}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {modal.open && (
        <RecruiterCalendarEventForm
          mode={modal.mode} initial={modal.initial}
          onClose={closeModal} onSave={handleSave}
          onDelete={modal.mode==='edit' ? handleDelete : undefined}
          typeChoices={TYPE_CHOICES} statusChoices={STATUS_CHOICES}
          saving={saving}
        />
      )}
    </>
  );
}