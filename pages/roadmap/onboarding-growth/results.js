// pages/roadmap/onboarding-growth/results.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function RoadmapOnboardingGrowthResultsShim() {
  const router = useRouter();

  useEffect(() => {
    const qs = typeof window !== 'undefined' ? window.location.search : '';
    router.replace(`/anvil/onboarding-growth/results${qs || ''}`);
  }, [router]);

  return null;
}
