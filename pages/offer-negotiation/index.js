import React from 'react';
import OfferNegotiationLanding from '../../components/offer-negotiation/OfferNegotiationLanding';

export default function OfferNegotiationPage() {
  // TODO: Replace with real user subscription & usage data
  const isPaidUser = true; 
  const remainingUses = 3;

  return (
    <div className="min-h-screen bg-[#ECEFF1] p-8">
      <OfferNegotiationLanding remainingUses={remainingUses} isPaidUser={isPaidUser} />
    </div>
  );
}
