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
    <div className="relative min-h-screen">
      {/* Background image */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: "url('/images/forge-bg-bw.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      />
      
      {/* Dark overlay */}
      <div className="fixed inset-0 bg-black opacity-70 z-0" />

      {/* Page content */}
      <div className="relative z-10 min-h-screen flex flex-col justify-between">
        {isLandingPage ? <LandingHeader /> : <Header />}
        <Component {...pageProps} />
        {isLandingPage ? <LandingFooter /> : <Footer />}
      </div>
    </div>
  );
}
