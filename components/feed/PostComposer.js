// components/feed/PostComposer.js
import { useState } from 'react';

export default function PostComposer({ onPost, onCancel }) {
  const [text, setText] = useState('');
  const [postType, setPostType] = useState(''); // "", "business", "personal"
  const [attachments, setAttachments] = useState([]); // [{type, url, name}]
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkValue, setLinkValue] = useState('');
  const [showEmojiBar, setShowEmojiBar] = useState(false);

  const EMOJIS = ['🔥', '💼', '🤝', '🚀', '🙏', '💪', '🛠️', '❤️'];

  const canPost =
    text.trim().length > 0 &&
    (postType === 'business' || postType === 'personal');

  const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  // ---- Attachments handlers ----
  const addImages = async (files) => {
    if (!files?.length) return;
    try {
      const promises = [...files].map(async (f) => {
        const dataUrl = await fileToDataUrl(f);
        return {
          type: 'image',
          url: dataUrl,
          name: f.name || 'image',
        };
      });
      const next = await Promise.all(promises);
      setAttachments((prev) => [...prev, ...next]);
    } catch (err) {
      console.error('Failed to read image files', err);
    }
  };

  const addVideos = async (files) => {
    if (!files?.length) return;
    try {
      const promises = [...files].map(async (f) => {
        const dataUrl = await fileToDataUrl(f);
        return {
          type: 'video',
          url: dataUrl,
          name: f.name || 'video',
        };
      });
      const next = await Promise.all(promises);
      setAttachments((prev) => [...prev, ...next]);
    } catch (err) {
      console.error('Failed to read video files', err);
    }
  };

  const addLink = () => {
    const url = linkValue.trim();
    if (!url) return;
    try {
      const u = new URL(url); // basic validation
      setAttachments((prev) => [
        ...prev,
        { type: 'link', url: u.toString(), name: u.hostname },
      ]);
      setLinkValue('');
      setShowLinkInput(false);
    } catch {
      // invalid URL, ignore for now
    }
  };

  const removeAttachment = (idx) => {
    setAttachments((prev) => {
      const copy = [...prev];
      copy.splice(idx, 1);
      return copy;
    });
  };

  const addEmoji = (emoji) => {
    setText((prev) => (prev || '') + emoji);
  };

  // ---- Submit ----
  const submit = () => {
    const body = text.trim();
    if (!canPost) return;

    onPost?.({
      id:
        (typeof crypto !== 'undefined' && crypto.randomUUID?.()) ||
        String(Date.now()),
      createdAt: Date.now(),
      body,
      type: postType, // required
      likes: 0,
      comments: [],
      attachments: attachments.map(({ type, url, name }) => ({
        type,
        url,
        name,
      })),
    });

    setText('');
    setPostType('');
    setAttachments([]);
    setShowLinkInput(false);
    setLinkValue('');
    setShowEmojiBar(false);
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

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {attachments.map((a, idx) => (
            <div
              key={idx}
              className="relative border rounded-md p-2 bg-gray-50 flex flex-col gap-2"
            >
              {a.type === 'image' && (
                <img
                  src={a.url}
                  alt={a.name || 'image'}
                  className="w-full h-28 object-cover rounded"
                />
              )}
              {a.type === 'video' && (
                <video
                  src={a.url}
                  controls
                  className="w-full h-28 object-cover rounded"
                />
              )}
              {a.type === 'link' && (
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 underline break-all"
                >
                  {a.url}
                </a>
              )}
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span className="truncate">{a.name}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(idx)}
                  className="text-gray-500 hover:text-gray-800"
                  aria-label="Remove attachment"
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Link entry (togglable) */}
      {showLinkInput && (
        <div className="mt-3 flex items-center gap-2">
          <input
            type="url"
            value={linkValue}
            onChange={(e) => setLinkValue(e.target.value)}
            placeholder="Paste a link (https://…)"
            className="flex-1 border rounded-md px-3 py-2"
          />
          <button
            type="button"
            onClick={addLink}
            className="px-3 py-2 rounded-md bg-gray-800 text-white hover:bg-gray-700"
          >
            Attach
          </button>
          <button
            type="button"
            onClick={() => {
              setShowLinkInput(false);
              setLinkValue('');
            }}
            className="px-3 py-2 rounded-md border"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Emoji bar */}
      {showEmojiBar && (
        <div className="mt-3 flex flex-wrap gap-2 text-lg">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => addEmoji(emoji)}
              className="px-2 py-1 border rounded-md hover:bg-gray-100"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Bottom controls – inside the card, not stretched */}
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        {/* Left: attachment controls */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-700">
          <input
            id="feed-image-input"
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              addImages(e.target.files);
              e.target.value = '';
            }}
          />
          <label
            htmlFor="feed-image-input"
            className="inline-flex items-center gap-1 hover:text-gray-900 cursor-pointer"
          >
            <span role="img" aria-label="photo">
              📷
            </span>
            Photo
          </label>

          <input
            id="feed-video-input"
            type="file"
            accept="video/mp4,video/webm"
            multiple
            className="hidden"
            onChange={(e) => {
              addVideos(e.target.files);
              e.target.value = '';
            }}
          />
          <label
            htmlFor="feed-video-input"
            className="inline-flex items-center gap-1 hover:text-gray-900 cursor-pointer"
          >
            <span role="img" aria-label="video">
              🎥
            </span>
            Video
          </label>

          <button
            type="button"
            className="inline-flex items-center gap-1 hover:text-gray-900"
            onClick={() => setShowLinkInput((v) => !v)}
          >
            <span role="img" aria-label="link">
              🔗
            </span>
            Link
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-1 hover:text-gray-900"
            onClick={() => setShowEmojiBar((v) => !v)}
          >
            <span role="img" aria-label="emoji">
              🙂
            </span>
            Emoji
          </button>
        </div>

        {/* Right: type selector + Post/Cancel */}
        <div className="flex flex-wrap items-center justify-start gap-2 sm:gap-3">
          <label className="text-sm text-gray-600 hidden sm:block">
            Post as<span className="text-red-500">*</span>:
          </label>

          <div className="inline-flex rounded-md border overflow-hidden">
            <button
              type="button"
              onClick={() => setPostType('business')}
              className={`px-3 py-1 text-sm ${
                postType === 'business'
                  ? 'bg-[#ff8a65] text-white'
                  : 'bg-white'
              }`}
              aria-pressed={postType === 'business'}
            >
              Business
            </button>
            <button
              type="button"
              onClick={() => setPostType('personal')}
              className={`px-3 py-1 text-sm ${
                postType === 'personal'
                  ? 'bg-[#ff8a65] text-white'
                  : 'bg-white'
              }`}
              aria-pressed={postType === 'personal'}
            >
              Personal
            </button>
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={!canPost}
            className="bg-[#ff7043] text-white font-semibold px-4 py-2 rounded-md disabled:opacity-40 disabled:cursor-not-allowed"
            title={
              !canPost
                ? 'Write something and choose Business or Personal'
                : 'Post'
            }
          >
            Post
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-2 rounded-md border text-sm"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* gentle nudge when type unselected */}
      {!postType && text.trim() && (
        <div className="mt-2 text-xs text-red-500">
          Please choose Business or Personal before posting.
        </div>
      )}
    </section>
  );
}
