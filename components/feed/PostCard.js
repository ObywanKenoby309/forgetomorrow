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
  onBlockAuthor,
}) {
  if (!post) return null;

  const router = useRouter();
  const { connectWith } = useConnect();

  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [hoveredEmoji, setHoveredEmoji] = useState(null);
  const [reactionUsers, setReactionUsers] = useState({});
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);

  // ✅ NEW: local connection request state
  const [connectionState, setConnectionState] = useState(null);
  // null | 'requested' | 'connected'

  const isOwner =
    post.authorId && currentUserId
      ? post.authorId === currentUserId
      : false;

  const canTargetAuthor = Boolean(post?.authorId) && !isOwner;

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
    } catch {}
  };

  const handleViewProfile = async () => {
    if (!post?.authorId) return;
    setAvatarMenuOpen(false);
    logProfileView('feed');

    const params = new URLSearchParams();
    params.set('userId', post.authorId);
    router.push(withChrome(`/member-profile?${params.toString()}`));
  };

  // ✅ FIXED: Connect uses useConnect (no navigation)
  const handleConnect = async () => {
    if (!post?.authorId) return;
    setAvatarMenuOpen(false);

    const result = await connectWith(post.authorId);

    if (!result.ok) {
      alert(result.errorMessage || 'Could not send request.');
      return;
    }

    if (result.alreadyConnected) {
      setConnectionState('connected');
      return;
    }

    if (result.alreadyRequested || result.status === 'pending') {
      setConnectionState('requested');
      return;
    }

    setConnectionState('requested');
  };

  const handleMessage = () => {
    if (!post?.authorId) return;
    setAvatarMenuOpen(false);

    const params = new URLSearchParams();
    params.set('userId', post.authorId);
    params.set('action', 'message');
    router.push(withChrome(`/seeker/messages?${params.toString()}`));
  };

  const handleReplySubmit = () => {
    if (!replyText.trim()) return;
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
        body: JSON.stringify({
          postId: post.id,
          targetUserId: post.authorId,
          reason: reason.trim(),
        }),
      });

      if (!res.ok) {
        alert('We could not submit your report.');
        return;
      }

      alert('Thank you. Your report has been submitted.');
    } catch {
      alert('We could not submit your report.');
    }
  };

  const handleBlockAuthor = async () => {
    if (!post?.authorId) return;

    const confirmed = window.confirm(
      'Block this member? You will no longer see their posts.'
    );
    if (!confirmed) return;

    try {
      const res = await fetch('/api/signal/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: post.authorId }),
      });

      if (!res.ok) {
        alert('We could not block this member.');
        return;
      }

      onBlockAuthor?.(post.authorId);
      alert('Member blocked.');
    } catch {
      alert('We could not block this member.');
    }
  };

  const selectedEmojis =
    post.reactions
      ?.filter((r) => r.userIds?.includes(currentUserId))
      ?.map((r) => r.emoji) || [];

  const reactionCounts =
    post.reactions?.reduce((acc, r) => {
      acc[r.emoji] = r.count || 0;
      return acc;
    }, {}) || {};

  return (
    <div className="relative bg-white rounded-lg shadow p-5 space-y-4 w-full">
      {/* Top actions */}
      <div className="absolute top-3 right-3 flex items-center gap-2">
        {!isOwner && (
          <>
            <button
              onClick={handleReportPost}
              className="text-xs px-2 py-1 border rounded-md"
            >
              Report
            </button>
            <button
              onClick={handleBlockAuthor}
              className="text-xs px-2 py-1 border border-red-300 text-red-700 rounded-md"
            >
              Block
            </button>
          </>
        )}
        {isOwner && (
          <button
            onClick={() => onDelete(post.id)}
            className="text-xs px-2 py-1 border border-red-300 text-red-700 rounded-md"
          >
            Delete
          </button>
        )}
      </div>

      {/* Author */}
      <div className="flex items-start gap-3">
        <div className="relative">
          <button
            type="button"
            onClick={() => canTargetAuthor && setAvatarMenuOpen((v) => !v)}
            onBlur={() => setAvatarMenuOpen(false)}
          >
            {post.authorAvatar ? (
              <img
                src={post.authorAvatar}
                alt={post.author}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                {post.author?.charAt(0)?.toUpperCase()}
              </div>
            )}
          </button>

          {avatarMenuOpen && canTargetAuthor && (
            <div className="absolute left-0 mt-2 w-44 bg-white border rounded-lg shadow-lg z-30">
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleViewProfile}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
              >
                View profile
              </button>

              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleConnect}
                disabled={connectionState === 'requested'}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
              >
                {connectionState === 'connected'
                  ? 'Connected'
                  : connectionState === 'requested'
                  ? 'Connection Requested'
                  : 'Connect'}
              </button>

              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleMessage}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
              >
                Message
              </button>
            </div>
          )}
        </div>

        <div>
          <div className="font-semibold">{post.author}</div>
          <div className="text-xs text-gray-500">
            {new Date(post.createdAt).toLocaleString()} • {post.type}
          </div>
        </div>
      </div>

      <p className="whitespace-pre-wrap">{post.body}</p>

      <QuickEmojiBar
        onPick={(emoji) => onReact(post.id, emoji)}
        selectedEmojis={selectedEmojis}
        reactionCounts={reactionCounts}
      />

      <div className="text-sm text-gray-600 flex gap-4">
        <button onClick={() => onOpenComments(post)} className="hover:underline">
          {post.comments.length} comments
        </button>
      </div>

      {showReplyInput ? (
        <div className="flex gap-2">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={2}
            className="flex-1 border rounded p-2"
          />
          <button
            onClick={handleReplySubmit}
            className="px-4 py-2 bg-orange-500 text-white rounded"
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
