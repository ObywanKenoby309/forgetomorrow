// pages/resume/create.js
import Head from 'next/head';
import { useState } from 'react';
import ContactInfoSection from '../../components/resume-form/ContactInfoSection';

export default function CreateResume() {
  const [contactInfo, setContactInfo] = useState({
    fullName: '',
    title: '',
    email: '',
    phone: '',
    linkedin: '',
    website: '',
  });

  return (
    <>
      <Head>
        <title>Create Resume | ForgeTomorrow</title>
      </Head>

      <main className="max-w-7xl mx-auto px-6 pt-[100px] pb-10 min-h-[80vh] bg-[#ECEFF1] text-[#212121]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Resume Form Section */}
          <section className="bg-white rounded-lg shadow p-8 space-y-10">
            <h1 className="text-3xl font-bold text-[#FF7043]">Create Your Resume</h1>

            {/* Contact Info Form */}
            <ContactInfoSection contactInfo={contactInfo} onChange={setContactInfo} />
          </section>

          {/* Live Preview Section */}
          <aside className="bg-white rounded-lg shadow p-8 space-y-4">
            <h2 className="text-xl font-bold text-[#FF7043] mb-2">Live Preview</h2>
            <div>
              <p className="text-xl font-bold">{contactInfo.fullName || '[Your Name]'}</p>
              <p className="text-md text-gray-700">{contactInfo.title || '[Professional Title]'}</p>
              <div className="text-sm text-gray-600 mt-2 space-y-1">
                {contactInfo.email && <p>📧 {contactInfo.email}</p>}
                {contactInfo.phone && <p>📞 {contactInfo.phone}</p>}
                {contactInfo.linkedin && <p>🔗 <a href={contactInfo.linkedin} className="text-[#FF7043] hover:underline" target="_blank">LinkedIn</a></p>}
                {contactInfo.website && <p>🌐 <a href={contactInfo.website} className="text-[#FF7043] hover:underline" target="_blank">Portfolio</a></p>}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
