import { useEffect, useState } from "react";
import PostComposer from "./PostComposer";
import PostList from "./PostList";

// seed
const initialPosts = [
  {
    id: "p1",
    author: "Alex T.",
    createdAt: Date.now() - 1000 * 60 * 6,
    body:
      "Kicked off a customer journey mapping today—so many insights already.",
    type: "business", // 'business' | 'personal'
    likes: 5,
    comments: [{ by: "Jane", text: "Love this!" }],
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
  // 'both' | 'business' | 'personal'
  const [filter, setFilter] = useState("both");
  const [showComposer, setShowComposer] = useState(false);
  const [posts, setPosts] = useState(initialPosts);
  const [pinnedId, setPinnedId] = useState(null);

  // auto-unpin “new post” highlight
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
        p.id === postId
          ? { ...p, comments: [...p.comments, { by: "You", text }] }
          : p
      )
    );
  };

  // lock body scroll when composer is open
  useEffect(() => {
    if (!showComposer) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showComposer]);

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
        pinnedId={pinnedId}
        onReply={handleReply}
      />

      {/* composer overlay */}
      {showComposer && (
        <div
          className="fixed inset-0 z-[60]"
          onKeyDown={(e) => e.key === "Escape" && setShowComposer(false)}
          tabIndex={-1}
        >
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowComposer(false)}
            aria-hidden="true"
          />

          {/* centered modal */}
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
