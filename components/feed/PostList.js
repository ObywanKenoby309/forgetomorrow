// components/feed/PostList.js
import { useMemo, useState } from 'react';
import PostCard from './PostCard';
import PostCommentsModal from './PostCommentsModal';

export default function PostList({
  posts,
  filter,
  onReply,
  onDelete,
  currentUserId,
}) {
  const [activePostId, setActivePostId] = useState(null);

  const safePosts = Array.isArray(posts) ? posts : [];

  const filteredPosts = useMemo(() => {
    if (filter === 'both') return safePosts;
    return safePosts.filter((p) => (p.type || 'business') === filter);
  }, [safePosts, filter]);

  const activePost =
    activePostId != null
      ? safePosts.find((p) => p.id === activePostId) || null
      : null;

  const handleOpenComments = (post) => {
    setActivePostId(post?.id ?? null);
  };

  const handleCloseComments = () => {
    setActivePostId(null);
  };

  const handleReplyInternal = (postId, text) => {
    onReply?.(postId, text);
  };

  const handleDeleteInternal = (postId) => {
    onDelete?.(postId);
    if (postId === activePostId) {
      setActivePostId(null);
    }
  };

  return (
    <>
      <div className="space-y-3">
        {filteredPosts.length === 0 ? (
          <div className="text-sm text-gray-500">
            No posts yet. Be the first to share something.
          </div>
        ) : (
          filteredPosts.map((post) => {
            console.log('[POSTLIST] rendering post', {
              id: post.id,
              comments: post.comments,
            });

            return (
              <PostCard
                key={post.id}
                post={post}
                onReply={handleReplyInternal}
                onOpenComments={handleOpenComments}
                currentUserId={currentUserId}
                onDelete={handleDeleteInternal}
              />
            );
          })
        )}
      </div>

      {activePost && (
        <PostCommentsModal
          post={activePost}
          onClose={handleCloseComments}
          onReply={handleReplyInternal}
        />
      )}
    </>
  );
}
