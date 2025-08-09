// pages/resume/view/[id].js
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useContext, useEffect, useState } from 'react';
import ResumeContext from '../../../context/ResumeContext';

export default function ViewResume() {
  const router = useRouter();
  const { id } = router.query;
  const { resumes } = useContext(ResumeContext);
  const [resume, setResume] = useState(null);

  useEffect(() => {
    if (id && resumes && resumes.length) {
      const found = resumes.find((r) => r.id === id);
      setResume(found || null);
    }
  }, [id, resumes]);

  return (
    <>
      <Head>
        <title>View Resume | ForgeTomorrow</title>
      </Head>

      <main className="max-w-4xl mx-auto px-6 pt-[100px] pb-10 min-h-[80vh] bg-[#ECEFF1] text-[#212121]">
        <section className="bg-white rounded-lg shadow p-8 space-y-6">
          <h1 className="text-3xl font-bold text-[#FF7043]">Viewing Resume</h1>
          <p className="text-lg text-gray-700">
            Resume ID: <strong>{id}</strong>
          </p>

          {!id ? (
            <p className="text-center text-gray-600">Loading...</p>
          ) : resume ? (
            <div>
              {/* Render resume content here */}
              <h2 className="text-xl font-semibold mb-4">{resume.fullName || 'Unnamed'}</h2>

              <p><strong>Email:</strong> {resume.email || 'N/A'}</p>
              <p><strong>Phone:</strong> {resume.phone || 'N/A'}</p>
              <p><strong>Location:</strong> {resume.location || 'N/A'}</p>

              {resume.summary && (
                <>
                  <h3 className="mt-6 font-semibold text-lg">Professional Summary</h3>
                  <p>{resume.summary}</p>
                </>
              )}

              {/* You can expand this section to display experiences, education, etc. */}
              {/* For example: */}
              {resume.experiences && resume.experiences.length > 0 && (
                <>
                  <h3 className="mt-6 font-semibold text-lg">Work Experience</h3>
                  <ul className="list-disc list-inside">
                    {resume.experiences.map((exp, index) => (
                      <li key={index}>
                        <p><strong>{exp.title}</strong> at {exp.company}</p>
                        <p>{exp.startDate} - {exp.endDate || 'Present'}</p>
                        <p>{exp.description}</p>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {/* Add more sections as needed */}
            </div>
          ) : (
            <div className="bg-[#F5F5F5] p-6 border border-dashed border-gray-400 rounded text-center text-gray-500">
              🚧 No resume found for ID <code>{id}</code>.
            </div>
          )}
        </section>
      </main>
    </>
  );
}
