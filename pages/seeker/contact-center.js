// pages/seeker/contact-center.js
import React, { useMemo, useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import SeekerLayout from '@/components/layouts/SeekerLayout';
import SeekerRightColumn from '@/components/seeker/SeekerRightColumn';

import ContactsList from '@/components/ContactsList';
import RequestList from '@/components/RequestList';
import { readContactsData, LS_KEYS } from '@/lib/contactsStore';

// local helper for writing JSON to LS
const writeJSON = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };
const SIGNAL_LS_KEY = 'signal_messages_v1';

export default function SeekerContactCenter() {
  const router = useRouter();

  // --- Tabs from query
  const currentTab = (() => {
    const t = (router.query.tab || '').toString();
    return ['contacts','signal','invites','requests','following'].includes(t) ? t : 'contacts';
  })();

  const currentSub = (() => {
    const s = (router.query.sub || '').toString();
    return ['people','groups','events','newsletters'].includes(s) ? s : 'people';
  })();

  // --- State
  const [contacts, setContacts] = useState([]);
  const [incomingRequests, setIncoming] = useState([]);
  const [outgoingRequests, setOutgoing] = useState([]);
  const [groups, setGroups] = useState([]);
  const [follows, setFollows] = useState({ people: [], pages: [], newsletters: [], groups: [], events: [] });

  // Signal preview
  const [signalThreads, setSignalThreads] = useState([]);
  const unreadSignalCount = useMemo(
    () => signalThreads.reduce((sum, t) => sum + (t.unread || 0), 0),
    [signalThreads]
  );

  // --- Load from LS once
  useEffect(() => {
    const { contacts, groups, requests, follows } = readContactsData();
    setContacts(contacts);
    setGroups(groups);
    setIncoming(requests.incoming || []);
    setOutgoing(requests.outgoing || []);
    setFollows({
      people: follows?.people || [],
      pages: follows?.pages || [],
      newsletters: follows?.newsletters || [],
      groups: follows?.groups || [],
      events: follows?.events || [],
    });

    // Signal threads (preview)
    try {
      const saved = JSON.parse(localStorage.getItem(SIGNAL_LS_KEY) || 'null');
      if (saved?.threads) setSignalThreads(saved.threads);
    } catch {}
  }, []);

  // --- Persist helpers
  const persistRequests = (incomingArr, outgoingArr) => {
    writeJSON(LS_KEYS.REQUESTS, { incoming: incomingArr, outgoing: outgoingArr });
  };
  const persistContacts = (arr) => writeJSON(LS_KEYS.CONTACTS, arr);

  // --- Counts
  const counts = useMemo(() => ({
    contacts: contacts.length,
    invitesIn: incomingRequests.length,
    invitesOut: outgoingRequests.length,
    followingPeople: follows.people.length,
    followingGroups: follows.groups.length,
    followingEvents: follows.events.length,
    followingNews: follows.newsletters.length,
  }), [contacts, incomingRequests, outgoingRequests, follows]);

  // --- Handlers
  const handleViewProfile = (c) => alert(`View profile for ${c.name} (coming soon)`);

  const handleAccept = (req) => {
    const nextIncoming = incomingRequests.filter(r => r.id !== req.id);
    const nextContacts = [...contacts, { id: req.id, name: req.name, status: 'Connected', photo: req.photo, groups: [] }];
    setIncoming(nextIncoming);
    setContacts(nextContacts);
    persistRequests(nextIncoming, outgoingRequests);
    persistContacts(nextContacts);
  };

  const handleDecline = (req) => {
    const nextIncoming = incomingRequests.filter(r => r.id !== req.id);
    setIncoming(nextIncoming);
    persistRequests(nextIncoming, outgoingRequests);
  };

  const handleCancel = (req) => {
    const nextOutgoing = outgoingRequests.filter(r => r.id !== req.id);
    setOutgoing(nextOutgoing);
    persistRequests(incomingRequests, nextOutgoing);
  };

  // Bulk actions (bottom CTAs for Invites/Requests)
  const approveAllIncoming = () => {
    if (!incomingRequests.length) return;
    const accepted = incomingRequests.map(r => ({ id: r.id, name: r.name, photo: r.photo, status: 'Connected', groups: [] }));
    const nextContacts = [...contacts, ...accepted];
    setIncoming([]);
    setContacts(nextContacts);
    persistRequests([], outgoingRequests);
    persistContacts(nextContacts);
  };

  const cancelAllOutgoing = () => {
    if (!outgoingRequests.length) return;
    setOutgoing([]);
    persistRequests(incomingRequests, []);
  };

  // Signal: mark all read (optional utility, keeps preview tidy if you want to call it later)
  const markAllSignalAsRead = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(SIGNAL_LS_KEY) || 'null');
      if (!saved?.threads) return;
      const next = {
        ...saved,
        threads: saved.threads.map(t => ({
          ...t,
          unread: 0,
          messages: (t.messages || []).map(m => ({ ...m, read: true })),
        })),
      };
      localStorage.setItem(SIGNAL_LS_KEY, JSON.stringify(next));
      setSignalThreads(next.threads);
    } catch {}
  };

  // --- Header card
  const HeaderBox = (
    <section style={{
      background: 'white', borderRadius: 12, padding: 16,
      boxShadow: '0 2px 6px rgba(0,0,0,0.06)', border: '1px solid #eee', textAlign: 'center'
    }}>
      <h1 style={{ margin: 0, color: '#FF7043', fontSize: 24, fontWeight: 800 }}>
        Contact Center
      </h1>
      <p style={{ margin: '6px auto 0', color: '#607D8B', maxWidth: 720 }}>
        Manage contacts, follow creators & pages, and handle invites — all in one place.
      </p>
    </section>
  );

  const RightRail = (
    <div style={{ display: 'grid', gap: 12 }}>
      <SeekerRightColumn variant="contacts" />
    </div>
  );

  // --- Tab links (query param; shallow)
  const TabLink = ({ label, badge, tabValue, isActive }) => (
    <Link
      href={{ pathname: '/seeker/contact-center', query: { tab: tabValue } }}
      shallow
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '8px 12px', borderRadius: 10, border: '1px solid #eee',
        background: isActive ? '#FFF3E9' : 'white',
        color: isActive ? '#D84315' : '#374151',
        fontWeight: 700, textDecoration: 'none'
      }}
    >
      <span>{label}</span>
      {typeof badge === 'number' && (
        <span style={{
          background: '#ECEFF1', color: '#374151',
          borderRadius: 999, padding: '2px 8px', fontSize: 12, fontWeight: 800
        }}>
          {badge}
        </span>
      )}
    </Link>
  );

  const SubTab = ({ label, value }) => {
    const active = currentSub === value;
    return (
      <Link
        href={{ pathname: '/seeker/contact-center', query: { tab: 'following', sub: value } }}
        shallow
        className="text-sm"
        style={{
          padding: '6px 10px', borderRadius: 8,
          border: '1px solid #eee', background: active ? '#FFF3E9' : 'white',
          color: active ? '#D84315' : '#374151', fontWeight: 700, textDecoration: 'none'
        }}
      >
        {label}
      </Link>
    );
  };

  // Tiny list item renderer for Following previews
  const Tiny = ({ avatar, title, subtitle }) => (
    <li className="flex items-center gap-3 p-2 border rounded bg-white">
      {avatar ? (
        <img src={avatar} alt="" width={32} height={32} className="rounded-full object-cover" />
      ) : (
        <div className="w-8 h-8 rounded-full bg-gray-200" />
      )}
      <div className="min-w-0">
        <div className="text-sm font-medium truncate">{title}</div>
        {subtitle && <div className="text-xs text-gray-600 truncate">{subtitle}</div>}
      </div>
    </li>
  );

  // Signal previews (computed inline in render)
  const computeSignalPreviews = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(SIGNAL_LS_KEY) || 'null');
      const threads = Array.isArray(saved?.threads) ? saved.threads : [];
      const previews = threads
        .map(t => {
          const last = t.messages?.[t.messages.length - 1];
          const lastTs = last?.ts || 0;
          return {
            id: t.id,
            name: t.name,
            muted: !!t.muted,
            unread: t.unread || 0,
            lastText: last?.text || '',
            lastTs,
          };
        })
        .sort((a, b) => (b.unread - a.unread) || (b.lastTs - a.lastTs))
        .slice(0, 4);
      return previews;
    } catch {
      return [];
    }
  };

  // -------------------- Render --------------------
  return (
    <SeekerLayout title="Contact Center | ForgeTomorrow" header={HeaderBox} right={RightRail} activeNav="contacts">
      <Head><title>ForgeTomorrow - Contact Center</title></Head>

      {/* Tabs row */}
      <section style={{ background: 'white', borderRadius: 12, padding: 12, border: '1px solid #eee',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <TabLink label="Contacts" tabValue="contacts" isActive={currentTab==='contacts'} badge={counts.contacts} />
          <TabLink label="The Signal" tabValue="signal" isActive={currentTab==='signal'} />
          <TabLink label="Invites" tabValue="invites" isActive={currentTab==='invites'} badge={counts.invitesIn} />
          <TabLink label="Requests" tabValue="requests" isActive={currentTab==='requests'} badge={counts.invitesOut} />
          <TabLink
            label="Following"
            tabValue="following"
            isActive={currentTab==='following'}
            badge={counts.followingPeople + counts.followingGroups + counts.followingEvents + counts.followingNews}
          />
        </div>
      </section>

      {/* Contacts */}
      {currentTab === 'contacts' && (
        <section
          style={{
            background: 'white',
            borderRadius: 12,
            padding: 16,
            border: '1px solid #eee',
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
          }}
        >
          <h2 style={{ color: '#FF7043', marginTop: 0 }}>Contacts</h2>

          <ContactsList contacts={contacts} onViewProfile={handleViewProfile} />

          {groups.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <h3 style={{ color: '#FF7043' }}>Your Groups</h3>
              <ul style={{ listStyle: 'disc', paddingLeft: 20 }}>
                {groups.map((g, i) => (
                  <li key={i} style={{ marginTop: 4 }}>{g}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Bottom CTA */}
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
            <Link href="/contacts" className="inline-block px-4 py-2 rounded-md bg-[#FF7043] text-white font-semibold hover:bg-[#e65c2f] transition">
              See all contacts
            </Link>
          </div>
        </section>
      )}

      {/* The Signal (preview + bottom CTA) */}
      {currentTab === 'signal' && (() => {
        const previews = computeSignalPreviews();
        const fmtTime = (ts) =>
          ts ? new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

        return (
          <section
            style={{
              background: 'white',
              borderRadius: 12,
              padding: 16,
              border: '1px solid #eee',
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
            }}
          >
            <h2 style={{ color: '#FF7043', marginTop: 0 }}>The Signal</h2>

            {previews.length === 0 ? (
              <div
                style={{
                  border: '1px solid #eee',
                  borderRadius: 10,
                  padding: 12,
                  background: '#FAFAFA',
                  color: '#607D8B',
                }}
              >
                You’re all caught up — no unread conversations.
              </div>
            ) : (
              <ul style={{ display: 'grid', gap: 8, margin: 0, padding: 0, listStyle: 'none' }}>
                {previews.map((p) => (
                  <li
                    key={p.id}
                    style={{
                      border: '1px solid #eee',
                      borderRadius: 10,
                      padding: 10,
                      background: 'white',
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ fontWeight: 800, color: '#263238', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.name}
                        </div>
                        {p.muted && (
                          <span
                            title="Muted"
                            style={{
                              fontSize: 11,
                              background: '#EEE',
                              color: '#555',
                              borderRadius: 999,
                              padding: '2px 6px',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            muted
                          </span>
                        )}
                        {!!p.unread && (
                          <span
                            title="Unread"
                            style={{
                              fontSize: 11,
                              background: '#263238',
                              color: 'white',
                              borderRadius: 999,
                              padding: '2px 6px',
                              whiteSpace: 'nowrap',
                              fontWeight: 800,
                            }}
                          >
                            {p.unread} new
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          color: '#455A64',
                          fontSize: 13,
                          marginTop: 4,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={p.lastText}
                      >
                        {p.lastText || '—'}
                      </div>
                    </div>
                    <div style={{ color: '#90A4AE', fontSize: 12, marginLeft: 8 }}>{fmtTime(p.lastTs)}</div>
                  </li>
                ))}
              </ul>
            )}

            {/* Bottom CTA */}
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
              <Link
                href="/seeker/messages"
                className="inline-block px-4 py-2 rounded-md bg-[#FF7043] text-white font-semibold hover:bg-[#e65c2f] transition"
              >
                Open The Signal
              </Link>
            </div>
          </section>
        );
      })()}

      {/* Invites — Incoming only (preview + bottom CTA: Approve all) */}
      {currentTab === 'invites' && (
        <section style={{ background: 'white', borderRadius: 12, padding: 16, border: '1px solid #eee',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
          <h2 style={{ color: '#FF7043', marginTop: 0 }}>Invitations — Incoming</h2>

          <RequestList
            incomingRequests={incomingRequests}
            outgoingRequests={[]}    // show only incoming
            onAccept={handleAccept}
            onDecline={handleDecline}
            onCancel={()=>{}}
          />

          {/* Bottom CTA */}
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={approveAllIncoming}
              className="inline-block px-4 py-2 rounded-md bg-[#FF7043] text-white font-semibold disabled:opacity-50 hover:bg-[#e65c2f] transition"
              disabled={!incomingRequests.length}
              title="Accept all incoming invitations"
            >
              Approve all
            </button>
          </div>
        </section>
      )}

      {/* Requests — Outgoing only (preview + bottom CTA: Cancel all) */}
      {currentTab === 'requests' && (
        <section style={{ background: 'white', borderRadius: 12, padding: 16, border: '1px solid #eee',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
          <h2 style={{ color: '#FF7043', marginTop: 0 }}>Requests — Outgoing</h2>

          <RequestList
            incomingRequests={[]}      // show only outgoing
            outgoingRequests={outgoingRequests}
            onAccept={()=>{}}
            onDecline={()=>{}}
            onCancel={handleCancel}
          />

          {/* Bottom CTA */}
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={cancelAllOutgoing}
              className="inline-block px-4 py-2 rounded-md bg-[#FF7043] text-white font-semibold disabled:opacity-50 hover:bg-[#e65c2f] transition"
              disabled={!outgoingRequests.length}
              title="Cancel all outgoing requests"
            >
              Cancel all
            </button>
          </div>
        </section>
      )}

      {/* Following — with sub-tabs + previews (kept the same pattern) */}
      {currentTab === 'following' && (
        <section style={{ background: 'white', borderRadius: 12, padding: 16, border: '1px solid #eee',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
          <div className="mb-3 flex items-center gap-2">
            <SubTab label={`People (${counts.followingPeople})`} value="people" />
            <SubTab label={`Groups (${counts.followingGroups})`} value="groups" />
            <SubTab label={`Events (${counts.followingEvents})`} value="events" />
            <SubTab label={`Newsletters (${counts.followingNews})`} value="newsletters" />
          </div>

          {currentSub === 'people' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">People you follow</h3>
                <Link href="/seeker/following/people" className="text-[#FF7043] font-semibold">See all →</Link>
              </div>
              {follows.people.length === 0 ? (
                <p className="text-gray-600">You aren’t following anyone yet.</p>
              ) : (
                <ul className="grid gap-2">
                  {follows.people.slice(0,5).map(p => (
                    <Tiny key={p.id} avatar={p.photo} title={p.name} subtitle={p.title} />
                  ))}
                </ul>
              )}
            </div>
          )}

          {currentSub === 'groups' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Groups you follow</h3>
                <Link href="/seeker/following/groups" className="text-[#FF7043] font-semibold">See all →</Link>
              </div>
              {follows.groups.length === 0 ? (
                <p className="text-gray-600">No groups followed yet.</p>
              ) : (
                <ul className="grid gap-2">
                  {follows.groups.slice(0,5).map(g => (
                    <Tiny key={g.id} title={g.name} subtitle={g.description} />
                  ))}
                </ul>
              )}
            </div>
          )}

          {currentSub === 'events' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Events you follow</h3>
                <Link href="/seeker/following/events" className="text-[#FF7043] font-semibold">See all →</Link>
              </div>
              {follows.events.length === 0 ? (
                <p className="text-gray-600">No events saved yet.</p>
              ) : (
                <ul className="grid gap-2">
                  {follows.events.slice(0,5).map(ev => (
                    <Tiny key={ev.id}
                         title={ev.title}
                         subtitle={`${ev.date ? new Date(ev.date).toLocaleString() : ''}${ev.location ? ` • ${ev.location}` : ''}`} />
                  ))}
                </ul>
              )}
            </div>
          )}

          {currentSub === 'newsletters' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Newsletters you follow</h3>
                <Link href="/seeker/following/newsletters" className="text-[#FF7043] font-semibold">See all →</Link>
              </div>
              {follows.newsletters.length === 0 ? (
                <p className="text-gray-600">No newsletters followed yet.</p>
              ) : (
                <ul className="grid gap-2">
                  {follows.newsletters.slice(0,5).map(n => (
                    <Tiny key={n.id} title={n.title || n.name} subtitle={n.author ? `by ${n.author}` : ''} />
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>
      )}
    </SeekerLayout>
  );
}
