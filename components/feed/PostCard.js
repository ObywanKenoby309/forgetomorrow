// components/feed/PostCard.js
import { useState } from 'react';
import QuickEmojiBar from './QuickEmojiBar';

export default function PostCard({ post, onReply, onOpenComments }) {
  const [reply, setReply] = useState('');

  const send = () => {
    const t = reply.trim();
    if (!t) return;
    onReply?.(post.id, t);
    setReply('');
  };

  const addEmoji = (emoji) => {
    setReply((prev) => (prev ? `${prev} ${emoji}` : emoji));
  };

  const hasComments = (post.comments?.length || 0) > 0;
  const previewCount = 2;

  return (
    <article className="bg-white rounded-lg shadow p-4">
      {/* header */}
      <header className="mb-2">
        <div className="font-semibold">{post.author}</div>
        <div className="text-xs text-gray-500">
          {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {' • '}
          {post.type === 'business' ? 'Business' : 'Personal'}
        </div>
      </header>

      {/* body */}
      <p className="mb-3 whitespace-pre-wrap">{post.body}</p>

      {/* meta row with counts + open comments */}
      <div className="text-sm text-gray-600 mb-3 flex items-center gap-4">
        <span>👍 {post.likes}</span>
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

      {/* view all comments link (only if more than previewCount) */}
      {post.comments.length > previewCount && (
        <button
          type="button"
          onClick={() => onOpenComments?.(post)}
          className="text-xs text-gray-600 hover:underline mb-3"
        >
          View all {post.comments.length} comments
        </button>
      )}

      {/* reply row + emoji bar */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Write a reply…"
            className="flex-1 border rounded-md px-3 py-2"
          />
          <button
            onClick={send}
            className="px-3 py-2 rounded-md bg-[#ff8a65] text-white font-semibold disabled:opacity-50"
            disabled={!reply.trim()}
          >
            Reply
          </button>
        </div>

        <QuickEmojiBar onPick={addEmoji} />
      </div>
    </article>
  );
}
