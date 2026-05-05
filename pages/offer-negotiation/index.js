// pages/offer-negotiation/index.js
// Shim — redirects to The Anvil where Offer & Negotiation now lives
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function OfferNegotiationShim() {
  const router = useRouter();

  useEffect(() => {
    const qs = typeof window !== 'undefined' ? window.location.search : '';
    router.replace(`/anvil${qs || ''}`);
  }, [router]);

  return null;
}