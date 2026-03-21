// components/feed/PostCard.js
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import QuickEmojiBar from './QuickEmojiBar';
import { useConnect } from '@/components/actions/useConnect';

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
  const { connectWith } = useConnect();

const [expanded, setExpanded] = useState(false);
const TRUNCATE_LIMIT = 280; // characters

  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [hoveredEmoji, setHoveredEmoji] = useState(null);
  const [reactionUsers, setReactionUsers] = useState({});

  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [connectStatus, setConnectStatus] = useState('idle'); // idle | requested | connected

  // ✅ NEW: actions menu (kebab) for Report/Block/Delete
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const actionsMenuRef = useRef(null);

  // ✅ Emoji bar (now "lives" with the actions row instead of floating mid-card)
  const [showEmojiBar, setShowEmojiBar] = useState(false);

  // ✅ NEW: Share + Save state
  const [saved, setSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [copyConfirm, setCopyConfirm] = useState(false);

  const isOwner = post.authorId && currentUserId ? post.authorId === currentUserId : false;
  const canTargetAuthor = Boolean(post?.authorId) && !isOwner;

  const chrome = String(router.query?.chrome || '').toLowerCase();
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
      if (!actionsMenuRef.current.contains(e.target)) {
        setActionsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocDown);
    return () => document.removeEventListener('mousedown', onDocDown);
  }, [actionsMenuOpen]);

  const logPostView = async (source) => {
    try {
      await fetch('/api/feed/post-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: post?.id,
          source: source || 'open_post',
        }),
      });
    } catch {
      // ignore
    }
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

  // Profile view logger
  const logProfileView = async (source) => {
    try {
      await fetch('/api/profile/views', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: post.authorId,
          source: source || 'feed',
        }),
      });
    } catch {
      // ignore
    }
  };

  const handleViewProfile = async () => {
    if (!post?.authorId) return;
    setAvatarMenuOpen(false);
    await logProfileView('feed');

    if (post?.authorSlug) {
      router.push(withChrome(`/profile/${post.authorSlug}`));
      return;
    }

    router.push(withChrome(`/member-profile?userId=${post.authorId}`));
  };

  const handleConnect = async () => {
    if (!post?.authorId) return;
    if (connectStatus !== 'idle') return;

    setAvatarMenuOpen(false);
    setConnectStatus('requested');

    const result = await connectWith(post.authorId);

    if (!result?.ok) {
      setConnectStatus('idle');
      alert(
        result?.errorMessage ||
          'We could not send your connection request. Please try again.'
      );
      return;
    }

    if (result.alreadyConnected || result.status === 'connected') {
      setConnectStatus('connected');
      alert('You are already connected.');
      return;
    }

    setConnectStatus('requested');
    alert(
      result.alreadyRequested
        ? 'Connection request already sent.'
        : 'Connection request sent.'
    );
  };

  const handleMessage = async () => {
    if (!post?.authorId) return;
    setAvatarMenuOpen(false);

    try {
      const res = await fetch('/api/signal/start-or-get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId: post.authorId }),
      });

      if (!res.ok) {
        if (res.status === 403) {
          let payload = null;
          try {
            payload = await res.json();
          } catch {
            // ignore parse error, fall back to generic text
          }

          const role = payload?.role;
          const msg = payload?.message;

          if (role === 'COACH') {
            alert(
              msg ||
                'To respect the privacy of coaches, please send a connection request or explore their mentorship offerings before messaging.'
            );
          } else if (role === 'RECRUITER') {
            alert(
              msg ||
                'To keep DMs respectful, please send a connection request first. Once you are connected, you can open a private conversation from The Signal.'
            );
          } else {
            alert(
              msg ||
                'You need to be connected with this member before opening a private conversation.'
            );
          }

          return;
        }

        const text = await res.text();
        console.error('signal/start-or-get error (PostCard):', text);
        alert('We could not open this conversation. Please try again.');
        return;
      }

      const params = new URLSearchParams();
      params.set('toId', post.authorId);
      if (post.author) params.set('toName', post.author);

      router.push(withChrome(`/seeker/messages?${params.toString()}`));
    } catch (err) {
      console.error('messageUser error (PostCard):', err);
      alert('We could not open this conversation. Please try again.');
    }
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
        body: JSON.stringify({
          postId: post.id,
          targetUserId: post.authorId,
          reason: reason.trim(),
        }),
      });

      if (!res.ok) {
        console.error('report error:', await res.text());
        alert('We could not submit your report. Please try again.');
        return;
      }

      alert('Thank you. Your report has been submitted.');
    } catch (err) {
      console.error('report error:', err);
      alert('We could not submit your report. Please try again.');
    } finally {
      setActionsMenuOpen(false);
    }
  };

  const handleBlockAuthorAction = async () => {
    if (!post?.authorId) {
      alert('We could not determine which member to block.');
      return;
    }

    const reason = window.prompt(
      'Optional: Why are you blocking this member? (This helps moderation)'
    );
    const confirmed = window.confirm(
      'Block this member? You will no longer see their posts, and they will not be able to message you.'
    );
    if (!confirmed) return;

    try {
      const res = await fetch('/api/signal/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: post.authorId,
          reason: reason?.trim() || null,
        }),
      });

      if (!res.ok) {
        console.error('block error:', res.status, await res.text());
        alert('We could not block this member. Please try again.');
        return;
      }

      onBlockAuthor?.(post.authorId);
      alert('Member blocked. You will no longer see their posts.');
    } catch (err) {
      console.error('block error:', err);
      alert('We could not block this member. Please try again.');
    } finally {
      setActionsMenuOpen(false);
    }
  };

  // ✅ NEW: Share handler — native share sheet on mobile, clipboard on desktop
  const handleShare = async () => {
    if (!post?.id) return;
    const url = `${window.location.origin}/post-view?id=${post.id}`;
    const shareData = {
      title: `Post by ${post.author} on ForgeTomorrow`,
      text: post.body?.slice(0, 100) || '',
      url,
    };

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
      } catch {
        // user cancelled — no error needed
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(url);
        setCopyConfirm(true);
        setTimeout(() => setCopyConfirm(false), 2000);
      } catch {
        // last resort
        window.prompt('Copy this link:', url);
      }
    }
  };

  // ✅ NEW: Save/unsave toggle
  const handleSave = async () => {
    if (!post?.id || saveLoading) return;
    setSaveLoading(true);
    try {
      const res = await fetch('/api/feed/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setSaved(data.saved);
      }
    } catch (err) {
      console.error('save error:', err);
    } finally {
      setSaveLoading(false);
    }
  };

  // Reactions
  const selectedEmojis =
    post.reactions
      ?.filter(
        (r) =>
          r.users?.includes(currentUserId) ||
          r.userIds?.includes(currentUserId)
      )
      ?.map((r) => r.emoji) || [];

  const reactionCounts =
    post.reactions?.reduce((acc, r) => {
      acc[r.emoji] = r.count || 0;
      return acc;
    }, {}) || {};

  const likeEmoji = '👍';
  const likeCount = reactionCounts[likeEmoji] || 0;
  const likeSelected = selectedEmojis.includes(likeEmoji);

  const handleLike = () => {
    onReact?.(post.id, likeEmoji);
  };

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
        const data = await res.json();
        const names = (data.names || [])
          .map((n) => (n === currentUserName ? 'You' : n))
          .join(', ');
        setReactionUsers((prev) => ({ ...prev, [emoji]: names }));
      }
    } catch (err) {
      console.error('reaction hover error:', err);
    }
  };

  const getTooltipText = (emoji) =>
    reactionUsers[emoji]
      ? `${reactionUsers[emoji]} reacted with ${emoji}`
      : 'Loading…';

  const typeLabel = post.type === 'personal' ? 'Personal' : 'Business';

  const typePillClass =
    post.type === 'personal'
      ? 'bg-purple-50 border-purple-200 text-purple-700'
      : 'bg-slate-50 border-slate-200 text-slate-700';

  // ✅ NEW: attachments (minimal display support)
  const attachments = useMemo(() => {
    const arr = Array.isArray(post?.attachments) ? post.attachments : [];
    return arr
      .map((a) => ({
        type: String(a?.type || '').toLowerCase().trim(),
        url: String(a?.url || '').trim(),
        name: String(a?.name || '').trim(),
      }))
      .filter((a) => a.type && a.url);
  }, [post?.attachments]);

  const isSafeAttachmentUrl = (url) => {
    const u = String(url || '').trim();
    if (!u) return false;
    if (u.startsWith('/')) return true;
    if (u.startsWith('https://') || u.startsWith('http://')) return true;
    if (u.startsWith('data:image/')) return true;
    if (u.startsWith('data:video/')) return true;
    return false;
  };

  const safeAttachments = useMemo(() => {
    return attachments.filter((a) => isSafeAttachmentUrl(a.url));
  }, [attachments]);

  return (
    <div className="relative bg-white/90 backdrop-blur rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5 space-y-4 w-full">
      {/* Header row: author + meta + kebab */}
      <div className="flex items-start justify-between gap-3">
        {/* AUTHOR */}
        <div className="flex items-start gap-3 min-w-0">
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                if (!canTargetAuthor) return;
                setAvatarMenuOpen((v) => !v);
              }}
              onBlur={() => setAvatarMenuOpen(false)}
              className="shrink-0"
              style={{ cursor: canTargetAuthor ? 'pointer' : 'default' }}
              aria-label={canTargetAuthor ? 'Open member actions' : 'Author avatar'}
            >
              {post.authorAvatar ? (
                <img
                  src={post.authorAvatar}
                  alt={post.author}
                  className="w-10 h-10 rounded-full object-cover border border-gray-200"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 border border-gray-200">
                  {post.author?.charAt(0)?.toUpperCase()}
                </div>
              )}
            </button>

            {avatarMenuOpen && canTargetAuthor ? (
              <div
                className="absolute left-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-30 overflow-hidden"
                role="menu"
              >
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleViewProfile}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                  role="menuitem"
                >
                  View profile
                </button>

                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleConnect}
                  disabled={connectStatus !== 'idle'}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 disabled:text-gray-400 disabled:bg-white"
                  role="menuitem"
                >
                  {connectStatus === 'connected'
                    ? 'Connected'
                    : connectStatus === 'requested'
                    ? 'Connection requested'
                    : 'Connect'}
                </button>

                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleMessage}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                  role="menuitem"
                >
                  Message
                </button>
              </div>
            ) : null}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="font-semibold text-gray-900 truncate">{post.author}</div>

              <span
                className={`inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-full border ${typePillClass}`}
                title={typeLabel}
              >
                {typeLabel}
              </span>
            </div>

            <div className="text-xs text-gray-500 mt-0.5">
              {new Date(post.createdAt).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Actions (kebab) */}
        <div className="relative" ref={actionsMenuRef}>
          <button
            type="button"
            onClick={() => setActionsMenuOpen((v) => !v)}
            className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
            aria-label="Post actions"
            title="Actions"
          >
            ⋯
          </button>

          {actionsMenuOpen ? (
            <div
              className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-xl shadow-lg z-30 overflow-hidden"
              role="menu"
            >
              {!isOwner ? (
                <>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleReportPost}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                    role="menuitem"
                  >
                    Report
                  </button>

                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleBlockAuthorAction}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 text-red-700"
                    role="menuitem"
                  >
                    Block
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setActionsMenuOpen(false);
                    onDelete?.(post.id);
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 text-red-700"
                  role="menuitem"
                >
                  Delete
                </button>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* BODY */}
<div className="w-full text-left">
  <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-gray-800">
    {!expanded && post.body?.length > TRUNCATE_LIMIT
      ? post.body.slice(0, TRUNCATE_LIMIT).trimEnd() + '…'
      : post.body}
  </p>

  {post.body?.length > TRUNCATE_LIMIT && (
    <button
      type="button"
      onClick={() => setExpanded((v) => !v)}
      className="mt-1 text-sm font-semibold text-orange-500 hover:text-orange-600"
    >
      {expanded ? 'See less' : 'See more'}
    </button>
  )}
</div>

      {/* ATTACHMENTS (minimal, safe display) */}
      {safeAttachments.length > 0 ? (
        <div className="grid gap-3">
          {safeAttachments.map((a, idx) => {
            const label = a.name || `${a.type} attachment`;

            if (a.type === 'image') {
              return (
                <div
                  key={`${a.type}-${idx}`}
                  className="border border-gray-200 rounded-2xl overflow-hidden bg-white"
                >
                  <img
                    src={a.url}
                    alt={label}
                    className="w-full max-h-[420px] object-contain bg-white"
                    onError={(e) => {
                      try {
                        e.currentTarget.style.display = 'none';
                      } catch {}
                    }}
                  />
                </div>
              );
            }

            if (a.type === 'video') {
              return (
                <div
                  key={`${a.type}-${idx}`}
                  className="border border-gray-200 rounded-2xl overflow-hidden bg-white"
                >
                  <video
                    src={a.url}
                    controls
                    className="w-full max-h-[420px] object-contain bg-white"
                  />
                </div>
              );
            }

            if (a.type === 'link') {
              return (
                <a
                  key={`${a.type}-${idx}`}
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm text-blue-700 break-all"
                  title={a.url}
                >
                  🔗 <span className="font-semibold">{label}</span>
                </a>
              );
            }

            return null;
          })}
        </div>
      ) : null}

      {/* Action row */}
      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-700">
        <button
          type="button"
          onClick={handleLike}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition ${
            likeSelected
              ? 'bg-blue-50 border-blue-200 text-blue-800'
              : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
          }`}
          aria-label={likeSelected ? 'Unlike' : 'Like'}
          title={likeSelected ? 'Unlike' : 'Like'}
        >
          <span className="text-base">👍</span>
          <span className="text-xs font-semibold">{likeCount}</span>
          <span className="text-xs font-semibold">Like</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenComments?.(post)}
          className="px-3 py-1.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
        >
          💬 {visibleCommentsCount} {visibleCommentsCount === 1 ? 'comment' : 'comments'}
        </button>

        <button
          type="button"
          onClick={() => setShowEmojiBar((v) => !v)}
          className="px-3 py-1.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
          aria-label="React with emoji"
          title="React"
        >
          🙂 React
        </button>

        {/* ✅ NEW: Share button */}
        <button
          type="button"
          onClick={handleShare}
          className="px-3 py-1.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition"
          aria-label="Share post"
          title="Share"
        >
          {copyConfirm ? '✅ Copied!' : '↗ Share'}
        </button>

        {/* ✅ NEW: Save button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={saveLoading}
          className={`px-3 py-1.5 rounded-full border transition ${
            saved
              ? 'bg-orange-50 border-orange-300 text-orange-700'
              : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
          }`}
          aria-label={saved ? 'Unsave post' : 'Save post'}
          title={saved ? 'Saved' : 'Save for later'}
        >
          {saved ? '🔖 Saved' : '🔖 Save'}
        </button>
      </div>

      {/* Emoji bar */}
      {showEmojiBar ? (
        <div className="relative">
          <div className="mt-2">
            <QuickEmojiBar
              emojis={['🔥', '🎉', '👏', '❤️']}
              onPick={(emoji) => onReact?.(post.id, emoji)}
              selectedEmojis={selectedEmojis}
              reactionCounts={reactionCounts}
              onMouseEnter={(emoji) => {
                setHoveredEmoji(emoji);
                if (reactionCounts[emoji] > 0) fetchUsersForEmoji(emoji);
              }}
              onMouseLeave={() => setHoveredEmoji(null)}
            />
          </div>

          {hoveredEmoji && reactionCounts[hoveredEmoji] > 0 && (
            <div className="absolute bottom-full left-0 mb-3 bg-gray-900 text-white text-sm rounded-lg p-3 shadow-xl z-20 whitespace-nowrap">
              {getTooltipText(hoveredEmoji)}
            </div>
          )}
        </div>
      ) : null}

      {/* REPLY */}
      {showReplyInput ? (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
          <div className="flex gap-2">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply…"
              className="flex-1 border border-gray-200 rounded-xl p-3 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
              rows={2}
            />
            <button
              onClick={handleReplySubmit}
              disabled={!replyText.trim()}
              className="px-4 py-2 bg-[#ff7043] text-white rounded-xl font-semibold disabled:opacity-50"
            >
              Send
            </button>
          </div>

          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <span>Keep it constructive. Forge builds people.</span>
            <button
              type="button"
              onClick={() => {
                setShowReplyInput(false);
                setReplyText('');
              }}
              className="font-semibold text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowReplyInput(true)}
          className="text-sm font-semibold text-gray-700 hover:text-gray-900 inline-flex items-center gap-2"
        >
          <span aria-hidden="true">↩</span> Reply
        </button>
      )}
    </div>
  );
}