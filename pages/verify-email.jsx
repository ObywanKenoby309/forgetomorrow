// pages/verify-email.jsx
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import prisma from '@/lib/prisma';
import { getSession, signIn } from 'next-auth/react';

export default function VerifyEmail() {
  const router = useRouter();
  const { token } = router.query;
  const [status, setStatus] = useState('Verifying...');

  useEffect(() => {
    if (!token) return;

    (async () => {
      const res = await fetch('/api/verify/email', {
        method: 'POST',
        body: JSON.stringify({ token }),
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (data.success) {
        if (data.plan === 'job-seeker-free') {
          await signIn('credentials', { redirect: false });
          setStatus('Welcome! Your free account is active.');
          setTimeout(() => router.push('/dashboard'), 2000);
        } else {
          setStatus('Email verified! Redirecting to checkout...');
          setTimeout(() => window.location.href = data.checkoutUrl, 1500);
        }
      } else {
        setStatus('Invalid or expired link.');
      }
    })();
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-12 rounded-xl shadow-lg text-center">
        <h1 className="text-3xl font-bold text-orange-600 mb-4">{status}</h1>
      </div>
    </div>
  );
}