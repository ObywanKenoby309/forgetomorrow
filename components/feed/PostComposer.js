// components/feed/PostComposer.js
import { useMemo, useState } from 'react';

export default function PostComposer({
  onPost,
  onCancel,
  canPostHiring = false,
  canPostCoachingOffer = false,
}) {
  const [text, setText] = useState('');
  const [postType, setPostType] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkValue, setLinkValue] = useState('');
  const [showEmojiBar, setShowEmojiBar] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const EMOJIS = useMemo(() => ['🔥', '💼', '🤝', '🚀', '🙏', '💪', '🛠️', '❤️'], []);

  const STARTER_PROMPTS = useMemo(() => {
    const prompts = [
      'Sharing a win:',
      'Looking for advice on',
      'Open to opportunities in',
      'Sharing an idea about',
    ];

    if (canPostCoachingOffer) {
      prompts.push('Coaching insight:');
      prompts.push('Hosting a workshop on');
    }

    if (canPostHiring) {
      prompts.push('Hiring for');
    }

    return prompts;
  }, [canPostCoachingOffer, canPostHiring]);

  const canPost =
    !uploading &&
    text.trim().length > 0 &&
    (postType === 'business' || postType === 'personal');

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

  const addStarterPrompt = (prompt) => {
    setText((prev) => {
      const current = prev.trim();
      if (!current) return `${prompt} `;
      return prev;
    });
  };

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
    <section className="w-full rounded-[26px] border border-white/60 bg-white/80 backdrop-blur-xl shadow-[0_16px_50px_rgba(15,23,42,0.08)] p-4 sm:p-5">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[18px] sm:text-[20px] font-bold text-gray-900">
              Share a signal
            </div>
            <div className="mt-1 text-sm text-gray-600">
              Post a win, update, idea, opportunity, or question for the community.
            </div>
          </div>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="shrink-0 px-3 py-2 rounded-xl border border-gray-200 bg-white/90 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {STARTER_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => addStarterPrompt(prompt)}
              className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50/80 px-3 py-1.5 text-xs font-semibold text-[#c85b33] hover:bg-orange-100"
            >
              {prompt}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-gray-200/80 bg-white/90 overflow-hidden">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What’s happening in your career world right now?"
            className="w-full resize-none border-0 p-4 bg-transparent text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
            rows={5}
          />

          <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-4 py-2.5 bg-white/70">
            <div className="text-xs text-gray-500">
              Keep it useful, clear, and signal-driven.
            </div>
            <div className="text-xs font-medium text-gray-400">
              {text.trim().length} characters
            </div>
          </div>
        </div>

        {uploading && (
          <div className="flex items-center gap-2 rounded-2xl border border-orange-200 bg-orange-50 px-3 py-2.5 text-sm text-orange-600">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Uploading…
          </div>
        )}

        {submitError && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-2xl px-3 py-2.5">
            {submitError}
          </div>
        )}

        {attachments.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {attachments.map((a, idx) => (
              <div
                key={idx}
                className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white/90 shadow-sm"
              >
                {a.type === 'image' && (
                  <img
                    src={a.url}
                    alt={a.name || 'image'}
                    className="w-full h-36 object-cover"
                  />
                )}

                {a.type === 'video' && (
                  <video
                    src={a.url}
                    controls
                    className="w-full h-36 object-cover bg-black"
                  />
                )}

                {a.type === 'link' && (
                  <div className="p-4 flex flex-col gap-2 min-h-[144px] justify-between">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Link
                    </div>
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-blue-600 underline break-all"
                    >
                      {a.url}
                    </a>
                    <div className="text-xs text-gray-500 truncate">{a.name}</div>
                  </div>
                )}

                {a.type !== 'link' && (
                  <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-t border-gray-100 bg-white">
                    <span className="truncate text-xs font-medium text-gray-600">
                      {a.name}
                    </span>
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
                )}

                {a.type === 'link' && (
                  <button
                    type="button"
                    onClick={() => removeAttachment(idx)}
                    className="absolute top-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:text-gray-800"
                    aria-label="Remove attachment"
                    title="Remove"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {showLinkInput && (
          <div className="rounded-2xl border border-gray-200 bg-white/85 p-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <input
                type="url"
                value={linkValue}
                onChange={(e) => setLinkValue(e.target.value)}
                placeholder="Paste a link (https://...)"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={addLink}
                  className="px-3 py-2.5 rounded-xl bg-gray-900 text-white hover:bg-gray-800 text-sm font-semibold"
                >
                  Attach
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLinkInput(false);
                    setLinkValue('');
                  }}
                  className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {showEmojiBar && (
          <div className="flex flex-wrap gap-2">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => addEmoji(emoji)}
                className="px-3 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 bg-white text-lg"
                aria-label={`Insert ${emoji}`}
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2.5 text-sm text-gray-700">
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
              className={`inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer font-medium ${
                uploading ? 'opacity-50 pointer-events-none' : ''
              }`}
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
              onChange={(e) => {
                addVideos(e.target.files);
                e.target.value = '';
              }}
            />
            <label
              htmlFor="feed-video-input"
              className={`inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer font-medium ${
                uploading ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              <span role="img" aria-label="video">🎥</span>
              Video
            </label>

            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 font-medium"
              onClick={() => setShowLinkInput((v) => !v)}
            >
              <span role="img" aria-label="link">🔗</span>
              Link
            </button>

            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 font-medium"
              onClick={() => setShowEmojiBar((v) => !v)}
            >
              <span role="img" aria-label="emoji">🙂</span>
              Emoji
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2.5">
            <div className="inline-flex rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
              <button
                type="button"
                onClick={() => setPostType('business')}
                className={`px-4 py-2.5 text-sm font-semibold ${
                  postType === 'business'
                    ? 'bg-[#ff8a65] text-white'
                    : 'bg-white text-gray-800 hover:bg-gray-50'
                }`}
                aria-pressed={postType === 'business'}
              >
                Business
              </button>
              <button
                type="button"
                onClick={() => setPostType('personal')}
                className={`px-4 py-2.5 text-sm font-semibold ${
                  postType === 'personal'
                    ? 'bg-[#ff8a65] text-white'
                    : 'bg-white text-gray-800 hover:bg-gray-50'
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
              className="bg-[#ff7043] text-white font-extrabold px-5 py-2.5 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-95 shadow-[0_10px_24px_rgba(255,112,67,0.22)]"
              title={!canPost ? 'Write something and choose Business or Personal' : 'Post'}
            >
              {uploading ? 'Uploading…' : 'Post signal'}
            </button>
          </div>
        </div>

        {!postType && text.trim() && (
          <div className="text-xs text-red-500">
            Please choose Business or Personal before posting.
          </div>
        )}
      </div>
    </section>
  );
}