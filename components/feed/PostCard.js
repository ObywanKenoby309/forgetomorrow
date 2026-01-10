// components/feed/PostCard.js
import { useState } from 'react';
import { useRouter } from 'next/router';
import QuickEmojiBar from './QuickEmojiBar';

export default function PostCard({
  post,
  onReply,
  onOpenComments,
  onDelete,
  onReact,
  currentUserId,
  currentUserName,
  onBlockAuthor, // ✅ NEW: callback to hide all posts from this author
}) {
  // ✅ CRITICAL FIX 1: Early return if post is missing/invalid (happens during static prerender)
  if (!post) return null;

  const router = useRouter();

  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [hoveredEmoji, setHoveredEmoji] = useState(null);
  const [reactionUsers, setReactionUsers] = useState({});

  // ✅ NEW (minimal): avatar action popover
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);

  // ✅ CRITICAL FIX 2: Safe isOwner check
  const isOwner = post.authorId && currentUserId ? post.authorId === currentUserId : false;
  const canTargetAuthor = Boolean(post?.authorId) && !isOwner;

  const handleReplySubmit = () => {
    if (!replyText.trim()) return;
    onReply(post.id, replyText.trim());
    setReplyText('');
    setShowReplyInput(false);
  };

  // ─────────────────────────────────────────────────────────────
  // Avatar menu actions (View / Connect / Message) + log view
  // ─────────────────────────────────────────────────────────────
  const chrome = String(router.query?.chrome || '').toLowerCase();
  const withChrome = (path) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

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
      // ignore (best-effort)
    }
  };

  const handleViewProfile = async () => {
    if (!post?.authorId) return;
    setAvatarMenuOpen(false);

    logProfileView('feed');

    const params = new URLSearchParams();
    params.set('userId', post.authorId);
    router.push(withChrome(`/member-profile?${params.toString()}`));
  };

  const handleConnect = () => {
    if (!post?.authorId) return;
    setAvatarMenuOpen(false);

    const params = new URLSearchParams();
    params.set('userId', post.authorId);
    router.push(withChrome(`/seeker/contact-center?${params.toString()}`));
  };

  const handleMessage = () => {
    if (!post?.authorId) return;
    setAvatarMenuOpen(false);

    const params = new URLSearchParams();
    params.set('tab', 'messages');
    params.set('userId', post.authorId);
    router.push(withChrome(`/seeker/contact-center?${params.toString()}`));
  };

  // ─────────────────────────────────────────────────────────────
  // REPORT POST (non-OP only) — mirrors Signal behavior
  // ─────────────────────────────────────────────────────────────
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
    }
  };

  // ─────────────────────────────────────────────────────────────
  // BLOCK AUTHOR (non-OP only) — prompt for reason, send to API, optimistic hide
  // ─────────────────────────────────────────────────────────────
  const handleBlockAuthor = async () => {
    if (!post?.authorId) {
      alert('We could not determine which member to block.');
      return;
    }

    const reason = window.prompt('Optional: Why are you blocking this member? (This helps moderation)');
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
          reason: reason?.trim() || null, // ✅ Send reason if provided
        }),
      });

      if (!res.ok) {
        console.error('block error:', res.status, await res.text());
        alert('We could not block this member. Please try again.');
        return;
      }

      // ✅ Optimistic hide + trigger Feed reload
      onBlockAuthor?.(post.authorId);
      alert('Member blocked. You will no longer see their posts.');
    } catch (err) {
      console.error('block error:', err);
      alert('We could not block this member. Please try again.');
    }
  };

  // ─────────────────────────────────────────────────────────────
  // REACTIONS
  // ─────────────────────────────────────────────────────────────
  const selectedEmojis =
    post.reactions
      ?.filter((r) => r.users?.includes(currentUserId) || r.userIds?.includes(currentUserId))
      ?.map((r) => r.emoji) || [];

  const reactionCounts =
    post.reactions?.reduce((acc, r) => {
      acc[r.emoji] = r.count || 0;
      return acc;
    }, {}) || {};

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
        const names = (data.names || []).map((n) => (n === currentUserName ? 'You' : n)).join(', ');
        setReactionUsers((prev) => ({ ...prev, [emoji]: names }));
      }
    } catch (err) {
      console.error('reaction hover error:', err);
    }
  };

  const getTooltipText = (emoji) =>
    reactionUsers[emoji] ? `${reactionUsers[emoji]} reacted with ${emoji}` : 'Loading…';

  return (
    // ✅ CHANGED: w-full so card always fills list width
    <div className="relative bg-white rounded-lg shadow p-5 space-y-4 w-full">
      {/* TOP-RIGHT ACTIONS — unified style */}
      <div className="absolute top-3 right-3 flex items-center gap-2">
        {/* Non-OP: Report + Block */}
        {!isOwner && (
          <>
            <button
              onClick={handleReportPost}
              className="text-xs px-2 py-1 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Report
            </button>
            <button
              onClick={handleBlockAuthor}
              className="text-xs px-2 py-1 border border-red-300 rounded-md text-red-700 hover:bg-red-50"
            >
              Block
            </button>
          </>
        )}

        {/* OP: Delete only, same style as Block */}
        {isOwner && (
          <button
            onClick={() => onDelete(post.id)}
            className="text-xs px-2 py-1 border border-red-300 rounded-md text-red-700 hover:bg-red-50"
          >
            Delete
          </button>
        )}
      </div>

      {/* AUTHOR */}
      <div className="flex items-start gap-3">
        {/* Avatar trigger (popover menu) */}
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
              <img src={post.authorAvatar} alt={post.author} className="w-10 h-10 rounded-full" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                {post.author?.charAt(0)?.toUpperCase()}
              </div>
            )}
          </button>

          {avatarMenuOpen && canTargetAuthor ? (
            <div
              className="absolute left-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-30 overflow-hidden"
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
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                role="menuitem"
              >
                Connect
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

        <div>
          <div className="font-semibold">{post.author}</div>
          <div className="text-xs text-gray-500">
            {new Date(post.createdAt).toLocaleString()} • {post.type}
          </div>
        </div>
      </div>

      {/* BODY */}
      <p className="whitespace-pre-wrap">{post.body}</p>

      {/* REACTIONS */}
      <div className="relative">
        <QuickEmojiBar
          onPick={(emoji) => onReact(post.id, emoji)}
          selectedEmojis={selectedEmojis}
          reactionCounts={reactionCounts}
          onMouseEnter={(emoji) => {
            setHoveredEmoji(emoji);
            if (reactionCounts[emoji] > 0) fetchUsersForEmoji(emoji);
          }}
          onMouseLeave={() => setHoveredEmoji(null)}
        />

        {hoveredEmoji && reactionCounts[hoveredEmoji] > 0 && (
          <div className="absolute bottom-full left-0 mb-3 bg-gray-900 text-white text-sm rounded-lg p-3 shadow-xl z-20 whitespace-nowrap">
            {getTooltipText(hoveredEmoji)}
          </div>
        )}
      </div>

      {/* SUMMARY */}
      <div className="flex items-center gap-4 text-sm text-gray-600">
        {post.likes > 0 && (
          <span className="bg-gray-100 px-2.5 py-1 rounded-full">{post.likes} reactions</span>
        )}
        <button onClick={() => onOpenComments(post)} className="hover:underline">
          {post.comments.length} comments
        </button>
      </div>

      {/* REPLY */}
      {showReplyInput ? (
        <div className="flex gap-2">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply…"
            className="flex-1 border rounded p-2"
            rows={2}
          />
          <button
            onClick={handleReplySubmit}
            disabled={!replyText.trim()}
            className="px-4 py-2 bg-orange-500 text-white rounded disabled:opacity-50"
          >
            Send
          </button>
        </div>
      ) : (
        <button onClick={() => setShowReplyInput(true)} className="text-sm text-gray-600 hover:underline">
          Reply
        </button>
      )}
    </div>
  );
}
