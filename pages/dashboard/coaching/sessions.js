// pages/dashboard/coaching/sessions.js
import React, { useEffect, useMemo, useState } from 'react';
import CoachingLayout from '@/components/layouts/CoachingLayout';
import CoachingRightColumn from '@/components/coaching/CoachingRightColumn';
import CoachSessionEditor from '@/components/calendar/CoachSessionEditor';

const API_URL = '/api/coaching/sessions';

function localISODate(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export default function CoachingSessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [editor, setEditor] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_URL);
      const data = await res.json().catch(() => ({}));
      setSessions(Array.isArray(data.sessions) ? data.sessions : []);
    } catch (err) {
      console.error('Error loading coaching sessions:', err);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const openAdd = () =>
    setEditor({
      mode: 'add',
      initial: { date: localISODate(), time: '09:00' },
    });

  const openEdit = (s) =>
    setEditor({
      mode: 'edit',
      initial: s,
    });

  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => {
      const aKey = `${a.date || ''}T${a.time || ''}`;
      const bKey = `${b.date || ''}T${b.time || ''}`;
      return aKey.localeCompare(bKey);
    });
  }, [sessions]);

  // ───────── styles for the page shell ─────────
  const shell = {
    background: '#F4F6F8',
    borderRadius: 16,
    border: '1px solid #E0E0E0',
    padding: 16,
    boxShadow: '0 12px 28px rgba(15,23,42,0.15)',
  };

  const headerRow = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  };

  const titleBlock = {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  };

  const titleStyle = {
    fontWeight: 800,
    fontSize: 18,
    color: '#112033',
  };

  const subtitleStyle = {
    fontSize: 12,
    color: '#607D8B',
  };

  const addBtn = {
    background: '#FF7043',
    border: 'none',
    color: 'white',
    padding: '8px 16px',
    borderRadius: 999,
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 13,
    boxShadow: '0 6px 14px rgba(255,112,67,0.35)',
    whiteSpace: 'nowrap',
  };

  const listWrap = {
    display: 'grid',
    gap: 8,
    marginTop: 8,
  };

  const rowCard = {
    background: '#FFFFFF',
    borderRadius: 12,
    border: '1px solid #E0E0E0',
    padding: 10,
    display: 'grid',
    gridTemplateColumns: '60px minmax(0,1fr) auto',
    alignItems: 'center',
    gap: 10,
  };

  const timeCol = {
    fontWeight: 700,
    fontSize: 13,
    color: '#1A4B8F',
  };

  const mainCol = {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    minWidth: 0,
  };

  const clientLine = {
    fontSize: 14,
    fontWeight: 600,
    color: '#263238',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const metaLine = {
    fontSize: 12,
    color: '#607D8B',
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  };

  const pill = (bg, fg) => ({
    fontSize: 11,
    background: bg,
    color: fg,
    padding: '2px 6px',
    borderRadius: 999,
  });

  const statusStyle = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'completed') return pill('#E8F5E9', '#2E7D32');
    if (s === 'no-show' || s === 'cancelled')
      return pill('#FFEBEE', '#C62828');
    return pill('#E3EDF7', '#1A4B8F'); // Scheduled / default
  };

  const editBtn = {
    background: 'white',
    border: '1px solid #CFD8DC',
    borderRadius: 999,
    padding: '6px 10px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    color: '#37474F',
  };

  const emptyState = {
    fontSize: 13,
    color: '#607D8B',
    padding: '8px 2px',
  };

  return (
    <CoachingLayout
      title="Sessions | ForgeTomorrow"
      activeNav="sessions"
      right={<CoachingRightColumn />}
    >
      <div style={{ display: 'grid', gap: 24, width: '100%', paddingBottom: 12 }}>
        <section style={shell}>
          <div style={headerRow}>
            <div style={titleBlock}>
              <div style={titleStyle}>Sessions</div>
              <div style={subtitleStyle}>
                Manage your coaching time – add, review, and update sessions in one place.
              </div>
            </div>

            <button type="button" style={addBtn} onClick={openAdd}>
              + Add Session
            </button>
          </div>

          {loading ? (
            <div style={emptyState}>Loading your sessions…</div>
          ) : sortedSessions.length === 0 ? (
            <div style={emptyState}>
              You don’t have any sessions scheduled yet. Click “Add Session” to create one.
            </div>
          ) : (
            <div style={listWrap}>
              {sortedSessions.map((s) => (
                <div key={s.id} style={rowCard}>
                  <div style={timeCol}>{s.time || '--:--'}</div>

                  <div style={mainCol}>
                    <div style={clientLine}>{s.client || 'Unnamed client'}</div>
                    <div style={metaLine}>
                      {s.type && (
                        <span style={pill('#F5F7FB', '#455A64')}>
                          {s.type}
                        </span>
                      )}
                      {s.status && (
                        <span style={statusStyle(s.status)}>{s.status}</span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    style={editBtn}
                    onClick={() => openEdit(s)}
                  >
                    Edit
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {editor && (
        <CoachSessionEditor
          mode={editor.mode}
          initial={editor.initial}
          onClose={() => setEditor(null)}
          onSaved={() => {
            loadSessions();
            setEditor(null);
          }}
          onDeleted={() => {
            loadSessions();
            setEditor(null);
          }}
        />
      )}
    </CoachingLayout>
  );
}
