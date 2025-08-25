// pages/contacts.js
import Head from 'next/head';
import ContactsHub from '@/components/contacts/ContactsHub';

export default function ContactsPage() {
  return (
    <>
      <Head><title>ForgeTomorrow — Contacts</title></Head>
      <main className="max-w-[1200px] mx-auto px-4 pt-6 pb-10">
        <ContactsHub />
      </main>
    </>
  );
}
