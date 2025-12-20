// components/feed/PostCard.js
import { useState } from 'react';
import QuickEmojiBar from './QuickEmojiBar';

export default function PostCard({
  post,
  onReply,
  onOpenComments,
  onDelete,
  onReact,
  currentUserId,
}) {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [hoveredEmoji, setHoveredEmoji] = useState(null); // Track hovered emoji for tooltip
  const [reactionUsers, setReactionUsers] = useState({}); // Cache { emoji: [names] }

  const handleReplySubmit = () => {
    if (replyText.trim()) {
      onReply(post.id, replyText.trim());
      setReplyText('');
      setShowReplyInput(false);
    }
  };

  // Extract reaction data
  const selectedEmojis = post.reactions
    ?.filter(r => r.users?.includes(currentUserId) || r.userIds?.includes(currentUserId))
    ?.map(r => r.emoji) || [];

  const reactionCounts = post.reactions?.reduce((acc, r) => {
    acc[r.emoji] = r.count || 0;
    return acc;
  }, {}) || {};

  // Fetch user names on hover (only once per emoji)
  const fetchUsersForEmoji = async (emoji) => {
    if (reactionUsers[emoji]) return; // cached

    const reaction = post.reactions?.find(r => r.emoji === emoji);
    if (!reaction || !reaction.userIds?.length) return;

    try {
      const res = await fetch('/api/users/names', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: reaction.userIds }),
      });
      if (res.ok) {
        const data = await res.json();
        const names = data.names || [];
        const formatted = names.map(name => 
          name === session?.user?.name ? 'You' : name
        ).join(', ');
        setReactionUsers(prev => ({ ...prev, [emoji]: formatted }));
      }
    } catch (err) {
      console.error('Failed to fetch reaction users', err);
    }
  };

  const getTooltipText = (emoji) => {
    const users = reactionUsers[emoji];
    if (!users) return 'Loading...';
    return `${users} reacted with ${emoji}`;
  };

  return (
    <div className="bg-white rounded-lg shadow p-5 space-y-4 relative">
      {/* Author */}
      <div className="flex items-start gap-3">
        {post.authorAvatar ? (
          <img src={post.authorAvatar} alt={post.author} className="w-10 h-10 rounded-full" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
            {post.author?.charAt(0)?.toUpperCase()}
          </div>
        )}
        <div>
          <div className="font-semibold">{post.author}</div>
          <div className="text-xs text-gray-500">
            {new Date(post.createdAt).toLocaleString()} • {post.type}
          </div>
        </div>
      </div>

      {/* Body */}
      <p className="whitespace-pre-wrap">{post.body}</p>

      {/* Attachments */}
      {post.attachments?.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {post.attachments.map((a, i) => (
            <div key={i}>
              {a.type === 'image' && <img src={a.url} alt={a.name} className="rounded" />}
              {a.type === 'video' && <video src={a.url} controls className="rounded" />}
              {a.type === 'link' && <a href={a.url}>{a.name}</a>}
            </div>
          ))}
        </div>
      )}

      {/* Reaction Bar with Tooltip */}
      <div className="relative">
        <QuickEmojiBar
          onPick={(emoji) => onReact(post.id, emoji)}
          selectedEmojis={selectedEmojis}
          reactionCounts={reactionCounts}
          onMouseEnter={(emoji) => {
            setHoveredEmoji(emoji);
            if (reactionCounts[emoji] > 0) fetchUsersForEmoji(emoji);
          }}
          onMouseLeave={() => setHoveredEmoji(null)}
        />
        {hoveredEmoji && reactionCounts[hoveredEmoji] > 0 && (
          <div
            className="absolute bottom-full left-0 mb-3 bg-gray-900 text-white text-sm rounded-lg p-3 shadow-xl z-20 whitespace-nowrap max-w-xs"
          >
            {getTooltipText(hoveredEmoji)}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="flex items-center gap-4 text-sm text-gray-600">
        {post.likes > 0 && (
          <span className="bg-gray-100 px-2.5 py-1 rounded-full">
            {post.likes} reactions
          </span>
        )}
        <button onClick={() => onOpenComments(post)} className="hover:underline">
          {post.comments.length} comments
        </button>
      </div>

      {/* Reply */}
      {showReplyInput ? (
        <div className="flex gap-2">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply..."
            className="flex-1 border rounded p-2"
            rows={2}
          />
          <button
            onClick={handleReplySubmit}
            disabled={!replyText.trim()}
            className="px-4 py-2 bg-orange-500 text-white rounded disabled:opacity-50"
          >
            Send
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowReplyInput(true)}
          className="text-sm text-gray-600 hover:underline"
        >
          Reply
        </button>
      )}

      {/* Delete */}
      {post.authorId === currentUserId && (
        <button
          onClick={() => onDelete(post.id)}
          className="text-red-600 text-sm hover:underline"
        >
          Delete
        </button>
      )}
    </div>
  );
}