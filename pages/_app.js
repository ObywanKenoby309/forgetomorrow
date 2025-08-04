// pages/_app.js
import { useRouter } from 'next/router';
import { JobPipelineProvider } from '../context/JobPipelineContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LandingHeader from '../components/LandingHeader';
import LandingFooter from '../components/LandingFooter';
import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  const router = useRouter();

  // Pages that use Landing Header/Footer (typically public or marketing pages)
  const landingPages = ['/', '/login', '/signup', '/about'];

  // Pages where footer is hidden
  const noFooterPages = ['/feed', '/jobs'];

  const useLandingHeaderFooter = landingPages.includes(router.pathname);

  return (
    <JobPipelineProvider>
      {useLandingHeaderFooter ? <LandingHeader /> : <Header />}
      <main
        className={`pt-20 min-h-screen text-[#212121] ${
          useLandingHeaderFooter ? '' : 'bg-[#ECEFF1]'
        }`}
      >
        <Component {...pageProps} />
      </main>
      {!noFooterPages.includes(router.pathname) &&
        (useLandingHeaderFooter ? <LandingFooter /> : <Footer />)}
    </JobPipelineProvider>
  );
}
