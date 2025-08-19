import { useEffect, useState } from "react";
import PostComposer from "./PostComposer";
import PostList from "./PostList";
import AdRail from "./AdRail";

const initialPosts = [
  {
    id: "p1",
    author: "Alex T.",
    createdAt: Date.now() - 1000 * 60 * 6,
    body: "Kicked off a customer journey mapping today—so many insights already.",
    type: "business",
    likes: 5,
    comments: [{ by: "Jamie", text: "Love this!" }],
  },
  {
    id: "p2",
    author: "Priya N.",
    createdAt: Date.now() - 1000 * 60 * 45,
    body: "Weekend hike was perfect 🌲",
    type: "personal",
    likes: 12,
    comments: [],
  },
];

export default function Feed() {
  const [filter, setFilter] = useState("all");          // 'all' | 'business' | 'personal'
  const [showComposer, setShowComposer] = useState(false);
  const [posts, setPosts] = useState(initialPosts);
  const [pinnedId, setPinnedId] = useState(null);       // id of the just-posted item

  // Auto-unpin after a short while (optional; tweak duration)
  useEffect(() => {
    if (!pinnedId) return;
    const t = setTimeout(() => setPinnedId(null), 12000);
    return () => clearTimeout(t);
  }, [pinnedId]);

  const handleNewPost = (post) => {
    setPosts((prev) => [post, ...prev]);
    setPinnedId(post.id);
    setShowComposer(false);
  };

  const handleReply = (postId, text) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, comments: [...p.comments, { by: "You", text }] } : p
      )
    );
  };

  return (
   <div className="mx-auto max-w-[1200px] px-4 pt-6 pb-10">
  {/* grid: main + right rail */}
  <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
    <div className="min-w-0">
      {/* feed filter row (tightened top spacing) */}
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
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.5rem center',
                backgroundSize: '12px 12px',
              }}
            >
              <option value="all">All</option>
              <option value="business">Business</option>
              <option value="personal">Personal</option>
            </select>
          </div>
        </div>
        <span className="text-xs text-gray-500">Showing most recent</span>
      </div>

          {/* Start a post button (overlay opener) */}
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <button
              onClick={() => setShowComposer(true)}
              className="w-full text-left text-gray-600 px-3 py-2 border rounded-md hover:bg-gray-50"
            >
              Start a post…
            </button>
          </div>

          {/* Feed list */}
          <PostList
            posts={posts}
            filter={filter}
            pinnedId={pinnedId}
            onReply={handleReply}
          />
        </div>

        {/* Right rail */}
        <AdRail />
      </div>

      {/* Composer Overlay */}
      {showComposer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 relative">
            {/* close button */}
            <button
              onClick={() => setShowComposer(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              aria-label="Close composer"
            >
              ✕
            </button>
            <PostComposer onPost={handleNewPost} />
          </div>
        </div>
      )}
    </div>
  );
}
