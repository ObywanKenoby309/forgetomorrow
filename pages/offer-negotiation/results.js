// pages/offer-negotiation/results.js

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import SeekerSidebar from '../../components/SeekerSidebar';
import OfferNegotiationResultsComponent from '../../components/offer-negotiation/OfferNegotiationResultsComponent';

export default function OfferNegotiationResults() {
  const router = useRouter();
  const { data } = router.query;

  const [formData, setFormData] = useState(null);
  const [plan, setPlan] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [planError, setPlanError] = useState('');

  // Parse the query param into formData
  useEffect(() => {
    if (!data) return;
    try {
      setFormData(JSON.parse(data));
    } catch {
      setFormData(null);
    }
  }, [data]);

  // Call AI endpoint once we have formData
  useEffect(() => {
    if (!formData) return;

    let cancelled = false;

    async function run() {
      setLoadingPlan(true);
      setPlanError('');
      try {
        const res = await fetch('/api/offer-negotiation/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ formData }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Failed to generate negotiation plan');
        }

        const json = await res.json();
        if (!cancelled) {
          setPlan(json.plan || null);
        }
      } catch (err) {
        console.error('[OfferNegotiationResults] AI error', err);
        if (!cancelled) {
          setPlanError(err.message || 'Could not generate negotiation strategy.');
        }
      } finally {
        if (!cancelled) setLoadingPlan(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [formData]);

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
              {/* Existing component that summarizes their inputs */}
              <OfferNegotiationResultsComponent formData={formData} />

              {/* New AI section */}
              <section className="mt-8 border-t border-gray-200 pt-6">
                <h2 className="text-xl font-semibold text-[#FF7043] mb-3">
                  Recommended Strategy
                </h2>

                {loadingPlan && (
                  <p className="text-sm text-gray-600">
                    Generating your negotiation strategy…
                  </p>
                )}

                {planError && (
                  <p className="text-sm text-red-600">
                    {planError}
                  </p>
                )}

                {plan && !loadingPlan && !planError && (
                  <div className="space-y-4 text-sm text-gray-800">
                    {plan.headline && (
                      <p className="font-semibold">{plan.headline}</p>
                    )}

                    {plan.marketSummary && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          Market Context
                        </h3>
                        <p>{plan.marketSummary}</p>
                      </div>
                    )}

                    {Array.isArray(plan.leveragePoints) && plan.leveragePoints.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          Your Leverage
                        </h3>
                        <ul className="list-disc list-inside space-y-1">
                          {plan.leveragePoints.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {Array.isArray(plan.risks) && plan.risks.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          Risks to Watch
                        </h3>
                        <ul className="list-disc list-inside space-y-1">
                          {plan.risks.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {Array.isArray(plan.counterOffers) && plan.counterOffers.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          Counter-Offer Paths
                        </h3>
                        <div className="grid gap-3">
                          {plan.counterOffers.map((c, i) => (
                            <div
                              key={i}
                              className="border border-gray-200 rounded-lg p-3"
                            >
                              <div className="font-semibold">
                                {c.label || `Option ${i + 1}`}
                              </div>
                              {c.description && (
                                <p className="text-gray-700 text-sm mt-1">
                                  {c.description}
                                </p>
                              )}
                              {c.whenToUse && (
                                <p className="text-gray-500 text-xs mt-1">
                                  When to use: {c.whenToUse}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {plan.recruiterScript && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          Script You Can Use
                        </h3>
                        <pre className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs whitespace-pre-wrap">
                          {plan.recruiterScript}
                        </pre>
                      </div>
                    )}

                    {plan.fallbackPlan && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          Fallback Plan
                        </h3>
                        <p>{plan.fallbackPlan}</p>
                      </div>
                    )}
                  </div>
                )}
              </section>

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
