// pages/seeker/messages.js
import dynamic from 'next/dynamic';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';

// Load SignalMessages only on the client to avoid SSR/prerender issues
const SignalMessages = dynamic(
  () => import('@/components/signal/SignalMessages'),
  { ssr: false }
);

// ✅ Added GLASS + tokens (minimal change)
const GLASS = {
  border: '1px solid rgba(255,255,255,0.22)',
  background: 'rgba(255,255,255,0.58)',
  boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};

const ORANGE = '#FF7043';
const MUTED = '#64748B';

export default function Messages() {
  // ✅ UPDATED HEADER (glass style)
  const HeaderBox = (
    <section
      style={{
        ...GLASS,
        borderRadius: 18,
        padding: 16,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          margin: 0,
          color: ORANGE,
          fontSize: 24,
          fontWeight: 900,
        }}
      >
        The Signal
      </div>
      <div
        style={{
          marginTop: 6,
          color: MUTED,
          maxWidth: 720,
          fontSize: 14,
          lineHeight: 1.5,
          marginInline: 'auto',
        }}
      >
        Chat with coaches, recruiters, and peers all in one place.
        <br />
        <span style={{ fontSize: 13 }}>
          New conversations are started from user profile and candidate cards.
          Once you send a message from someone&apos;s profile, the thread will
          appear here so you can pick it up any time.
        </span>
      </div>
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