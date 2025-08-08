import React from 'react';
import { useRouter } from 'next/router';
import NegotiationInputForm from '../../components/offer-negotiation/NegotiationInputForm';

export default function OfferNegotiationFormPage() {
  const router = useRouter();

  const handleFormSubmit = (formData) => {
    // Pass form data as query params (or use state management / backend later)
    router.push({
      pathname: '/offer-negotiation/results',
      query: { data: JSON.stringify(formData) },
    });
  };

  return (
    <div className="min-h-screen bg-[#ECEFF1] p-8">
      <NegotiationInputForm onSubmit={handleFormSubmit} />
    </div>
  );
}
