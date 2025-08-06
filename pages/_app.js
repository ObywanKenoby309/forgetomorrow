// pages/_app.js
import '../styles/globals.css';
import { useRouter } from 'next/router';

import Header from '../components/Header';
import Footer from '../components/Footer';
import LandingHeader from '../components/LandingHeader';
import LandingFooter from '../components/LandingFooter';

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const isLandingPage = ['/', '/signup', '/features'].includes(router.pathname);

  return (
    <div
      className="relative min-h-screen"
      style={{
        backgroundImage: "url('/images/forge-bg-bw.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {isLandingPage ? <LandingHeader /> : <Header />}

      <Component {...pageProps} />

      {isLandingPage ? <LandingFooter /> : <Footer />}
    </div>
  );
}
