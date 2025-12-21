// components/feed/PostList.js
import { useMemo, useState } from 'react';
import PostCard from './PostCard';
import PostCommentsModal from './PostCommentsModal';
export default function PostList({
  posts,
  filter,
  onReply,
  onDelete,
  onReact,
  currentUserId,
  currentUserName, // ✅ ADDED
  onBlockAuthor, // ✅ NEW: passed from Feed for global block
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
  const handleReactInternal = (postId, emoji) => {
    onReact?.(postId, emoji);
  };
  return (
    <>
      <div className="space-y-3">
        {filteredPosts.length === 0 ? (
          <div className="text-sm text-gray-500">
            No posts yet. Be the first to share something.
          </div>
        ) : (
          filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onReply={handleReplyInternal}
              onOpenComments={handleOpenComments}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              onDelete={handleDeleteInternal}
              onReact={handleReactInternal}
              onBlockAuthor={onBlockAuthor} // ✅ NEW: forward to PostCard for global hide
            />
          ))
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