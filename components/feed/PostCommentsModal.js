// components/feed/PostCommentsModal.js
import { useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import QuickEmojiBar from './QuickEmojiBar';
import { useConnect } from '@/components/actions/useConnect';
import { createPortal } from 'react-dom';

export default function PostCommentsModal({ post, onClose, onReply }) {
  const [text, setText] = useState('');
  const [likingKey, setLikingKey] = useState(null);
  const [deletingKey, setDeletingKey] = useState(null);
  const [commentMenuKey, setCommentMenuKey] = useState(null);
  const [connectingKey, setConnectingKey] = useState(null);

  const { data: session } = useSession();
  const router = useRouter();
  const { connectWith } = useConnect();

  if (!post) return null;
  if (typeof document === 'undefined') return null;

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
    } catch {}
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
    } catch {}
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
    } catch {}

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
    } catch {}

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
        } catch {}

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
      } catch {}

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

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[99999] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-5"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex h-[94dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-[26px] border border-white/45 bg-white/95 shadow-[0_28px_90px_rgba(15,23,42,0.34)] backdrop-blur-xl sm:h-[88vh] sm:rounded-[30px]"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-30 inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-xl text-gray-500 shadow-sm transition hover:bg-gray-50 hover:text-gray-800"
          aria-label="Close"
        >
          ×
        </button>

        <div className="flex min-h-0 flex-1 flex-col">
          <section className="shrink-0 border-b border-gray-100 bg-white/80 px-4 py-4 sm:px-7 sm:py-5">
            <header className="flex items-center gap-3 pr-14">
              {post.authorAvatar ? (
                <img
                  src={post.authorAvatar}
                  alt={post.author || 'Author'}
                  className="h-11 w-11 flex-shrink-0 rounded-full bg-gray-200 object-cover"
                />
              ) : (
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm text-gray-500">
                  {post.author?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}

              <div className="min-w-0">
  <div className="truncate text-[15px] font-bold text-gray-950">
    {post.author}
  </div>

  {post.authorHeadline && (
    <div className="text-xs text-gray-500">
      {post.authorHeadline}
    </div>
  )}

  <div className="mt-0.5 text-xs text-gray-500">
    {createdAtLabel} • {post.type === 'personal' ? 'Personal' : 'Business'}
  </div>
</div>
            </header>

            <div className="mt-4 max-h-[22vh] overflow-y-auto pr-1 text-[15px] leading-7 text-gray-800 sm:max-h-[26vh]">
              <div className="whitespace-pre-wrap">{post.body}</div>

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
                            className="max-h-[360px] w-full bg-white object-contain"
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
                            className="max-h-[360px] w-full bg-black object-contain"
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
          </section>

          <section className="flex min-h-0 flex-1 flex-col bg-gradient-to-b from-white to-gray-50/80">
            <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3 sm:px-7">
              <div className="text-[15px] font-bold text-gray-950">
  Comments
</div>

              <div className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-600 shadow-sm">
                {visibleComments.length}{' '}
                {visibleComments.length === 1 ? 'reply' : 'replies'}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-7 sm:py-5">
              {visibleComments.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-gray-200 bg-white px-5 py-10 text-center text-sm text-gray-500 shadow-sm">
                  No comments yet. Be the first to add one.
                </div>
              ) : (
                <div className="space-y-4">
                  {visibleComments.map((c, i) => {
                    const likes = Number(c?.likes) || 0;
                    const hasLiked = Boolean(c?.hasLiked);
                    const key = c?.id ?? i;

                    const busyLike = likingKey === `${post.id}:${c?.id ?? i}`;
                    const busyDelete =
                      deletingKey === `${post.id}:${c?.id ?? i}`;

                    const authorId = c?.authorId ? String(c.authorId) : '';
                    const canDelete = Boolean(
                      myId && authorId && myId === authorId
                    );

                    const targetUserId = getCommentAuthorId(c);
                    const canTarget =
                      Boolean(targetUserId) &&
                      Boolean(myId) &&
                      targetUserId !== myId;

                    const menuKey = `${post.id}:${c?.id ?? i}`;
                    const menuOpen = commentMenuKey === menuKey;

                    return (
                      <article
                        key={key}
                        className="group rounded-3xl border border-gray-200/80 bg-white p-4 shadow-sm transition hover:border-gray-300 hover:shadow-md sm:p-5"
                      >
                        <div className="flex items-start gap-3 sm:gap-4">
                          <div className="relative shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                if (!canTarget) return;
                                setCommentMenuKey((v) =>
                                  v === menuKey ? null : menuKey
                                );
                              }}
                              onBlur={() => setCommentMenuKey(null)}
                              className="shrink-0"
                              style={{ cursor: canTarget ? 'pointer' : 'default' }}
                              aria-label={
                                canTarget
                                  ? 'Open member actions'
                                  : 'Comment author avatar'
                              }
                            >
                              {c.avatarUrl ? (
                                <img
                                  src={c.avatarUrl}
                                  alt={c.by || 'User'}
                                  className="h-10 w-10 rounded-full bg-gray-200 object-cover ring-2 ring-white"
                                />
                              ) : (
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-500 ring-2 ring-white">
                                  {c.by?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                              )}
                            </button>

                            {menuOpen && canTarget ? (
                              <div
                                className="absolute left-0 z-30 mt-2 w-44 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl"
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
                                  onClick={() =>
                                    handleConnect(targetUserId, menuKey)
                                  }
                                  disabled={connectingKey === menuKey}
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 disabled:bg-white disabled:text-gray-400"
                                  role="menuitem"
                                >
                                  {connectingKey === menuKey
                                    ? 'Sending…'
                                    : 'Connect'}
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
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
  <div className="text-sm font-bold text-gray-950">
    {c.by}
  </div>

  {c.headline && (
    <div className="w-full text-xs text-gray-500">
      {c.headline}
    </div>
  )}

  {c.at && (
    <div className="text-xs text-gray-400">
      {new Date(c.at).toLocaleString()}
    </div>
  )}
</div>

                            <div className="mt-2 whitespace-pre-wrap break-words text-[15px] leading-7 text-gray-800">
                              {c.text}
                            </div>

                            <div className="mt-4 flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => toggleCommentLike(c, i)}
                                disabled={busyLike}
                                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                                  hasLiked
                                    ? 'border-[#FF7043]/30 bg-[#FF7043]/10 text-[#FF7043]'
                                    : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                                } ${busyLike ? 'opacity-60' : ''}`}
                                aria-label={
                                  hasLiked ? 'Unlike comment' : 'Like comment'
                                }
                                title={hasLiked ? 'Unlike' : 'Like'}
                              >
                                👍 Like{likes > 0 ? ` · ${likes}` : ''}
                              </button>

                              {canDelete && (
                                <button
                                  type="button"
                                  onClick={() => deleteComment(c, i)}
                                  disabled={busyDelete}
                                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
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
                      </article>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="shrink-0 border-t border-gray-100 bg-white/90 px-4 py-3 shadow-[0_-12px_35px_rgba(15,23,42,0.06)] sm:px-7 sm:py-4">
              <div className="rounded-3xl border border-gray-200 bg-gray-50 p-3 sm:p-4">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={3}
                  className="max-h-40 min-h-[96px] w-full resize-y rounded-2xl border border-gray-200 bg-white p-4 text-[15px] leading-6 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="Write your comment…"
                />

                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <QuickEmojiBar onPick={addEmoji} />

                  <div className="flex justify-end">
                    <button
                      onClick={send}
                      disabled={!text.trim()}
                      className="rounded-2xl bg-[#ff8a65] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#ff7043] disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      Comment
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>,
    document.body
  );
}