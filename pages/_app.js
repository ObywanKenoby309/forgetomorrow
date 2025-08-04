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

  // Routes that use the landing page layout (LandingHeader/Footer)
  const landingPages = ['/', '/login', '/signup', '/about'];

  // Routes where footer should be hidden
  const noFooterPages = ['/feed', '/jobs'];

  const useLandingLayout = landingPages.includes(router.pathname);

  return (
    <JobPipelineProvider>
      {useLandingLayout ? <LandingHeader /> : <Header />}
      <main
        className={`pt-20 min-h-screen text-[#212121] ${
          useLandingLayout ? '' : 'bg-[#ECEFF1]'
        }`}
      >
        <Component {...pageProps} />
      </main>
      {!noFooterPages.includes(router.pathname) &&
        (useLandingLayout ? <LandingFooter /> : <Footer />)}
    </JobPipelineProvider>
  );
}

