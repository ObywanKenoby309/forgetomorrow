// pages/coaching/contacts.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function CoachingContactsShim() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/contacts?chrome=coach');
  }, [router]);
  return null;
}
