// pages/messages.js
import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import SeekerRightColumn from '@/components/seeker/SeekerRightColumn';

export default function MessagesPage() {
  const router = useRouter();
  const { toId, toName } = router.query;

  const displayName = Array.isArray(toName) ? toName[0] : toName;
  const [message, setMessage] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Stub for now — backend wiring comes next
    alert(
      `Direct messaging backend is coming next.\n\nYou attempted to send:\n\nTo: ${
        displayName || 'Member'
      }\nMessage: ${message.trim()}`
    );
    setMessage('');
  };

  return (
    <>
      <Head>
        <title>ForgeTomorrow — Messages</title>
      </Head>

      <SeekerLayout
        title="Messages | ForgeTomorrow"
        right={<SeekerRightColumn variant="default" />}
        activeNav="messages"
        header={
          <section
            aria-label="Messages header"
            style={{
              background: 'white',
              borderRadius: 12,
              padding: 16,
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              border: '1px solid #eee',
              textAlign: 'center',
            }}
          >
            <h1
              style={{
                margin: 0,
                color: '#FF7043',
                fontSize: 24,
                fontWeight: 800,
              }}
            >
              Messages
            </h1>
            <p
              style={{
                margin: '6px auto 0',
                color: '#607D8B',
                maxWidth: 720,
              }}
            >
              Start a conversation with members from your Community Feed.
            </p>
          </section>
        }
      >
        <div className="mt-4 grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4">
          {/* Left: placeholder for conversations list */}
          <section className="bg-white rounded-lg shadow p-4 border border-gray-100">
            <h2 className="text-sm font-semibold text-gray-800 mb-2">
              Conversations
            </h2>
            <p className="text-xs text-gray-600">
              Your recent message threads will appear here once direct messaging
              is fully enabled.
            </p>
          </section>

          {/* Right: new message composer */}
          <section className="bg-white rounded-lg shadow p-4 border border-gray-100">
            <h2 className="text-sm font-semibold text-gray-800 mb-2">
              {displayName
                ? `New message to ${displayName}`
                : 'Start a new message'}
            </h2>
            {!displayName && (
              <p className="text-xs text-gray-600 mb-3">
                To start a conversation, open the Community Feed, click a
                member&apos;s name or photo, and choose <strong>Message</strong>.
              </p>
            )}

            <form onSubmit={handleSend} className="space-y-3">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  displayName
                    ? `Write a message to ${displayName}…`
                    : 'Write a message…'
                }
                className="w-full border rounded-md px-3 py-2 text-sm min-h-[120px]"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!message.trim()}
                  className="px-4 py-2 rounded-md bg-[#ff8a65] text-white text-sm font-semibold disabled:opacity-50"
                >
                  Send (UI only for now)
                </button>
              </div>
              <p className="text-[11px] text-gray-500">
                This is the first version of messaging. The full, persistent
                messaging backend will be added next.
              </p>
            </form>
          </section>
        </div>
      </SeekerLayout>
    </>
  );
}
