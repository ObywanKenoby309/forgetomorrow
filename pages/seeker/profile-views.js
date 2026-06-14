// pages/seeker/profile-views.js — redirect shim
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Redirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/seeker/contact-center?tab=profileViews');
  }, []);
  return null;
}