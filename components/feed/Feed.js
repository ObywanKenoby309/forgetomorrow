// components/feed/Feed.js
import { useEffect, useState } from "react";
import PostComposer from "./PostComposer";
import PostList from "./PostList";

// For now, simple stub. Later we can pull from session.
const currentUserId = "me";
const currentUserName = "You";

export default function Feed() {
  const [filter, setFilter] = useState("both");
  const [showComposer, setShowComposer] = useState(false);
  const [posts, setPosts] = useState([]);

  // Load posts from API (shared across roles)
  useEffect(() => {
    fetch("/api/feed")
      .then((res) => res.json())
      .then((data) => {
        const normalized = (data.posts || []).map((p) => ({
          id: p.id,
          authorId: p.authorId ?? "anon",
          author: p.author ?? "ForgeTomorrow",
          text: p.text ?? "",
          type: p.type ?? "business",
          audience: p.audience ?? "both",
          createdAt: p.createdAt ?? Date.now(),
          likes: p.likes ?? 0,
          comments: Array.isArray(p.comments) ? p.comments : [],
        }));
        setPosts(normalized);
      })
      .catch((err) => console.log("Feed error:", err));
  }, []);

  useEffect(() => {
    if (!showComposer) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showComposer]);

  const handleNewPost = async (post) => {
    // post likely contains { text, type, audience }
    const payload = {
      text: post.text,
      type: post.type,
      audience: post.audience,
      authorId: currentUserId,
      authorName: currentUserName,
    };

    try {
      const res = await fetch("/api/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.error("Failed to create post", await res.text());
        // Fallback: local optimistic insert
        const safePost = {
          id: `temp_${Date.now()}`,
          authorId: currentUserId,
          author: currentUserName,
          createdAt: Date.now(),
          type: post.type || "business",
          audience: post.audience || "both",
          likes: 0,
          comments: [],
          text: post.text || "",
        };
        setPosts((prev) => [safePost, ...prev]);
      } else {
        const data = await res.json();
        const saved = data.post;
        setPosts((prev) => [saved, ...prev]);
      }
    } catch (err) {
      console.error("Feed POST error:", err);
    } finally {
      setShowComposer(false);
    }
  };

  const handleReply = (postId, text) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              comments: [...(p.comments || []), { by: currentUserName, text }],
            }
          : p
      )
    );
  };

  const handleDelete = (postId) => {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  return (
    <div className="mx-auto w-full max-w-none px-2 sm:px-6 pt-6 pb-10">
      {/* filter row */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-700">Showing</span>
          <div className="inline-flex items-center gap-2 bg-white border border-gray-300 rounded-md shadow-sm px-2 py-1">
            <select
              id="feedFilter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="text-sm bg-white outline-none pr-8 appearance-none"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 20 20'><path fill='%236b7280' d='M5 7l5 6 5-6H5z'/></svg>\")",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 0.5rem center",
                backgroundSize: "12px 12px",
              }}
            >
              <option value="both">Both</option>
              <option value="business">Professional</option>
              <option value="personal">Personal</option>
            </select>
          </div>
        </div>
        <span className="text-xs text-gray-500">Showing most recent</span>
      </div>

      {/* start a post */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <button
          onClick={() => setShowComposer(true)}
          className="w-full text-left text-gray-600 px-3 py-2 border rounded-md hover:bg-gray-50"
        >
          Start a post…
        </button>
      </div>

      {/* feed list */}
      <PostList
        posts={posts}
        filter={filter}
        onReply={handleReply}
        onDelete={handleDelete}
        currentUserId={currentUserId}
      />

      {/* composer overlay */}
      {showComposer && (
        <div
          className="fixed inset-0 z-[60]"
          onKeyDown={(e) => e.key === "Escape" && setShowComposer(false)}
          tabIndex={-1}
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowComposer(false)}
            aria-hidden="true"
          />
          <div className="relative h-full w-full flex items-center justify-center p-4">
            <div className="w-full max-w-3xl bg-white rounded-xl shadow-2xl ring-1 ring-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <h3 className="font-semibold text-gray-800">Create post</h3>
                <button
                  onClick={() => setShowComposer(false)}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Close composer"
                >
                  ✕
                </button>
              </div>
              <div className="p-4">
                <PostComposer onPost={handleNewPost} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
