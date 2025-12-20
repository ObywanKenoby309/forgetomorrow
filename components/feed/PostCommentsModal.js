// components/feed/PostCommentsModal.js
import { useState } from 'react';
import QuickEmojiBar from './QuickEmojiBar';

export default function PostCommentsModal({ post, onClose, onReply }) {
  const [text, setText] = useState('');

  if (!post) return null;

  const send = () => {
    const t = text.trim();
    if (!t) return;
    onReply?.(post.id, t);
    setText('');
  };

  const addEmoji = (emoji) => {
    setText((prev) => (prev ? `${prev} ${emoji}` : emoji));
  };

  const createdAtLabel = (() => {
    try {
      const d = new Date(post.createdAt);
      return d.toLocaleString();
    } catch {
      return '';
    }
  })();

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

        <header className="mb-4 flex items-center gap-3">
          {post.authorAvatar ? (
            <img
              src={post.authorAvatar}
              alt={post.author || 'Author'}
              className="w-9 h-9 rounded-full object-cover bg-gray-200 flex-shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500 flex-shrink-0">
              {post.author?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
          <div>
            <div className="font-semibold">{post.author}</div>
            <div className="text-xs text-gray-500">
              {createdAtLabel} • {post.type === 'personal' ? 'Personal' : 'Business'}
            </div>
          </div>
        </header>

        <p className="mb-4 whitespace-pre-wrap">{post.body}</p>

        <div className="border-t pt-4 space-y-3 max-h-[50vh] overflow-y-auto">
          {post.comments.length === 0 ? (
            <div className="text-sm text-gray-500">
              No comments yet—be the first!
            </div>
          ) : (
            post.comments.map((c, i) => (
              <div key={i} className="flex items-start gap-2">
                {c.avatarUrl ? (
                  <img
                    src={c.avatarUrl}
                    alt={c.by || 'User'}
                    className="w-7 h-7 rounded-full object-cover bg-gray-200 mt-0.5 flex-shrink-0"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-[10px] text-gray-500 mt-0.5 flex-shrink-0">
                    {c.by?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
                <div>
                  <div className="text-sm">
                    <span className="font-medium">{c.by}:</span> {c.text}
                  </div>
                  {c.at && (
                    <div className="text-xs text-gray-400">
                      {new Date(c.at).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 space-y-3">
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