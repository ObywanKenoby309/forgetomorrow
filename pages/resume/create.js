// pages/resume/create.js
import Head from 'next/head';
import { useState } from 'react';
import ContactInfoSection from '../../components/resume-form/ContactInfoSection';

export default function CreateResumePage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    portfolio: '',
    forgeUrl: 'https://forgetomorrow.com/your-profile' // this can be dynamic later
  });

  return (
    <>
      <Head>
        <title>Create Resume | ForgeTomorrow</title>
      </Head>

      <main className="max-w-5xl mx-auto px-6 min-h-[80vh] bg-[#ECEFF1] py-28 text-[#212121] space-y-10">
        <div className="bg-white rounded-lg shadow p-8 space-y-6">
          <h1 className="text-4xl font-bold text-[#FF7043] text-center">Create Your Resume</h1>
          <p className="text-lg text-gray-700 text-center max-w-2xl mx-auto">
            Fill in the sections below to generate a beautiful, ATS-optimized resume. You’ll be able to preview,
            edit, and save your work as you go.
          </p>
        </div>

        <ContactInfoSection formData={formData} setFormData={setFormData} />
      </main>
    </>
  );
}
