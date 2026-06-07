// components/signal/SignalMessages.js
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/router';
import MemberAvatarActions from '../member/MemberAvatarActions';

const ORANGE = '#FF7043';
const MUTED = '#64748B';

function normaliseRole(role) {
  return String(role || '').trim().toUpperCase();
}

function getMoveTarget(role) {
  const r = normaliseRole(role);

  if (r.includes('COACH')) {
    return { value: 'coach', label: 'Coach Inbox' };
  }

  if (
    r.includes('RECRUITER') ||
    r === 'ADMIN' ||
    r === 'OWNER' ||
    r === 'SITE_ADMIN'
  ) {
    return { value: 'recruiter', label: 'Recruiter Inbox' };
  }

  return null;
}

function HeaderKebabMenu({ onDelete, onReport, onBlock, isBlocked }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;

    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-[13px] border border-gray-200 rounded-md text-gray-700 hover:bg-white"
        style={{
          width: 30,
          height: 30,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 900,
          lineHeight: 1,
          background: 'white',
        }}
        title="More actions"
        aria-label="More actions"
      >
        ⋮
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            zIndex: 50,
            minWidth: 150,
            background: 'white',
            border: '1px solid rgba(15,23,42,0.10)',
            borderRadius: 10,
            boxShadow: '0 12px 28px rgba(15,23,42,0.16)',
            overflow: 'hidden',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onDelete?.();
            }}
            style={{
              display: 'block',
              width: '100%',
              padding: '9px 14px',
              border: 'none',
              background: 'white',
              textAlign: 'left',
              fontSize: 13,
              color: '#334155',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#F8FAFC';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
            }}
          >
            Delete
          </button>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onReport?.();
            }}
            style={{
              display: 'block',
              width: '100%',
              padding: '9px 14px',
              border: 'none',
              background: 'white',
              textAlign: 'left',
              fontSize: 13,
              color: '#334155',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#F8FAFC';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
            }}
          >
            Report
          </button>

          <button
            type="button"
            disabled={isBlocked}
            onClick={() => {
              setOpen(false);
              onBlock?.();
            }}
            style={{
              display: 'block',
              width: '100%',
              padding: '9px 14px',
              border: 'none',
              borderTop: '1px solid rgba(15,23,42,0.06)',
              background: 'white',
              textAlign: 'left',
              fontSize: 13,
              color: isBlocked ? '#94A3B8' : '#DC2626',
              cursor: isBlocked ? 'default' : 'pointer',
            }}
            onMouseEnter={(e) => {
              if (!isBlocked) e.currentTarget.style.background = '#FEF2F2';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
            }}
          >
            {isBlocked ? 'Blocked' : 'Block'}
          </button>
        </div>
      )}
    </div>
  );
}

