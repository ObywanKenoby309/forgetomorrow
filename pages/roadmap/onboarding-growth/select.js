// pages/roadmap/onboarding-growth/select.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function RoadmapOnboardingGrowthSelectShim() {
  const router = useRouter();

  useEffect(() => {
    const qs = typeof window !== 'undefined' ? window.location.search : '';
    router.replace(`/anvil/onboarding-growth/select${qs || ''}`);
  }, [router]);

  return null;
}
