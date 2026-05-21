// pages/search.js
import { useEffect, useState } from 'react';
import InternalLayout from '@/components/layouts/InternalLayout';
import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';
import SeekerTitleCard from '@/components/seeker/SeekerTitleCard';
import GlobalSearchPageTool from '@/components/search/GlobalSearchPageTool';
import { getTimeGreeting } from '@/lib/dashboardGreeting';

export default function SearchPage() {
  const [collapseSiderails, setCollapseSiderails] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const greeting = getTimeGreeting();

  return (
    <InternalLayout
      title="Search ForgeTomorrow"
      activeNav="search"
      right={<RightRailPlacementManager />}
      rightVariant="light"
      collapseSiderails={collapseSiderails}
      onToggleSiderails={() => setCollapseSiderails((v) => !v)}
    >
      <SeekerTitleCard
        greeting={greeting}
        title="Search ForgeTomorrow"
        subtitle="Find members, companies, posts, groups, pages, newsletters, and platform resources. Career/job intelligence stays on the Jobs page."
      />

      <GlobalSearchPageTool />
    </InternalLayout>
  );
}
