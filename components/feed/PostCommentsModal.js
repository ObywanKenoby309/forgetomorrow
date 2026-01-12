// components/feed/PostCommentsModal.js
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import QuickEmojiBar from './QuickEmojiBar';

export default function PostCommentsModal({ post, onClose, onReply }) {
  const [text, setText] = useState('');
  const [likingKey, setLikingKey] = useState(null); // `${postId}:${commentId||index}`
  const [deletingKey, setDeletingKey] = useState(null); // `${postId}:${commentId||index}`
  const { data: session } = useSession();

  if (!post) return null;

  const logPostView = async (source) => {
    try {
      await fetch('/api/feed/post-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: post?.id,
          source: source || 'reply_submit',
        }),
      });
    } catch {
      // ignore (best-effort)
    }
  };

  const send = async () => {
    const t = text.trim();
    if (!t) return;

    // ✅ Comment submission counts as a view
    logPostView('reply_submit');

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

  // ✅ MIN CHANGE: hide soft-deleted comments from public view
  const allComments = Array.isArray(post.comments) ? post.comments : [];
  const visibleComments = allComments.filter((c) => !(c && c.deleted === true));

  // ─────────────────────────────────────────────────────────────
  // ✅ COMMENT LIKE (thumbs up) — separate from emojis
  // - toggles likes on a comment object inside post.comments (JSON)
  // - best-effort optimistic UI (no schema changes here)
  // ─────────────────────────────────────────────────────────────
  const toggleCommentLike = async (comment, visibleIndex) => {
    if (!post?.id) return;

    const commentId = comment?.id ?? null;
    const key = `${post.id}:${commentId ?? visibleIndex}`;
    if (likingKey === key) return;

    setLikingKey(key);

    // optimistic update (local only)
    try {
      const currentLikes = Number(comment?.likes) || 0;
      const hasLiked = Boolean(comment?.hasLiked); // client-only flag (optional)
      const nextLikes = hasLiked
        ? Math.max(0, currentLikes - 1)
        : currentLikes + 1;

      // apply to the *real* post.comments array by id (preferred) else by visible-index mapping
      if (Array.isArray(post.comments)) {
        const nextComments = post.comments.map((c) => {
          if (!c) return c;
          if (commentId && String(c.id || '') === String(commentId)) {
            return { ...c, likes: nextLikes, hasLiked: !hasLiked };
          }
          return c;
        });

        // fallback if no id match (older comments): map visibleIndex -> actual index
        if (!commentId) {
          const actualIndex = (() => {
            let seen = -1;
            for (let i = 0; i < post.comments.length; i++) {
              const x = post.comments[i];
              if (x && x.deleted === true) continue;
              seen += 1;
              if (seen === visibleIndex) return i;
            }
            return -1;
          })();

          if (actualIndex >= 0) {
            nextComments[actualIndex] = {
              ...(nextComments[actualIndex] || {}),
              likes: nextLikes,
              hasLiked: !hasLiked,
            };
          }
        }

        post.comments = nextComments;
      }
    } catch {
      // ignore optimistic failure
    }

    try {
      const res = await fetch('/api/feed/comment-like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: post.id,
          commentId: commentId, // may be null; API can fallback to index later if needed
          commentIndex: visibleIndex, // visible index (non-deleted list)
        }),
      });

      if (!res.ok) {
        setLikingKey(null);
        return;
      }

      const data = await res.json().catch(() => ({}));
      const updated = data?.comment || null;

      // reconcile with server response if provided
      if (updated && Array.isArray(post.comments)) {
        const nextComments = post.comments.map((c) => {
          if (!c) return c;
          if (commentId && String(c.id || '') === String(commentId)) {
            return {
              ...c,
              likes:
                typeof updated.likes === 'number'
                  ? updated.likes
                  : Number(c?.likes) || 0,
              hasLiked:
                typeof updated.hasLiked === 'boolean'
                  ? updated.hasLiked
                  : Boolean(c?.hasLiked),
              id: updated.id ?? c.id,
            };
          }
          return c;
        });

        post.comments = nextComments;
      }
    } catch {
      // ignore (best-effort)
    } finally {
      setLikingKey(null);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // ✅ COMMENT DELETE — ONLY for comment author
  // - Confirm prompt (per your UX spec)
  // - optimistic UI: remove immediately after confirm
  // - server: /api/feed/comment-delete (soft delete)
  // ─────────────────────────────────────────────────────────────
  const deleteComment = async (comment, visibleIndex) => {
    if (!post?.id) return;

    const myId = session?.user?.id ? String(session.user.id) : '';
    const authorId = comment?.authorId ? String(comment.authorId) : '';
    if (!myId || !authorId || myId !== authorId) return;

    const ok = window.confirm('Are you sure you want to delete this comment?');
    if (!ok) return;

    const commentId = comment?.id ?? null;
    const key = `${post.id}:${commentId ?? visibleIndex}`;
    if (deletingKey === key) return;

    setDeletingKey(key);

    // optimistic: mark deleted in the real post.comments (so it disappears immediately via visibleComments filter)
    let prior = null;

    try {
      if (Array.isArray(post.comments)) {
        const next = post.comments.map((c) => {
          if (!c) return c;
          if (commentId && String(c.id || '') === String(commentId)) {
            prior = c;
            return { ...c, deleted: true };
          }
          return c;
        });

        // fallback if no id
        if (!commentId) {
          const actualIndex = (() => {
            let seen = -1;
            for (let i = 0; i < post.comments.length; i++) {
              const x = post.comments[i];
              if (x && x.deleted === true) continue;
              seen += 1;
              if (seen === visibleIndex) return i;
            }
            return -1;
          })();

          if (actualIndex >= 0) {
            prior = post.comments[actualIndex] || null;
            next[actualIndex] = { ...(next[actualIndex] || {}), deleted: true };
          }
        }

        post.comments = next;
      }
    } catch {
      // ignore optimistic failure
    }

    try {
      const res = await fetch('/api/feed/comment-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: post.id,
          commentId: commentId,
          commentIndex: visibleIndex,
        }),
      });

      if (!res.ok) {
        // rollback (show it again)
        try {
          if (prior && Array.isArray(post.comments)) {
            post.comments = post.comments.map((c) => {
              if (!c) return c;
              if (commentId && String(c.id || '') === String(commentId)) {
                return prior;
              }
              return c;
            });
          }
        } catch {
          // ignore rollback failure
        }

        const msg = await res.json().catch(() => ({}));
        alert(msg?.error || 'Delete failed. The comment was restored.');
      }
    } catch {
      // rollback (show it again)
      try {
        if (prior && Array.isArray(post.comments)) {
          post.comments = post.comments.map((c) => {
            if (!c) return c;
            if (commentId && String(c.id || '') === String(commentId)) {
              return prior;
            }
            return c;
          });
        }
      } catch {
        // ignore rollback failure
      }

      alert('Delete failed (network/server). The comment was restored.');
    } finally {
      setDeletingKey(null);
    }
  };

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
          {visibleComments.length === 0 ? (
            <div className="text-sm text-gray-500">
              No comments yet—be the first!
            </div>
          ) : (
            visibleComments.map((c, i) => {
              const likes = Number(c?.likes) || 0;
              const hasLiked = Boolean(c?.hasLiked);
              const key = c?.id ?? i;

              const busyLike = likingKey === `${post.id}:${c?.id ?? i}`;
              const busyDelete = deletingKey === `${post.id}:${c?.id ?? i}`;

              const myId = session?.user?.id ? String(session.user.id) : '';
              const authorId = c?.authorId ? String(c.authorId) : '';
              const canDelete = Boolean(myId && authorId && myId === authorId);

              return (
                <div key={key} className="flex items-start gap-2">
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

                  <div className="min-w-0 flex-1">
                    <div className="text-sm">
                      <span className="font-medium">{c.by}:</span> {c.text}
                    </div>

                    <div className="mt-1 flex items-center gap-3">
                      {c.at && (
                        <div className="text-xs text-gray-400">
                          {new Date(c.at).toLocaleString()}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => toggleCommentLike(c, i)}
                        disabled={busyLike}
                        className={`text-xs font-semibold px-2 py-1 rounded-full border transition ${
                          hasLiked
                            ? 'bg-[#FF7043]/10 border-[#FF7043]/30 text-[#FF7043]'
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                        } ${busyLike ? 'opacity-60' : ''}`}
                        aria-label={hasLiked ? 'Unlike comment' : 'Like comment'}
                        title={hasLiked ? 'Unlike' : 'Like'}
                      >
                        👍 Like{likes > 0 ? ` · ${likes}` : ''}
                      </button>

                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => deleteComment(c, i)}
                          disabled={busyDelete}
                          className={`text-xs font-semibold px-2 py-1 rounded-full border transition ${
                            busyDelete
                              ? 'opacity-60'
                              : 'bg-white border-red-200 text-red-600 hover:bg-red-50'
                          }`}
                          aria-label="Delete comment"
                          title="Delete"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
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
