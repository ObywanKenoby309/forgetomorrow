// pages/cover/create.js
import { useContext, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import { ResumeContext } from '@/context/ResumeContext';
import { extractTextFromFile } from '@/lib/jd/ingest';
import BulkExportCTA from '@/components/BulkExportCTA';
import CoverPDFButton from '@/components/cover-letter/export/CoverPDFButton';

const CoverLetterTemplate = dynamic(
  () => import('@/components/cover-letter/CoverLetterTemplate'),
  { ssr: false }
);

const ORANGE = '#FF7043';

function Banner({ children }) {
  return (
    <div
      style={{
        background: '#FFF3E0',
        border: '1px solid #FFCC80',
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        color: '#E65100',
        fontWeight: 600,
      }}
    >
      {children}
    </div>
  );
}

function Section({ title, open, onToggle, children, required = false }) {
  return (
    <div
      style={{
        background: 'white',
        border: '1px solid #E5E7EB',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          padding: '16px 20px',
          background: required ? '#FFF7E6' : '#FAFAFA',
          textAlign: 'left',
          fontWeight: 800,
          fontSize: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <span style={{ color: required ? ORANGE : '#1F2937' }}>{title}</span>
        <span
          style={{
            width: 24,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            className="w-5 h-5 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            {open ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 12H4"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            )}
          </svg>
        </span>
      </button>
      {open && (
        <div style={{ padding: '24px 20px', borderTop: '1px solid #E5E7EB' }}>
          {children}
        </div>
      )}
    </div>
  );
}

export default function CoverLetterPage() {
  const router = useRouter();

  // 🔸 Preserve chrome mode (seeker / coach / recruiter-smb / recruiter-ent)
  const chrome = String(router.query.chrome || '').toLowerCase();
  const withChrome = (path) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

  const fileInputRef = useRef(null);
  const dropRef = useRef(null);
  const { formData = {}, saveEventAt } = useContext(ResumeContext);

  const [jd, setJd] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [recipient, setRecipient] = useState('Hiring Manager');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [greeting, setGreeting] = useState('Dear Hiring Manager,');
  const [opening, setOpening] = useState('');
  const [body, setBody] = useState('');
  const [closing, setClosing] = useState('');
  const [signoff, setSignoff] = useState('Sincerely,');
  const [portfolio, setPortfolio] = useState(formData?.portfolio || '');

  const [openRequired, setOpenRequired] = useState(true);
  const [openContent, setOpenContent] = useState(true);
  const [openTailor, setOpenTailor] = useState(false);

  const [showToast, setShowToast] = useState(false);

  const savedTime = saveEventAt
    ? new Date(saveEventAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const letterData = {
    fullName: formData.fullName || 'Your Name',
    email: formData.email || '',
    phone: formData.phone || '',
    location: formData.location || '',
    portfolio: portfolio || '',
    recipient: recipient || 'Hiring Manager',
    company: company || 'the company',
    role: role || 'the position',
    greeting: greeting || 'Dear Hiring Manager,',
    opening: opening || '',
    body: body || '',
    closing: closing || '',
    signoff: signoff || 'Sincerely,',
    jd: jd || '',
  };

  // Load last JD if present
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ft_last_job_text');
      if (saved) setJd(saved);
    } catch {
      // ignore
    }
  }, []);

  const handleFile = async (file) => {
    if (!file) return;
    try {
      const text = await extractTextFromFile(file);
      setJd(text);
      try {
        localStorage.setItem('ft_last_job_text', text);
      } catch {
        // ignore
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Drag/drop for JD
  useEffect(() => {
    const el = dropRef.current;
    if (!el) return;

    const prevent = (e) => e.preventDefault();
    const onDrop = (e) => {
      prevent(e);
      if (e.dataTransfer?.files?.[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    };

    el.addEventListener('dragover', prevent);
    el.addEventListener('drop', onDrop);

    return () => {
      el.removeEventListener('dragover', prevent);
      el.removeEventListener('drop', onDrop);
    };
  }, []);

  // Auto-save draft
  useEffect(() => {
    const timer = setInterval(() => {
      try {
        localStorage.setItem(
          'ft_cover_draft',
          JSON.stringify({
            recipient,
            company,
            role,
            greeting,
            opening,
            body,
            closing,
            signoff,
            portfolio,
          })
        );
      } catch {
        // ignore
      }
    }, 30000);

    return () => clearInterval(timer);
  }, [recipient, company, role, greeting, opening, body, closing, signoff, portfolio]);

  // Toast behavior (match resume/create)
  useEffect(() => {
    if (!saveEventAt) return;
    setShowToast(true);
    const t = setTimeout(() => setShowToast(false), 2200);
    return () => clearTimeout(t);
  }, [saveEventAt]);

  const runAITailor = async () => {
    if (!jd.trim()) return;
    setIsLoading(true);

    try {
      const experiences = formData.workExperiences || [];
      const expText = experiences
        .map(
          (exp) =>
            `${exp.jobTitle} at ${exp.company}: ${
              exp.bullets?.join('. ') || ''
            }`
        )
        .filter(Boolean)
        .join('\n');

      const prompt = `
You are a brutal, direct cover letter AI. Write:
- 1 opening sentence (12 words max)
- 3 bullet points (10 words max each)
- 1 closing sentence (8 words max)
Use ONLY real candidate achievements with numbers.
Match job exactly. No fluff.
JOB:
${jd}
CANDIDATE:
${expText || 'No experience data'}
OUTPUT FORMAT:
OPENING: ...
BULLET1: ...
BULLET2: ...
BULLET3: ...
CLOSING: ...
      `.trim();

      const res = await fetch('/api/ai-tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const text = await res.text();
      const lines = text.split('\n').map((l) => l.trim());

      const openingLine =
        lines
          .find((l) => l.startsWith('OPENING:'))
          ?.replace('OPENING:', '')
          .trim() || '';

      const bullets = lines
        .filter((l) => l.match(/^BULLET[1-3]:/))
        .map((l) => l.replace(/^BULLET\d+:/, '').trim())
        .filter(Boolean);

      const closingLine =
        lines
          .find((l) => l.startsWith('CLOSING:'))
          ?.replace('CLOSING:', '')
          .trim() || '';

      setOpening(openingLine);
      setBody(bullets.join('\n'));
      setClosing(closingLine);
    } catch (err) {
      console.error('AI Tailor failed:', err);
      alert('AI failed. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // HEADER
  const Header = (
    <section className="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-sm">
      <h1 className="text-3xl font-bold text-orange-600">Cover Builder</h1>
      <p className="text-gray-600 mt-3 max-w-2xl mx-auto">
        1 letter. 3 bullets. 100% tailored.{' '}
        No generic paragraphs. Only your real wins.{' '}
        Beats 3-paragraph letters every time.
      </p>
      <div className="flex items-center justify-center gap-8 mt-6">
        <button
          onClick={() => router.push(withChrome('/resume/create'))}
          className="min-w-[160px] px-6 py-3 rounded-full font-bold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          1. Resume
        </button>
        <div className="w-16 h-px bg-gray-300" />
        <button
          onClick={() => router.push(withChrome('/cover/create'))}
          className="min-w-[160px] px-6 py-3 rounded-full font-bold text-sm bg-orange-500 text-white shadow-md"
        >
          2. Cover Letter
        </button>
      </div>
    </section>
  );

  const Footer = (
    <div className="mt-16 text-center text-xs text-gray-500 max-w-2xl mx-auto px-4">
      *87% of job seekers using ATS-optimized resumes receive at least one interview within 7
      days of applying.
      <em> Source: Jobscan 2024 Applicant Study (n=1,200). Results vary.</em>
    </div>
  );

  return (
    <SeekerLayout
      title="Cover Letter Builder"
      header={Header}
      right={null}
      footer={Footer}
      activeNav="resume-cover"
    >
      <div
        style={{
          maxWidth: 1600,
          margin: '0 auto',
          padding: '20px 16px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 40,
          alignItems: 'start',
        }}
      >
        {/* LEFT: FORM */}
        <div
          style={{
            display: 'grid',
            gap: 20,
            position: 'sticky',
            top: 20,
          }}
        >
          <Banner>
            Live preview updates instantly on the right •{' '}
            <a
              href={withChrome('/resume/create')}
              style={{ textDecoration: 'underline' }}
            >
              Back to Resume
            </a>
          </Banner>

          {/* Philosophy box */}
          <div
            style={{
              background: '#FFF7E6',
              border: '1px solid #FED7AA',
              borderRadius: 12,
              padding: 18,
              marginBottom: 20,
              fontSize: 14,
              lineHeight: 1.6,
              color: '#92400E',
            }}
          >
            <strong
              style={{
                fontSize: 15,
                display: 'block',
                marginBottom: 8,
              }}
            >
              The Forge Cover Letter Philosophy
            </strong>
            <strong>Short = Strong.</strong> Recruiters spend <strong>6 seconds</strong> on your
            letter. We remove fluff, keep metrics, and make every word count.
            <br />
            <br />
            <strong>Bullets = Scan-proof.</strong> Humans don’t read — they{' '}
            <strong>scan</strong>. 3 bullets with numbers beat 3 paragraphs every time.
            <br />
            <br />
            <strong>No “excited.” Just impact.</strong> Your resume tells the story. This letter{' '}
            <strong>lands the punch</strong>.
          </div>

          {/* Required section */}
          <Section
            title="Required – Start Here"
            open={openRequired}
            onToggle={() => setOpenRequired((v) => !v)}
            required
          >
            <div style={{ display: 'grid', gap: 20 }}>
              <div>
                <label style={{ fontWeight: 700 }}>Recipient</label>
                <input
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="Hiring Manager"
                  style={{
                    width: '100%',
                    padding: 12,
                    border: '1px solid #E5E7EB',
                    borderRadius: 8,
                  }}
                />
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                }}
              >
                <div>
                  <label style={{ fontWeight: 700 }}>Company</label>
                  <input
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Company XYZ"
                    style={{
                      width: '100%',
                      padding: 12,
                      border: '1px solid #E5E7EB',
                      borderRadius: 8,
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontWeight: 700 }}>Role (Optional)</label>
                  <input
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="Senior Designer"
                    style={{
                      width: '100%',
                      padding: 12,
                      border: '1px solid #E5E7EB',
                      borderRadius: 8,
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontWeight: 700 }}>Greeting</label>
                <input
                  value={greeting}
                  onChange={(e) => setGreeting(e.target.value)}
                  placeholder="Dear Hiring Manager,"
                  style={{
                    width: '100%',
                    padding: 12,
                    border: '1px solid #E5E7EB',
                    borderRadius: 8,
                  }}
                />
              </div>

              <div>
                <label style={{ fontWeight: 700 }}>
                  Portfolio / Website (Optional)
                </label>
                <input
                  type="url"
                  value={portfolio}
                  onChange={(e) => setPortfolio(e.target.value)}
                  placeholder="https://yourwebsite.com"
                  style={{
                    width: '100%',
                    padding: 12,
                    border: '1px solid #E5E7EB',
                    borderRadius: 8,
                  }}
                />
              </div>
            </div>
          </Section>

          {/* Content section */}
          <Section
            title="Letter Content"
            open={openContent}
            onToggle={() => setOpenContent((v) => !v)}
          >
            <div style={{ display: 'grid', gap: 20 }}>
              <div>
                <label style={{ fontWeight: 700 }}>Opening Paragraph</label>
                <textarea
                  value={opening}
                  onChange={(e) => setOpening(e.target.value)}
                  placeholder="I’m applying because I built the future of job apps."
                  style={{
                    width: '100%',
                    height: 100,
                    padding: 12,
                    border: '1px solid #E5E7EB',
                    borderRadius: 8,
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div>
                <label style={{ fontWeight: 700 }}>Body (Key Points)</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={
                    'Key point 1 with an increase of success of 45%\n' +
                    'Key point 2 with a decrease of loss by 23%\n' +
                    'Retained customer base of 73%'
                  }
                  style={{
                    width: '100%',
                    height: 150,
                    padding: 12,
                    border: '1px solid #E5E7EB',
                    borderRadius: 8,
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                }}
              >
                <div>
                  <label style={{ fontWeight: 700 }}>Closing</label>
                  <textarea
                    value={closing}
                    onChange={(e) => setClosing(e.target.value)}
                    placeholder="Let’s talk."
                    style={{
                      width: '100%',
                      height: 80,
                      padding: 12,
                      border: '1px solid #E5E7EB',
                      borderRadius: 8,
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontWeight: 700 }}>Sign-off</label>
                  <input
                    value={signoff}
                    onChange={(e) => setSignoff(e.target.value)}
                    placeholder="Sincerely,"
                    style={{
                      width: '100%',
                      padding: 12,
                      border: '1px solid #E5E7EB',
                      borderRadius: 8,
                    }}
                  />
                </div>
              </div>
            </div>
          </Section>

          {/* Tailor to Job */}
          <Section
            title="Tailor to Job"
            open={openTailor}
            onToggle={() => setOpenTailor((v) => !v)}
          >
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <label
                  style={{ fontWeight: 700, fontSize: 14 }}
                >
                  Paste Job Description (Primary)
                </label>
                <textarea
                  value={jd}
                  onChange={(e) => setJd(e.target.value)}
                  placeholder="Paste the full job description here..."
                  style={{
                    width: '100%',
                    height: 160,
                    padding: 12,
                    border: '1px solid #E5E7EB',
                    borderRadius: 8,
                    fontFamily: 'inherit',
                    fontSize: 14,
                    resize: 'vertical',
                  }}
                />
              </div>

              <div
                style={{
                  textAlign: 'center',
                  fontSize: 13,
                  color: '#666',
                }}
              >
                or{' '}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    color: ORANGE,
                    background: 'none',
                    border: 0,
                    fontWeight: 800,
                    textDecoration: 'underline',
                    cursor: 'pointer',
                  }}
                >
                  upload file
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                  style={{ display: 'none' }}
                />
              </div>

              {jd && (
                <div
                  style={{
                    padding: '8px 12px',
                    background: '#F0FDF4',
                    border: '1px solid #BBF7D0',
                    borderRadius: 8,
                    fontSize: 12,
                    color: '#166534',
                    fontWeight: 600,
                  }}
                >
                  JD loaded •{' '}
                  {jd.split(/\s+/).filter(Boolean).length} words
                </div>
              )}

              {jd && (
                <button
                  onClick={runAITailor}
                  disabled={isLoading || !jd.trim()}
                  style={{
                    width: '100%',
                    background: isLoading ? '#9CA3AF' : ORANGE,
                    color: 'white',
                    padding: 16,
                    borderRadius: 12,
                    fontWeight: 800,
                    fontSize: 16,
                    border: 'none',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.7 : 1,
                  }}
                >
                  {isLoading ? 'AI Tailoring...' : 'AI TAILOR to 3s'}
                </button>
              )}

              {/* Invisible drop target to share the same box as page */}
              <div
                ref={dropRef}
                style={{
                  height: 1,
                  opacity: 0,
                  pointerEvents: 'none',
                }}
              />
            </div>
          </Section>
        </div>

        {/* RIGHT: LIVE PREVIEW */}
        <div
          style={{
            position: 'sticky',
            top: 20,
            background: 'white',
            borderRadius: 16,
            boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '20px 32px',
              background: '#263238',
              color: 'white',
              fontWeight: 800,
              fontSize: 18,
              textAlign: 'center',
            }}
          >
            LIVE COVER LETTER
          </div>
          <div
            style={{
              padding: 60,
              background: '#fff',
              minHeight: '100vh',
            }}
          >
            <CoverLetterTemplate data={letterData} />
          </div>
        </div>
      </div>

      {/* EXPORT BUTTONS (match resume/create style & position) */}
      <div className="fixed bottom-24 right-6 z-40 flex items-center gap-2 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-2xl border">
        <CoverPDFButton templateId="ats-cover" data={letterData}>
          <div className="bg-teal-600 text-white px-4 py-2 rounded-full font-bold text-xs hover:bg-teal-700 transition-all cursor-pointer">
            ATS PDF
          </div>
        </CoverPDFButton>

        <CoverPDFButton templateId="cover-pdf" data={letterData}>
          <div className="bg-orange-500 text-white px-4 py-2 rounded-full font-bold text-xs hover:bg-orange-600 transition-all cursor-pointer">
            Designed PDF
          </div>
        </CoverPDFButton>
      </div>

      <div className="mt-6 max-w-4xl mx-auto">
        <BulkExportCTA />
      </div>

      {saveEventAt && showToast && (
        <div
          style={{
            position: 'fixed',
            right: 28,
            bottom: 100,
            background: '#16A34A',
            color: 'white',
            padding: '12px 20px',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 14,
            boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span>Saved</span>
          <span style={{ fontSize: 12, opacity: 0.8 }}>{savedTime}</span>
        </div>
      )}
    </SeekerLayout>
  );
}
