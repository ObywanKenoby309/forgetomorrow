// components/feed/PostCard.js
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/router';
import QuickEmojiBar from './QuickEmojiBar';
import MemberAvatarActions from '@/components/member/MemberAvatarActions';

function formatRelativeTime(dateInput) {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return '';

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 5) return 'Just now';
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;

  const weeks = Math.floor(days / 7);
  if (days < 35) return `${weeks}w`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;

  const years = Math.floor(days / 365);
  return `${years}y`;
}

export default function PostCard({
  post,
  onOpenComments,
  onDelete,
  onReact,
  currentUserId,
  currentUserName,
  onBlockAuthor,
}) {
  if (!post) return null;

  const router = useRouter();

  const [expanded,       setExpanded]       = useState(false);
  const [hoveredEmoji,   setHoveredEmoji]   = useState(null);
  const [reactionUsers,  setReactionUsers]  = useState({});
  const [actionsMenuOpen,setActionsMenuOpen]= useState(false);
  const [showEmojiBar,   setShowEmojiBar]   = useState(false);
  const [saved,          setSaved]          = useState(false);
  const [saveLoading,    setSaveLoading]    = useState(false);
  const [hearthCount,    setHearthCount]    = useState(Number(post.hearthRecommendationCount || 0));
  const [hearthRecommended, setHearthRecommended] = useState(Boolean(post.currentUserRecommendedHearth));
  const [hearthThreadId, setHearthThreadId] = useState(post.hearthThreadId || null);
  const [hearthThreadTitle, setHearthThreadTitle] = useState(post.hearthThreadTitle || null);
  const [hearthLoading,  setHearthLoading]  = useState(false);
  const [copyConfirm,    setCopyConfirm]    = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [reactionViewer, setReactionViewer] = useState(null);
  const touchStartXRef = useRef(null);

  const actionsMenuRef = useRef(null);
  const TRUNCATE_LIMIT = 280;

  const isOwner       = post.authorId && currentUserId ? post.authorId === currentUserId : false;
  const canTargetAuthor = Boolean(post?.authorId) && !isOwner;

  const chrome     = String(router.query?.chrome || '').toLowerCase();
  const withChrome = (path) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

  const visibleComments = Array.isArray(post.comments)
    ? post.comments.filter((c) => !(c && c.deleted === true))
    : [];

  const visibleCommentsCount = visibleComments.length;
  const latestVisibleComment = visibleCommentsCount > 0
    ? visibleComments[visibleCommentsCount - 1]
    : null;

  const HEARTH_THRESHOLD = 5;
  const canRecommendForHearth = !isOwner && !hearthThreadId;
  const canBranchToHearth = isOwner && !hearthThreadId && hearthCount >= HEARTH_THRESHOLD;

  // Close actions menu on outside click
  useEffect(() => {
    const onDocDown = (e) => {
      if (!actionsMenuOpen) return;
      if (!actionsMenuRef.current) return;
      if (!actionsMenuRef.current.contains(e.target)) setActionsMenuOpen(false);
    };
    document.addEventListener('mousedown', onDocDown);
    return () => document.removeEventListener('mousedown', onDocDown);
  }, [actionsMenuOpen]);

  useEffect(() => {
    setHearthCount(Number(post.hearthRecommendationCount || 0));
    setHearthRecommended(Boolean(post.currentUserRecommendedHearth));
    setHearthThreadId(post.hearthThreadId || null);
    setHearthThreadTitle(post.hearthThreadTitle || null);
  }, [post.id, post.hearthRecommendationCount, post.currentUserRecommendedHearth, post.hearthThreadId, post.hearthThreadTitle]);

  // ── Handlers ─────────────────────────────────────────────

  const logPostView = async (source) => {
    try {
      await fetch('/api/feed/post-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post?.id, source: source || 'open_post' }),
      });
    } catch { /* non-blocking */ }
  };

  const handleOpenPost = async () => {
    if (!post?.id) return;
    logPostView('open_post');
    router.push(withChrome(`/post-view?id=${post.id}`));
  };

  // Clicking anywhere on the card opens the full post + comments modal —
  // unless the click originated on/within an interactive element (buttons,
  // links, inputs, menus), which handle their own actions.
  const handleCardClick = (e) => {
    const target = e.target;
    if (target.closest && target.closest('button, a, input, textarea, [role="menu"], [role="menuitem"], [data-stop-card-click]')) {
      return;
    }
    logPostView('open_post');
    onOpenComments?.(post);
  };

  const handleReportPost = async () => {
    const reason = window.prompt(
      'Tell us briefly what happened. This will be sent to the ForgeTomorrow moderation team.'
    );
    if (reason === null) return;
    try {
      const res = await fetch('/api/feed/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id, targetUserId: post.authorId, reason: reason.trim() }),
      });
      if (!res.ok) { console.error('report error:', await res.text()); alert('We could not submit your report. Please try again.'); return; }
      alert('Thank you. Your report has been submitted.');
    } catch (err) {
      console.error('report error:', err);
      alert('We could not submit your report. Please try again.');
    } finally {
      setActionsMenuOpen(false);
    }
  };

  const handleBlockAuthorAction = async () => {
    if (!post?.authorId) { alert('We could not determine which member to block.'); return; }
    const reason    = window.prompt('Optional: Why are you blocking this member? (This helps moderation)');
    const confirmed = window.confirm('Block this member? You will no longer see their posts, and they will not be able to message you.');
    if (!confirmed) return;
    try {
      const res = await fetch('/api/signal/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: post.authorId, reason: reason?.trim() || null }),
      });
      if (!res.ok) { console.error('block error:', res.status, await res.text()); alert('We could not block this member. Please try again.'); return; }
      onBlockAuthor?.(post.authorId);
      alert('Member blocked. You will no longer see their posts.');
    } catch (err) {
      console.error('block error:', err);
      alert('We could not block this member. Please try again.');
    } finally {
      setActionsMenuOpen(false);
    }
  };

  const handleShare = async () => {
    if (!post?.id) return;
    const url = `${window.location.origin}/post-view?id=${post.id}`;
    const shareData = { title: `Post by ${post.author} on ForgeTomorrow`, text: post.body?.slice(0, 100) || '', url };
    if (navigator.share && navigator.canShare?.(shareData)) {
      try { await navigator.share(shareData); } catch { /* cancelled */ }
    } else {
      try { await navigator.clipboard.writeText(url); setCopyConfirm(true); setTimeout(() => setCopyConfirm(false), 2000); }
      catch { window.prompt('Copy this link:', url); }
    }
  };

  const handleSave = async () => {
    if (!post?.id || saveLoading) return;
    setSaveLoading(true);
    try {
      const res = await fetch('/api/feed/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id }),
      });
      if (res.ok) { const data = await res.json(); setSaved(data.saved); }
    } catch (err) { console.error('save error:', err); }
    finally { setSaveLoading(false); }
  };



  const handleRecommendForHearth = async () => {
    if (!post?.id || hearthLoading || hearthRecommended || hearthThreadId) return;
    setHearthLoading(true);
    try {
      const res = await fetch('/api/feed/hearth-recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || 'We could not recommend this post for the Hearth.');
        return;
      }
      setHearthRecommended(true);
      setHearthCount(Number(data.count || 0));
      if (data.hearthThreadId) setHearthThreadId(data.hearthThreadId);
    } catch (err) {
      console.error('hearth recommend error:', err);
      alert('We could not recommend this post for the Hearth. Please try again.');
    } finally {
      setHearthLoading(false);
    }
  };

  const handleBranchToHearth = async () => {
    if (!post?.id || hearthLoading || hearthThreadId) return;
    const suggestedTitle = String(signalMeta?.displayBody || post.body || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 80);
    const title = window.prompt('Name this Hearth discussion:', suggestedTitle || 'Community discussion');
    if (title === null) return;

    setHearthLoading(true);
    try {
      const res = await fetch('/api/feed/branch-to-hearth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id, title: title.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || 'We could not continue this discussion in the Hearth.');
        return;
      }
      const thread = data.thread || {};
      setHearthThreadId(thread.id || null);
      setHearthThreadTitle(thread.title || title.trim() || 'Hearth discussion');
      if (thread.id) router.push(withChrome(`/seeker/the-hearth/forums?thread=${thread.id}`));
    } catch (err) {
      console.error('branch to hearth error:', err);
      alert('We could not continue this discussion in the Hearth. Please try again.');
    } finally {
      setHearthLoading(false);
    }
  };

  // ── Reactions ─────────────────────────────────────────────

  const postReactions = Array.isArray(post.reactions) ? post.reactions : [];

  const selectedEmojis = postReactions
    .filter((r) => {
      const userIds = Array.isArray(r?.userIds) ? r.userIds.map(String) : [];
      const users = Array.isArray(r?.users) ? r.users.map(String) : [];
      const myId = currentUserId ? String(currentUserId) : '';
      return Boolean(myId) && (userIds.includes(myId) || users.includes(myId));
    })
    .map((r) => r.emoji) || [];

  const reactionCounts = postReactions.reduce((acc, r) => {
    if (!r?.emoji) return acc;
    acc[r.emoji] = Number(r.count) || (Array.isArray(r.userIds) ? r.userIds.length : 0);
    return acc;
  }, {}) || {};

  const visiblePostReactions = postReactions.filter((r) => {
    const count = Number(r?.count) || (Array.isArray(r?.userIds) ? r.userIds.length : 0);
    return r?.emoji && count > 0;
  });

  const likeEmoji    = '👍';
  const likeCount    = reactionCounts[likeEmoji] || 0;
  const likeSelected = selectedEmojis.includes(likeEmoji);
  const handleLike   = () => {
    if (isOwner) return;
    onReact?.(post.id, likeEmoji);
  };

  const fetchUsersForEmoji = async (emoji) => {
    const cached = reactionUsers[emoji];
    if (cached?.loaded && Array.isArray(cached.names)) return cached.names;

    const reaction = postReactions.find((r) => r.emoji === emoji);
    const userIds = Array.isArray(reaction?.userIds) ? reaction.userIds.map(String).filter(Boolean) : [];
    if (!userIds.length) return [];

    setReactionUsers((prev) => ({
      ...prev,
      [emoji]: {
        ...(prev[emoji] || {}),
        loading: true,
      },
    }));

    try {
      const res = await fetch('/api/users/names', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds }),
      });
      if (!res.ok) throw new Error('Could not load reaction users');

      const data = await res.json().catch(() => ({}));
      const names = Array.isArray(data.users)
  ? data.users.map((u) => ({
      id: u.id,
      name: u.name || 'Member',
      headline: u.headline || '',
      slug: u.slug || '',
      avatarUrl: u.avatarUrl || '',
    }))
  : [];

      setReactionUsers((prev) => ({
        ...prev,
        [emoji]: {
          names,
          loading: false,
          loaded: true,
        },
      }));

      return names;
    } catch (err) {
      console.error('reaction hover error:', err);
      const names = userIds.map((id) => (String(id) === String(currentUserId) ? 'You' : 'Member'));
      setReactionUsers((prev) => ({
        ...prev,
        [emoji]: {
          names,
          loading: false,
          loaded: true,
        },
      }));
      return names;
    }
  };

  const getTooltipText = (emoji) => {
    const names = reactionUsers[emoji]?.names || [];
    if (!names.length) return 'Loading…';
    const preview = names.slice(0, 3).join(', ');
    const extra = names.length > 3 ? ` +${names.length - 3}` : '';
    return `${preview}${extra} reacted with ${emoji}`;
  };

  const openReactionViewer = async (emoji, event) => {
    const reaction = postReactions.find((r) => r?.emoji === emoji);
    const userIds = Array.isArray(reaction?.userIds) ? reaction.userIds.map(String).filter(Boolean) : [];
    if (!userIds.length) return;

    let top = 96;
    let left = 16;
    let mobile = false;

    try {
      const viewportWidth = window.innerWidth || 360;
      const viewportHeight = window.innerHeight || 700;
      mobile = viewportWidth < 640;

      const panelWidth = Math.min(mobile ? 320 : 340, viewportWidth - 28);
      const estimatedPanelHeight = mobile ? 320 : 330;
      const clickX = Number(event?.clientX);
      const clickY = Number(event?.clientY);

      if (Number.isFinite(clickX) && Number.isFinite(clickY)) {
        left = Math.min(
          Math.max(14, clickX - 24),
          Math.max(14, viewportWidth - panelWidth - 14)
        );

        top = clickY + 12;

        if (top + estimatedPanelHeight > viewportHeight - 14) {
          top = Math.max(14, viewportHeight - estimatedPanelHeight - 14);
        }
      } else {
        const rect = event?.currentTarget?.getBoundingClientRect?.();

        if (rect) {
          left = Math.min(
            Math.max(14, rect.left),
            Math.max(14, viewportWidth - panelWidth - 14)
          );

          top = rect.bottom + 8;

          if (top + estimatedPanelHeight > viewportHeight - 14) {
            top = Math.max(14, viewportHeight - estimatedPanelHeight - 14);
          }
        }
      }
    } catch {}

    setReactionViewer({
      emoji,
      userIds,
      names: reactionUsers[emoji]?.names || [],
      top,
      left,
      mobile,
    });

    const names = await fetchUsersForEmoji(emoji);
    setReactionViewer((current) => {
      if (!current || current.emoji !== emoji) return current;
      return { ...current, names };
    });
  };

  // ── Derived display values ────────────────────────────────

  const typeLabel    = post.type === 'personal' ? 'Personal' : 'Business';
  const typePillClass = post.type === 'personal'
    ? 'bg-[rgba(168,120,255,0.18)] border-[rgba(168,120,255,0.4)] text-[#5a3aa8]'
    : 'bg-[rgba(95,150,255,0.18)] border-[rgba(95,150,255,0.4)] text-[#2f5fb0]';

  // Type-driven accent treatments — purple for personal, blue for business
  const accentEdgeClass = post.type === 'personal'
    ? "before:content-[''] before:absolute before:left-0 before:top-2.5 before:bottom-2.5 before:w-1 before:rounded-r-[4px] before:bg-[linear-gradient(180deg,#caa6ff,#7c5cff)] before:shadow-[0_0_16px_rgba(168,120,255,0.45)]"
    : "before:content-[''] before:absolute before:left-0 before:top-2.5 before:bottom-2.5 before:w-1 before:rounded-r-[4px] before:bg-[linear-gradient(180deg,#9fc3ff,#4f8cff)] before:shadow-[0_0_16px_rgba(80,140,255,0.45)]";

  const accentDividerClass = post.type === 'personal'
    ? 'bg-[linear-gradient(90deg,rgba(168,120,255,0.55),rgba(168,120,255,0.05))]'
    : 'bg-[linear-gradient(90deg,rgba(95,150,255,0.55),rgba(95,150,255,0.05))]';

  const attachments = useMemo(() => {
    const arr = Array.isArray(post?.attachments) ? post.attachments : [];
    return arr.map((a) => ({
      type: String(a?.type || '').toLowerCase().trim(),
      url:  String(a?.url  || '').trim(),
      name: String(a?.name || '').trim(),
    })).filter((a) => a.type && a.url);
  }, [post?.attachments]);

  const isSafeUrl = (url) => {
    const u = String(url || '').trim();
    return u.startsWith('/') || u.startsWith('https://') || u.startsWith('http://') ||
           u.startsWith('data:image/') || u.startsWith('data:video/');
  };

  const safeAttachments  = useMemo(() => attachments.filter((a) => isSafeUrl(a.url)),  [attachments]);
  const mediaAttachments = useMemo(() => safeAttachments.filter((a) => a.type === 'image' || a.type === 'video'), [safeAttachments]);
  const linkAttachments  = useMemo(() => safeAttachments.filter((a) => a.type === 'link'),  [safeAttachments]);

  useEffect(() => {
    if (activeMediaIndex >= mediaAttachments.length) {
      setActiveMediaIndex(0);
    }
  }, [activeMediaIndex, mediaAttachments.length]);

  const activeMedia = mediaAttachments[activeMediaIndex] || mediaAttachments[0] || null;
  const hasMultipleMedia = mediaAttachments.length > 1;

  const goToMedia = (idx) => {
    if (!mediaAttachments.length) return;
    const total = mediaAttachments.length;
    const nextIndex = ((idx % total) + total) % total;
    setActiveMediaIndex(nextIndex);
  };

  const openLightbox = (idx = activeMediaIndex) => {
    if (!mediaAttachments.length) return;
    setLightboxIndex(idx);
    logPostView('media_open');
  };

  const closeLightbox = () => setLightboxIndex(null);

  const showPreviousMedia = () => goToMedia(activeMediaIndex - 1);
  const showNextMedia = () => goToMedia(activeMediaIndex + 1);

  const handleMediaTouchStart = (e) => {
    touchStartXRef.current = e.touches?.[0]?.clientX ?? null;
  };

  const handleMediaTouchEnd = (e) => {
    if (!hasMultipleMedia || touchStartXRef.current == null) return;
    const endX = e.changedTouches?.[0]?.clientX ?? touchStartXRef.current;
    const delta = touchStartXRef.current - endX;
    touchStartXRef.current = null;

    if (Math.abs(delta) < 40) return;
    if (delta > 0) showNextMedia();
    else showPreviousMedia();
  };

  const signalMeta = useMemo(() => {
    const rawBody = String(post?.body || '');
    const rules = [
      { prefix: 'Hiring for',               label: 'Hiring',    className: 'bg-[rgba(255,112,67,0.18)] border-[rgba(255,112,67,0.4)] text-[#b6481f]' },
      { prefix: 'Open to opportunities in', label: 'Open to work', className: 'bg-[rgba(120,200,90,0.18)] border-[rgba(120,200,90,0.4)] text-[#3f7a1f]' },
      { prefix: 'Hosting a workshop on',    label: 'Workshop',  className: 'bg-[rgba(60,200,170,0.18)] border-[rgba(60,200,170,0.4)] text-[#1a7a66]' },
      { prefix: 'Coaching insight:',        label: 'Coaching',  className: 'bg-[rgba(70,190,230,0.18)] border-[rgba(70,190,230,0.4)] text-[#1a6e8f]' },
      { prefix: 'Looking for advice on',    label: 'Advice',    className: 'bg-[rgba(230,90,170,0.18)] border-[rgba(230,90,170,0.4)] text-[#a3275f]' },
      { prefix: 'Sharing a win:',           label: 'Win',       className: 'bg-[rgba(245,190,80,0.18)] border-[rgba(245,190,80,0.4)] text-[#8a5d0a]' },
      { prefix: 'Sharing an idea about',    label: 'Idea',      className: 'bg-white/40 border-white/50 text-[#6b4a3a]' },
    ];
    const match = rules.find((rule) => rawBody.startsWith(rule.prefix));
    if (!match) return { signalLabel: '', signalClassName: '', displayBody: rawBody };
    const displayBody = rawBody.slice(match.prefix.length).trim() || rawBody;
    return { signalLabel: match.label, signalClassName: match.className, displayBody };
  }, [post?.body]);

  // ── Render ────────────────────────────────────────────────

  return (
    <>
    <style jsx>{`
      @keyframes ft-pop {
        0%   { transform: scale(1) rotate(0deg); }
        35%  { transform: scale(1.45) rotate(-8deg); }
        65%  { transform: scale(0.92) rotate(4deg); }
        100% { transform: scale(1) rotate(0deg); }
      }
      @keyframes ft-flicker {
        0%, 100% { filter: drop-shadow(0 0 0px rgba(255,112,67,0)); transform: scale(1); }
        50%      { filter: drop-shadow(0 0 6px rgba(255,112,67,0.7)); transform: scale(1.06); }
      }
      @keyframes ft-slidedown {
        from { opacity: 0; transform: translateY(-6px) scale(0.96); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
      }
      .ft-pop { animation: ft-pop 0.42s cubic-bezier(.34,1.56,.64,1); }
      .ft-flicker { animation: ft-flicker 2.4s ease-in-out infinite; }
      .ft-slidedown { animation: ft-slidedown 0.28s ease; }
      .ft-reaction-scroll {
        scrollbar-width: thin;
        scrollbar-color: rgba(255,112,67,0.42) rgba(255,247,242,0.72);
      }
      .ft-reaction-scroll::-webkit-scrollbar {
        width: 8px;
      }
      .ft-reaction-scroll::-webkit-scrollbar-track {
        background: rgba(255,247,242,0.72);
        border-radius: 999px;
      }
      .ft-reaction-scroll::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, rgba(255,112,67,0.72), rgba(229,90,43,0.48));
        border: 2px solid rgba(255,247,242,0.92);
        border-radius: 999px;
      }
      .ft-reaction-scroll::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(180deg, rgba(255,112,67,0.9), rgba(229,90,43,0.62));
      }
    `}</style>

    <div
      onClick={handleCardClick}
      className={`relative overflow-hidden rounded-[20px] border border-white/40 bg-[linear-gradient(160deg,rgba(255,255,255,0.22),rgba(255,180,130,0.18))] backdrop-blur-[26px] backdrop-saturate-[160%] shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_20px_50px_-24px_rgba(50,20,10,0.3)] p-3.5 sm:p-5 space-y-3 sm:space-y-4 w-full cursor-pointer transition-all duration-300 ease-out hover:-translate-y-[3px] hover:border-white/60 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_28px_60px_-24px_rgba(255,140,90,0.3),0_28px_60px_-24px_rgba(50,20,10,0.35)] ${accentEdgeClass}`}
    >

      {/* Header row */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[1fr_auto_1fr] items-start gap-2 sm:gap-3">

        {/* Left: avatar + name + headline + meta */}
        <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">

          {/* Avatar — unified action system handles routing, connect, message */}
          <div data-stop-card-click onClick={(e) => e.stopPropagation()}>
            <MemberAvatarActions
              targetUserId={canTargetAuthor ? post.authorId : null}
              targetUserSlug={post.authorSlug}
              targetName={post.author}
            >
              {post.authorAvatar ? (
                <img
                  src={post.authorAvatar}
                  alt={post.author}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover ring-1 ring-white/60 shrink-0"
                  style={{ cursor: canTargetAuthor ? 'pointer' : 'default' }}
                />
              ) : (
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/40 flex items-center justify-center text-[#8a5d44] ring-1 ring-white/60 shrink-0">
                  {post.author?.charAt(0)?.toUpperCase()}
                </div>
              )}
            </MemberAvatarActions>
          </div>

          <div className="min-w-0 flex-1">
            <div className="font-semibold text-[#3a2418] truncate">{post.author}</div>
            {post.authorHeadline && (
              <div className="w-full text-xs text-[#8a5d44] line-clamp-1 sm:line-clamp-2" title={post.authorHeadline}>
                {post.authorHeadline}
              </div>
            )}
            <div className="text-xs text-[#a8775f] mt-0.5" title={new Date(post.createdAt).toLocaleString()}>
              {formatRelativeTime(post.createdAt)}
            </div>

            {/* Mobile-only signal pill, shown inline under the meta line */}
            {signalMeta.signalLabel && (
              <div className="mt-1.5 sm:hidden">
                <span className={`inline-flex items-center px-2.5 py-1 text-[11px] font-extrabold tracking-wide rounded-full border whitespace-nowrap ${signalMeta.signalClassName}`}>
                  {signalMeta.signalLabel}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Center: signal pill (Hiring, Open to work, Win, etc.) — desktop only, mobile shows it inline above */}
        <div className="hidden sm:flex sm:justify-self-center">
          {signalMeta.signalLabel && (
            <span className={`inline-flex items-center px-2.5 py-1 text-[11px] font-extrabold tracking-wide rounded-full border whitespace-nowrap ${signalMeta.signalClassName}`}>
              {signalMeta.signalLabel}
            </span>
          )}
        </div>

        {/* Right: type pill + post actions menu */}
        <div className="flex items-center gap-1.5 sm:gap-2 justify-self-end shrink-0">
          <span className={`inline-flex items-center px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-semibold rounded-full border whitespace-nowrap ${typePillClass}`}>{typeLabel}</span>

          <div className="relative" ref={actionsMenuRef}>
            <button
              type="button"
              onClick={() => setActionsMenuOpen((v) => !v)}
              className="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-white/40 bg-white/40 hover:bg-white/60 text-[#6b4a3a] hover:text-[#3a2418] transition"
              aria-label="Post actions"
            >
              <svg className="w-4 h-4 sm:w-[18px] sm:h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <circle cx="5" cy="12" r="1.4" />
                <circle cx="12" cy="12" r="1.4" />
                <circle cx="19" cy="12" r="1.4" />
              </svg>
            </button>
            {actionsMenuOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white/95 border border-white/40 rounded-xl shadow-2xl shadow-black/50 z-30 overflow-hidden" role="menu">
                {!isOwner ? (
                  <>
                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={handleReportPost}
                      className="w-full text-left px-3 py-2 text-sm text-[#6b4a3a] hover:bg-white/[0.06]" role="menuitem">Report</button>
                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={handleBlockAuthorAction}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50" role="menuitem">Block</button>
                  </>
                ) : (
                  <button type="button" onMouseDown={(e) => e.preventDefault()}
                    onClick={() => { setActionsMenuOpen(false); onDelete?.(post.id); }}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50" role="menuitem">Delete</button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Post body */}
      <div className="w-full text-left">
        <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-[#4a3024]">
          {!expanded && signalMeta.displayBody?.length > TRUNCATE_LIMIT
            ? signalMeta.displayBody.slice(0, TRUNCATE_LIMIT).trimEnd() + '…'
            : signalMeta.displayBody}
        </p>
        {signalMeta.displayBody?.length > TRUNCATE_LIMIT && (
          <button type="button" onClick={() => setExpanded((v) => !v)}
            className="mt-1 text-sm font-semibold text-[#d6602f] hover:text-[#b6481f]">
            {expanded ? 'See less' : 'See more'}
          </button>
        )}
      </div>

      {/* Media attachments */}
      {activeMedia && (
        <div
          className="relative overflow-hidden rounded-2xl border border-white/40 bg-gray-950"
          onTouchStart={handleMediaTouchStart}
          onTouchEnd={handleMediaTouchEnd}
        >
          <div className="relative h-[260px] sm:h-[340px] md:h-[420px] w-full bg-gray-950 flex items-center justify-center overflow-hidden">
            {activeMedia.type === 'image' && (
              <button
                type="button"
                onClick={() => openLightbox(activeMediaIndex)}
                className="group h-full w-full"
                aria-label="Open image"
              >
                <img
                  src={activeMedia.url}
                  alt={activeMedia.name || 'Post image'}
                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.01]"
                  onError={(e) => { try { e.currentTarget.style.display = 'none'; } catch {} }}
                />
              </button>
            )}

            {activeMedia.type === 'video' && (
              <video
                src={activeMedia.url}
                controls
                className="h-full w-full object-contain bg-black"
              />
            )}

            {hasMultipleMedia && (
              <>
                <button
                  type="button"
                  onClick={showPreviousMedia}
                  className="absolute left-3 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white border border-white/20 backdrop-blur hover:bg-black/65"
                  aria-label="Previous media"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={showNextMedia}
                  className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white border border-white/20 backdrop-blur hover:bg-black/65"
                  aria-label="Next media"
                >
                  ›
                </button>
                <div className="absolute right-3 top-3 rounded-full bg-black/50 px-3 py-1 text-xs font-bold text-white border border-white/15 backdrop-blur">
                  {activeMediaIndex + 1} / {mediaAttachments.length}
                </div>
              </>
            )}
          </div>

          {hasMultipleMedia && (
            <div className="flex items-center justify-center gap-1.5 px-3 py-3 bg-[#0c0e14]">
              {mediaAttachments.map((a, idx) => (
                <button
                  key={`${a.type}-${idx}`}
                  type="button"
                  onClick={() => goToMedia(idx)}
                  className={`h-2.5 rounded-full transition-all ${
                    idx === activeMediaIndex ? 'w-7 bg-[#ff7043]' : 'w-2.5 bg-white/15 hover:bg-white/30'
                  }`}
                  aria-label={`Show media ${idx + 1}`}
                  aria-current={idx === activeMediaIndex ? 'true' : 'false'}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Link attachments */}
      {linkAttachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {linkAttachments.map((a, idx) => (
            <a key={`${a.type}-${idx}`} href={a.url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/40 bg-white/35 hover:bg-white/55 hover:border-white/60 text-sm text-[#2f5fb0] break-all transition">
              <svg className="w-[16px] h-[16px] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07l-1.5 1.5" />
                <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07l1.5-1.5" />
              </svg>
              <span className="font-semibold">{a.name || 'Link attachment'}</span>
            </a>
          ))}
        </div>
      )}

      {/* Action bar */}
      <div className="pt-3 space-y-3">
        <div className={`h-px w-full ${accentDividerClass}`} />
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {!isOwner && (
              <button
                type="button"
                onClick={handleLike}
                className={`inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full border text-xs sm:text-sm font-bold transition-all duration-150 ${
                  likeSelected
                    ? 'text-[#b6481f] border-orange-400/50 bg-gradient-to-br from-orange-500/25 to-orange-500/10'
                    : 'text-[#6b4a3a] border-white/40 bg-white/40 hover:bg-white/60 hover:border-white/60 hover:text-[#3a2418] hover:-translate-y-0.5'
                }`}
              >
                <svg className={`w-4 h-4 sm:w-[18px] sm:h-[18px] ${likeSelected ? 'ft-pop' : ''}`} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2 21h4V9H2v12zM22 10c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L13.17 1 7.59 6.59C7.22 6.95 7 7.45 7 8v11c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
                </svg>
                <span>Like</span>
                {likeCount > 0 && <span className="text-[10px] sm:text-xs text-[#a8775f]">{likeCount}</span>}
              </button>
            )}

            <button
              type="button"
              onClick={() => onOpenComments?.(post)}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full border border-white/40 bg-white/40 hover:bg-white/60 hover:border-white/60 text-xs sm:text-sm font-bold text-[#6b4a3a] hover:text-[#3a2418] transition-all duration-150 hover:-translate-y-0.5"
            >
              <svg className="w-4 h-4 sm:w-[18px] sm:h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              <span>Comment</span>
              {visibleCommentsCount > 0 && (
                <span className="text-[10px] sm:text-xs text-[#a8775f]">{visibleCommentsCount}</span>
              )}
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full border border-white/40 bg-white/40 hover:bg-white/60 hover:border-white/60 text-xs sm:text-sm font-bold text-[#6b4a3a] hover:text-[#3a2418] transition-all duration-150 hover:-translate-y-0.5"
            >
              {copyConfirm ? (
                <>
                  <svg className="w-4 h-4 sm:w-[18px] sm:h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 sm:w-[18px] sm:h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <path d="M8.59 13.51 15.42 17.49" />
                    <path d="M15.41 6.51 8.59 10.49" />
                  </svg>
                  <span>Share</span>
                </>
              )}
            </button>

            {!isOwner && (
              <button
                type="button"
                onClick={() => setShowEmojiBar((v) => !v)}
                className="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-white/40 bg-white/40 hover:bg-white/60 hover:border-white/60 text-[#6b4a3a] hover:text-[#3a2418] transition-all duration-150"
                aria-label="React"
              >
                <svg className="w-4 h-4 sm:w-[18px] sm:h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M9 9h.01M15 9h.01M8.5 14.5a4 4 0 0 0 7 0" />
                </svg>
              </button>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={saveLoading}
              className={`inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full border text-xs sm:text-sm font-bold transition-all duration-150 disabled:opacity-50 ${
                saved
                  ? 'text-[#b6481f] border-orange-400/40 bg-orange-500/10'
                  : 'text-[#6b4a3a] border-white/40 bg-white/40 hover:bg-white/60 hover:border-white/60 hover:text-[#3a2418]'
              }`}
            >
              <svg
                className={`w-4 h-4 sm:w-[18px] sm:h-[18px] transition-transform duration-300 ${saved ? 'scale-110' : ''}`}
                viewBox="0 0 24 24"
                fill={saved ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              >
                <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
              </svg>
              <span>{saved ? 'Saved' : 'Save'}</span>
            </button>
        </div>

        {visiblePostReactions.length > 0 && (
          <div className="relative flex flex-wrap items-center gap-1.5">
            {visiblePostReactions.map((reaction) => {
              const emoji = reaction.emoji;
              const count = Number(reaction.count) || (Array.isArray(reaction.userIds) ? reaction.userIds.length : 0);
              return (
                <button
                  key={`post-reaction-${emoji}`}
                  type="button"
                  onClick={(e) => openReactionViewer(emoji, e)}
                  onMouseEnter={() => {
                    setHoveredEmoji(emoji);
                    fetchUsersForEmoji(emoji);
                  }}
                  onMouseLeave={() => setHoveredEmoji(null)}
                  className="inline-flex items-center gap-1 rounded-full border border-white/50 bg-white/30 px-2.5 py-1.5 text-xs font-bold text-[#6b4a3a] transition hover:bg-white/55 hover:text-[#3a2418]"
                  aria-label={`${count} ${count === 1 ? 'reaction' : 'reactions'} with ${emoji}`}
                >
                  <span>{emoji}</span>
                  <span>{count}</span>
                </button>
              );
            })}

            {hoveredEmoji && reactionCounts[hoveredEmoji] > 0 && (
              <div className="absolute bottom-full left-0 mb-2 z-20 hidden whitespace-nowrap rounded-lg border border-white/40 bg-white/95 px-3 py-2 text-xs font-semibold text-[#3a2418] shadow-xl shadow-black/30 sm:block">
                {getTooltipText(hoveredEmoji)}
              </div>
            )}
          </div>
        )}

        {latestVisibleComment && (
          <button
            type="button"
            onClick={() => onOpenComments?.(post)}
            className="w-full text-left pl-3.5 border-l-2 border-[rgba(180,140,110,0.35)] hover:border-[rgba(180,140,110,0.6)] transition"
          >
            <div className="flex items-start gap-2">
              {latestVisibleComment.avatarUrl ? (
                <img
                  src={latestVisibleComment.avatarUrl}
                  alt={latestVisibleComment.by || 'Commenter'}
                  className="mt-0.5 h-7 w-7 rounded-full object-cover bg-white/40 ring-1 ring-white/50"
                />
              ) : (
                <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-orange-300 text-[10px] font-extrabold text-white">
                  {latestVisibleComment.by?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-[#3a2418]">
                  {latestVisibleComment.by || 'Member'}
                </div>
				{latestVisibleComment.headline && (
  <div className="text-[11px] text-[#a8775f]">
    {latestVisibleComment.headline}
  </div>
)}
                <div className="mt-0.5 line-clamp-2 text-sm text-[#6b4a3a]">
                  {latestVisibleComment.text}
                </div>
                {visibleCommentsCount > 1 && (
                  <div className="mt-1 text-xs font-bold text-[#d6602f]">
                    View all {visibleCommentsCount} comments
                  </div>
                )}
              </div>
            </div>
          </button>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {hearthThreadId ? (
            <button
              type="button"
              onClick={() => router.push(withChrome(`/seeker/the-hearth/forums?thread=${hearthThreadId}`))}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-orange-400/40 bg-gradient-to-br from-orange-500/25 to-orange-500/5 text-sm font-bold text-[#b6481f] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(255,112,67,0.25)]"
              title={hearthThreadTitle || 'Continued in the Hearth'}
            >
              <span className="ft-flicker">🔥</span> Continued in Hearth
            </button>
          ) : canBranchToHearth ? (
            <button
              type="button"
              onClick={handleBranchToHearth}
              disabled={hearthLoading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-transparent bg-gradient-to-br from-[#ff7043] to-[#e55a2b] text-sm font-bold text-white shadow-[0_8px_20px_-8px_rgba(255,112,67,0.55)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_12px_26px_-10px_rgba(255,112,67,0.65)] disabled:opacity-60"
            >
              <span className="ft-flicker">🔥</span> Continue in Hearth
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">{hearthCount} / {HEARTH_THRESHOLD}</span>
            </button>
          ) : canRecommendForHearth ? (
            <button
              type="button"
              onClick={handleRecommendForHearth}
              disabled={hearthLoading || hearthRecommended}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full border text-sm font-bold transition-all duration-150 ${
                hearthRecommended
                  ? 'bg-orange-500/15 border-orange-400/40 text-[#b6481f]'
                  : 'border-white/40 bg-white/40 text-[#6b4a3a] hover:bg-orange-500/10 hover:border-orange-400/40 hover:text-[#b6481f] hover:-translate-y-0.5'
              }`}
              title="Recommend this post to move into a deeper Hearth discussion"
            >
              <span className="ft-flicker">🔥</span> Move to Hearth
              <span className="rounded-full bg-white/40 px-2 py-0.5 text-xs text-[#8a5d44]">
                {hearthCount} / {HEARTH_THRESHOLD}
              </span>
            </button>
          ) : hearthCount > 0 ? (
            <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-white/40 bg-white/30 text-sm font-semibold text-[#a8775f]">
              <span className="ft-flicker">🔥</span> Hearth interest
              <span className="rounded-full bg-white/40 px-2 py-0.5 text-xs">{hearthCount} / {HEARTH_THRESHOLD}</span>
            </span>
          ) : null}
        </div>
      </div>

      {/* Emoji bar */}
      {showEmojiBar && !isOwner && (
        <div className="relative">
          <div className="mt-2 ft-slidedown">
            <QuickEmojiBar
              emojis={['🔥', '🎉', '👏', '❤️']}
              onPick={(emoji) => { if (!isOwner) onReact?.(post.id, emoji); }}
              selectedEmojis={selectedEmojis}
              reactionCounts={reactionCounts}
              onMouseEnter={(emoji) => { setHoveredEmoji(emoji); if (reactionCounts[emoji] > 0) fetchUsersForEmoji(emoji); }}
              onMouseLeave={() => setHoveredEmoji(null)}
            />
          </div>
          {hoveredEmoji && reactionCounts[hoveredEmoji] > 0 && (
            <div className="absolute bottom-full left-0 mb-3 hidden bg-white/95 border border-white/40 text-[#3a2418] text-sm rounded-lg p-3 shadow-2xl shadow-black/50 z-20 whitespace-nowrap sm:block">
              {getTooltipText(hoveredEmoji)}
            </div>
          )}
        </div>
      )}
    </div>

    {reactionViewer && typeof document !== 'undefined' && createPortal(
      <>
        <button
          type="button"
          className="fixed inset-0 z-[99999] cursor-default bg-transparent"
          aria-label="Close reactions"
          onClick={() => setReactionViewer(null)}
        />

        {reactionViewer.mobile ? (
          <div
            className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+14px)] left-3 right-3 z-[100000] sm:hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-h-[58dvh] overflow-visible rounded-[22px] border border-white/50 bg-[rgba(255,250,245,0.98)] shadow-[0_22px_70px_rgba(50,20,10,0.32)] backdrop-blur-[24px]">
              <div className="flex items-start justify-between gap-3 border-b border-white/45 px-4 py-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-extrabold text-[#3a2418]">
                    {(() => {
                      const names = reactionUsers[reactionViewer.emoji]?.names || reactionViewer.names || [];
                      const first = names[0] || 'Someone';
                      const others = Math.max(0, (reactionViewer.userIds?.length || names.length) - 1);

                      return others > 0
                        ? `${reactionViewer.emoji} ${first} and ${others} other${others === 1 ? '' : 's'} reacted`
                        : `${reactionViewer.emoji} ${first} reacted`;
                    })()}
                  </div>
                  <div className="mt-0.5 text-[11px] font-semibold text-[#a8775f]">
                    {reactionViewer.userIds?.length || 0} members
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setReactionViewer(null)}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/50 bg-white/60 text-[#6b4a3a]"
                  aria-label="Close reactions"
                >
                  ✕
                </button>
              </div>

              <div className="ft-reaction-scroll max-h-[42dvh] overflow-x-visible overflow-y-auto px-4 py-3">
                <div className="space-y-2">
                  {(reactionUsers[reactionViewer.emoji]?.names || reactionViewer.names || []).map((name, index) => (
                    <div
                      key={`post-reaction-viewer-mobile-${reactionViewer.emoji}-${name}-${index}`}
                      className="flex items-center gap-2.5 rounded-2xl border border-white/45 bg-white/40 px-3 py-2.5"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-orange-300 text-xs font-extrabold text-white">
                        {String(name || 'Member').charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-extrabold text-[#3a2418]">
                          {name || 'Member'}
                        </div>
                      </div>
                      <div className="shrink-0 text-sm" aria-hidden="true">
                        {reactionViewer.emoji}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="fixed z-[100000] max-h-[70dvh] overflow-visible rounded-[22px] border border-white/50 bg-[rgba(255,250,245,0.97)] shadow-[0_22px_70px_rgba(50,20,10,0.32)] backdrop-blur-[24px]"
            style={{
              top: reactionViewer.top ?? 96,
              left: reactionViewer.left ?? 16,
              width: 'min(340px, calc(100vw - 28px))',
            }}
            role="dialog"
            aria-modal="false"
            aria-label="Post reactions"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/45 px-4 py-3">
              <div>
                <div className="text-sm font-extrabold text-[#3a2418]">
                  {reactionViewer.emoji} Reactions
                </div>
                <div className="text-[11px] font-semibold text-[#a8775f]">
                  {reactionViewer.userIds?.length || 0} members
                </div>
              </div>

              <button
                type="button"
                onClick={() => setReactionViewer(null)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/50 bg-white/60"
              >
                ✕
              </button>
            </div>

            <div className="ft-reaction-scroll max-h-[260px] overflow-x-visible overflow-y-auto px-4 py-3">
              <div className="space-y-2">
                {(reactionUsers[reactionViewer.emoji]?.names || reactionViewer.names || []).map((name, index) => (
                  <div
                    key={`post-reaction-viewer-${reactionViewer.emoji}-${name}-${index}`}
                    className="flex items-center gap-2.5 rounded-2xl border border-white/45 bg-white/40 px-3 py-2.5"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-orange-300 text-xs font-extrabold text-white">
                      {String(name || 'Member').charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-extrabold text-[#3a2418]">
                        {name || 'Member'}
                      </div>
                    </div>
                    <div className="shrink-0 text-sm" aria-hidden="true">
                      {reactionViewer.emoji}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </>,
      document.body
    )}

    {lightboxIndex !== null && mediaAttachments[lightboxIndex] && (
      <div
        className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={closeLightbox}
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          onClick={closeLightbox}
          className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20"
          aria-label="Close media viewer"
        >
          ✕
        </button>

        {mediaAttachments[lightboxIndex].type === 'image' && (
          <img
            src={mediaAttachments[lightboxIndex].url}
            alt={mediaAttachments[lightboxIndex].name || 'Post image'}
            className="max-h-[88vh] max-w-[94vw] rounded-2xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        )}

        {mediaAttachments[lightboxIndex].type === 'video' && (
          <video
            src={mediaAttachments[lightboxIndex].url}
            controls
            autoPlay
            className="max-h-[88vh] max-w-[94vw] rounded-2xl bg-black shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        )}
      </div>
    )}
    </>
  );
}