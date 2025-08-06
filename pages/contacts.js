// pages/contacts.js
import Head from 'next/head';
import ContactsList from '../components/ContactsList';
import RequestList from '../components/RequestList';

export default function Contacts() {
  const contacts = [
    {
      id: 1,
      name: 'Jane Doe',
      status: 'Open to Opportunities',
      photo: 'https://via.placeholder.com/48',
    },
  ];

  const incomingRequests = [
    {
      id: 2,
      name: 'John Smith',
      photo: 'https://via.placeholder.com/48',
    },
  ];

  const outgoingRequests = [
    {
      id: 3,
      name: 'Alex Johnson',
      photo: 'https://via.placeholder.com/48',
    },
  ];

  const handleViewProfile = (contact) =>
    alert(`View profile for ${contact.name} coming soon!`);
  const handleAccept = (request) =>
    alert(`Accepted request from ${request.name}`);
  const handleDecline = (request) =>
    alert(`Declined request from ${request.name}`);
  const handleCancel = (request) =>
    alert(`Canceled request to ${request.name}`);

  return (
    <>
      <Head>
        <title>ForgeTomorrow - My Contacts</title>
      </Head>

      <main className="max-w-6xl mx-auto p-6 space-y-10 min-h-[80vh] bg-[#ECEFF1] text-[#212121] pt-20">
        <h1 className="text-4xl font-bold text-[#FF7043] mb-6 text-center">
          My Contacts
        </h1>

        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold text-[#FF7043] mb-4">
            Contacts
          </h2>
          <ContactsList contacts={contacts} onViewProfile={handleViewProfile} />
        </section>

        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold text-[#FF7043] mb-4">
            Requests
          </h2>
          <RequestList
            incomingRequests={incomingRequests}
            outgoingRequests={outgoingRequests}
            onAccept={handleAccept}
            onDecline={handleDecline}
            onCancel={handleCancel}
          />
        </section>
      </main>
    </>
  );
}
