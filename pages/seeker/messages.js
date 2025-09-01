// pages/seeker/messages.js
import Head from 'next/head';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import SeekerRightColumn from '@/components/seeker/SeekerRightColumn';
import SignalMessages from '@/components/signal/SignalMessages';

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
      <h1 style={{ margin: 0, color: '#ff8a65', fontSize: 24, fontWeight: 800 }}>The Signal</h1>
      <p style={{ margin: '6px auto 0', color: '#607D8B', maxWidth: 720 }}>
        Chat with coaches, recruiters, and peers all in one place.
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
      <Head><title>ForgeTomorrow - The Signal</title></Head>
        <SignalMessages />
    </SeekerLayout>
  );
}
