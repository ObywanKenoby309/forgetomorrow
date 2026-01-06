// pages/roadmap/onboarding-growth/index.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function RoadmapOnboardingGrowthIndexShim() {
  const router = useRouter();

  useEffect(() => {
    // preserve all query params
    const qs = typeof window !== 'undefined' ? window.location.search : '';
    router.replace(`/anvil/onboarding-growth${qs || ''}`);
  }, [router]);

  return null;
}
