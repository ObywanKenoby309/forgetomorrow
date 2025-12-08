// pages/offer-negotiation/form.js

import React from 'react';
import { useRouter } from 'next/router';
import SeekerSidebar from '../../components/SeekerSidebar';
import NegotiationInputForm from '../../components/offer-negotiation/NegotiationInputForm';

export default function OfferNegotiationFormPage() {
  const router = useRouter();

  const handleFormSubmit = (formData) => {
    // NOTE: For now we serialize into the query string.
    // If payloads get large, we can switch to:
    // - POST to an API and pass back an ID, or
    // - use sessionStorage/localStorage as a short-lived stash.
    const query = encodeURIComponent(JSON.stringify(formData));
    router.push(`/offer-negotiation/results?data=${query}`);
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '300px minmax(0, 1fr) 300px',
        gap: '20px',
        padding: '120px 20px 20px',
        minHeight: '100vh',
        backgroundColor: '#ECEFF1',
      }}
    >
      <SeekerSidebar />

      <main
        style={{
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            padding: '32px',
            maxWidth: '800px',
            width: '100%',
          }}
        >
          <NegotiationInputForm onSubmit={handleFormSubmit} />
        </div>
      </main>

      <aside
        style={{
          backgroundColor: '#ECEFF1',
          borderRadius: '8px',
          width: '300px',
        }}
      />
    </div>
  );
}
