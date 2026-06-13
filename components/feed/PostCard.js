// components/feed/PostCard.js
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import QuickEmojiBar from './QuickEmojiBar';
import MemberAvatarActions from '@/components/member/MemberAvatarActions';

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

  const selectedEmojis = post.reactions
    ?.filter((r) => r.users?.includes(currentUserId) || r.userIds?.includes(currentUserId))
    ?.map((r) => r.emoji) || [];

  const reactionCounts = post.reactions?.reduce((acc, r) => {
    acc[r.emoji] = r.count || 0; return acc;
  }, {}) || {};

  const likeEmoji    = '👍';
  const likeCount    = reactionCounts[likeEmoji] || 0;
  const likeSelected = selectedEmojis.includes(likeEmoji);
  const handleLike   = () => onReact?.(post.id, likeEmoji);

  const fetchUsersForEmoji = async (emoji) => {
    if (reactionUsers[emoji]) return;
    const reaction = post.reactions?.find((r) => r.emoji === emoji);
    if (!reaction || !reaction.userIds?.length) return;
    try {
      const res = await fetch('/api/users/names', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: reaction.userIds }),
      });
      if (res.ok) {
        const data  = await res.json();
        const names = (data.names || []).map((n) => (n === currentUserName ? 'You' : n)).join(', ');
        setReactionUsers((prev) => ({ ...prev, [emoji]: names }));
      }
    } catch (err) { console.error('reaction hover error:', err); }
  };

  const getTooltipText = (emoji) =>
    reactionUsers[emoji] ? `${reactionUsers[emoji]} reacted with ${emoji}` : 'Loading…';

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
    `}</style>

    <div className={`relative overflow-hidden rounded-[20px] border border-white/40 bg-[linear-gradient(160deg,rgba(255,255,255,0.22),rgba(255,180,130,0.18))] backdrop-blur-[26px] backdrop-saturate-[160%] shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_20px_50px_-24px_rgba(50,20,10,0.3)] p-5 space-y-4 w-full transition-all duration-300 ease-out hover:-translate-y-[3px] hover:border-white/60 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_28px_60px_-24px_rgba(255,140,90,0.3),0_28px_60px_-24px_rgba(50,20,10,0.35)] ${accentEdgeClass}`}>

      {/* Header row */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3">

        {/* Left: avatar + name + headline + meta */}
        <div className="flex items-start gap-3 min-w-0">

          {/* Avatar — unified action system handles routing, connect, message */}
          <MemberAvatarActions
            targetUserId={canTargetAuthor ? post.authorId : null}
            targetUserSlug={post.authorSlug}
            targetName={post.author}
          >
            {post.authorAvatar ? (
              <img
                src={post.authorAvatar}
                alt={post.author}
                className="w-10 h-10 rounded-full object-cover ring-1 ring-white/60"
                style={{ cursor: canTargetAuthor ? 'pointer' : 'default' }}
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-white/40 flex items-center justify-center text-[#8a5d44] ring-1 ring-white/60">
                {post.author?.charAt(0)?.toUpperCase()}
              </div>
            )}
          </MemberAvatarActions>

          <div className="min-w-0">
            <div className="font-semibold text-[#3a2418] truncate">{post.author}</div>
            {post.authorHeadline && (
              <div className="w-full text-xs text-[#8a5d44]">
                {post.authorHeadline}
              </div>
            )}
            <div className="text-xs text-[#a8775f] mt-0.5">{new Date(post.createdAt).toLocaleString()}</div>
          </div>
        </div>

        {/* Center: signal pill (Hiring, Open to work, Win, etc.) */}
        <div className="justify-self-center">
          {signalMeta.signalLabel && (
            <span className={`inline-flex items-center px-2.5 py-1 text-[11px] font-extrabold tracking-wide rounded-full border whitespace-nowrap ${signalMeta.signalClassName}`}>
              {signalMeta.signalLabel}
            </span>
          )}
        </div>

        {/* Right: type pill + post actions menu */}
        <div className="flex items-center gap-2 justify-self-end">
          <span className={`inline-flex items-center px-2.5 py-1 text-[11px] font-semibold rounded-full border whitespace-nowrap ${typePillClass}`}>{typeLabel}</span>

          <div className="relative" ref={actionsMenuRef}>
            <button
              type="button"
              onClick={() => setActionsMenuOpen((v) => !v)}
              className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-white/40 bg-white/40 hover:bg-white/60 text-[#6b4a3a] hover:text-[#3a2418] transition"
              aria-label="Post actions"
            >
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleLike}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full border text-sm font-bold transition-all duration-150 ${
                likeSelected
                  ? 'text-[#b6481f] border-orange-400/50 bg-gradient-to-br from-orange-500/25 to-orange-500/10'
                  : 'text-[#6b4a3a] border-white/40 bg-white/40 hover:bg-white/60 hover:border-white/60 hover:text-[#3a2418] hover:-translate-y-0.5'
              }`}
            >
              <svg className={`w-[18px] h-[18px] ${likeSelected ? 'ft-pop' : ''}`} viewBox="0 0 24 24" fill="currentColor">
                <path d="M2 21h4V9H2v12zM22 10c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L13.17 1 7.59 6.59C7.22 6.95 7 7.45 7 8v11c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
              </svg>
              <span>Like</span>
              {likeCount > 0 && <span className="text-xs text-[#a8775f]">{likeCount}</span>}
            </button>

            <button
              type="button"
              onClick={() => onOpenComments?.(post)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-white/40 bg-white/40 hover:bg-white/60 hover:border-white/60 text-sm font-bold text-[#6b4a3a] hover:text-[#3a2418] transition-all duration-150 hover:-translate-y-0.5"
            >
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              <span>Comment</span>
              {visibleCommentsCount > 0 && (
                <span className="text-xs text-[#a8775f]">{visibleCommentsCount}</span>
              )}
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-white/40 bg-white/40 hover:bg-white/60 hover:border-white/60 text-sm font-bold text-[#6b4a3a] hover:text-[#3a2418] transition-all duration-150 hover:-translate-y-0.5"
            >
              {copyConfirm ? (
                <>
                  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowEmojiBar((v) => !v)}
              className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-white/40 bg-white/40 hover:bg-white/60 hover:border-white/60 text-[#6b4a3a] hover:text-[#3a2418] transition-all duration-150"
              aria-label="React"
            >
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M9 9h.01M15 9h.01M8.5 14.5a4 4 0 0 0 7 0" />
              </svg>
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saveLoading}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full border text-sm font-bold transition-all duration-150 disabled:opacity-50 ${
                saved
                  ? 'text-[#b6481f] border-orange-400/40 bg-orange-500/10'
                  : 'text-[#6b4a3a] border-white/40 bg-white/40 hover:bg-white/60 hover:border-white/60 hover:text-[#3a2418]'
              }`}
            >
              <svg
                className={`w-[18px] h-[18px] transition-transform duration-300 ${saved ? 'scale-110' : ''}`}
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
        </div>

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
      {showEmojiBar && (
        <div className="relative">
          <div className="mt-2 ft-slidedown">
            <QuickEmojiBar
              emojis={['🔥', '🎉', '👏', '❤️']}
              onPick={(emoji) => onReact?.(post.id, emoji)}
              selectedEmojis={selectedEmojis}
              reactionCounts={reactionCounts}
              onMouseEnter={(emoji) => { setHoveredEmoji(emoji); if (reactionCounts[emoji] > 0) fetchUsersForEmoji(emoji); }}
              onMouseLeave={() => setHoveredEmoji(null)}
            />
          </div>
          {hoveredEmoji && reactionCounts[hoveredEmoji] > 0 && (
            <div className="absolute bottom-full left-0 mb-3 bg-white/95 border border-white/40 text-[#3a2418] text-sm rounded-lg p-3 shadow-2xl shadow-black/50 z-20 whitespace-nowrap">
              {getTooltipText(hoveredEmoji)}
            </div>
          )}
        </div>
      )}
    </div>

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