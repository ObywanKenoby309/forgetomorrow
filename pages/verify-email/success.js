// pages/verify-email/success.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Success() {
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect to dashboard after payment
    setTimeout(() => {
      router.push('/dashboard');
    }, 2000);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#ECEFF1]">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[#FF7043] mb-4">
          Payment Successful!
        </h1>
        <p>Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}