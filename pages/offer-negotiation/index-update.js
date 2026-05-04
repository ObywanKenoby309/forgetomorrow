// pages/offer-negotiation/index-update.js
// Premium B — single-page progressive decision engine
// Test at /offer-negotiation/index-update before going live
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import SeekerTitleCard from '@/components/seeker/SeekerTitleCard';
import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';
import { getTimeGreeting } from '@/lib/dashboardGreeting';

const OfferEngine = dynamic(
  () => import('@/components/offer-negotiation/OfferEngine'),
  { ssr: false }
);

function getChromeFromAsPath(asPath) {
  try {
    const s = String(asPath || '');
    if (!s.includes('chrome=')) return '';
    const qIndex = s.indexOf('?');
    if (qIndex === -1) return '';
    const query = s.slice(qIndex + 1);
    const params = new URLSearchParams(query);
    return String(params.get('chrome') || '').toLowerCase();
  } catch {
    return '';
  }
}

export default function OfferNegotiationPage() {
  const router = useRouter();
  const chrome =
    String(router.query.chrome || '').toLowerCase() ||
    getChromeFromAsPath(router.asPath);

  const greeting = getTimeGreeting();

  return (
    <SeekerLayout
      title="Offer & Negotiation Engine | ForgeTomorrow"
      header={
        <SeekerTitleCard
          greeting={greeting}
          title="Offer & Negotiation Engine"
          subtitle="Run the numbers, pressure-test your offer, and walk into the conversation with a full playbook."
        />
      }
      headerCard={false}
      activeNav="anvil"
      rightVariant="light"
      right={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <RightRailPlacementManager slot="right_rail_1" />
        </div>
      }
    >
      <div style={{ width: '100%', boxSizing: 'border-box' }}>
        <OfferEngine />
      </div>
    </SeekerLayout>
  );
}