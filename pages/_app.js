// pages/_app.js
import '@/styles/globals.css';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import LandingHeader from '@/components/LandingHeader';
import LandingFooter from '@/components/LandingFooter';
import Footer from '@/components/Footer';
import UniversalHeader from '@/components/UniversalHeader';
import { ResumeProvider } from '@/context/ResumeContext';
import { PlanProvider } from '@/context/PlanContext';
import { AiUsageProvider } from '@/context/AiUsageContext';
import { SessionProvider } from 'next-auth/react';
function RouteTracker() {
  const router = useRouter();
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const initial = router.asPath || '/';
    if (!initial.startsWith('/feedback/')) {
      try { sessionStorage.setItem('lastRoute', initial); } catch {}
    }
    const handleStart = () => {
      const curr = router.asPath || '/';
      if (!curr.startsWith('/feedback/')) {
        try { sessionStorage.setItem('lastRoute', curr); } catch {}
      }
    };
    router.events.on('routeChangeStart', handleStart);
    return () => router.events.off('routeChangeStart', handleStart);
  }, [router]);
  return null;
}
export default function App({ Component, pageProps: { session, ...pageProps } }) { // ← session added
  const router = useRouter();
  const isRecruiterRoute = router.pathname.startsWith('/recruiter');
  const isSeekerRoute =
    router.pathname.startsWith('/seeker') ||
    router.pathname.startsWith('/resume') ||
    router.pathname.startsWith('/cover') ||
    router.pathname.startsWith('/apply') ||
    [
      '/the-hearth',
      '/jobs',
      '/applications',
      '/pinned-jobs',
      '/resume-cover',
      '/roadmap',
      '/profile',
      '/profile-analytics',
      '/feed'
    ].includes(router.pathname);
  const isCoachingRoute =
    router.pathname === '/coaching-dashboard' ||
    router.pathname.startsWith('/dashboard/coaching');
  const isSettingsRoute = router.pathname === '/settings';
  const isPublicByPath = !isRecruiterRoute && !isSeekerRoute && !isCoachingRoute && !isSettingsRoute;
  const universalHeaderRoutes = new Set([]);
  const isUniversalPage = universalHeaderRoutes.has(router.pathname) && !router.query?.chrome;
  const sharedRoutes = new Set(['/help', '/privacy', '/terms', '/security', '/accessibility', '/cookies']);
  const [sharedAsInternal, setSharedAsInternal] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isShared = sharedRoutes.has(router.pathname);
    if (!isShared) {
      setSharedAsInternal(false);
      return;
    }
    let lastRoute = null;
    try { lastRoute = sessionStorage.getItem('lastRoute') || ''; } catch {}
    const cameFromInternal =
      !!lastRoute &&
      (lastRoute.startsWith('/seeker') ||
        lastRoute.startsWith('/recruiter') ||
        lastRoute.startsWith('/dashboard/coaching') ||
        lastRoute === '/coaching-dashboard' ||
        lastRoute === '/feed' ||
        lastRoute === '/settings');
    setSharedAsInternal(cameFromInternal);
  }, [router.pathname]);
  const isPublicEffective = sharedRoutes.has(router.pathname)
    ? (isPublicByPath && !sharedAsInternal)
    : isPublicByPath;
  const useForgeBackground =
    !isUniversalPage && isPublicEffective && ['/', '/about', '/features'].includes(router.pathname);
  const forgeBgPosition = router.pathname === '/' ? '35% center' : 'center';
  const renderLandingHeader = isPublicEffective && !isUniversalPage;
  return (
    <SessionProvider session={session}> {/* ← WRAPPED */}
      <div className="relative min-h-screen">
        {useForgeBackground && (
          <>
            <div
              className="fixed inset-0 z-0"
              style={{
                backgroundImage: "url('/images/forge-bg-bw.png')",
                backgroundSize: 'cover',
                backgroundPosition: forgeBgPosition,
                backgroundAttachment: 'fixed',
              }}
            />
            <div className="fixed inset-0 bg-black opacity-80 z-0" />
          </>
        )}
        <div className={`relative z-10 min-h-screen flex flex-col justify-between ${!useForgeBackground ? 'bg-[#ECEFF1]' : ''}`}>
          <PlanProvider>
            <ResumeProvider>
              <AiUsageProvider>
                <RouteTracker />
                {renderLandingHeader && <LandingHeader />}
                {isUniversalPage && <UniversalHeader />}
                <Component {...pageProps} />
              </AiUsageProvider>
            </ResumeProvider>
          </PlanProvider>
          {renderLandingHeader ? <LandingFooter /> : <Footer />}
        </div>
      </div>
    </SessionProvider>
  );
}