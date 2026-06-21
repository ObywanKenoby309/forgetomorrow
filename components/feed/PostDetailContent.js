// components/feed/PostDetailContent.js
import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import QuickEmojiBar from './QuickEmojiBar';
import { useConnect } from '@/components/actions/useConnect';

// Renders a post's full body + attachments + comment thread + reply box.
// Used by both PostCommentsModal (variant="modal", scrollable panes inside
// a fixed-height sheet) and pages/post-view.js (variant="page", normal page
// flow / no internal scroll regions).
export default function PostDetailContent({ post, onReply, variant = 'modal' }) {
  const [text, setText] = useState('');
  const [likingKey, setLikingKey] = useState(null);
  const [deletingKey, setDeletingKey] = useState(null);
  const [commentMenuKey, setCommentMenuKey] = useState(null);
  const [connectingKey, setConnectingKey] = useState(null);
  const [localComments, setLocalComments] = useState([]);
  const [commentLikeNames, setCommentLikeNames] = useState({});
  const [likeViewer, setLikeViewer] = useState(null);

  const { data: session } = useSession();
  const router = useRouter();
  const { connectWith } = useConnect();

  useEffect(() => {
    setLocalComments(Array.isArray(post?.comments) ? post.comments : []);
  }, [post?.id, post?.comments]);

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
    } catch {}
  };

  const send = async () => {
    const t = text.trim();
    if (!t) return;

    const optimisticComment = {
      id: `local_${Date.now()}`,
      authorId: session?.user?.id || null,
      userId: session?.user?.id || null,
      by: session?.user?.name || 'You',
      text: t,
      at: new Date().toISOString(),
      avatarUrl: session?.user?.avatarUrl || session?.user?.image || null,
      headline: session?.user?.headline || null,
      likes: 0,
      likedBy: [],
    };

    setLocalComments((prev) => [...prev, optimisticComment]);

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

  const allComments = Array.isArray(localComments) ? localComments : [];
  const visibleComments = allComments.filter((c) => !(c && c.deleted === true));

  const myId = session?.user?.id ? String(session.user.id) : '';
  const currentUserName = session?.user?.name || 'You';

  const getCommentAuthorId = (c) => {
    try {
      return String(c?.authorId || c?.userId || '').trim();
    } catch {
      return '';
    }
  };

  const getCommentHeadline = (c) => {
    return c?.headline || c?.authorHeadline || null;
  };


  const getCommentLikeIds = (c) => {
    if (!Array.isArray(c?.likedBy)) return [];
    return c.likedBy.map((id) => String(id || '').trim()).filter(Boolean);
  };

  const getCommentLikeKey = (comment, visibleIndex) => {
    return `${post.id}:${comment?.id ?? visibleIndex}:comment-likes`;
  };

  const loadCommentLikeNames = async (ids, key) => {
    const safeIds = Array.isArray(ids)
      ? ids.map((id) => String(id || '').trim()).filter(Boolean)
      : [];

    if (!safeIds.length || !key) return [];

    const cached = commentLikeNames[key];
    if (cached?.loaded && Array.isArray(cached.names)) {
      return cached.names;
    }

    setCommentLikeNames((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        loading: true,
      },
    }));

    try {
      const res = await fetch('/api/users/names', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: safeIds }),
      });

      if (!res.ok) throw new Error('Could not load comment likes');

      const data = await res.json().catch(() => ({}));
      const names = Array.isArray(data.names)
        ? data.names.map((name) =>
            name === currentUserName ? 'You' : String(name || 'Member')
          )
        : [];

      setCommentLikeNames((prev) => ({
        ...prev,
        [key]: {
          names,
          loading: false,
          loaded: true,
        },
      }));

      return names;
    } catch {
      const fallbackNames = safeIds.map((id) =>
        id === myId ? 'You' : 'Member'
      );

      setCommentLikeNames((prev) => ({
        ...prev,
        [key]: {
          names: fallbackNames,
          loading: false,
          loaded: true,
        },
      }));

      return fallbackNames;
    }
  };

  const getCommentLikePreview = (comment, visibleIndex) => {
    const ids = getCommentLikeIds(comment);
    if (!ids.length) return '';

    const key = getCommentLikeKey(comment, visibleIndex);
    const names = commentLikeNames[key]?.names || [];

    if (!names.length) {
      return commentLikeNames[key]?.loading ? 'Liked by loading…' : 'Liked by members';
    }

    const firstNames = names.slice(0, 2).join(', ');
    const remaining = Math.max(0, ids.length - 2);

    return remaining > 0
      ? `Liked by ${firstNames} +${remaining}`
      : `Liked by ${firstNames}`;
  };

  const openCommentLikeViewer = async (comment, visibleIndex) => {
    const ids = getCommentLikeIds(comment);
    if (!ids.length) return;

    const key = getCommentLikeKey(comment, visibleIndex);
    const cachedNames = commentLikeNames[key]?.names || [];

    setLikeViewer({
      key,
      ids,
      names: cachedNames,
    });

    const names = await loadCommentLikeNames(ids, key);

    setLikeViewer((current) => {
      if (!current || current.key !== key) return current;
      return {
        ...current,
        names,
      };
    });
  };

  useEffect(() => {
    visibleComments.forEach((comment, index) => {
      const ids = getCommentLikeIds(comment);
      if (!ids.length) return;

      const key = getCommentLikeKey(comment, index);
      if (commentLikeNames[key]?.loaded || commentLikeNames[key]?.loading) return;

      loadCommentLikeNames(ids, key);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localComments, post?.id]);

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
      const likedBy = getCommentLikeIds(comment);
      const hasLiked = Boolean(comment?.hasLiked) || likedBy.includes(myId);
      const nextLikedBy = hasLiked
        ? likedBy.filter((id) => id !== myId)
        : myId
          ? [...likedBy, myId]
          : likedBy;
      const nextLikes = hasLiked
        ? Math.max(0, currentLikes - 1)
        : currentLikes + 1;

      setLocalComments((prev) =>
        prev.map((c, idx) => {
          if (!c) return c;

          if (commentId && String(c.id || '') === String(commentId)) {
            return { ...c, likes: nextLikes, hasLiked: !hasLiked, likedBy: nextLikedBy };
          }

          if (!commentId) {
            let seen = -1;
            for (let i = 0; i < prev.length; i++) {
              const x = prev[i];
              if (x && x.deleted === true) continue;
              seen += 1;
              if (seen === visibleIndex && idx === i) {
                return { ...c, likes: nextLikes, hasLiked: !hasLiked, likedBy: nextLikedBy };
              }
            }
          }

          return c;
        })
      );
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

      if (updated) {
        setLocalComments((prev) =>
          prev.map((c) => {
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
                likedBy: Array.isArray(updated.likedBy)
                  ? updated.likedBy
                  : Array.isArray(c?.likedBy)
                    ? c.likedBy
                    : [],
                id: updated.id ?? c.id,
              };
            }
            return c;
          })
        );
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
      setLocalComments((prev) =>
        prev.map((c, idx) => {
          if (!c) return c;

          if (commentId && String(c.id || '') === String(commentId)) {
            prior = c;
            return { ...c, deleted: true };
          }

          if (!commentId) {
            let seen = -1;
            for (let i = 0; i < prev.length; i++) {
              const x = prev[i];
              if (x && x.deleted === true) continue;
              seen += 1;
              if (seen === visibleIndex && idx === i) {
                prior = c;
                return { ...c, deleted: true };
              }
            }
          }

          return c;
        })
      );
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
        if (prior) {
          setLocalComments((prev) =>
            prev.map((c) => {
              if (!c) return c;
              if (commentId && String(c.id || '') === String(commentId)) {
                return prior;
              }
              return c;
            })
          );
        }

        const msg = await res.json().catch(() => ({}));
        alert(msg?.error || 'Delete failed. The comment was restored.');
      }
    } catch {
      if (prior) {
        setLocalComments((prev) =>
          prev.map((c) => {
            if (!c) return c;
            if (commentId && String(c.id || '') === String(commentId)) {
              return prior;
            }
            return c;
          })
        );
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

  const typeLabel = post.type === 'personal' ? 'Personal' : 'Business';
  const typePillClass = post.type === 'personal'
    ? 'bg-[rgba(168,120,255,0.15)] border-[rgba(168,120,255,0.35)] text-[#7c5cff]'
    : 'bg-[rgba(95,150,255,0.15)] border-[rgba(95,150,255,0.35)] text-[#4f8cff]';

  const isModal = variant === 'modal';

  return (
    <div className={isModal ? 'flex min-h-0 flex-1 flex-col' : 'flex flex-col'}>
      <section className="shrink-0 border-b border-white/40 bg-white/30 px-4 py-4 sm:px-7 sm:py-5">
        <header className="flex items-center gap-3 pr-14">
          {post.authorAvatar ? (
            <img
              src={post.authorAvatar}
              alt={post.author || 'Author'}
              className="h-11 w-11 flex-shrink-0 rounded-full bg-white/40 object-cover ring-1 ring-white/50"
            />
          ) : (
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-white/40 text-sm font-bold text-[#8a5d44] ring-1 ring-white/50">
              {post.author?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}

          <div className="min-w-0">
            <div className="truncate text-[15px] font-extrabold text-[#3a2418]">
              {post.author}
            </div>

            {post.authorHeadline && (
              <div className="text-xs text-[#8a5d44]">
                {post.authorHeadline}
              </div>
            )}

            <div className="mt-1 flex items-center gap-2">
              <span className="text-xs text-[#a8775f]">{createdAtLabel}</span>
              <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full border ${typePillClass}`}>
                {typeLabel}
              </span>
            </div>
          </div>
        </header>

        <div className={`mt-4 pr-1 text-[15px] leading-7 text-[#4a3024] ${isModal ? 'max-h-none overflow-visible sm:max-h-[26vh] sm:overflow-y-auto' : ''}`}>
          <div className="whitespace-pre-wrap">{post.body}</div>

          {safeAttachments.length > 0 && (
            <div className="mt-4 space-y-3">
              {safeAttachments.map((a, idx) => {
                if (a.type === 'image') {
                  return (
                    <div
                      key={`detail-attachment-${idx}`}
                      className="overflow-hidden rounded-2xl border border-white/45 bg-white/30"
                    >
                      <img
                        src={a.url}
                        alt={a.name || 'Image attachment'}
                        className="max-h-[360px] w-full bg-white/20 object-contain"
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
                      key={`detail-attachment-${idx}`}
                      className="overflow-hidden rounded-2xl border border-white/45 bg-black"
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
                      key={`detail-attachment-${idx}`}
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 break-all rounded-xl border border-white/45 bg-white/35 px-3 py-2 text-sm text-[#4f8cff] hover:bg-white/55 transition"
                    >
                      <svg className="w-[16px] h-[16px] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07l-1.5 1.5" />
                        <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07l1.5-1.5" />
                      </svg>
                      {a.name || a.url}
                    </a>
                  );
                }

                return null;
              })}
            </div>
          )}
        </div>
      </section>

      <section className={`flex flex-col bg-gradient-to-b from-white/10 to-white/30 ${isModal ? 'min-h-0 flex-1' : ''}`}>
        <div className="flex shrink-0 items-center justify-between border-b border-white/40 px-4 py-3 sm:px-7">
          <div className="text-[15px] font-extrabold text-[#3a2418]">
            Comments
          </div>

          <div className="rounded-full border border-white/50 bg-white/40 px-3 py-1 text-xs font-bold text-[#6b4a3a]">
            {visibleComments.length}{' '}
            {visibleComments.length === 1 ? 'reply' : 'replies'}
          </div>
        </div>

        <div className={`px-4 py-4 sm:px-7 sm:py-5 ${isModal ? 'min-h-0 flex-1 overflow-y-auto' : ''}`}>
          {visibleComments.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/50 bg-white/25 px-5 py-10 text-center text-sm text-[#8a5d44]">
              No comments yet. Be the first to add one.
            </div>
          ) : (
            <div className="space-y-4">
              {visibleComments.map((c, i) => {
                const likes = Number(c?.likes) || 0;
                const likeIds = getCommentLikeIds(c);
                const hasLiked = Boolean(c?.hasLiked) || likeIds.includes(myId);
                const key = c?.id ?? i;
                const likePreview = getCommentLikePreview(c, i);

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
                const commentHeadline = getCommentHeadline(c);

                return (
                  <article
                    key={key}
                    className="group rounded-3xl border border-white/50 bg-white/50 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] transition hover:bg-white/65 hover:border-white/70 sm:p-5"
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
                              className="h-10 w-10 rounded-full bg-white/40 object-cover ring-1 ring-white/50"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-orange-300 text-xs font-extrabold text-white ring-1 ring-white/50">
                              {c.by?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                          )}
                        </button>

                        {menuOpen && canTarget ? (
                          <div
                            className="absolute left-0 z-30 mt-2 w-44 overflow-hidden rounded-xl border border-white/50 bg-white/95 shadow-xl"
                            role="menu"
                          >
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => handleViewProfile(targetUserId)}
                              className="w-full px-3 py-2 text-left text-sm text-[#3a2418] hover:bg-white/60"
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
                              className="w-full px-3 py-2 text-left text-sm text-[#3a2418] hover:bg-white/60 disabled:bg-transparent disabled:text-[#c79a86]"
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
                              className="w-full px-3 py-2 text-left text-sm text-[#3a2418] hover:bg-white/60"
                              role="menuitem"
                            >
                              Message
                            </button>
                          </div>
                        ) : null}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <div className="text-sm font-extrabold text-[#3a2418]">
                            {c.by}
                          </div>

                          {commentHeadline && (
                            <div className="w-full text-xs text-[#a8775f]">
                              {commentHeadline}
                            </div>
                          )}

                          {c.at && (
                            <div className="text-xs text-[#c79a86]">
                              {new Date(c.at).toLocaleString()}
                            </div>
                          )}
                        </div>

                        <div className="mt-2 whitespace-pre-wrap break-words text-[15px] leading-7 text-[#4a3024]">
                          {c.text}
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleCommentLike(c, i)}
                            disabled={busyLike}
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                              hasLiked
                                ? 'border-[rgba(255,112,67,0.35)] bg-[rgba(255,112,67,0.15)] text-[#c0512a]'
                                : 'border-white/50 bg-white/40 text-[#6b4a3a] hover:bg-white/60'
                            } ${busyLike ? 'opacity-60' : ''}`}
                            aria-label={
                              hasLiked ? 'Unlike comment' : 'Like comment'
                            }
                            title={hasLiked ? 'Unlike' : 'Like'}
                          >
                            <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M2 21h4V9H2v12zM22 10c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L13.17 1 7.59 6.59C7.22 6.95 7 7.45 7 8v11c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
                            </svg>
                            Like{likes > 0 ? ` · ${likes}` : ''}
                          </button>

                          {likes > 0 && (
                            <button
                              type="button"
                              onClick={() => openCommentLikeViewer(c, i)}
                              className="inline-flex items-center gap-1.5 rounded-full border border-white/50 bg-white/30 px-3 py-1.5 text-xs font-bold text-[#8a5d44] transition hover:bg-white/55 hover:text-[#3a2418]"
                              aria-label="See who liked this comment"
                              title="See who liked this comment"
                            >
                              <span aria-hidden="true">👍</span>
                              <span>{likePreview || `${likes} ${likes === 1 ? 'like' : 'likes'}`}</span>
                            </button>
                          )}

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => deleteComment(c, i)}
                              disabled={busyDelete}
                              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                                busyDelete
                                  ? 'opacity-60 border-white/40 bg-white/30 text-[#c79a86]'
                                  : 'border-[rgba(239,68,68,0.3)] bg-white/40 text-[#c0392b] hover:bg-[rgba(239,68,68,0.1)]'
                              }`}
                              aria-label="Delete comment"
                              title="Delete"
                            >
                              <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" />
                              </svg>
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

        <div className="shrink-0 border-t border-white/40 bg-white/35 px-4 py-3 shadow-[0_-12px_35px_rgba(50,20,10,0.06)] sm:px-7 sm:py-4">
          <div className="rounded-3xl border border-white/50 bg-white/40 p-3 sm:p-4">
            <div className="rounded-2xl border border-white/50 bg-white/45 overflow-hidden">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                className="max-h-40 min-h-[96px] w-full resize-y border-0 p-4 bg-transparent text-[15px] leading-6 text-[#3a2418] placeholder:text-[#b48b78] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[rgba(255,112,67,0.4)]"
                placeholder="Write your comment…"
              />
            </div>

            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <QuickEmojiBar onPick={addEmoji} />

              <div className="flex justify-end">
                <button
                  onClick={send}
                  disabled={!text.trim()}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-[#FF7043] to-[#E55A2B] px-5 py-2.5 text-sm font-extrabold text-white shadow-[0_10px_24px_-10px_rgba(255,112,67,0.55)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_-10px_rgba(255,112,67,0.65)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 disabled:hover:shadow-[0_10px_24px_-10px_rgba(255,112,67,0.55)]"
                >
                  Comment
                  <svg className="w-[16px] h-[16px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {likeViewer && (
        <div
          className="fixed inset-0 z-[100000] flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Comment likes"
          onClick={() => setLikeViewer(null)}
        >
          <div
            className="max-h-[70dvh] w-full overflow-hidden rounded-t-[26px] border border-white/50 bg-[rgba(255,250,245,0.97)] shadow-[0_28px_90px_rgba(50,20,10,0.35)] backdrop-blur-[24px] sm:max-w-md sm:rounded-[26px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/45 px-5 py-4">
              <div>
                <div className="text-base font-extrabold text-[#3a2418]">
                  Liked by
                </div>
                <div className="text-xs font-semibold text-[#a8775f]">
                  {likeViewer.ids?.length || 0}{' '}
                  {(likeViewer.ids?.length || 0) === 1 ? 'member' : 'members'}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setLikeViewer(null)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/50 bg-white/60 text-[#6b4a3a] transition hover:bg-white/80 hover:text-[#3a2418]"
                aria-label="Close comment likes"
              >
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="max-h-[56dvh] overflow-y-auto px-5 py-4">
              {(commentLikeNames[likeViewer.key]?.loading &&
                !(commentLikeNames[likeViewer.key]?.names || likeViewer.names || []).length) ? (
                <div className="rounded-2xl border border-white/50 bg-white/35 px-4 py-4 text-sm font-semibold text-[#8a5d44]">
                  Loading likes…
                </div>
              ) : (
                <div className="space-y-2">
                  {(commentLikeNames[likeViewer.key]?.names || likeViewer.names || []).map((name, index) => (
                    <div
                      key={`${likeViewer.key}-${name}-${index}`}
                      className="flex items-center gap-3 rounded-2xl border border-white/45 bg-white/40 px-3 py-3"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-orange-300 text-xs font-extrabold text-white ring-1 ring-white/50">
                        {String(name || 'Member').charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0 flex-1 truncate text-sm font-extrabold text-[#3a2418]">
                        {name || 'Member'}
                      </div>
                      <div className="text-sm" aria-hidden="true">
                        👍
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}