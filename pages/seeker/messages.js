// pages/seeker/messages.js
import Head from 'next/head';
<<<<<<< HEAD
import dynamic from 'next/dynamic';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import SeekerRightColumn from '@/components/seeker/SeekerRightColumn';

// Load SignalMessages only on the client to avoid SSR/prerender issues
const SignalMessages = dynamic(
  () => import('@/components/signal/SignalMessages'),
  { ssr: false }
);
=======
import SeekerLayout from '@/components/layouts/SeekerLayout';
import SeekerRightColumn from '@/components/seeker/SeekerRightColumn';
import SignalMessages from '@/components/signal/SignalMessages';
>>>>>>> 6ee98c0 (Add privacy delete user data system)

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
<<<<<<< HEAD
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
=======
      <h1 style={{ margin: 0, color: '#ff8a65', fontSize: 24, fontWeight: 800 }}>The Signal</h1>
      <p style={{ margin: '6px auto 0', color: '#607D8B', maxWidth: 720 }}>
        Chat with coaches, recruiters, and peers all in one place.
>>>>>>> 6ee98c0 (Add privacy delete user data system)
      </p>
    </section>
  );

  const RightRail = (
    <div style={{ display: 'grid', gap: 12 }}>
      <SeekerRightColumn variant="messages" />
    </div>
  );

  return (
    <SeekerLayout
      title="Messages | ForgeTomorrow"
      header={HeaderBox}
      right={RightRail}
      activeNav="messages"
    >
<<<<<<< HEAD
      <Head>
        <title>ForgeTomorrow - The Signal</title>
      </Head>
      {/* Client-only chat inbox */}
      <SignalMessages />
=======
      <Head><title>ForgeTomorrow - The Signal</title></Head>
        <SignalMessages />
>>>>>>> 6ee98c0 (Add privacy delete user data system)
    </SeekerLayout>
  );
}
