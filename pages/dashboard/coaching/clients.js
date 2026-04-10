// pages/dashboard/coaching/clients.js
//
// Thin page wrapper — renders ClientsModule inside CoachingLayout.
// Direct URL navigation (/dashboard/coaching/clients) still works.
// All logic lives in components/coaching/modules/ClientsModule.js.

import CoachingLayout from '@/components/layouts/CoachingLayout';
import CoachingTitleCard from '@/components/coaching/CoachingTitleCard';
import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';
import ClientsModule from '@/components/coaching/modules/ClientsModule';
import { getTimeGreeting } from '@/lib/dashboardGreeting';

const GAP = 16;
const RIGHT_COL_WIDTH = 280;

const GLASS_TITLE = {
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.22)',
  background: 'rgba(255,255,255,0.58)',
  boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};

export default function CoachingClientsPage() {
  const greeting = getTimeGreeting();

  return (
    <CoachingLayout
      title="Clients | ForgeTomorrow"
      activeNav="client-hub"
      contentFullBleed
      sidebarInitialOpen={{ coaching: true, seeker: false }}
    >
      <div style={{ width: '100%', padding: 0, margin: 0, paddingRight: 16, boxSizing: 'border-box' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `minmax(0,1fr) ${RIGHT_COL_WIDTH}px`,
          gridTemplateRows: 'auto auto',
          gap: GAP, width: '100%', minWidth: 0, boxSizing: 'border-box',
        }}>

          <CoachingTitleCard
            greeting={greeting}
            title="Clients"
            subtitle="Manage active clients, goals, status, and coaching plans in one place."
            style={{ gridColumn: '1/2', gridRow: '1', alignSelf: 'start' }}
          />

          <aside style={{
            gridColumn: '2/3', gridRow: '1/3',
            display: 'flex', flexDirection: 'column', gap: GAP,
            alignSelf: 'stretch', boxSizing: 'border-box',
          }}>
            <RightRailPlacementManager slot="right_rail_1" />
          </aside>

          <div style={{ gridColumn: '1/2', gridRow: '2' }}>
            <ClientsModule />
          </div>

        </div>
      </div>
    </CoachingLayout>
  );
}