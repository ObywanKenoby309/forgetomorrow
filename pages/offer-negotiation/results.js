import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import SeekerSidebar from '../../components/SeekerSidebar';
import OfferNegotiationResultsComponent from '../../components/offer-negotiation/OfferNegotiationResultsComponent';

export default function OfferNegotiationResults() {
  const router = useRouter();
  const { data } = router.query;

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
          <h1 className="text-3xl font-bold text-[#FF7043] mb-6 text-center">
            Negotiation Strategy Results
          </h1>

          {!formData ? (
            <p className="text-center text-gray-600">Loading your data...</p>
          ) : (
            <>
              <OfferNegotiationResultsComponent formData={formData} />

              <div className="text-right mt-6">
                <button
                  onClick={() => router.push('/offer-negotiation/form')}
                  className="bg-[#FF7043] text-white px-6 py-3 rounded hover:bg-[#F4511E] transition"
                >
                  Back to Form
                </button>
              </div>
            </>
          )}
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
