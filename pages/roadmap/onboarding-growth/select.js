// pages/roadmap/onboarding-growth/select.js
import Head from 'next/head';
import { useRouter } from 'next/router';
import SeekerSidebar from '../../../components/SeekerSidebar';
import ResumeSelector from '../../../components/resume/ResumeSelector';

export default function OnboardingGrowthResumeSelectorPage() {
  const router = useRouter();

  // TODO: wire this to your real plan source (e.g., UserContext / auth)
  const userPlan = 'free'; // 'free' | 'paid'

  return (
    <>
      <Head>
        <title>Select Resume | Onboarding & Growth | ForgeTomorrow</title>
      </Head>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '300px minmax(0, 1fr) 300px',
          gap: '20px',
          padding: '120px 20px 20px',
          minHeight: '100vh',
          backgroundColor: '#ECEFF1',
        }}
      >
        <SeekerSidebar />

        <main
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            padding: '32px',
            maxWidth: '800px',
            width: '100%',
          }}
        >
          <h1
            style={{
              color: '#FF7043',
              fontSize: '2rem',
              fontWeight: '700',
              textAlign: 'center',
              marginBottom: '24px',
            }}
          >
            Select Your Resume for Onboarding & Growth
          </h1>

          <ResumeSelector
            plan={userPlan}
            onConfirm={(resumeId) => {
              // Next step will read this ID and generate results
              router.push(`/roadmap/onboarding-growth/results?resumeId=${encodeURIComponent(resumeId)}`);
            }}
            onExhausted={() => {
              alert('You’ve reached your monthly limit. Upgrade to unlock more analyses.');
            }}
          />
        </main>

        {/* Right column reserved for tips/upgrade later */}
        <aside
          style={{
            backgroundColor: '#ECEFF1',
            borderRadius: '8px',
            width: '300px',
          }}
        />
      </div>
    </>
  );
}
