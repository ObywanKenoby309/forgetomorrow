// components/profile/ProfileResumeAttach.js
import React, { useState } from 'react';

export default function ProfileResumeAttach({ withChrome, resume, setResume }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.match(/\.(pdf|docx)$/i)) {
      setUploadError('Only PDF or DOCX files are allowed.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File too large. Max 5MB.');
      return;
    }

    setIsUploading(true);
    setUploadError('');

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await fetch('/api/resume/upload', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Upload failed');
      }

      const data = await res.json();

      // === ENSURE ALL FIELDS ===
      const resumeData = {
        filename: data.filename,
        lastUpdated: data.lastUpdated || new Date().toISOString().split('T')[0],
        score: data.score || 0,
        keywords: data.keywords || []
      };

      setResume(resumeData); // Saves to profile.js → localStorage
    } catch (err) {
      setUploadError(err.message || 'Upload failed. Try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // === SAFE READ ===
  const hasResume = resume && resume.filename && resume.lastUpdated;
  const viewUrl = hasResume ? `/uploads/${resume.filename}` : null;

  return (
    <section
      style={{
        border: '1px solid #eee',
        borderRadius: 12,
        padding: 16,
        background: 'white',
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
      }}
    >
      <h3 style={{ margin: 0, color: '#FF7043', fontWeight: 700, fontSize: '1.1rem' }}>
        Attached Resume
      </h3>

      {hasResume ? (
        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ margin: 0, fontSize: '0.9375rem', color: '#2d3748' }}>
            Uploaded: <strong>{resume.lastUpdated}</strong>
          </p>
          <a
            href={viewUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#FF7043', fontWeight: 600, fontSize: '0.875rem' }}
          >
            View Resume
          </a>
        </div>
      ) : (
        <p style={{ margin: '12px 0 0', color: '#718096', fontSize: '0.9375rem' }}>
          No resume attached yet.
        </p>
      )}

      {uploadError && (
        <p style={{ margin: '8px 0 0', color: '#e53e3e', fontSize: '0.875rem' }}>
          {uploadError}
        </p>
      )}

      <div style={{ marginTop: 16 }}>
        <input
          type="file"
          accept=".pdf,.docx"
          onChange={handleUpload}
          disabled={isUploading}
          id="resume-upload"
          style={{ display: 'none' }}
        />
        <label
          htmlFor="resume-upload"
          style={{
            display: 'inline-block',
            background: '#FF7043',
            color: 'white',
            padding: '10px 20px',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: '0.9375rem',
            cursor: isUploading ? 'not-allowed' : 'pointer',
            opacity: isUploading ? 0.7 : 1,
            transition: 'all 0.2s'
          }}
        >
          {isUploading ? 'Uploading...' : 'Upload Resume'}
        </label>
      </div>
    </section>
  );
}