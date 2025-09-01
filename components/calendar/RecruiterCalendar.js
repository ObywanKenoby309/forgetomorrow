import React, { useEffect, useMemo, useState } from 'react';
import CalendarInterface from './CalendarInterface';

// recruiter-oriented defaults
const TYPE_CHOICES = ['Interview', 'Screen', 'Sourcing', 'Offer', 'Task', 'Appointment'];
const STATUS_CHOICES = ['Scheduled', 'Completed', 'Cancelled', 'No-show'];

// localStorage keys (separate buckets so personal ≠ team)
const TEAM_KEY = 'recruiter_team_cal_v1';
const PERSONAL_KEY = 'recruiter_personal_cal_v1';

function useEventCount(storageKey) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) { setCount(0); return; }
      const obj = JSON.parse(raw) || {};
      const sum = Object.values(obj).reduce(
        (acc, arr) => acc + (Array.isArray(arr) ? arr.length : 0),
        0
      );
      setCount(sum);
    } catch {
      setCount(0);
    }
  }, [storageKey]);
  return count;
}

export default function RecruiterCalendar(props) {
  const [tab, setTab] = useState('team'); // 'team' | 'personal'

  const storageKey = tab === 'team' ? TEAM_KEY : PERSONAL_KEY;
  const title = tab === 'team' ? 'Team Calendar' : 'Personal Calendar';

  const teamCount = useEventCount(TEAM_KEY);
  const personalCount = useEventCount(PERSONAL_KEY);

  const Tabs = useMemo(() => (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 12 }}>
      <button
        type="button"
        onClick={() => setTab('team')}
        aria-pressed={tab === 'team'}
        style={{
          padding: '6px 10px',
          borderRadius: 10,
          border: '1px solid #eee',
          background: tab === 'team' ? '#FFF3E9' : 'white',
          color: tab === 'team' ? '#D84315' : '#374151',
          fontWeight: 700,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
        }}
      >
        Team
        <span
          style={{
            background: '#ECEFF1',
            color: '#374151',
            borderRadius: 999,
            padding: '2px 8px',
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          {teamCount}
        </span>
      </button>

      <button
        type="button"
        onClick={() => setTab('personal')}
        aria-pressed={tab === 'personal'}
        style={{
          padding: '6px 10px',
          borderRadius: 10,
          border: '1px solid #eee',
          background: tab === 'personal' ? '#FFF3E9' : 'white',
          color: tab === 'personal' ? '#D84315' : '#374151',
          fontWeight: 700,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
        }}
      >
        Personal
        <span
          style={{
            background: '#ECEFF1',
            color: '#374151',
            borderRadius: 999,
            padding: '2px 8px',
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          {personalCount}
        </span>
      </button>
    </div>
  ), [tab, teamCount, personalCount]);

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {Tabs}
      <CalendarInterface
        {...props}
        title={title}
        storageKey={storageKey}                // <- switched by tab
        typeChoices={TYPE_CHOICES}
        statusChoices={STATUS_CHOICES}
        addLabel="+"
        eventNudge={0}
        eventWidthDeduct={10}
      />
    </div>
  );
}
