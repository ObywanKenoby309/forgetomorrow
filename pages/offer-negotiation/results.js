import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
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
    <div className="min-h-screen bg-[#ECEFF1] p-8 max-w-4xl mx-auto">
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
  );
}
