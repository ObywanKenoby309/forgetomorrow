// components/messaging/MessageCandidateButton.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/router';

export default function MessageCandidateButton({ candidateId, size = 'md' }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (!candidateId) return null;

  const label = 'Message candidate';

  const baseClasses =
    'inline-flex items-center justify-center rounded-full font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF7043]';

  const sizeClasses =
    size === 'sm'
      ? 'text-xs px-3 py-1.5'
      : size === 'lg'
      ? 'text-sm px-4 py-2'
      : 'text-sm px-3 py-1.5';

  const colorClasses =
    'bg-[#FF7043] text-white hover:bg-[#F4511E] disabled:opacity-70 disabled:cursor-not-allowed';

  async function handleClick() {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch('/api/messages/start-thread', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error('[MessageCandidateButton] error', data);
        alert(data?.error || 'Unable to open messaging. Please try again.');
        return;
      }

      const conversationId = data.conversationId;

      if (!conversationId) {
        alert('Messaging is not available right now. Please try again later.');
        return;
      }

      // 🔑 Adjust this line if your messaging page uses a different param/route
      router.push(`/recruiter/messaging?conversationId=${conversationId}`);
    } catch (err) {
      console.error('[MessageCandidateButton] unexpected error', err);
      alert('Something went wrong starting this conversation.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`${baseClasses} ${sizeClasses} ${colorClasses}`}
    >
      {loading ? 'Opening…' : label}
    </button>
  );
}
