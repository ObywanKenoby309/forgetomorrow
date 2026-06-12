// components/feed/PostCard.js
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import QuickEmojiBar from './QuickEmojiBar';
import MemberAvatarActions from '@/components/member/MemberAvatarActions';

export default function PostCard({
  post,
  onReply,
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
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText,      setReplyText]      = useState('');
  const [hoveredEmoji,   setHoveredEmoji]   = useState(null);
  const [reactionUsers,  setReactionUsers]  = useState({});
  const [actionsMenuOpen,setActionsMenuOpen]= useState(false);
  const [showEmojiBar,   setShowEmojiBar]   = useState(false);
  const [saved,          setSaved]          = useState(false);
  const [saveLoading,    setSaveLoading]    = useState(false);
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

  const visibleCommentsCount = Array.isArray(post.comments)
    ? post.comments.filter((c) => !(c && c.deleted === true)).length
    : 0;

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

  const handleReplySubmit = async () => {
    if (!replyText.trim()) return;
    logPostView('reply_submit');
    onReply(post.id, replyText.trim());
    setReplyText('');
    setShowReplyInput(false);
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
    ? 'bg-purple-50 border-purple-200 text-purple-700'
    : 'bg-slate-50 border-slate-200 text-slate-700';

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
      { prefix: 'Hiring for',               label: 'Hiring',    className: 'bg-orange-50 border-orange-200 text-orange-700' },
      { prefix: 'Open to opportunities in', label: 'Open to work', className: 'bg-green-50 border-green-200 text-green-700' },
      { prefix: 'Hosting a workshop on',    label: 'Workshop',  className: 'bg-blue-50 border-blue-200 text-blue-700' },
      { prefix: 'Coaching insight:',        label: 'Coaching',  className: 'bg-sky-50 border-sky-200 text-sky-700' },
      { prefix: 'Looking for advice on',    label: 'Advice',    className: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
      { prefix: 'Sharing a win:',           label: 'Win',       className: 'bg-amber-50 border-amber-200 text-amber-700' },
      { prefix: 'Sharing an idea about',    label: 'Idea',      className: 'bg-gray-50 border-gray-200 text-gray-700' },
    ];
    const match = rules.find((rule) => rawBody.startsWith(rule.prefix));
    if (!match) return { signalLabel: '', signalClassName: '', displayBody: rawBody };
    const displayBody = rawBody.slice(match.prefix.length).trim() || rawBody;
    return { signalLabel: match.label, signalClassName: match.className, displayBody };
  }, [post?.body]);

  // ── Render ────────────────────────────────────────────────

  return (
    <>
    <div className="relative bg-white/90 backdrop-blur rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5 space-y-4 w-full">

      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
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
                className="w-10 h-10 rounded-full object-cover border border-gray-200"
                style={{ cursor: canTargetAuthor ? 'pointer' : 'default' }}
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 border border-gray-200">
                {post.author?.charAt(0)?.toUpperCase()}
              </div>
            )}
          </MemberAvatarActions>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="font-semibold text-gray-900 truncate">{post.author}</div>
              <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-full border ${typePillClass}`}>{typeLabel}</span>
              {signalMeta.signalLabel && (
                <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-full border ${signalMeta.signalClassName}`}>
                  {signalMeta.signalLabel}
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">{new Date(post.createdAt).toLocaleString()}</div>
          </div>
        </div>

        {/* Post actions (report / block / delete) — separate from avatar actions */}
        <div className="relative" ref={actionsMenuRef}>
          <button
            type="button"
            onClick={() => setActionsMenuOpen((v) => !v)}
            className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
            aria-label="Post actions"
          >
            ⋯
          </button>
          {actionsMenuOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-xl shadow-lg z-30 overflow-hidden" role="menu">
              {!isOwner ? (
                <>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={handleReportPost}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50" role="menuitem">Report</button>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={handleBlockAuthorAction}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 text-red-700" role="menuitem">Block</button>
                </>
              ) : (
                <button type="button" onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { setActionsMenuOpen(false); onDelete?.(post.id); }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 text-red-700" role="menuitem">Delete</button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Post body */}
      <div className="w-full text-left">
        <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-gray-800">
          {!expanded && signalMeta.displayBody?.length > TRUNCATE_LIMIT
            ? signalMeta.displayBody.slice(0, TRUNCATE_LIMIT).trimEnd() + '…'
            : signalMeta.displayBody}
        </p>
        {signalMeta.displayBody?.length > TRUNCATE_LIMIT && (
          <button type="button" onClick={() => setExpanded((v) => !v)}
            className="mt-1 text-sm font-semibold text-orange-500 hover:text-orange-600">
            {expanded ? 'See less' : 'See more'}
          </button>
        )}
      </div>

      {/* Media attachments */}
      {activeMedia && (
        <div
          className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-950"
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
            <div className="flex items-center justify-center gap-1.5 px-3 py-3 bg-white">
              {mediaAttachments.map((a, idx) => (
                <button
                  key={`${a.type}-${idx}`}
                  type="button"
                  onClick={() => goToMedia(idx)}
                  className={`h-2.5 rounded-full transition-all ${
                    idx === activeMediaIndex ? 'w-7 bg-[#ff7043]' : 'w-2.5 bg-gray-300 hover:bg-gray-400'
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
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm text-blue-700 break-all">
              🔗 <span className="font-semibold">{a.name || 'Link attachment'}</span>
            </a>
          ))}
        </div>
      )}

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-700">
        <button type="button" onClick={handleLike}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition ${likeSelected ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}`}>
          <span className="text-base">👍</span>
          <span className="text-xs font-semibold">{likeCount}</span>
          <span className="text-xs font-semibold">Like</span>
        </button>

        <button type="button" onClick={() => onOpenComments?.(post)}
          className="px-3 py-1.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-700">
          💬 {visibleCommentsCount} {visibleCommentsCount === 1 ? 'comment' : 'comments'}
        </button>

        <button type="button" onClick={() => setShowEmojiBar((v) => !v)}
          className="px-3 py-1.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-700">
          🙂 React
        </button>

        <button type="button" onClick={handleShare}
          className="px-3 py-1.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition">
          {copyConfirm ? '✅ Copied!' : '↗ Share'}
        </button>

        <button type="button" onClick={handleSave} disabled={saveLoading}
          className={`px-3 py-1.5 rounded-full border transition ${saved ? 'bg-orange-50 border-orange-300 text-orange-700' : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'}`}>
          {saved ? '🔖 Saved' : '🔖 Save'}
        </button>
      </div>

      {/* Emoji bar */}
      {showEmojiBar && (
        <div className="relative">
          <div className="mt-2">
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
            <div className="absolute bottom-full left-0 mb-3 bg-gray-900 text-white text-sm rounded-lg p-3 shadow-xl z-20 whitespace-nowrap">
              {getTooltipText(hoveredEmoji)}
            </div>
          )}
        </div>
      )}

      {/* Reply */}
      {showReplyInput ? (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
          <div className="flex gap-2">
            <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply…" rows={2}
              className="flex-1 border border-gray-200 rounded-xl p-3 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400" />
            <button onClick={handleReplySubmit} disabled={!replyText.trim()}
              className="px-4 py-2 bg-[#ff7043] text-white rounded-xl font-semibold disabled:opacity-50">Send</button>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <span>Keep it constructive. Forge builds people.</span>
            <button type="button" onClick={() => { setShowReplyInput(false); setReplyText(''); }}
              className="font-semibold text-gray-600 hover:text-gray-900">Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowReplyInput(true)}
          className="text-sm font-semibold text-gray-700 hover:text-gray-900 inline-flex items-center gap-2">
          <span aria-hidden="true">↩</span> Reply
        </button>
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