// components/feed/PostCard.js
import { useState } from 'react';
import QuickEmojiBar from './QuickEmojiBar';

export default function PostCard({
  post,
  onReply,
  onOpenComments,
  onDelete,
  currentUserId,
}) {
  const [reply, setReply] = useState('');
  const [reported, setReported] = useState(false);
  const [reportMessage, setReportMessage] = useState('');

  const isOwner = currentUserId && post.authorId === currentUserId;
  const hasComments = (post.comments?.length || 0) > 0;
  const previewCount = 2;

  const sendReply = () => {
    const t = reply.trim();
    if (!t) return;
    onReply?.(post.id, t);
    setReply('');
  };

  const addEmoji = (emoji) => {
    setReply((prev) => (prev ? `${prev} ${emoji}` : emoji));
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

  return (
    <article
      id={`post-${post.id}`}
      className="bg-white rounded-lg shadow p-4"
    >
      {/* header */}
      <header className="mb-2">
        <div className="font-semibold">{post.author}</div>
        <div className="text-xs text-gray-500">
          {createdAtLabel}
          {' • '}
          {post.type === 'personal' ? 'Personal' : 'Business'}
        </div>
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
      <div className="text-sm text-gray-600 mb-3 flex items-center gap-4">
        <span>👍 {post.likes ?? 0}</span>
        <button
          type="button"
          onClick={() => onOpenComments?.(post)}
          className="hover:underline"
          title="View comments"
        >
          💬 {post.comments.length} Comments
        </button>
      </div>

      {/* comments preview */}
      {hasComments && (
        <div className="space-y-2 mb-2">
          {post.comments.slice(0, previewCount).map((c, i) => (
            <div key={i} className="text-sm">
              <span className="font-medium">{c.by}:</span> {c.text}
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

        {/* emoji bar just injects emoji into reply input */}
        <QuickEmojiBar onPick={addEmoji} />
      </div>
    </article>
  );
}
