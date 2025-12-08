// pages/offer-negotiation/index.js

import React from 'react';
import Head from 'next/head';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import OfferNegotiationLanding from '@/components/offer-negotiation/OfferNegotiationLanding';

export default function OfferNegotiationPage() {
  // TODO: Replace with real user subscription & usage data
  const isPaidUser = true;
  const remainingUses = 3;

  const Header = (
    <section
      aria-label="Offer & negotiation toolkit header"
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
        Offer & Negotiation Toolkit
      </h1>
      <p
        style={{
          margin: '6px auto 0',
          color: '#607D8B',
          maxWidth: 720,
        }}
      >
        Run the numbers, pressure-test your offer, and plan a confident negotiation
        with an AI-assisted playbook.
      </p>
    </section>
  );

  return (
    <>
      <Head>
        <title>Offer & Negotiation Toolkit | ForgeTomorrow</title>
      </Head>
      <SeekerLayout
        title="Offer & Negotiation Toolkit | ForgeTomorrow"
        header={Header}
        right={null}
        activeNav={null} // keeps the user’s normal seeker sidebar/header; no special highlight
      >
        <div className="w-full max-w-4xl mx-auto">
          <OfferNegotiationLanding
            remainingUses={remainingUses}
            isPaidUser={isPaidUser}
          />
        </div>
      </SeekerLayout>
    </>
  );
}
