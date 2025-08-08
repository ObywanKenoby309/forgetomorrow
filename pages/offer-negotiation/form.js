import React from 'react';
import { useRouter } from 'next/router';
import NegotiationInputForm from '../../components/offer-negotiation/NegotiationInputForm';

export default function OfferNegotiationFormPage() {
  const router = useRouter();

  const handleFormSubmit = (formData) => {
    // For now, pass form data as query params (or use state management / backend later)
    // We'll just navigate to results page placeholder
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
