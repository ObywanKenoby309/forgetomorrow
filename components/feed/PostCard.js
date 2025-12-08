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
}) {
  const router = useRouter();

  const [reply, setReply] = useState('');
  const [reported, setReported] = useState(false);
  const [reportMessage, setReportMessage] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const chrome = String(router.query.chrome || '').toLowerCase();
  const withChrome = (path) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

  const isOwner = currentUserId && post.authorId === currentUserId;
  const hasComments = (post.comments?.length || 0) > 0;
  const previewCount = 2;

  const sendReply = () => {
    const t = reply.trim();
    if (!t) return;
    onReply?.(post.id, t);
    setReply('');
  };

  const handleDeleteClick = () => {
    if (!onDelete) return;
    onDelete(post.id);
  };

  const handleReportClick = async () => {
    if (reported) return;

    try {
      const res = await fetch('/api/feed/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id }),
      });

      if (!res.ok) {
        console.error('Feed REPORT failed:', await res.text());
        setReportMessage(
          "We couldn't submit your report. Please try again or contact support."
        );
        return;
      }

      setReported(true);
      setReportMessage(
        'Your report has been submitted. Our team will review this post.'
      );
    } catch (err) {
      console.error('Feed REPORT error:', err);
      setReportMessage(
        "We couldn't submit your report. Please try again or contact support."
      );
    }
  };

  const createdAtLabel = (() => {
    try {
      const d = new Date(post.createdAt);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  })();

  // Aggregate reactions like 🔥 2, ❤️ 1
  const reactionCounts = (() => {
    const counts = {};
    if (Array.isArray(post.reactions)) {
      for (const r of post.reactions) {
        if (!r || !r.emoji) continue;
        counts[r.emoji] = (counts[r.emoji] || 0) + 1;
      }
    }
    return counts;
  })();

  const hasReactions = Object.keys(reactionCounts).length > 0;

  const authorId = post.authorId || '';
  const authorName =
    post.author ||
    post.authorName ||
    [post.authorFirstName, post.authorLastName].filter(Boolean).join(' ') ||
    'Member';

  const goToProfile = () => {
    if (!authorId) return;
    const params = new URLSearchParams();
    params.set('userId', authorId);

    setShowProfileMenu(false);
    router.push(withChrome(`/member-profile?${params.toString()}`));
  };

  const goToMessages = () => {
    if (!authorId) return;
    const params = new URLSearchParams();
    params.set('toId', authorId);
    if (authorName) params.set('toName', authorName);

    setShowProfileMenu(false);
    // 🔹 Canonical DM inbox = The Signal at /seeker/messages
    router.push(withChrome(`/seeker/messages?${params.toString()}`));
  };

  const goToConnect = () => {
    if (!authorId) return;
    const params = new URLSearchParams();
    params.set('toId', authorId);
    if (authorName) params.set('toName', authorName);

    setShowProfileMenu(false);
    // For now this goes to Contact Center; we’ll wire direct request UX on the
    // Member Profile button (primary place for “Connect”).
    router.push(withChrome(`/seeker/contact-center?${params.toString()}`));
  };

  return (
    <article
      id={`post-${post.id}`}
      className="bg-white rounded-lg shadow p-4 relative"
    >
      {/* header with avatar + profile menu trigger */}
      <header className="mb-2 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setShowProfileMenu((v) => !v)}
          className="flex items-center gap-3 text-left"
        >
          {post.authorAvatar ? (
            <img
              src={post.authorAvatar}
              alt={authorName}
              className="w-9 h-9 rounded-full object-cover bg-gray-200 flex-shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500 flex-shrink-0">
              {authorName?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
          <div>
            <div className="font-semibold">{authorName}</div>
            <div className="text-xs text-gray-500">
              {createdAtLabel}
              {' • '}
              {post.type === 'personal' ? 'Personal' : 'Business'}
            </div>
          </div>
        </button>

        {/* inline profile actions menu */}
        {showProfileMenu && (
          <div className="absolute top-12 left-4 z-20 bg-white border rounded-lg shadow-lg text-sm w-52">
            <div className="px-3 py-2 border-b font-semibold">
              {authorName}
            </div>
            <button
              type="button"
              className="w-full text-left px-3 py-2 hover:bg-gray-50"
              onClick={goToProfile}
            >
              View profile
            </button>
            <button
              type="button"
              className="w-full text-left px-3 py-2 hover:bg-gray-50"
              onClick={goToMessages}
            >
              Message
            </button>
            <button
              type="button"
              className="w-full text-left px-3 py-2 hover:bg-gray-50"
              onClick={goToConnect}
            >
              Connect
            </button>
          </div>
        )}
      </header>

      {/* body text */}
      <p className="mb-3 whitespace-pre-wrap">{post.body}</p>

      {/* attachments */}
      {Array.isArray(post.attachments) && post.attachments.length > 0 && (
        <div className="mb-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {post.attachments.map((a, idx) => (
            <div
              key={idx}
              className="relative border rounded-md p-2 bg-gray-50 flex flex-col gap-2"
            >
              {a.type === 'image' && (
                <img
                  src={a.url}
                  alt={a.name || 'image'}
                  className="w-full max-h-96 object-contain rounded"
                />
              )}
              {a.type === 'video' && (
                <video
                  src={a.url}
                  controls
                  className="w-full max-h-96 object-contain rounded"
                />
              )}
              {a.type === 'link' && (
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 underline break-all"
                >
                  {a.url}
                </a>
              )}
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span className="truncate">{a.name}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* meta row */}
      <div className="text-sm text-gray-600 mb-2 flex items-center gap-4">
        <span>👍 {post.likes ?? 0}</span>
        <button
          type="button"
          onClick={() => onOpenComments?.(post)}
          className="hover:underline"
          title="View comments"
        >
          💬 {post.comments?.length || 0} Comments
        </button>
      </div>

      {/* reactions row (emoji chips) */}
      {hasReactions && (
        <div className="text-sm text-gray-600 mb-3 flex flex-wrap gap-2">
          {Object.entries(reactionCounts).map(([emoji, count]) => (
            <span
              key={emoji}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100"
            >
              <span>{emoji}</span>
              <span className="text-xs text-gray-700">{count}</span>
            </span>
          ))}
        </div>
      )}

      {/* comments preview */}
      {hasComments && (
        <div className="space-y-2 mb-2">
          {post.comments.slice(0, previewCount).map((c, i) => (
            <div key={i} className="text-sm flex items-start gap-2">
              {c.avatarUrl ? (
                <img
                  src={c.avatarUrl}
                  alt={c.by || 'User'}
                  className="w-6 h-6 rounded-full object-cover bg-gray-200 mt-0.5 flex-shrink-0"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] text-gray-500 mt-0.5 flex-shrink-0">
                  {c.by?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
              <div>
                <span className="font-medium">{c.by}:</span> {c.text}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* "view all" link */}
      {post.comments.length > previewCount && (
        <button
          type="button"
          onClick={() => onOpenComments?.(post)}
          className="text-xs text-gray-600 hover:underline mb-3"
        >
          View all {post.comments.length} comments
        </button>
      )}

      {/* reply row + emoji bar + delete/report */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2 items-center">
          <input
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Write a reply…"
            className="flex-1 border rounded-md px-3 py-2 min-w-[150px]"
          />
          <button
            type="button"
            onClick={sendReply}
            className="px-3 py-2 rounded-md bg-[#ff8a65] text-white font-semibold disabled:opacity-50"
            disabled={!reply.trim()}
          >
            Reply
          </button>

          {/* OWNER: Delete button */}
          {isOwner && (
            <button
              type="button"
              onClick={handleDeleteClick}
              className="px-3 py-2 rounded-md bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
            >
              Delete
            </button>
          )}

          {/* NON-OWNER: red Report button */}
          {!isOwner && (
            <button
              type="button"
              onClick={handleReportClick}
              className={`px-3 py-2 rounded-md text-sm font-semibold ${
                reported
                  ? 'bg-red-200 text-red-800 cursor-default'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
              disabled={reported}
            >
              {reported ? 'Reported' : 'Report'}
            </button>
          )}
        </div>

        {/* inline confirmation/error for report */}
        {reportMessage && (
          <div className="text-xs text-gray-600 mt-1">{reportMessage}</div>
        )}

        {/* Emoji bar */}
        <QuickEmojiBar
          onPick={(emoji) => {
            if (!emoji) return;
            onReact?.(post.id, emoji);
          }}
        />
      </div>
    </article>
  );
}
