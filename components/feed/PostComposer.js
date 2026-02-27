// components/feed/PostComposer.js
import { useMemo, useState } from 'react';

export default function PostComposer({ onPost, onCancel }) {
  const [text, setText] = useState('');
  const [postType, setPostType] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkValue, setLinkValue] = useState('');
  const [showEmojiBar, setShowEmojiBar] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const EMOJIS = useMemo(() => ['🔥', '💼', '🤝', '🚀', '🙏', '💪', '🛠️', '❤️'], []);

  const canPost =
    !uploading &&
    text.trim().length > 0 &&
    (postType === 'business' || postType === 'personal');

  // ─── Upload files to Supabase via /api/feed/upload ──────────────────────
  const uploadFiles = async (files, type) => {
    if (!files?.length) return;
    setUploading(true);
    setSubmitError('');

    try {
      const formData = new FormData();
      [...files].forEach((f) => formData.append('file', f));

      const res = await fetch('/api/feed/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Upload failed (${res.status})`);
      }

      const { attachments: uploaded } = await res.json();
      setAttachments((prev) => [...prev, ...uploaded]);
    } catch (err) {
      console.error('Upload error', err);
      setSubmitError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const addImages = (files) => uploadFiles(files, 'image');
  const addVideos = (files) => uploadFiles(files, 'video');

  const addLink = () => {
    const url = linkValue.trim();
    if (!url) return;
    try {
      const u = new URL(url);
      setAttachments((prev) => [
        ...prev,
        { type: 'link', url: u.toString(), name: u.hostname },
      ]);
      setLinkValue('');
      setShowLinkInput(false);
    } catch {
      // invalid URL, ignore
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

  // ─── Submit — only clears state if the API call succeeds ────────────────
  const submit = async () => {
    const body = text.trim();
    if (!canPost) return;
    setSubmitError('');

    try {
      await onPost?.({
        body,
        type: postType,
        attachments: attachments.map(({ type, url, name }) => ({ type, url, name })),
      });

      // Only clear if onPost resolved without throwing
      setText('');
      setPostType('');
      setAttachments([]);
      setShowLinkInput(false);
      setLinkValue('');
      setShowEmojiBar(false);
    } catch (err) {
      console.error('Post failed', err);
      setSubmitError(err.message || 'Post failed. Your content is still here — please try again.');
    }
  };

  return (
    <section className="w-full rounded-2xl border border-gray-200 bg-white/85 backdrop-blur p-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Share a win, ask a question, or post an update…"
        className="w-full border border-gray-200 rounded-2xl p-4 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
        rows={4}
      />

      {/* Upload progress indicator */}
      {uploading && (
        <div className="mt-2 flex items-center gap-2 text-sm text-orange-500">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Uploading…
        </div>
      )}

      {/* Error message */}
      {submitError && (
        <div className="mt-2 text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          {submitError}
        </div>
      )}

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {attachments.map((a, idx) => (
            <div
              key={idx}
              className="relative border border-gray-200 rounded-xl p-2 bg-gray-50 flex flex-col gap-2 overflow-hidden"
            >
              {a.type === 'image' && (
                <img
                  src={a.url}
                  alt={a.name || 'image'}
                  className="w-full h-28 object-cover rounded-lg"
                />
              )}
              {a.type === 'video' && (
                <video
                  src={a.url}
                  controls
                  className="w-full h-28 object-cover rounded-lg"
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

      {/* Link entry */}
      {showLinkInput && (
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-2">
          <input
            type="url"
            value={linkValue}
            onChange={(e) => setLinkValue(e.target.value)}
            placeholder="Paste a link (https://…)"
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={addLink}
              className="px-3 py-2 rounded-xl bg-gray-900 text-white hover:bg-gray-800"
            >
              Attach
            </button>
            <button
              type="button"
              onClick={() => { setShowLinkInput(false); setLinkValue(''); }}
              className="px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Emoji bar */}
      {showEmojiBar && (
        <div className="mt-4 flex flex-wrap gap-2 text-lg">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => addEmoji(emoji)}
              className="px-2.5 py-1.5 border border-gray-200 rounded-xl hover:bg-gray-50 bg-white"
              aria-label={`Insert ${emoji}`}
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Bottom controls */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left controls */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-700">
          <input
            id="feed-image-input"
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => { addImages(e.target.files); e.target.value = ''; }}
          />
          <label
            htmlFor="feed-image-input"
            className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <span role="img" aria-label="photo">📷</span>
            Photo
          </label>

          <input
            id="feed-video-input"
            type="file"
            accept="video/mp4,video/webm"
            multiple
            className="hidden"
            onChange={(e) => { addVideos(e.target.files); e.target.value = ''; }}
          />
          <label
            htmlFor="feed-video-input"
            className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <span role="img" aria-label="video">🎥</span>
            Video
          </label>

          <button
            type="button"
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50"
            onClick={() => setShowLinkInput((v) => !v)}
          >
            <span role="img" aria-label="link">🔗</span>
            Link
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50"
            onClick={() => setShowEmojiBar((v) => !v)}
          >
            <span role="img" aria-label="emoji">🙂</span>
            Emoji
          </button>
        </div>

        {/* Right controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="inline-flex rounded-xl border border-gray-200 overflow-hidden bg-white">
            <button
              type="button"
              onClick={() => setPostType('business')}
              className={`px-3 py-2 text-sm font-semibold ${postType === 'business' ? 'bg-[#ff8a65] text-white' : 'bg-white text-gray-800 hover:bg-gray-50'}`}
              aria-pressed={postType === 'business'}
            >
              Business
            </button>
            <button
              type="button"
              onClick={() => setPostType('personal')}
              className={`px-3 py-2 text-sm font-semibold ${postType === 'personal' ? 'bg-[#ff8a65] text-white' : 'bg-white text-gray-800 hover:bg-gray-50'}`}
              aria-pressed={postType === 'personal'}
            >
              Personal
            </button>
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={!canPost}
            className="bg-[#ff7043] text-white font-extrabold px-5 py-2.5 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-95"
            title={!canPost ? 'Write something and choose Business or Personal' : 'Post'}
          >
            {uploading ? 'Uploading…' : 'Post'}
          </button>
        </div>
      </div>

      {!postType && text.trim() && (
        <div className="mt-3 text-xs text-red-500">
          Please choose Business or Personal before posting.
        </div>
      )}
    </section>
  );
}