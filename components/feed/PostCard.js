// components/feed/PostCard.js
import { useState } from 'react';
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
  onBlockAuthor, // ✅ NEW: callback to hide all posts from this author
}) {
  // ✅ CRITICAL FIX 1: Early return if post is missing/invalid (happens during static prerender)
  if (!post) return null;

  const router = useRouter();
  const { connectWith } = useConnect();

  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [hoveredEmoji, setHoveredEmoji] = useState(null);
  const [reactionUsers, setReactionUsers] = useState({});

  // ✅ avatar action popover
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);

  // ✅ connect state (optimistic UI)
  const [connectStatus, setConnectStatus] = useState('idle'); // idle | requested | connected

  // ✅ NEW: Desktop-only optional emoji bar
  const [showEmojiBar, setShowEmojiBar] = useState(false);

  // ✅ CRITICAL FIX 2: Safe isOwner check
  const isOwner =
    post.authorId && currentUserId ? post.authorId === currentUserId : false;
  const canTargetAuthor = Boolean(post?.authorId) && !isOwner;

  const chrome = String(router.query?.chrome || '').toLowerCase();
  const withChrome = (path) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

  // ─────────────────────────────────────────────────────────────
  // ✅ FeedPostView tracking (best-effort; never blocks UI)
  // - "open_post" when user opens full post reader
  // - "reply_submit" when user submits a reply/comment
  // ─────────────────────────────────────────────────────────────
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
      // ignore (best-effort)
    }
  };

  // ✅ Open full post reader (this is the "view")
  const handleOpenPost = async () => {
    if (!post?.id) return;
    logPostView('open_post');
    router.push(withChrome(`/post-view?id=${post.id}`));
  };

  const handleReplySubmit = async () => {
    if (!replyText.trim()) return;

    // ✅ Reply submit counts as a view
    logPostView('reply_submit');

    onReply(post.id, replyText.trim());
    setReplyText('');
    setShowReplyInput(false);
  };

  // ─────────────────────────────────────────────────────────────
  // Avatar menu actions (View / Connect / Message) + log profile view
  // ─────────────────────────────────────────────────────────────
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

  // ✅ Connect sends request (no navigation) + UI feedback
  const handleConnect = async () => {
    if (!post?.authorId) return;
    if (connectStatus !== 'idle') return;

    setAvatarMenuOpen(false);
    setConnectStatus('requested'); // optimistic

    const result = await connectWith(post.authorId);

    if (!result?.ok) {
      setConnectStatus('idle');
      alert(
        result?.errorMessage ||
          'We could not send your connection request. Please try again.'
      );
      return;
    }

    // If already connected
    if (result.alreadyConnected || result.status === 'connected') {
      setConnectStatus('connected');
      alert('You are already connected.');
      return;
    }

    // If already requested OR newly requested
    setConnectStatus('requested');
    alert(
      result.alreadyRequested
        ? 'Connection request already sent.'
        : 'Connection request sent.'
    );
  };

  // ✅ Message → The Signal, pre-loaded to message
  const handleMessage = () => {
    if (!post?.authorId) return;
    setAvatarMenuOpen(false);

    const params = new URLSearchParams();
    params.set('userId', post.authorId);
    params.set('action', 'message');
    router.push(withChrome(`/seeker/messages?${params.toString()}`));
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
  // BLOCK AUTHOR (non-OP only)
  // ─────────────────────────────────────────────────────────────
  const handleBlockAuthor = async () => {
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
    }
  };

  // ─────────────────────────────────────────────────────────────
  // REACTIONS
  // ─────────────────────────────────────────────────────────────
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

  // ✅ Dedicated Like (thumbs up)
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

  return (
    <div className="relative bg-white rounded-lg shadow p-5 space-y-4 w-full">
      {/* TOP-RIGHT ACTIONS */}
      <div className="absolute top-3 right-3 flex items-center gap-2">
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
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
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

        <div>
          <div className="font-semibold">{post.author}</div>
          <div className="text-xs text-gray-500">
            {new Date(post.createdAt).toLocaleString()} • {post.type}
          </div>
        </div>
      </div>

      {/* BODY (click to open full post = view) */}
      <button
        type="button"
        onClick={handleOpenPost}
        className="w-full text-left"
        aria-label="Open post"
      >
        <p className="whitespace-pre-wrap">{post.body}</p>
      </button>

      {/* REACTIONS (Desktop only, optional via Emoji button; 👍 removed here because Like is dedicated) */}
      <div className="relative hidden md:block">
        <div className="flex items-center justify-between">
          <div />
          <button
            type="button"
            onClick={() => setShowEmojiBar((v) => !v)}
            className="text-xs px-2 py-1 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            aria-label="Toggle emoji reactions"
          >
            Emoji
          </button>
        </div>

        {showEmojiBar ? (
          <div className="mt-2">
            <QuickEmojiBar
              emojis={['🔥', '🎉', '👏', '❤️']}
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
        ) : null}
      </div>

      {/* SUMMARY */}
      <div className="flex items-center gap-4 text-sm text-gray-600">
        {/* ✅ Dedicated Like (all devices) */}
        <button
          type="button"
          onClick={handleLike}
          className={`flex items-center gap-2 px-2.5 py-1 rounded-full border transition ${
            likeSelected
              ? 'bg-blue-100 border-blue-300 text-blue-800'
              : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
          }`}
          aria-label={likeSelected ? 'Unlike' : 'Like'}
          title={likeSelected ? 'Unlike' : 'Like'}
        >
          <span className="text-base">👍</span>
          <span className="text-xs font-semibold">{likeCount}</span>
          <span className="text-xs font-semibold">Like</span>
        </button>

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
        <button
          onClick={() => setShowReplyInput(true)}
          className="text-sm text-gray-600 hover:underline"
        >
          Reply
        </button>
      )}
    </div>
  );
}
