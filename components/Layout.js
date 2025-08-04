// components/Layout.js
import { useRouter } from 'next/router';
import Header from './Header';
import Footer from './Footer';

export default function Layout({ children }) {
  const router = useRouter();

  // Define paths where footer should NOT show
  const noFooterPaths = ['/feed', '/pipeline'];

  const showFooter = !noFooterPaths.includes(router.pathname);

  return (
    <>
      <Header />
      <main>{children}</main>
      {showFooter && <Footer />}
    </>
  );
}
