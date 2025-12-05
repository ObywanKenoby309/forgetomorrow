// components/feed/PostList.js
import { useState, useMemo } from 'react';
import PostCard from './PostCard';
import PostCommentsModal from './PostCommentsModal';

export default function PostList({
  posts,
  filter,
  onReply,
  onDelete,
  currentUserId,
}) {
  const [activePost, setActivePost] = useState(null);

  // Apply filter (business / personal / both)
  const filteredPosts = useMemo(() => {
    if (!Array.isArray(posts)) return [];
    if (filter === 'both') return posts;
    return posts.filter((p) => (p.type || 'business') === filter);
  }, [posts, filter]);

  const handleOpenComments = (post) => {
    setActivePost(post);
  };

  const handleCloseComments = () => {
    setActivePost(null);
  };

  // Wrap onReply so modal + cards both get updated
  const handleReplyInternal = (postId, text) => {
    onReply?.(postId, text);

    // If the modal is open, refresh its copy from latest posts
    const updated = posts.find((p) => p.id === postId);
    if (updated) {
      setActivePost(updated);
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
          filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onReply={handleReplyInternal}
              onOpenComments={handleOpenComments}
              currentUserId={currentUserId}
              onDelete={onDelete}
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
