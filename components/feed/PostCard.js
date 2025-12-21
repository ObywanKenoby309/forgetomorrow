// components/feed/PostCard.js
import { useState } from 'react';
import QuickEmojiBar from './QuickEmojiBar';
export default function PostCard({
  post,
  onReply,
  onOpenComments,
  onDelete,
  onReact,
  currentUserId,
  currentUserName,
}) {
  // ✅ CRITICAL FIX 1: Early return if post is missing/invalid (happens during static prerender)
  if (!post) return null;

  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [hoveredEmoji, setHoveredEmoji] = useState(null);
  const [reactionUsers, setReactionUsers] = useState({});
  
  // ✅ CRITICAL FIX 2: Safe isOwner check – prevents crash even if authorId missing
  const isOwner = post.authorId && currentUserId ? post.authorId === currentUserId : false;
  
  // ✅ NEW: local hide so block is immediate without refresh
  const [isHidden, setIsHidden] = useState(false);
  if (isHidden) return null;
  
  const handleReplySubmit = () => {
    if (!replyText.trim()) return;
    onReply(post.id, replyText.trim());
    setReplyText('');
    setShowReplyInput(false);
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
  // BLOCK AUTHOR (non-OP only) — no redirect, immediate hide
  // ─────────────────────────────────────────────────────────────
  const handleBlockAuthor = async () => {
    if (!post?.authorId) {
      alert('We could not determine which member to block.');
      return;
    }
    const confirmed = window.confirm(
      'Block this member? You will no longer see their posts, and they will not be able to message you.'
    );
    if (!confirmed) return;
    try {
      const res = await fetch('/api/signal/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: post.authorId }),
      });
      if (!res.ok) {
        console.error('block error:', res.status, await res.text());
        alert('We could not block this member. Please try again.');
        return;
      }
      setIsHidden(true);
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
    <div className="relative bg-white rounded-lg shadow p-5 space-y-4">
      {/* TOP-RIGHT ACTIONS (NON-OP ONLY) */}
      {!isOwner && (
        <div className="absolute top-3 right-3 flex items-center gap-2">
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
        </div>
      )}
      {/* AUTHOR */}
      <div className="flex items-start gap-3">
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
          <span className="bg-gray-100 px-2.5 py-1 rounded-full">
            {post.likes} reactions
          </span>
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
        <button
          onClick={() => setShowReplyInput(true)}
          className="text-sm text-gray-600 hover:underline"
        >
          Reply
        </button>
      )}
      {/* BOTTOM-RIGHT DELETE (OP ONLY) */}
      {isOwner && (
        <div className="flex justify-end">
          <button
            onClick={() => onDelete(post.id)}
            className="text-xs px-2 py-1 border border-red-300 rounded-md text-red-700 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}