// components/feed/PostCommentsModal.js
import { createPortal } from 'react-dom';
import PostDetailContent from './PostDetailContent';

export default function PostCommentsModal({ post, onClose, onReply }) {
  if (!post) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[99999] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-5"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex h-[94dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-[26px] border border-white/50 bg-[rgba(255,250,245,0.94)] backdrop-blur-[28px] backdrop-saturate-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_28px_90px_rgba(50,20,10,0.35)] sm:h-[88vh] sm:rounded-[30px]"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-30 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/50 bg-white/70 text-[#6b4a3a] shadow-sm transition hover:bg-white/90 hover:text-[#3a2418]"
          aria-label="Close"
        >
          <svg className="w-[20px] h-[20px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        <PostDetailContent post={post} onReply={onReply} variant="modal" />
      </div>
    </div>,
    document.body
  );
}