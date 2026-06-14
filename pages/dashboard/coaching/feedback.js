// pages/dashboard/coaching/feedback.js
//
// Thin page wrapper — renders FeedbackModule inside CoachingLayout.
// Direct URL navigation (/dashboard/coaching/feedback) still works.
// All logic lives in components/coaching/modules/FeedbackModule.js.

import { useEffect, useState } from 'react';
import CoachingLayout from '@/components/layouts/CoachingLayout';
import CoachingTitleCard from '@/components/coaching/CoachingTitleCard';
import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';
import FeedbackModule from '@/components/coaching/modules/FeedbackModule';
import { getTimeGreeting } from '@/lib/dashboardGreeting';


// ─── SSR-safe mobile hook ───────────────────────────────────────────────────
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window === 'undefined' ? false : window.innerWidth < breakpoint
  );
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);
  return isMobile;
}

const GAP = 16;
const RIGHT_COL_WIDTH = 280;

export default function CoachingFeedbackPage() {
  const greeting = getTimeGreeting();
  const isMobile = useIsMobile();

  return (
    <CoachingLayout
      title="Feedback | ForgeTomorrow"
      activeNav="feedback"
      contentFullBleed
      sidebarInitialOpen={{ coaching: true, seeker: false }}
    >
      <div style={{ width: '100%', padding: 0, margin: 0, paddingRight: 16, boxSizing: 'border-box' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : `minmax(0,1fr) ${RIGHT_COL_WIDTH}px`,
          gridTemplateRows: isMobile ? 'auto' : 'auto auto',
          gap: GAP, width: '100%', minWidth: 0, boxSizing: 'border-box',
        }}>

          <CoachingTitleCard
            greeting={greeting}
            title="Client Feedback"
            subtitle="Ratings and comments collected from your clients after coaching sessions."
            style={{ gridColumn: '1/2', gridRow: '1', alignSelf: 'start' }}
          />

          <aside style={{
            gridColumn: isMobile ? '1/2' : '2/3', gridRow: isMobile ? '3' : '1/3',
            display: 'flex', flexDirection: 'column', gap: GAP,
            alignSelf: 'stretch', boxSizing: 'border-box',
          }}>
            <RightRailPlacementManager slot="right_rail_1" />
          </aside>

          <div style={{ gridColumn: '1/2', gridRow: '2' }}>
            <FeedbackModule />
          </div>

        </div>
      </div>
    </CoachingLayout>
  );
}