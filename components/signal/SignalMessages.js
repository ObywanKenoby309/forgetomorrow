// components/signal/SignalMessages.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { emitSidebarCountsUpdate } from '@/components/hooks/useSidebarCounts';

const STORAGE_KEY = 'signal_messages_v1';

const now = () => Date.now();
const fmtTime = (ts) =>
  new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export default function SignalMessages() {
  const [threads, setThreads] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [draft, setDraft] = useState('');
  const inputRef = useRef(null);

  // Brand palette (muted orange)
  const soft = { brand: '#ff8a65', accent: '#ff7043' };

  // ---------- Seed / Persist ----------
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved?.threads?.length) {
        setThreads(saved.threads);
        setActiveId(saved.lastOpenThreadId || saved.threads[0]?.id || null);
      } else {
        const initial = [
          {
            id: 't1',
            name: 'Jane Doe',
            muted: false,
            unread: 2,
            messages: [
              { sender: 'them', text: 'Hey! Excited about ForgeTomorrow?', ts: now() - 3600_000, read: false },
              { sender: 'them', text: 'Do you have time to chat today?', ts: now() - 3300_000, read: false },
            ],
          },
          {
            id: 't2',
            name: 'John Smith',
            muted: false,
            unread: 0,
            messages: [
              { sender: 'them', text: 'Let’s schedule a call.', ts: now() - 86_400_000, read: true },
              { sender: 'me',   text: 'Sounds good—tomorrow 2pm PT?', ts: now() - 86_000_000, read: true },
            ],
          },
          {
            id: 't3',
            name: 'Samantha Lee',
            muted: true,
            unread: 1,
            messages: [
              { sender: 'them', text: 'Thanks for the update!', ts: now() - 3*86_400_000, read: true },
              { sender: 'them', text: 'Following up on that resume.', ts: now() - 2*86_400_000, read: false },
            ],
          },
        ];
        setThreads(initial);
        setActiveId('t1');
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ threads: initial, lastOpenThreadId: 't1' }));
        emitSidebarCountsUpdate();
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ threads, lastOpenThreadId: activeId }));
      emitSidebarCountsUpdate(); // refresh badges when messages change
    } catch {}
  }, [threads, activeId]);

  const activeThread = useMemo(
    () => threads.find((t) => t.id === activeId) || null,
    [threads, activeId]
  );

  const pendingConvoCount = useMemo(
    // not used for badges, but nice for UI: count threads with any unread
    () => threads.filter((t) => (t.unread || 0) > 0).length,
    [threads]
  );

  // ---------- Actions ----------
  const openThread = (id) => {
    setActiveId(id);
    // Mark all in this thread read
    setThreads((prev) =>
      prev.map((t) =>
        t.id !== id ? t : {
          ...t,
          unread: 0,
          messages: t.messages.map((m) => ({ ...m, read: true }))
        }
      )
    );
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const sendMessage = () => {
    if (!draft.trim() || !activeThread) return;
    const text = draft.trim();
    const ts = Date.now();
    setThreads((prev) =>
      prev.map((t) =>
        t.id !== activeThread.id
          ? t
          : { ...t, messages: [...t.messages, { sender: 'me', text, ts, read: true }] }
      )
    );
    setDraft('');
  };

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  };

  const deleteConversation = (id) => {
    if (!confirm('Delete this conversation?')) return;
    setThreads((prev) => {
      const next = prev.filter((t) => t.id !== id);
      if (id === activeId) setActiveId(next[0]?.id || null);
      return next;
    });
  };

  const toggleMute = (id) => {
    setThreads((prev) => prev.map((t) => (t.id === id ? { ...t, muted: !t.muted } : t)));
  };

  const markAllAsRead = () => {
    setThreads((prev) =>
      prev.map((t) => ({
        ...t,
        unread: 0,
        messages: t.messages.map((m) => ({ ...m, read: true })),
      }))
    );
  };

  // ---------- UI ----------
  return (
    <div className="space-y-4 max-w-[1120px] mx-auto">
      {/* Header row */}
      <div
        className="rounded-lg shadow border flex items-center justify-between px-4 py-2"
        style={{ background: 'white', borderColor: '#eee' }}
      >
        <div className="flex items-center gap-2 text-sm">
          <span
            className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold"
            style={{ background: '#F5F5F5', color: '#374151' }}
          >
            Pending messages {pendingConvoCount || 'none'}
          </span>
        </div>

        <button
          onClick={markAllAsRead}
          className="text-xs px-3 py-1 rounded-md border hover:bg-gray-50"
          style={{ borderColor: '#cfcfcf', color: '#374151' }}
        >
          Mark all as read
        </button>
      </div>

      {/* Main content card */}
      <section className="bg-white rounded-lg shadow p-4 md:p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Threads list */}
          <div className="threads w-full md:w-72 bg-[#1a1a1a] border border-gray-700 rounded-md overflow-y-auto">
            {threads.length === 0 ? (
              <div className="p-6 text-gray-300">No conversations yet.</div>
            ) : (
              threads.map((t) => {
                const last = t.messages[t.messages.length - 1];
                const preview = last?.text || '';
                const time = last ? fmtTime(last.ts) : '';
                const isActive = t.id === activeId;

                return (
                  <div
                    key={t.id}
                    className={`border-b border-gray-700 ${isActive ? 'text-white' : 'text-gray-200'}`}
                    style={{ background: isActive ? soft.accent : 'transparent' }}
                  >
                    <button
                      type="button"
                      onClick={() => openThread(t.id)}
                      className="w-full text-left p-3 focus:outline-none"
                      title={`Open ${t.name}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="truncate min-w-0">
                          <div className="font-bold text-lg truncate">{t.name}</div>
                          <div className="text-sm text-gray-300 truncate">{preview}</div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {/* badge shows per-thread unread (for the list only) */}
                          {!!t.unread && (
                            <span
                              className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-white text-xs font-bold"
                              style={{ background: t.muted ? '#8d8d8d' : '#263238' }}
                              title={t.muted ? 'Muted (unread present)' : 'Unread'}
                            >
                              {t.unread}
                            </span>
                          )}
                          <span className="text-xs text-gray-300">{time}</span>
                        </div>
                      </div>
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Chat */}
          <div className="chat flex-1 min-w-0 flex flex-col bg-[#222] rounded-md p-4 md:p-6 text-[#eee] min-h-[50vh]">
            {activeThread ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <div className="font-bold truncate">{activeThread.name}</div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="px-3 py-1 rounded-md border text-xs"
                      style={{ borderColor: '#555', color: '#eee' }}
                      onClick={() => toggleMute(activeThread.id)}
                      title={activeThread.muted ? 'Unmute notifications' : 'Mute notifications'}
                    >
                      {activeThread.muted ? 'Unmute' : 'Mute'}
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1 rounded-md text-xs font-bold text-white"
                      style={{ background: '#E53935', border: '1px solid #C62828' }}
                      onClick={() => deleteConversation(activeThread.id)}
                      title="Delete conversation"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="messages flex-grow overflow-y-auto space-y-4 mb-4">
                  {activeThread.messages.map((m, i) => {
                    const mine = m.sender === 'me';
                    return (
                      <div
                        key={i}
                        className={`rounded-2xl p-3 ${mine ? 'self-end rounded-br-none' : 'rounded-bl-none'}`}
                        style={{ maxWidth: '92%', background: mine ? soft.accent : '#333' }}
                      >
                        <div>{m.text}</div>
                        <div className="text-[10px] text-gray-200 mt-1 text-right opacity-80">
                          {fmtTime(m.ts)}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="input-area flex gap-2">
                  <textarea
                    ref={inputRef}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message… (Ctrl/Cmd+Enter to send)"
                    className="flex-grow resize-none rounded-md p-2 bg-[#333] text-white focus:outline-none"
                    rows={2}
                    aria-label="Message input"
                  />
                  <button
                    onClick={sendMessage}
                    className="px-4 rounded-md font-bold text-white"
                    style={{
                      background: draft.trim() ? soft.brand : '#8d8d8d',
                      cursor: draft.trim() ? 'pointer' : 'not-allowed',
                    }}
                    disabled={!draft.trim()}
                    aria-label="Send message"
                  >
                    Send
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 grid place-items-center text-gray-300">
                Select a conversation to get started.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
