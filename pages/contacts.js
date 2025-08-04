// pages/contacts.js
import Head from 'next/head';
import ContactsList from '../components/ContactsList';

export default function Contacts() {
  const contacts = [
    {
      id: 1,
      name: 'Jane Doe',
      status: 'Open to Opportunities',
      photo: 'https://via.placeholder.com/48',
    },
    // Add more contacts as needed
  ];

  const handleViewProfile = (contact) => alert(`View profile for ${contact.name} coming soon!`);

  return (
    <>
      <Head>
        <title>ForgeTomorrow - My Contacts</title>
      </Head>

      <main className="max-w-6xl mx-auto p-6 space-y-10 min-h-[80vh] bg-[#ECEFF1] text-[#212121] pt-20">
        <h1 className="text-4xl font-bold text-[#FF7043] mb-6 text-center">My Contacts</h1>

        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold text-[#FF7043] mb-4">Contacts</h2>
          <ContactsList contacts={contacts} onViewProfile={handleViewProfile} />
        </section>
      </main>
    </>
  );
}
