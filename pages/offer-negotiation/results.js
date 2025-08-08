import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

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

  // Placeholder: Replace with actual AI-generated feedback logic
  const aiFeedback = formData
    ? `AI feedback for ${formData.jobDescription || 'your job'} will appear here.`
    : 'Loading...';

  return (
    <div className="min-h-screen bg-[#ECEFF1] p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-[#FF7043] mb-6 text-center">
        Negotiation Strategy Results
      </h1>

      {!formData ? (
        <p className="text-center text-gray-600">Loading your data...</p>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow space-y-6">
          <h2 className="text-xl font-semibold">Summary</h2>
          <p>{aiFeedback}</p>

          {/* Placeholder for download buttons */}
          <div className="flex justify-end space-x-4 mt-8">
            <button
              disabled
              className="bg-gray-400 text-white px-4 py-2 rounded cursor-not-allowed"
            >
              Download PDF (coming soon)
            </button>
            <button
              disabled
              className="bg-gray-400 text-white px-4 py-2 rounded cursor-not-allowed"
            >
              Download Word (coming soon)
            </button>
            <button
              disabled
              className="bg-gray-400 text-white px-4 py-2 rounded cursor-not-allowed"
            >
              Download Text (coming soon)
            </button>
          </div>

          <div className="text-right">
            <button
              onClick={() => router.push('/offer-negotiation/form')}
              className="bg-[#FF7043] text-white px-6 py-3 rounded hover:bg-[#F4511E] transition"
            >
              Back to Form
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
