// pages/seeker/messages.js
import dynamic from 'next/dynamic';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';

// Load SignalMessages only on the client to avoid SSR/prerender issues
const SignalMessages = dynamic(
  () => import('@/components/signal/SignalMessages'),
  { ssr: false }
);

export default function Messages() {
  const HeaderBox = (
    <section
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
          color: '#ff8a65',
          fontSize: 24,
          fontWeight: 800,
        }}
      >
        The Signal
      </h1>
      <p
        style={{
          margin: '6px auto 0',
          color: '#607D8B',
          maxWidth: 720,
          fontSize: 14,
          lineHeight: 1.5,
        }}
      >
        Chat with coaches, recruiters, and peers all in one place.
        <br />
        <span style={{ fontSize: 13 }}>
          New conversations are started from user profile and candidate cards.
          Once you send a message from someone&apos;s profile, the thread will
          appear here in The Signal so you can pick it up any time.
        </span>
      </p>
    </section>
  );

  return (
    <SeekerLayout
      title="ForgeTomorrow — The Signal"
      header={HeaderBox}
      right={<RightRailPlacementManager surfaceId="the_signal" />}
      activeNav="messages"
    >
      {/* Client-only chat inbox */}
      <SignalMessages />
    </SeekerLayout>
  );
}
