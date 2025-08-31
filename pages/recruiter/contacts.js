// pages/recruiter/contacts.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function RecruiterContactsShim() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/contacts?chrome=recruiter');
  }, [router]);
  return null;
}
