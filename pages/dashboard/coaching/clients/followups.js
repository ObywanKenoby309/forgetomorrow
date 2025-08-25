// pages/dashboard/coaching/clients/followups.js
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import CoachingLayout from '@/components/layouts/CoachingLayout';
import CoachingRightColumn from '@/components/coaching/CoachingRightColumn';
import {
  getSettings, saveSettings,
  listByWindow, getAllFollowUps, saveAllFollowUps,
  markDone, snooze
} from '@/lib/coaching/followups';

export default function FollowUpsPage() {
  const router = useRouter();
  const due = (router.query.due || 'today').toString(); // 'today' | 'overdue' | 'this_week' | 'all'
  const [windowKey, setWindowKey] = useState(due);
  const [items, setItems] = useState([]);
  const [settings, setSettings] = useState({ followupCadenceDays: 7 });

  // seed & load
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setSettings(getSettings());
    // ensure array exists
    const arr = getAllFollowUps();
    saveAllFollowUps(arr);
    setItems(listByWindow(windowKey));
  }, [windowKey]);

  function refresh() {
    setItems(listByWindow(windowKey));
  }

  function onSaveSettings() {
    const n = Math.max(1, Number(settings.followupCadenceDays) || 7);
    saveSettings({ followupCadenceDays: n });
    refresh();
  }

  const HeaderBox = (
    <section
      style={{
        background: 'white',
        border: '1px solid #eee',
        borderRadius: 12,
        padding: 16,
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        textAlign: 'center',
      }}
    >
      <h1 style={{ margin: 0, color: '#FF7043', fontSize: 24, fontWeight: 800 }}>
        Follow-ups
      </h1>
      <p style={{ margin: '6px auto 0', color: '#607D8B', maxWidth: 720 }}>
        Review due follow-ups and set your default cadence. Per-client next follow-up can be edited on the client’s profile.
      </p>
    </section>
  );

  return (
    <CoachingLayout
      title="Follow-ups | ForgeTomorrow"
      header={HeaderBox}
      activeNav="clients"
      right={<CoachingRightColumn />}
    >
      <div style={{ display: 'grid', gap: 16, maxWidth: 980 }}>
        {/* Settings strip */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            background: 'white',
            border: '1px solid #eee',
            borderRadius: 12,
            padding: 12,
          }}
        >
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#455A64', fontWeight: 600 }}>Default cadence (days)</span>
            <input
              type="number"
              min={1}
              value={settings.followupCadenceDays}
              onChange={(e) => setSettings({ ...settings, followupCadenceDays: Number(e.target.value) })}
              style={{ width: 90, border: '1px solid #ccc', borderRadius: 8, padding: '6px 8px' }}
            />
          </label>
          <button
            onClick={onSaveSettings}
            style={{
              marginLeft: 'auto',
              background: '#FF7043',
              color: 'white',
              border: '1px solid #FF7043',
              borderRadius: 10,
              padding: '8px 12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Save
          </button>
        </div>

        {/* Filters */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            background: 'white',
            border: '1px solid #eee',
            borderRadius: 12,
            padding: 8,
          }}
        >
          {[
            ['today', 'Today'],
            ['overdue', 'Overdue'],
            ['this_week', 'This Week'],
            ['all', 'All'],
          ].map(([k, label]) => (
            <button
              key={k}
              onClick={() => setWindowKey(k)}
              style={{
                background: windowKey === k ? '#FF7043' : 'white',
                color: windowKey === k ? 'white' : '#FF7043',
                border: '1px solid #FF7043',
                borderRadius: 999,
                padding: '8px 12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          ))}
          <div style={{ marginLeft: 'auto' }}>
            <Link href="/dashboard/coaching/clients" style={{ color: '#FF7043', fontWeight: 600 }}>
              Go to Clients
            </Link>
          </div>
        </div>

        {/* List */}
        <div style={{ display: 'grid', gap: 10 }}>
          {items.length === 0 ? (
            <div
              style={{
                background: 'white',
                border: '1px solid #eee',
                borderRadius: 12,
                padding: 16,
                color: '#90A4AE',
              }}
            >
              No follow-ups in this view.
            </div>
          ) : (
            items.map((f) => {
              const due = new Date(f.nextDueAt);
              return (
                <div
                  key={f.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(220px, 1fr) 1fr 260px',
                    alignItems: 'center',
                    gap: 12,
                    background: 'white',
                    border: '1px solid #eee',
                    borderRadius: 12,
                    padding: 12,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: '#263238' }}>{f.clientName}</div>
                    <div style={{ fontSize: 12, color: '#607D8B' }}>
                      Due {due.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      {f.recurring ? ` • every ${f.cadenceDays ?? getSettings().followupCadenceDays}d` : ' • one-off'}
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: '#455A64' }}>
                    {f.notes || <span style={{ color: '#90A4AE' }}>(No notes)</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => { markDone(f.id); refresh(); }}
                      style={{
                        background: '#E8F5E9',
                        color: '#2E7D32',
                        border: '1px solid #C8E6C9',
                        borderRadius: 8,
                        padding: '8px 10px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Mark done
                    </button>
                    <button
                      onClick={() => { snooze(f.id, 1); refresh(); }}
                      style={{ background: 'white', color: '#455A64', border: '1px solid #CFD8DC', borderRadius: 8, padding: '8px 10px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Snooze +1
                    </button>
                    <button
                      onClick={() => { snooze(f.id, 3); refresh(); }}
                      style={{ background: 'white', color: '#455A64', border: '1px solid #CFD8DC', borderRadius: 8, padding: '8px 10px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      +3
                    </button>
                    <button
                      onClick={() => { snooze(f.id, 7); refresh(); }}
                      style={{ background: 'white', color: '#455A64', border: '1px solid #CFD8DC', borderRadius: 8, padding: '8px 10px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      +7
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </CoachingLayout>
  );
}
