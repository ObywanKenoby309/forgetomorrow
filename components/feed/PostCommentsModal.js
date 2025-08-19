// components/feed/PostCommentsModal.jsx
import { useState } from 'react';
import QuickEmojiBar from './QuickEmojiBar';

export default function PostCommentsModal({ post, onClose, onReply }) {
  const [text, setText] = useState('');

  const send = () => {
    const t = text.trim();
    if (!t) return;
    onReply?.(post.id, t);
    setText('');
  };

  const addEmoji = (emoji) => {
    setText((prev) => (prev ? `${prev} ${emoji}` : emoji));
  };

  if (!post) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 relative"
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
          aria-label="Close"
        >
          ✕
        </button>

        <header className="mb-4">
          <div className="font-semibold">{post.author}</div>
          <div className="text-xs text-gray-500">
            {new Date(post.createdAt).toLocaleString()} • {post.type === 'business' ? 'Business' : 'Personal'}
          </div>
        </header>

        <p className="mb-4 whitespace-pre-wrap">{post.body}</p>

        <div className="border-t pt-4 space-y-3 max-h-[50vh] overflow-y-auto">
          {post.comments.length === 0 ? (
            <div className="text-sm text-gray-500">No comments yet—be the first!</div>
          ) : (
            post.comments.map((c, i) => (
              <div key={i}>
                <div className="text-sm">
                  <span className="font-medium">{c.by}:</span> {c.text}
                </div>
                {c.at && (
                  <div className="text-xs text-gray-400">{new Date(c.at).toLocaleString()}</div>
                )}
              </div>
            ))
          )}
        </div>

        {/* composer + emoji bar */}
        <div className="mt-4 space-y-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            className="w-full border rounded-md p-3"
            placeholder="Write your comment…"
          />
          <QuickEmojiBar onPick={addEmoji} />
          <div className="flex justify-end">
            <button
              onClick={send}
              disabled={!text.trim()}
              className="px-4 py-2 rounded-md bg-[#ff8a65] text-white font-semibold disabled:opacity-50"
            >
              Comment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
