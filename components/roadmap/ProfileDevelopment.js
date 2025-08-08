import React, { useState } from 'react';

export default function ProfileDevelopment() {
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [prompts, setPrompts] = useState([
    { id: 1, text: 'Add quantifiable metrics to your work experience.', applied: false },
    { id: 2, text: 'Include a strong summary statement.', applied: false },
    { id: 3, text: 'Highlight relevant skills for your target role.', applied: false },
  ]);

  const handleUpload = (e) => {
    // For now, just simulate upload success
    e.preventDefault();
    setResumeUploaded(true);
  };

  const toggleApplied = (id) => {
    setPrompts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, applied: !p.applied } : p))
    );
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-[#FF7043] mb-4">Profile Development</h2>

      {!resumeUploaded ? (
        <div className="mb-6 text-center">
          <p className="mb-2">Upload your resume to receive personalized AI prompts.</p>
          <button
            onClick={handleUpload}
            className="bg-[#FF7043] text-white px-6 py-3 rounded hover:bg-[#F4511E] transition"
          >
            Upload Resume
          </button>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <div className="bg-gray-300 rounded-full h-4 w-full">
              <div
                className="bg-[#FF7043] h-4 rounded-full"
                style={{ width: '33%' }}
              />
            </div>
            <p className="text-sm mt-1 text-gray-600">Step 1 of 3: Profile Development</p>
          </div>

          <ul className="space-y-4">
            {prompts.map(({ id, text, applied }) => (
              <li key={id} className="flex items-center justify-between border p-4 rounded">
                <span>{text}</span>
                <button
                  onClick={() => toggleApplied(id)}
                  className={`px-3 py-1 rounded text-white ${
                    applied ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-500 hover:bg-gray-600'
                  } transition`}
                >
                  {applied ? 'Applied' : 'Apply Suggestion'}
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-6 text-right">
            <button
              className="bg-[#FF7043] text-white px-6 py-3 rounded hover:bg-[#F4511E] transition"
              // onClick={() => {/* handle next step navigation */}}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
