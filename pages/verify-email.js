// pages/verify-email.js
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { prisma } from '@/lib/prisma';

export default function VerifyEmail() {
  const router = useRouter();
  const { token } = router.query;

  useEffect(() => {
    if (!token) return;

    fetch('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
      headers: { 'Content-Type': 'application/json' },
    }).then(res => res.json()).then(data => {
      if (data.success) {
        alert('Email verified! Redirecting...');
        router.push('/login');
      } else {
        alert('Invalid token');
      }
    });
  }, [token, router]);

  return <div>Verifying email...</div>;
}