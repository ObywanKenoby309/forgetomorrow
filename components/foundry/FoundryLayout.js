// components/foundry/FoundryLayout.js
// Standalone layout for Foundry rooms. Never touches SeekerLayout/RecruiterLayout.
// Pages using this must export getLayout = (page) => <FoundryLayout ...>{page}</FoundryLayout>

import Head from 'next/head';
import { useEffect } from 'react';

export default function FoundryLayout({ children, title = 'Foundry' }) {
  // Foundry takes full viewport - suppress any global scrollbars
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <>
      <Head>
        <title>{title} · ForgeTomorrow Foundry</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: '#0b0d11',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 9999,
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </>
  );
}
