import { useMemo, useState } from "react";
import dynamic from "next/dynamic";

// Hydration-safe "Xm ago" (renders client-only)
const RelativeTime = dynamic(() => import("@/components/RelativeTime"), { ssr: false });

// (kept for other uses)
const timeAgo = (ts) => {
  const diff = Math.max(0, Date.now() - ts);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
};

function AttachmentGallery({ attachments = [] }) {
  if (!attachments.length) return null;

  const images = attachments.filter((a) => a.type === "image");
  const videos = attachments.filter((a) => a.type === "video");
  const links  = attachments.filter((a) => a.type === "link");

  return (
    <div className="mt-3 space-y-3">
      {images.length > 0 && (
        <div
          className={`grid gap-2 ${
            images.length === 1 ? "grid-cols-1" :
            images.length === 2 ? "grid-cols-2" : "grid-cols-3"
          }`}
        >
          {images.map((img, i) => (
            <img
              key={`img-${i}`}
              src={img.url}
              alt={img.name || "image"}
              className="w-full h-44 object-cover rounded-md border"
            />
          ))}
        </div>
      )}

      {videos.length > 0 && (
        <div className="grid gap-2">
          {videos.map((v, i) => (
            <video
              key={`vid-${i}`}
              src={v.url}
              controls
              className="w-full rounded-md border"
            />
          ))}
        </div>
      )}

      {links.length > 0 && (
        <div className="grid gap-2">
          {links.map((l, i) => (
            <a
              key={`lnk-${i}`}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block border rounded-md p-3 bg-gray-50 hover:bg-gray-100 text-blue-700 break-all"
              title={l.url}
            >
              🔗 {l.url}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function PostCard({ post, isPinned, onReply, onDelete, currentUserId }) {
  const [showReactions, setShowReactions] = useState(false);
  const [reply, setReply] = useState("");

  const submitReply = () => {
    const t = reply.trim();
    if (!t) return;
    onReply?.(post.id, t);
    setReply("");
  };

  const canDelete = Boolean(onDelete) && post.authorId === currentUserId;

  return (
    <article
      className={`bg-white rounded-lg shadow p-4 border ${
        isPinned ? "border-[#ff8a65]" : "border-transparent"
      }`}
    >
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold text-gray-900 truncate">
            {post.author}
          </div>
          <div className="text-xs text-gray-500">
            <time dateTime={post.createdAt ? new Date(post.createdAt).toISOString() : new Date().toISOString()} aria-label={post.createdAt ? new Date(post.createdAt).toLocaleString() : new Date().toLocaleString()}>
              <RelativeTime iso={post.createdAt ? new Date(post.createdAt).toISOString() : new Date().toISOString()} />
            </time>
            {" • "}
            {post.type === "business" ? "Professional" : "Personal"}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
            onClick={() => alert("Report submitted — thank you.")}
          >
            Report post
          </button>

          {canDelete && (
            <button
              className="text-xs px-2 py-1 border rounded hover:bg-red-50 text-red-600 border-red-300"
              onClick={() => onDelete(post.id)}
              aria-label={`Delete post by ${post.author}`}
              title="Delete post"
            >
              Delete
            </button>
          )}
        </div>
      </header>

      <div className="mt-3 whitespace-pre-wrap text-gray-900">{post.body}</div>

      <AttachmentGallery attachments={post.attachments} />

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          className="text-sm px-2 py-1 border rounded hover:bg-gray-50"
          onClick={() => setShowReactions((s) => !s)}
          aria-expanded={showReactions}
        >
          React
        </button>

        {showReactions && (
          <div className="flex items-center gap-1 ml-1">
            {["👍","🔥","👏","💯","🎉","❤️"].map((e) => (
              <button
                key={e}
                className="px-2 py-1 text-lg hover:scale-110 transition"
                onClick={() => alert(`You reacted ${e}`)}
                aria-label={`React ${e}`}
              >
                {e}
              </button>
            ))}
          </div>
        )}
      </div>

      {post.comments?.length > 0 && (
        <div className="mt-3 space-y-1">
          {post.comments.map((c, i) => (
            <div key={i} className="text-sm">
              <span className="font-semibold text-gray-800">{c.by}</span>{" "}
              <span className="text-gray-700">{c.text}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        <input
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Write a reply…"
          className="flex-1 border rounded-md px-3 py-2"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submitReply();
            }
          }}
        />
        <button
          className="px-3 py-2 rounded-md bg-[#ff7043] text-white font-semibold disabled:opacity-40"
          onClick={submitReply}
          disabled={!reply.trim()}
        >
          Reply
        </button>
      </div>
    </article>
  );
}

export default function PostList({
  posts = [],
  filter = "both",
  pinnedId,
  onReply,
  onDelete,
  currentUserId,
}) {
  const filtered = useMemo(() => {
    if (filter === "both") return posts;
    return posts.filter((p) => p.type === (filter === "business" ? "business" : "personal"));
  }, [posts, filter]);

  if (!filtered.length) {
    return (
      <div className="text-center text-gray-500 py-10">
        No posts yet. Be the first to share something!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filtered.map((p) => (
        <PostCard
          key={p.id}
          post={p}
          isPinned={pinnedId === p.id}
          onReply={onReply}
          onDelete={onDelete}
          currentUserId={currentUserId}
        />
      ))}
    </div>
  );
}
