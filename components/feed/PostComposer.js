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
    <section className="w-full rounded-[22px] border border-white/35 bg-[linear-gradient(160deg,rgba(255,255,255,0.22),rgba(255,255,255,0.10))] backdrop-blur-[28px] backdrop-saturate-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_20px_50px_-24px_rgba(50,20,10,0.35)] p-4 sm:p-5">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[18px] sm:text-[20px] font-extrabold text-[#3a2418]">
              Share a signal
            </div>
            <div className="mt-1 text-sm text-[#8a5d44]">
              Post a win, update, idea, opportunity, or question for the community.
            </div>
          </div>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="shrink-0 px-3 py-2 rounded-xl border border-white/50 bg-white/40 text-sm font-semibold text-[#6b4a3a] hover:bg-white/60 transition"
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
              className="inline-flex items-center rounded-full border border-[rgba(255,112,67,0.28)] bg-[rgba(255,112,67,0.12)] px-3 py-1.5 text-xs font-bold text-[#a8431b] hover:bg-[rgba(255,112,67,0.2)] hover:-translate-y-0.5 transition-all duration-150"
            >
              {prompt}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-white/50 bg-white/45 overflow-hidden">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What’s happening in your career world right now?"
            className="w-full resize-none border-0 p-4 bg-transparent text-[15px] text-[#3a2418] placeholder:text-[#b48b78] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[rgba(255,112,67,0.4)]"
            rows={5}
          />

          <div className="flex items-center justify-between gap-3 border-t border-white/40 px-4 py-2.5 bg-white/25">
            <div className="text-xs text-[#a8775f]">
              Keep it useful, clear, and signal-driven.
            </div>
            <div className="text-xs font-semibold text-[#c79a86]">
              {text.trim().length} characters
            </div>
          </div>
        </div>

        {uploading && (
          <div className="flex items-center gap-2 rounded-2xl border border-[rgba(255,112,67,0.28)] bg-[rgba(255,112,67,0.12)] px-3 py-2.5 text-sm font-semibold text-[#a8431b]">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Uploading…
          </div>
        )}

        {submitError && (
          <div className="text-sm text-[#b91c1c] bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] rounded-2xl px-3 py-2.5">
            {submitError}
          </div>
        )}

        {attachments.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {attachments.map((a, idx) => (
              <div
                key={idx}
                className="relative overflow-hidden rounded-2xl border border-white/45 bg-white/30"
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
                    <div className="text-xs font-bold uppercase tracking-wide text-[#c79a86]">
                      Link
                    </div>
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-[#4f8cff] underline break-all"
                    >
                      {a.url}
                    </a>
                    <div className="text-xs text-[#a8775f] truncate">{a.name}</div>
                  </div>
                )}

                {a.type !== 'link' && (
                  <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-t border-white/40 bg-white/25">
                    <span className="truncate text-xs font-semibold text-[#6b4a3a]">
                      {a.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(idx)}
                      className="text-[#8a5d44] hover:text-[#3a2418]"
                      aria-label="Remove attachment"
                      title="Remove"
                    >
                      <svg className="w-[16px] h-[16px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}

                {a.type === 'link' && (
                  <button
                    type="button"
                    onClick={() => removeAttachment(idx)}
                    className="absolute top-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/50 bg-white/60 text-[#8a5d44] hover:text-[#3a2418] hover:bg-white/80 transition"
                    aria-label="Remove attachment"
                    title="Remove"
                  >
                    <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {showLinkInput && (
          <div className="rounded-2xl border border-white/45 bg-white/30 p-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <input
                type="url"
                value={linkValue}
                onChange={(e) => setLinkValue(e.target.value)}
                placeholder="Paste a link (https://...)"
                className="flex-1 border border-white/50 rounded-xl px-3 py-2.5 bg-white/50 text-[#3a2418] placeholder:text-[#b48b78] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[rgba(255,112,67,0.4)]"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={addLink}
                  className="px-3 py-2.5 rounded-xl bg-gradient-to-br from-[#FF7043] to-[#E55A2B] text-white text-sm font-bold shadow-[0_10px_24px_-10px_rgba(255,112,67,0.55)] hover:-translate-y-0.5 hover:shadow-[0_14px_28px_-10px_rgba(255,112,67,0.65)] transition-all duration-150"
                >
                  Attach
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLinkInput(false);
                    setLinkValue('');
                  }}
                  className="px-3 py-2.5 rounded-xl border border-white/50 bg-white/40 hover:bg-white/60 text-sm font-semibold text-[#6b4a3a] transition"
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
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/50 bg-white/40 hover:bg-[rgba(255,112,67,0.15)] hover:border-[rgba(255,112,67,0.3)] hover:-translate-y-1 hover:scale-110 text-lg transition-all duration-150"
                aria-label={`Insert ${emoji}`}
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2.5 text-sm text-[#6b4a3a]">
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
              className={`inline-flex items-center gap-1.5 px-3 py-2.5 rounded-full border border-white/50 bg-white/40 hover:bg-white/60 hover:-translate-y-0.5 cursor-pointer font-bold transition-all duration-150 ${
                uploading ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.5-3.5L9 18" />
              </svg>
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
              className={`inline-flex items-center gap-1.5 px-3 py-2.5 rounded-full border border-white/50 bg-white/40 hover:bg-white/60 hover:-translate-y-0.5 cursor-pointer font-bold transition-all duration-150 ${
                uploading ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m22 8-6 4 6 4V8Z" />
                <rect x="2" y="6" width="14" height="12" rx="2" />
              </svg>
              Video
            </label>

            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-full border border-white/50 bg-white/40 hover:bg-white/60 hover:-translate-y-0.5 font-bold transition-all duration-150"
              onClick={() => setShowLinkInput((v) => !v)}
            >
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07l-1.5 1.5" />
                <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07l1.5-1.5" />
              </svg>
              Link
            </button>

            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-full border border-white/50 bg-white/40 hover:bg-white/60 hover:-translate-y-0.5 font-bold transition-all duration-150"
              onClick={() => setShowEmojiBar((v) => !v)}
            >
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M9 9h.01M15 9h.01M8.5 14.5a4 4 0 0 0 7 0" />
              </svg>
              Emoji
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2.5">
            <div className="inline-flex rounded-full border border-white/50 bg-white/35 overflow-hidden">
              <button
                type="button"
                onClick={() => setPostType('business')}
                className={`px-4 py-2.5 text-sm font-extrabold transition-all duration-150 ${
                  postType === 'business'
                    ? 'text-white bg-gradient-to-br from-[#6fa8ff] to-[#4f8cff] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]'
                    : 'text-[#6b4a3a] hover:bg-white/30'
                }`}
                aria-pressed={postType === 'business'}
              >
                Business
              </button>
              <button
                type="button"
                onClick={() => setPostType('personal')}
                className={`px-4 py-2.5 text-sm font-extrabold transition-all duration-150 ${
                  postType === 'personal'
                    ? 'text-white bg-gradient-to-br from-[#a679ff] to-[#7c5cff] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]'
                    : 'text-[#6b4a3a] hover:bg-white/30'
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
              className="inline-flex items-center gap-2 bg-gradient-to-br from-[#FF7043] to-[#E55A2B] text-white font-extrabold px-5 py-2.5 rounded-full disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[0_10px_24px_-10px_rgba(255,112,67,0.55)] hover:-translate-y-0.5 shadow-[0_10px_24px_-10px_rgba(255,112,67,0.55)] hover:shadow-[0_14px_28px_-10px_rgba(255,112,67,0.65)] transition-all duration-150"
              title={!canPost ? 'Write something and choose Business or Personal' : 'Post'}
            >
              {uploading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Uploading…
                </>
              ) : (
                <>
                  Post signal
                  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>

        {!postType && text.trim() && (
          <div className="text-xs font-semibold text-[#c0392b]">
            Please choose Business or Personal before posting.
          </div>
        )}
      </div>
    </section>
  );
}