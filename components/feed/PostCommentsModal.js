// components/feed/PostCommentsModal.js
import { useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import QuickEmojiBar from './QuickEmojiBar';
import { useConnect } from '@/components/actions/useConnect';

export default function PostCommentsModal({ post, onClose, onReply }) {
  const [text, setText] = useState('');
  const [likingKey, setLikingKey] = useState(null); // `${postId}:${commentId||index}`
  const [deletingKey, setDeletingKey] = useState(null); // `${postId}:${commentId||index}`

  const [commentMenuKey, setCommentMenuKey] = useState(null); // `${postId}:${commentId||visibleIndex}`
  const [connectingKey, setConnectingKey] = useState(null);

  const { data: session } = useSession();
  const router = useRouter();
  const { connectWith } = useConnect();

  if (!post) return null;

  const chrome = String(router.query?.chrome || '').toLowerCase();
  const withChrome = (path) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

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

  const allComments = Array.isArray(post.comments) ? post.comments : [];
  const visibleComments = allComments.filter((c) => !(c && c.deleted === true));

  const myId = session?.user?.id ? String(session.user.id) : '';

  const getCommentAuthorId = (c) => {
    try {
      return String(c?.authorId || c?.userId || '').trim();
    } catch {
      return '';
    }
  };

  const logProfileView = async (targetUserId, source) => {
    try {
      await fetch('/api/profile/views', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId,
          source: source || 'feed_comment',
        }),
      });
    } catch {
      // ignore
    }
  };

  const handleViewProfile = async (targetUserId) => {
    if (!targetUserId) return;
    setCommentMenuKey(null);

    await logProfileView(targetUserId, 'feed_comment');
    router.push(withChrome(`/member-profile?userId=${targetUserId}`));
  };

  const handleConnect = async (targetUserId, key) => {
    if (!targetUserId) return;
    if (connectingKey === key) return;

    setCommentMenuKey(null);
    setConnectingKey(key);

    const result = await connectWith(targetUserId);

    if (!result?.ok) {
      setConnectingKey(null);
      alert(
        result?.errorMessage ||
          'We could not send your connection request. Please try again.'
      );
      return;
    }

    if (result.alreadyConnected || result.status === 'connected') {
      setConnectingKey(null);
      alert('You are already connected.');
      return;
    }

    setConnectingKey(null);
    alert(
      result.alreadyRequested
        ? 'Connection request already sent.'
        : 'Connection request sent.'
    );
  };

  const handleMessage = (targetUserId) => {
    if (!targetUserId) return;
    setCommentMenuKey(null);

    const params = new URLSearchParams();
    params.set('userId', targetUserId);
    params.set('action', 'message');
    router.push(withChrome(`/seeker/messages?${params.toString()}`));
  };

  const toggleCommentLike = async (comment, visibleIndex) => {
    if (!post?.id) return;

    const commentId = comment?.id ?? null;
    const key = `${post.id}:${commentId ?? visibleIndex}`;
    if (likingKey === key) return;

    setLikingKey(key);

    try {
      const currentLikes = Number(comment?.likes) || 0;
      const hasLiked = Boolean(comment?.hasLiked);
      const nextLikes = hasLiked
        ? Math.max(0, currentLikes - 1)
        : currentLikes + 1;

      if (Array.isArray(post.comments)) {
        const nextComments = post.comments.map((c) => {
          if (!c) return c;
          if (commentId && String(c.id || '') === String(commentId)) {
            return { ...c, likes: nextLikes, hasLiked: !hasLiked };
          }
          return c;
        });

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
          commentId: commentId,
          commentIndex: visibleIndex,
        }),
      });

      if (!res.ok) {
        setLikingKey(null);
        return;
      }

      const data = await res.json().catch(() => ({}));
      const updated = data?.comment || null;

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

  const deleteComment = async (comment, visibleIndex) => {
    if (!post?.id) return;

    const authorId = comment?.authorId ? String(comment.authorId) : '';
    if (!myId || !authorId || myId !== authorId) return;

    const ok = window.confirm('Are you sure you want to delete this comment?');
    if (!ok) return;

    const commentId = comment?.id ?? null;
    const key = `${post.id}:${commentId ?? visibleIndex}`;
    if (deletingKey === key) return;

    setDeletingKey(key);

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

  const safeAttachments = useMemo(() => {
    const arr = Array.isArray(post?.attachments) ? post.attachments : [];
    return arr
      .map((a) => ({
        type: String(a?.type || '').toLowerCase(),
        url: String(a?.url || '').trim(),
        name: String(a?.name || '').trim(),
      }))
      .filter((a) => {
        if (!a.url) return false;
        return (
          a.url.startsWith('data:image/') ||
          (a.url.startsWith('data:') && a.url.includes('image')) ||
          a.url.startsWith('data:video/') ||
          a.url.startsWith('https://') ||
          a.url.startsWith('http://') ||
          a.url.startsWith('/')
        );
      });
  }, [post?.attachments]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/55 p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl overflow-hidden rounded-[28px] border border-white/40 bg-white/95 shadow-[0_24px_80px_rgba(15,23,42,0.28)] backdrop-blur-xl"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          aria-label="Close"
        >
          ✕
        </button>

        <div className="max-h-[88vh] overflow-y-auto">
          <div className="border-b border-gray-100 px-5 py-5 sm:px-6">
            <header className="flex items-center gap-3 pr-12">
              {post.authorAvatar ? (
                <img
                  src={post.authorAvatar}
                  alt={post.author || 'Author'}
                  className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-200 object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm text-gray-500">
                  {post.author?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
              <div className="min-w-0">
                <div className="truncate text-[15px] font-semibold text-gray-900">
                  {post.author}
                </div>
                <div className="mt-0.5 text-xs text-gray-500">
                  {createdAtLabel} • {post.type === 'personal' ? 'Personal' : 'Business'}
                </div>
              </div>
            </header>

            <div className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-gray-800">
              {post.body}
            </div>

            {safeAttachments.length > 0 && (
              <div className="mt-4 space-y-3">
                {safeAttachments.map((a, idx) => {
                  if (a.type === 'image') {
                    return (
                      <div
                        key={`modal-attachment-${idx}`}
                        className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
                      >
                        <img
                          src={a.url}
                          alt={a.name || 'Image attachment'}
                          className="max-h-[420px] w-full bg-white object-contain"
                          onError={(e) => {
                            try {
                              e.currentTarget.style.display = 'none';
                            } catch {}
                          }}
                        />
                      </div>
                    );
                  }

                  if (a.type === 'video') {
                    return (
                      <div
                        key={`modal-attachment-${idx}`}
                        className="overflow-hidden rounded-2xl border border-gray-200 bg-black"
                      >
                        <video
                          src={a.url}
                          controls
                          className="max-h-[420px] w-full bg-black object-contain"
                        />
                      </div>
                    );
                  }

                  if (a.type === 'link') {
                    return (
                      <a
                        key={`modal-attachment-${idx}`}
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 break-all rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-blue-700 hover:bg-gray-50"
                      >
                        🔗 {a.name || a.url}
                      </a>
                    );
                  }

                  return null;
                })}
              </div>
            )}
          </div>

          <div className="px-5 py-5 sm:px-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-900">
                Comments
              </div>
              <div className="text-xs text-gray-500">
                {visibleComments.length} {visibleComments.length === 1 ? 'reply' : 'replies'}
              </div>
            </div>

            <div className="space-y-3 max-h-[42vh] overflow-y-auto pr-1">
              {visibleComments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                  No comments yet. Be the first to add one.
                </div>
              ) : (
                visibleComments.map((c, i) => {
                  const likes = Number(c?.likes) || 0;
                  const hasLiked = Boolean(c?.hasLiked);
                  const key = c?.id ?? i;

                  const busyLike = likingKey === `${post.id}:${c?.id ?? i}`;
                  const busyDelete = deletingKey === `${post.id}:${c?.id ?? i}`;

                  const authorId = c?.authorId ? String(c.authorId) : '';
                  const canDelete = Boolean(myId && authorId && myId === authorId);

                  const targetUserId = getCommentAuthorId(c);
                  const canTarget =
                    Boolean(targetUserId) && Boolean(myId) && targetUserId !== myId;

                  const menuKey = `${post.id}:${c?.id ?? i}`;
                  const menuOpen = commentMenuKey === menuKey;

                  return (
                    <div
                      key={key}
                      className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-white px-3 py-3 shadow-sm"
                    >
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            if (!canTarget) return;
                            setCommentMenuKey((v) => (v === menuKey ? null : menuKey));
                          }}
                          onBlur={() => setCommentMenuKey(null)}
                          className="shrink-0"
                          style={{ cursor: canTarget ? 'pointer' : 'default' }}
                          aria-label={canTarget ? 'Open member actions' : 'Comment author avatar'}
                        >
                          {c.avatarUrl ? (
                            <img
                              src={c.avatarUrl}
                              alt={c.by || 'User'}
                              className="mt-0.5 h-8 w-8 flex-shrink-0 rounded-full bg-gray-200 object-cover"
                            />
                          ) : (
                            <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-[10px] text-gray-500">
                              {c.by?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                          )}
                        </button>

                        {menuOpen && canTarget ? (
                          <div
                            className="absolute left-0 z-30 mt-2 w-44 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg"
                            role="menu"
                          >
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => handleViewProfile(targetUserId)}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                              role="menuitem"
                            >
                              View profile
                            </button>

                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => handleConnect(targetUserId, menuKey)}
                              disabled={connectingKey === menuKey}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 disabled:bg-white disabled:text-gray-400"
                              role="menuitem"
                            >
                              {connectingKey === menuKey ? 'Sending…' : 'Connect'}
                            </button>

                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => handleMessage(targetUserId)}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                              role="menuitem"
                            >
                              Message
                            </button>
                          </div>
                        ) : null}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="rounded-2xl bg-gray-50 px-3 py-2.5">
                          <div className="text-sm font-semibold text-gray-900">
                            {c.by}
                          </div>
                          <div className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                            {c.text}
                          </div>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-2.5">
                          {c.at && (
                            <div className="text-xs text-gray-400">
                              {new Date(c.at).toLocaleString()}
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => toggleCommentLike(c, i)}
                            disabled={busyLike}
                            className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                              hasLiked
                                ? 'border-[#FF7043]/30 bg-[#FF7043]/10 text-[#FF7043]'
                                : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
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
                              className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                                busyDelete
                                  ? 'opacity-60'
                                  : 'border-red-200 bg-white text-red-600 hover:bg-red-50'
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

            <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-3 sm:p-4">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                className="w-full rounded-2xl border border-gray-200 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="Write your comment…"
              />

              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <QuickEmojiBar onPick={addEmoji} />
                <div className="flex justify-end">
                  <button
                    onClick={send}
                    disabled={!text.trim()}
                    className="rounded-xl bg-[#ff8a65] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    Comment
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}