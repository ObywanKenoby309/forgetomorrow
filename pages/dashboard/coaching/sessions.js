// pages/dashboard/coaching/sessions.js
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
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

  useEffect(() => {
    fetch(API_URL)
      .then((r) => r.json())
      .then((d) => setSessions(d.sessions || []));
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

  return (
    <CoachingLayout
      title="Sessions"
      activeNav="sessions"
      right={<CoachingRightColumn />}
    >
      <button onClick={openAdd}>+ Add Session</button>

      {sessions.map((s) => (
        <div key={s.id}>
          <strong>{s.time}</strong> {s.client}
          <button onClick={() => openEdit(s)}>Edit</button>
        </div>
      ))}

      {editor && (
        <CoachSessionEditor
          mode={editor.mode}
          initial={editor.initial}
          onClose={() => setEditor(null)}
          onSaved={() => {
            fetch(API_URL)
              .then((r) => r.json())
              .then((d) => setSessions(d.sessions || []));
            setEditor(null);
          }}
          onDeleted={() => {
            fetch(API_URL)
              .then((r) => r.json())
              .then((d) => setSessions(d.sessions || []));
            setEditor(null);
          }}
        />
      )}
    </CoachingLayout>
  );
}
