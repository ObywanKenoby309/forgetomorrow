// pages/offer-negotiation/index.js

import React from 'react';
import OfferNegotiationLanding from '../../components/offer-negotiation/OfferNegotiationLanding';

export default function OfferNegotiationPage() {
  // For launch: no fake counters or gating here.
  // OfferNegotiationLanding should safely handle missing props
  // and treat the tool as open access until billing is wired.

  return (
    <div className="min-h-screen bg-[#ECEFF1] p-8">
      <OfferNegotiationLanding />
    </div>
  );
}
