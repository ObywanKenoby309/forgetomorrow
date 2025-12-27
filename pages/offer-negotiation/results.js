// pages/offer-negotiation/results.js

import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import OfferNegotiationResultsComponent from '@/components/offer-negotiation/OfferNegotiationResultsComponent';

function getChromeFromAsPath(asPath) {
  try {
    const s = String(asPath || '');
    if (!s.includes('chrome=')) return '';
    const qIndex = s.indexOf('?');
    if (qIndex === -1) return '';
    const query = s.slice(qIndex + 1);
    const params = new URLSearchParams(query);
    return String(params.get('chrome') || '').toLowerCase();
  } catch {
    return '';
  }
}

export default function OfferNegotiationResults() {
  const router = useRouter();
  const { data } = router.query;

  const chrome =
    String(router.query.chrome || '').toLowerCase() ||
    getChromeFromAsPath(router.asPath);

  const withChrome = (path) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

  const [formData, setFormData] = useState(null);

  useEffect(() => {
    if (data) {
      try {
        setFormData(JSON.parse(data));
      } catch {
        setFormData(null);
      }
    }
  }, [data]);

  const Header = (
    <section
      aria-label="Negotiation strategy results header"
      style={{
        background: 'white',
        borderRadius: 12,
        padding: 16,
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        border: '1px solid #eee',
        textAlign: 'center',
      }}
    >
      <h1
        style={{
          margin: 0,
          color: '#FF7043',
          fontSize: 24,
          fontWeight: 800,
        }}
      >
        Negotiation Strategy
      </h1>
      <p
        style={{
          margin: '6px auto 0',
          color: '#607D8B',
          maxWidth: 720,
        }}
      >
        Review your talking points, risks, and next moves before you respond to the offer.
      </p>
    </section>
  );

  return (
    <>
      <Head>
        <title>Negotiation Strategy | ForgeTomorrow</title>
      </Head>
      <SeekerLayout
        title="Negotiation Strategy | ForgeTomorrow"
        header={Header}
        right={null}
        activeNav="roadmap"
      >
        <div className="w-full max-w-3xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            {!formData ? (
              <p className="text-center text-gray-600">Loading your data…</p>
            ) : (
              <>
                <OfferNegotiationResultsComponent formData={formData} />
                <div className="text-right mt-6">
                  <button
                    onClick={() => router.push(withChrome('/offer-negotiation/form'))}
                    className="bg-[#FF7043] text-white px-6 py-3 rounded hover:bg-[#F4511E] transition"
                  >
                    Back to Form
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </SeekerLayout>
    </>
  );
}
