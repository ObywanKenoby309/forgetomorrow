// pages/offer-negotiation/form.js

import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import NegotiationInputForm from '@/components/offer-negotiation/NegotiationInputForm';

export default function OfferNegotiationFormPage() {
  const router = useRouter();

  const handleFormSubmit = (formData) => {
    const query = encodeURIComponent(JSON.stringify(formData));
    router.push(`/offer-negotiation/results?data=${query}`);
  };

  const Header = (
    <section
      aria-label="Offer negotiation form header"
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
        Offer Details
      </h1>
      <p
        style={{
          margin: '6px auto 0',
          color: '#607D8B',
          maxWidth: 720,
        }}
      >
        Share your offer, current role, and priorities. We’ll help you shape a
        negotiation plan that respects your value.
      </p>
    </section>
  );

  return (
    <>
      <Head>
        <title>Offer Details | ForgeTomorrow</title>
      </Head>
      <SeekerLayout
        title="Offer Details | ForgeTomorrow"
        header={Header}
        right={null}
        activeNav={null}
      >
        <div className="w-full max-w-3xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <NegotiationInputForm onSubmit={handleFormSubmit} />
          </div>
        </div>
      </SeekerLayout>
    </>
  );
}
