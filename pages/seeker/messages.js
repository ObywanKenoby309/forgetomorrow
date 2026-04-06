// pages/seeker/messages.js
import dynamic from 'next/dynamic';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';
import SeekerTitleCard from '@/components/seeker/SeekerTitleCard';
import { getTimeGreeting } from '@/lib/dashboardGreeting';

// Load SignalMessages only on the client to avoid SSR/prerender issues
const SignalMessages = dynamic(
  () => import('@/components/signal/SignalMessages'),
  { ssr: false }
);

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
  const greeting = getTimeGreeting();

  const HeaderBox = (
    <SeekerTitleCard
      greeting={greeting}
      title="The Signal"
      subtitle={`Chat with coaches, recruiters, and peers all in one place. New conversations are started from user profile and candidate cards. Once you send a message from someone's profile, the thread will appear here so you can pick it up any time.`}
    />
  );

  return (
    <SeekerLayout
      title="ForgeTomorrow — The Signal"
      header={HeaderBox}
      right={<RightRailPlacementManager surfaceId="the_signal" />}
      rightVariant="light"
      activeNav="messages"
    >
      <SignalMessages />
    </SeekerLayout>
  );
}