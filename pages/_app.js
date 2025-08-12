// pages/_app.js
import '../styles/globals.css';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

import Header from '../components/Header';
import Footer from '../components/Footer';
import LandingHeader from '../components/LandingHeader';
import LandingFooter from '../components/LandingFooter';

import { ResumeProvider } from '../context/ResumeContext';

function RouteTracker() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // On first mount, record current page unless it's a feedback page.
    const initial = router.asPath || '/';
    if (!initial.startsWith('/feedback/')) {
      try {
        sessionStorage.setItem('lastRoute', initial);
      } catch {}
    }

    // Before navigating away, store the *current* page as lastRoute.
    const handleStart = () => {
      const curr = router.asPath || '/';
      if (!curr.startsWith('/feedback/')) {
        try {
          sessionStorage.setItem('lastRoute', curr);
        } catch {}
      }
    };

    router.events.on('routeChangeStart', handleStart);
    return () => router.events.off('routeChangeStart', handleStart);
  }, [router]);

  return null;
}

export default function App({ Component, pageProps }) {
  const router = useRouter();

  const isLandingPage = ['/', '/signup', '/features', '/login', '/about'].includes(router.pathname);
  const useForgeBackground = ['/', '/about', '/features'].includes(router.pathname);

  return (
    <div className="relative min-h-screen">
      {useForgeBackground && (
        <>
          <div
            className="fixed inset-0 z-0"
            style={{
              backgroundImage: "url('/images/forge-bg-bw.png')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundAttachment: 'fixed',
            }}
          />
          <div className="fixed inset-0 bg-black opacity-80 z-0" />
        </>
      )}

      <div
        className={`relative z-10 min-h-screen flex flex-col justify-between ${
          !useForgeBackground ? 'bg-[#ECEFF1]' : ''
        }`}
      >
        {isLandingPage ? <LandingHeader /> : <Header />}

        <ResumeProvider>
          {/* Track last visited non-feedback route for smart returns */}
          <RouteTracker />
          <Component {...pageProps} />
        </ResumeProvider>

        {isLandingPage ? <LandingFooter /> : <Footer />}
      </div>
    </div>
  );
}
