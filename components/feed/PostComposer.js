// components/feed/PostComposer.js
import { useState } from "react";

export default function PostComposer({ onPost }) {
  const [text, setText] = useState("");
  // start blank -> must choose before posting
  const [postType, setPostType] = useState(""); // "", "business", "personal"
  const canPost = text.trim().length > 0 && (postType === "business" || postType === "personal");

  const submit = () => {
    const body = text.trim();
    if (!canPost) return;
    onPost?.({
      id: crypto.randomUUID?.() || String(Date.now()),
      author: "You",
      createdAt: Date.now(),
      body,
      type: postType, // required
      likes: 0,
      comments: [],
    });
    setText("");
    setPostType(""); // reset to blank
  };

  return (
    <section className="bg-white rounded-lg shadow p-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What's on your mind?"
        className="w-full border rounded-md p-3 bg-white"
        rows={3}
      />

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: attachments */}
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <button type="button" className="inline-flex items-center gap-1 hover:text-gray-800">
            <span role="img" aria-label="photo">📷</span> Photo
          </button>
          <button type="button" className="inline-flex items-center gap-1 hover:text-gray-800">
            <span role="img" aria-label="video">🎥</span> Video
          </button>
          <button type="button" className="inline-flex items-center gap-1 hover:text-gray-800">
            <span role="img" aria-label="link">🔗</span> Link
          </button>
        </div>

        {/* Right: type selector + Post */}
        <div className="flex items-center gap-2 sm:gap-3">
          <label className="text-sm text-gray-600 hidden sm:block">Post as<span className="text-red-500">*</span>:</label>

          {/* compact pills right beside Post */}
          <div className="inline-flex rounded-md border overflow-hidden">
            <button
              type="button"
              onClick={() => setPostType("business")}
              className={`px-3 py-1 text-sm ${postType === "business" ? "bg-[#ff8a65] text-white" : "bg-white"}`}
              aria-pressed={postType === "business"}
            >
              Business
            </button>
            <button
              type="button"
              onClick={() => setPostType("personal")}
              className={`px-3 py-1 text-sm ${postType === "personal" ? "bg-[#ff8a65] text-white" : "bg-white"}`}
              aria-pressed={postType === "personal"}
            >
              Personal
            </button>
          </div>

          <button
            onClick={submit}
            disabled={!canPost}
            className="bg-[#ff7043] text-white font-semibold px-4 py-2 rounded-md disabled:opacity-40 disabled:cursor-not-allowed"
            title={!canPost ? "Write something and choose Business or Personal" : "Post"}
          >
            Post
          </button>
        </div>
      </div>

      {/* gentle nudge when type unselected */}
      {!postType && text.trim() && (
        <div className="mt-2 text-xs text-red-500">Please choose Business or Personal before posting.</div>
      )}
    </section>
  );
}