// Converts plain-text URLs into clickable anchor tags.
// Returns an array of strings and <a> elements for React rendering.
function linkify(text) {
  const parts = String(text || '').split(/(https?:\/\/[^\s]+)/g);
  return parts.map((part, i) => {
    if (/^https?:\/\//.test(part)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: 'inherit',
            textDecoration: 'underline',
            textUnderlineOffset: 2,
            wordBreak: 'break-all',
          }}
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

export default function SignalMessages({ view = 'spark', userRole = 'SEEKER' }) {
  const router = useRouter();
  const { toId, toName, told, chrome } = router.query;

  const [threads, setThreads] = useState([]);
  const [threadsLoading, setThreadsLoading] = useState(true);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [activeTitle, setActiveTitle] = useState('');
  const [activeOtherUserId, setActiveOtherUserId] = useState(null);
  const [activeHomeLocation, setActiveHomeLocation] = useState('seeker');
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [composer, setComposer] = useState('');
  const [sending, setSending] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [mobileView, setMobileView] = useState('list');
  const [query, setQuery] = useState('');
  const [showEmojiTray, setShowEmojiTray] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [movingHome, setMovingHome] = useState(false);

  const messagesRef = useRef(null);
  const lastMsgIdRef = useRef(null);
  const stickToBottomRef = useRef(true);
  const composerRef = useRef(null);
  const emojiBtnRef = useRef(null);
  const emojiTrayRef = useRef(null);
  const lastTypingSentRef = useRef(0);
  const typingStopTimerRef = useRef(null);

  const moveTarget = getMoveTarget(userRole);
  const canMoveHome = !!moveTarget && !!activeConversationId;

  const GLASS = {
    border: '1px solid rgba(255,255,255,0.22)',
    background: 'rgba(255,255,255,0.72)',
    boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderRadius: 14,
  };

  const softCard = 'border border-gray-100 shadow-sm bg-white/70 backdrop-blur';

  const ROOM = {
    border: '1px solid rgba(255,255,255,0.22)',
    background: 'rgba(255,255,255,0.80)',
    boxShadow: '0 18px 40px rgba(0,0,0,0.16)',
    borderRadius: 16,
  };

  const ROOM_INNER = {
    background: 'rgba(255,255,255,0.62)',
    border: '1px solid rgba(255,255,255,0.22)',
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mq = window.matchMedia('(max-width: 767px)');
    const apply = () => setIsMobileDevice(!!mq.matches);

    apply();

    if (mq.addEventListener) {
      mq.addEventListener('change', apply);
      return () => mq.removeEventListener('change', apply);
    }

    mq.addListener(apply);
    return () => mq.removeListener(apply);
  }, []);

  useEffect(() => {
    if (isMobileDevice && showEmojiTray) setShowEmojiTray(false);
  }, [isMobileDevice, showEmojiTray]);

  const scrollToBottom = (behavior = 'smooth') => {
    const el = messagesRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  };

  const isNearBottom = () => {
    const el = messagesRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight <= 80;
  };

  const EMOJIS = useMemo(
    () => [
      '😀',
      '😁',
      '😂',
      '🤣',
      '😊',
      '😍',
      '😎',
      '🤝',
      '👍',
      '🙏',
      '🔥',
      '✨',
      '💡',
      '🎯',
      '✅',
      '💬',
      '📌',
      '📎',
      '🧠',
      '💪',
      '👏',
      '🙌',
      '🎉',
      '❤️',
    ],
    []
  );

  const insertEmoji = (emoji) => {
    if (!emoji || !activeConversationId || isBlocked) return;

    const el = composerRef.current;

    if (!el) {
      handleComposerChange(`${String(composer || '')}${emoji}`);
      return;
    }

    const value = String(composer || '');
    const start =
      typeof el.selectionStart === 'number' ? el.selectionStart : value.length;
    const end =
      typeof el.selectionEnd === 'number' ? el.selectionEnd : value.length;
    const next = value.slice(0, start) + emoji + value.slice(end);

    handleComposerChange(next);

    setTimeout(() => {
      try {
        el.focus();
        el.setSelectionRange(start + emoji.length, start + emoji.length);
      } catch {
        // ignore
      }
    }, 0);
  };

  useEffect(() => {
    if (!showEmojiTray) return;

    const onKey = (e) => {
      if (e.key === 'Escape') setShowEmojiTray(false);
    };

    const onDown = (e) => {
      if (emojiTrayRef.current?.contains(e.target)) return;
      if (emojiBtnRef.current?.contains(e.target)) return;
      setShowEmojiTray(false);
    };

    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);

    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [showEmojiTray]);

  const fetchThreads = useCallback(async () => {
    setThreadsLoading(true);

    try {
      const params = new URLSearchParams({ view: String(view || 'spark') });
      const res = await fetch(`/api/signal/threads?${params.toString()}`);

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      const incoming = Array.isArray(data.threads) ? data.threads : [];

      setThreads(
        incoming.filter((t) =>
          !!(typeof t.lastMessage === 'string' ? t.lastMessage.trim() : '')
        )
      );
    } catch (err) {
      console.error('fetchThreads error:', err);
      setThreads([]);
    } finally {
      setThreadsLoading(false);
    }
  }, [view]);

  const fetchMessages = useCallback(
    async (conversationId, opts = { appendOnly: false }) => {
      if (!conversationId) return;

      setMessagesLoading(true);

      try {
        const params = new URLSearchParams({
          conversationId: String(conversationId),
        });

        const res = await fetch(`/api/signal/messages?${params.toString()}`);

        if (!res.ok) throw new Error(await res.text());

        const data = await res.json();
        const incoming = Array.isArray(data.messages) ? data.messages : [];

        setTypingUsers(Array.isArray(data.typingUsers) ? data.typingUsers : []);

        if (!opts.appendOnly) {
          setMessages(incoming);
          lastMsgIdRef.current = incoming[incoming.length - 1]?.id || null;
          return;
        }

        setMessages((prev) => {
          const seen = new Set(prev.map((m) => m?.id));
          const next = [...prev];

          for (const m of incoming) {
            if (m?.id && !seen.has(m.id)) next.push(m);
          }

          lastMsgIdRef.current = next[next.length - 1]?.id || null;
          return next;
        });
      } catch (err) {
        console.error('fetchMessages error:', err);
        if (!opts.appendOnly) setMessages([]);
        setTypingUsers([]);
      } finally {
        setMessagesLoading(false);
      }
    },
    []
  );

  const openConversation = async (thread) => {
    setActiveConversationId(thread.id);
    setActiveTitle(thread.title || 'Conversation');
    setActiveOtherUserId(thread.otherUserId || null);
    setActiveHomeLocation(thread.homeLocation || 'seeker');
    setIsBlocked(false);
    setShowEmojiTray(false);
    stickToBottomRef.current = true;

    await fetchMessages(thread.id, { appendOnly: false });

    setMobileView('chat');
    setTimeout(() => scrollToBottom('auto'), 0);
  };

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  useEffect(() => {
    if (!router.isReady) return;

    const deepLinkIdRaw = Array.isArray(toId || told)
      ? (toId || told)[0]
      : toId || told;

    if (!deepLinkIdRaw || threadsLoading) return;

    const cleanUrl = () => {
      const cleanQuery = {};
      if (chrome) cleanQuery.chrome = chrome;

      router.replace(
        { pathname: router.pathname, query: cleanQuery },
        undefined,
        { shallow: true }
      );
    };

    const resolvedName = Array.isArray(toName)
      ? toName[0]
      : toName || 'Member';

    const match = threads.find(
      (t) => t.otherUserId && String(t.otherUserId) === String(deepLinkIdRaw)
    );

    if (match) {
      openConversation(match);
      cleanUrl();
      return;
    }

    (async () => {
      try {
        const res = await fetch('/api/signal/start-or-get', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ toUserId: deepLinkIdRaw }),
        });

        if (!res.ok) {
          if (res.status === 403) {
            const payload = await res.json().catch(() => ({}));
            alert(
              payload?.message ||
                'You need to be connected with this member before messaging.'
            );
          } else {
            console.error(
              'deep-link start-or-get error:',
              res.status,
              await res.text()
            );
          }

          cleanUrl();
          return;
        }

        const data = await res.json();
        const conversationId =
          data?.conversationId || data?.conversation?.id || data?.id || null;

        if (!conversationId) {
          console.error('deep-link: start-or-get returned no conversationId', data);
          cleanUrl();
          return;
        }

        const threadStub = {
          id: conversationId,
          title: resolvedName,
          otherUserId: deepLinkIdRaw,
          otherAvatarUrl: data?.otherAvatarUrl || null,
          otherUserSlug:
            data?.otherUserSlug ||
            data?.otherSlug ||
            data?.slug ||
            data?.profileSlug ||
            null,
          homeLocation: data?.homeLocation || 'seeker',
          lastMessage: '',
          lastMessageAt: null,
        };

        setThreads((prev) =>
          prev.some((t) => t.id === conversationId)
            ? prev
            : [threadStub, ...prev]
        );

        await openConversation(threadStub);
        cleanUrl();
        fetchThreads();
      } catch (err) {
        console.error('deep-link handler error:', err);
        cleanUrl();
      }
    })();
  }, [router.isReady, toId, told, chrome, threads, threadsLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!activeConversationId) return;

    let cancelled = false;

    const tick = async () => {
      try {
        const shouldStick = stickToBottomRef.current && isNearBottom();
        await fetchMessages(activeConversationId, { appendOnly: true });

        if (!cancelled && shouldStick) {
          setTimeout(() => scrollToBottom('smooth'), 0);
        }
      } catch {
        // ignore
      }
    };

    const initial = setTimeout(() => {
      if (!cancelled) tick();
    }, 800);

    const interval = setInterval(() => {
      if (!cancelled) tick();
    }, 4000);

    return () => {
      cancelled = true;
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [activeConversationId, fetchMessages]);

  const clearTypingState = useCallback(async (conversationId) => {
    if (!conversationId) return;

    try {
      await fetch('/api/signal/typing', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId }),
      });
    } catch {
      // Typing state is non-critical.
    }
  }, []);

  const sendTypingHeartbeat = useCallback(async (conversationId) => {
    if (!conversationId) return;

    const now = Date.now();
    if (now - lastTypingSentRef.current < 1500) return;

    lastTypingSentRef.current = now;

    try {
      await fetch('/api/signal/typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId }),
      });
    } catch {
      // Typing state is non-critical.
    }
  }, []);

  const handleComposerChange = (value) => {
    setComposer(value);

    if (!activeConversationId || isBlocked) return;

    if (!String(value || '').trim()) {
      if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current);
      typingStopTimerRef.current = null;
      clearTypingState(activeConversationId);
      return;
    }

    sendTypingHeartbeat(activeConversationId);

    if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current);

    typingStopTimerRef.current = setTimeout(() => {
      clearTypingState(activeConversationId);
    }, 3500);
  };

  useEffect(() => {
    return () => {
      if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current);
      if (activeConversationId) clearTypingState(activeConversationId);
      setTypingUsers([]);
    };
  }, [activeConversationId, clearTypingState]);

  const handleSetHome = async (newHomeLocation) => {
    if (
      !activeConversationId ||
      movingHome ||
      newHomeLocation === activeHomeLocation
    ) {
      return;
    }

    setMovingHome(true);

    try {
      const res = await fetch('/api/signal/set-home', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConversationId,
          homeLocation: newHomeLocation,
        }),
      });

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      const nextHome = data.homeLocation || newHomeLocation;

      setActiveHomeLocation(nextHome);

      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeConversationId ? { ...t, homeLocation: nextHome } : t
        )
      );

      await fetchThreads();
    } catch (err) {
      console.error('set-home error:', err);
      alert('Could not update conversation location. Please try again.');
    } finally {
      setMovingHome(false);
    }
  };

  const handleSend = async (e) => {
    e?.preventDefault?.();

    if (!activeConversationId || !composer.trim() || sending || isBlocked) {
      return;
    }

    if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current);
    typingStopTimerRef.current = null;
    clearTypingState(activeConversationId);

    setSending(true);

    try {
      const res = await fetch('/api/signal/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConversationId,
          content: composer.trim(),
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('send error payload:', text);

        if (res.status === 403) {
          setIsBlocked(true);
          alert('Messaging is blocked between you and this member.');
          return;
        }

        throw new Error(text);
      }

      const data = await res.json();

      const newMessage = {
        id: data.message.id,
        conversationId: data.message.conversationId,
        senderId: 'me',
        senderName: 'You',
        senderAvatarUrl: null,
        content: data.message.content,
        createdAt: data.message.createdAt,
        isMine: true,
      };

      stickToBottomRef.current = true;
      setMessages((prev) => [...prev, newMessage]);
      lastMsgIdRef.current = newMessage?.id || lastMsgIdRef.current;
      setComposer('');
      setShowEmojiTray(false);

      await fetchThreads();

      setTimeout(() => scrollToBottom('smooth'), 0);
    } catch (err) {
      console.error('send error:', err);
      alert('We could not send your message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleBlock = async () => {
    if (!activeOtherUserId) {
      alert('We could not determine which member to block.');
      return;
    }

    const reason = window.prompt(
      'Optional: Why are you blocking this member? (This helps moderation)'
    );

    const confirmed = window.confirm(
      'Are you sure you want to block this member? They will no longer be able to message you, and you will not see new messages from them.'
    );

    if (!confirmed) return;

    try {
      const res = await fetch('/api/signal/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: activeOtherUserId,
          reason: reason?.trim() || null,
        }),
      });

      if (!res.ok) {
        console.error('block error status:', res.status, await res.text());
        alert('We could not block this member. Please try again.');
        return;
      }

      setIsBlocked(true);
      setComposer('');
      setShowEmojiTray(false);
      setThreads((prev) =>
        prev.filter((t) => t.otherUserId !== activeOtherUserId)
      );

      await fetch('/api/contacts/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactUserId: activeOtherUserId }),
      });
    } catch (err) {
      console.error('block error:', err);
      alert('We could not block this member. Please try again.');
    }
  };

  const handleReport = async () => {
    if (!activeConversationId || !activeOtherUserId) {
      alert('We could not determine which conversation to report.');
      return;
    }

    const reason = window.prompt(
      'Tell us briefly what happened. This will go to the ForgeTomorrow support team.'
    );

    if (reason === null) return;

    try {
      const res = await fetch('/api/signal/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConversationId,
          targetUserId: activeOtherUserId,
          reason: reason.trim(),
        }),
      });

      if (!res.ok) {
        console.error('report error status:', res.status, await res.text());
        alert('We could not submit your report. Please try again.');
        return;
      }

      alert('Thank you. Your report has been submitted to our team.');
    } catch (err) {
      console.error('report error:', err);
      alert('We could not submit your report. Please try again.');
    }
  };

  const handleDeleteConversation = async () => {
    if (!activeConversationId) {
      alert('No active conversation selected.');
      return;
    }

    const confirmed = window.confirm(
      'Delete this conversation for both participants? This cannot be undone.'
    );

    if (!confirmed) return;

    try {
      const res = await fetch('/api/signal/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: activeConversationId }),
      });

      if (!res.ok) {
        console.error('delete error status:', res.status, await res.text());
        alert('We could not delete this conversation. Please try again.');
        return;
      }

      setActiveConversationId(null);
      setActiveTitle('');
      setActiveOtherUserId(null);
      setActiveHomeLocation('seeker');
      setMessages([]);
      setIsBlocked(false);
      setShowEmojiTray(false);
      setMobileView('list');

      await fetchThreads();
    } catch (err) {
      console.error('delete error:', err);
      alert('We could not delete this conversation. Please try again.');
    }
  };

  const filteredThreads = useMemo(() => {
    const q = String(query || '').trim().toLowerCase();

    if (!q) return threads;

    return threads.filter(
      (t) =>
        String(t.title || '').toLowerCase().includes(q) ||
        String(t.lastMessage || '').toLowerCase().includes(q)
    );
  }, [threads, query]);

  const formatTime = (dt) => {
    try {
      return new Date(dt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const isMobileChat = mobileView === 'chat';
  const showDesktopEmojiUI =
    activeConversationId && !isBlocked && !isMobileDevice;

  return (
    <div style={{ ...GLASS, padding: 14, marginTop: 14 }}>
      <div className="md:hidden flex items-center justify-between mb-3">
        {isMobileChat ? (
          <button
            type="button"
            onClick={() => setMobileView('list')}
            className="text-sm font-semibold text-gray-800 hover:opacity-80"
          >
            ← Back
          </button>
        ) : (
          <div className="text-sm font-semibold text-gray-900">Conversations</div>
        )}

        <div className="text-xs text-gray-500">
          {threadsLoading ? 'Loading…' : `${threads.length} total`}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4">
        <section
          className={`${softCard} rounded-xl p-4 ${
            isMobileChat ? 'hidden md:block' : 'block'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="text-sm font-extrabold text-gray-900">Messages</h2>

            <button
              type="button"
              onClick={fetchThreads}
              className="text-[11px] px-2 py-1 rounded-md border border-gray-200 hover:bg-white"
            >
              Refresh
            </button>
          </div>

          <div className="mb-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search messages…"
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-white"
            />
          </div>

          {threadsLoading ? (
            <p className="text-xs text-gray-500">Loading conversations…</p>
          ) : filteredThreads.length === 0 ? (
            <div className="text-xs text-gray-600">
              <div className="font-semibold text-gray-800">No conversations yet.</div>
              <div className="mt-1">Start one from a member profile or candidate card.</div>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filteredThreads.map((t) => {
                const otherId = t.otherUserId || null;
                const otherName = t.title || 'Member';
                const otherSlug =
                  t.otherUserSlug ||
                  t.otherSlug ||
                  t.userSlug ||
                  t.slug ||
                  t.profileSlug ||
                  null;
                const isActive = t.id === activeConversationId;

                return (
                  <li
                    key={t.id}
                    className={`relative py-2 px-2 flex items-start gap-3 cursor-pointer rounded-lg ${
                      isActive ? 'bg-[#FFF3E9]' : 'hover:bg-white'
                    }`}
                    onClick={() => openConversation(t)}
                  >
                    <MemberAvatarActions
                      targetUserId={otherId}
                      targetUserSlug={otherSlug}
                      targetName={otherName}
                    >
                      <span className="flex-shrink-0 inline-flex">
                        {t.otherAvatarUrl ? (
                          <img
                            src={t.otherAvatarUrl}
                            alt={otherName}
                            className="w-9 h-9 rounded-full object-cover border border-gray-200"
                          />
                        ) : (
                          <span className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-700 border border-gray-200">
                            {otherName?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        )}
                      </span>
                    </MemberAvatarActions>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-extrabold text-gray-900 truncate">
                          {t.title}
                        </p>

                        <div className="text-[10px] text-gray-500 whitespace-nowrap pt-1">
                          {t.lastMessageAt ? formatTime(t.lastMessageAt) : ''}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section
          className={`${softCard} rounded-xl p-4 flex flex-col ${
            isMobileChat ? 'block' : 'hidden'
          } md:flex`}
          style={ROOM}
        >
          <div
            aria-hidden="true"
            style={{
              height: 3,
              borderRadius: 999,
              background:
                'linear-gradient(90deg, rgba(255,112,67,0.65), rgba(255,112,67,0))',
              marginBottom: 10,
            }}
          />

          <div className="flex items-center justify-between mb-3 gap-2">
            <div className="min-w-0">
              <h2 className="text-sm font-extrabold text-gray-900 truncate">
                {activeConversationId
                  ? activeTitle || 'Conversation'
                  : 'Your Signal inbox is ready'}
              </h2>

              {!activeConversationId && (
                <p className="text-xs text-gray-600 mt-1">
                  Start a conversation from a profile, candidate card, or coaching listing.
                </p>
              )}
            </div>

            {activeConversationId && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <HeaderKebabMenu
                  onDelete={handleDeleteConversation}
                  onReport={handleReport}
                  onBlock={handleBlock}
                  isBlocked={isBlocked}
                />

                {canMoveHome && (
                  <>
                    <button
                      type="button"
                      disabled={movingHome || activeHomeLocation === 'seeker'}
                      onClick={() => handleSetHome('seeker')}
                      className="text-[11px] px-2 py-1 border rounded-md hover:bg-white"
                      style={{
                        borderColor:
                          activeHomeLocation === 'seeker'
                            ? ORANGE
                            : 'rgba(229,231,235,1)',
                        background:
                          activeHomeLocation === 'seeker'
                            ? 'rgba(255,112,67,0.08)'
                            : 'white',
                        color: activeHomeLocation === 'seeker' ? ORANGE : MUTED,
                        fontWeight: 700,
                        opacity: movingHome ? 0.55 : 1,
                        cursor:
                          movingHome || activeHomeLocation === 'seeker'
                            ? 'default'
                            : 'pointer',
                      }}
                    >
                      Spark{activeHomeLocation === 'seeker' ? ' ✓' : ''}
                    </button>

                    <button
                      type="button"
                      disabled={
                        movingHome || activeHomeLocation === moveTarget.value
                      }
                      onClick={() => handleSetHome(moveTarget.value)}
                      className="text-[11px] px-2 py-1 border rounded-md hover:bg-white"
                      style={{
                        borderColor:
                          activeHomeLocation === moveTarget.value
                            ? ORANGE
                            : 'rgba(229,231,235,1)',
                        background:
                          activeHomeLocation === moveTarget.value
                            ? 'rgba(255,112,67,0.08)'
                            : 'white',
                        color:
                          activeHomeLocation === moveTarget.value ? ORANGE : MUTED,
                        fontWeight: 700,
                        opacity: movingHome ? 0.55 : 1,
                        cursor:
                          movingHome || activeHomeLocation === moveTarget.value
                            ? 'default'
                            : 'pointer',
                      }}
                    >
                      {moveTarget.label}
                      {activeHomeLocation === moveTarget.value ? ' ✓' : ''}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {activeConversationId && isBlocked && (
            <div className="mb-3 text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              You have blocked this member. You will not be able to send new messages.
            </div>
          )}

          <div
            ref={messagesRef}
            onScroll={() => {
              stickToBottomRef.current = isNearBottom();
            }}
            className="signal-room-messages flex-1 overflow-y-auto rounded-xl p-3 space-y-2"
            style={{
              ...ROOM_INNER,
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)',
            }}
          >
            {activeConversationId ? (
              messagesLoading && messages.length === 0 ? (
                <p className="text-xs text-gray-500">Loading messages…</p>
              ) : messages.length === 0 ? (
                <p className="text-xs text-gray-500">
                  No messages yet. Say hello to start the conversation.
                </p>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`rounded-2xl px-3 py-2 text-xs ${
                        m.isMine
                          ? 'bg-[#FF7043] text-white'
                          : 'bg-white text-gray-900 border border-gray-100'
                      }`}
                      style={{
                        boxShadow: m.isMine
                          ? '0 10px 20px rgba(255,112,67,0.18)'
                          : '0 10px 18px rgba(0,0,0,0.06)',
                        maxWidth: 'min(86%, 680px)',
                        minWidth: 0,
                        overflowWrap: 'anywhere',
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {!m.isMine && (
                        <div className="font-bold text-[11px] mb-0.5 opacity-90">
                          {m.senderName}
                        </div>
                      )}

                      <div
                        className="whitespace-pre-wrap leading-relaxed"
                        style={{
                          overflowWrap: 'anywhere',
                          wordBreak: 'break-word',
                        }}
                      >
                        {linkify(m.content)}
                      </div>

                      <div className="text-[9px] opacity-75 mt-1 text-right">
                        {formatTime(m.createdAt)}
                      </div>
                    </div>
                  </div>
                ))
              )
            ) : (
              <p className="text-xs text-gray-500">
                Select a conversation on the left or start a new one from a member profile.
              </p>
            )}

            {activeConversationId && typingUsers.length > 0 && (
              <div className="flex justify-start">
                <div
                  className="inline-flex items-center gap-2 rounded-full border border-gray-100 bg-white px-3 py-2 text-xs font-semibold text-gray-500"
                  style={{ boxShadow: '0 10px 18px rgba(0,0,0,0.06)' }}
                >
                  <span>
                    {typingUsers.length === 1
                      ? `${typingUsers[0]?.name || 'They'} is typing`
                      : 'Multiple people are typing'}
                  </span>

                  <span className="signal-typing-dots" aria-hidden="true">
                    <span></span>
                    <span></span>
                    <span></span>
                  </span>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="mt-3 space-y-2">
            <div className="relative">
              <textarea
                ref={composerRef}
                value={composer}
                onChange={(e) => handleComposerChange(e.target.value)}
                disabled={!activeConversationId || isBlocked}
                placeholder={
                  !activeConversationId
                    ? 'Select a conversation to start messaging…'
                    : isBlocked
                    ? 'You have blocked this member.'
                    : 'Write a message…'
                }
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm min-h-[84px] disabled:bg-gray-50 bg-white"
                style={{ boxShadow: '0 10px 18px rgba(0,0,0,0.06)' }}
              />

              {showDesktopEmojiUI && showEmojiTray && (
                <div
                  ref={emojiTrayRef}
                  className="absolute z-30 left-0 right-0 bottom-[calc(100%+10px)] border border-gray-200 rounded-xl bg-white"
                  style={{
                    boxShadow: '0 18px 40px rgba(0,0,0,0.14)',
                    padding: 10,
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[11px] font-semibold text-gray-700">
                      Emojis
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowEmojiTray(false)}
                      className="text-[11px] px-2 py-1 rounded-md border border-gray-200 hover:bg-white"
                    >
                      Close
                    </button>
                  </div>

                  <div
                    className="grid gap-1"
                    style={{
                      gridTemplateColumns: 'repeat(10, minmax(0, 1fr))',
                      maxHeight: 160,
                      overflowY: 'auto',
                      paddingRight: 4,
                    }}
                  >
                    {EMOJIS.map((e) => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => insertEmoji(e)}
                        className="w-9 h-9 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-lg flex items-center justify-center"
                        aria-label={`Insert ${e}`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>

                  <div className="mt-2 text-[10px] text-gray-500">
                    Tip: Press <span className="font-semibold">Esc</span> to close.
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2">
              {activeConversationId && (
                <button
                  type="button"
                  onClick={() => {
                    handleComposerChange('');
                    setShowEmojiTray(false);
                  }}
                  className="px-3 py-2 rounded-md border border-gray-200 text-sm hover:bg-white"
                >
                  Clear
                </button>
              )}

              {showDesktopEmojiUI && (
                <button
                  ref={emojiBtnRef}
                  type="button"
                  onClick={() => {
                    setShowEmojiTray((v) => !v);
                    setTimeout(() => {
                      try {
                        composerRef.current?.focus?.();
                      } catch {
                        // ignore
                      }
                    }, 0);
                  }}
                  className="px-3 py-2 rounded-md border border-gray-200 text-sm hover:bg-white"
                >
                  Emojis
                </button>
              )}

              <button
                type="submit"
                disabled={!activeConversationId || !composer.trim() || sending || isBlocked}
                className="px-4 py-2 rounded-md bg-[#ff8a65] text-white text-sm font-extrabold disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </form>
        </section>
      </div>

      <style jsx global>{`
        @media (min-width: 768px) {
          .md\\:hidden {
            display: none !important;
          }
        }

        .signal-room-messages {
          min-height: 220px;
          max-height: 340px;
        }

        @media (max-width: 767px) {
          .signal-room-messages {
            min-height: 260px;
            max-height: 460px;
          }
        }

        .signal-typing-dots {
          display: inline-flex;
          gap: 3px;
          align-items: center;
        }

        .signal-typing-dots span {
          width: 4px;
          height: 4px;
          border-radius: 999px;
          background: #94a3b8;
          animation: signal-typing-dot 1.1s infinite ease-in-out;
        }

        .signal-typing-dots span:nth-child(2) {
          animation-delay: 0.16s;
        }

        .signal-typing-dots span:nth-child(3) {
          animation-delay: 0.32s;
        }

        @keyframes signal-typing-dot {
          0%,
          80%,
          100% {
            opacity: 0.35;
            transform: translateY(0);
          }

          40% {
            opacity: 1;
            transform: translateY(-2px);
          }
        }
      `}</style>
    </div>
  );
}