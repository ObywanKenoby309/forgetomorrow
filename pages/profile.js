import Head from 'next/head';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Profile() {
  const alertFeatureComingSoon = (feature) => () => alert(`${feature} feature coming soon!`);

  return (
    <>
      <Head>
        <title>ForgeTomorrow - Profile</title>
      </Head>

      <Header />

      <main className="max-w-4xl mx-auto p-6 space-y-10 min-h-[80vh] bg-[#ECEFF1] text-[#212121] pt-20">
        {/* Top Section: Image and Basic Info */}
        <section className="bg-white rounded-lg shadow p-8 flex flex-col items-center sm:flex-row sm:items-center sm:space-x-8 relative">
          {/* Profile Picture */}
          <div>
            <img
              src="https://via.placeholder.com/140"
              alt="Profile picture"
              className="profile-pic mb-6 sm:mb-0 rounded-full border-4 border-[#FF7043] object-cover shadow-lg"
              aria-label="User profile picture"
              style={{ width: '140px', height: '140px', boxShadow: '0 0 10px rgba(255,112,67,0.5)' }}
            />
            <button
              className="mt-3 w-full sm:w-auto bg-[#FF7043] hover:bg-[#F4511E] text-white px-4 py-2 rounded font-semibold transition-colors"
              aria-label="Update profile picture"
              onClick={alertFeatureComingSoon('Profile picture update')}
            >
              Update Picture
            </button>
          </div>

          {/* Basic Info */}
          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-4xl font-bold text-[#FF7043]">Eric James</h1>
              <p className="text-gray-700 text-lg">He/Him</p>
            </div>
            <div>
              <p className="text-gray-600 italic max-w-lg">
                Customer Success Leader & AI Advocate
              </p>
            </div>
            <div className="flex flex-wrap gap-4 text-gray-600">
              <span>Location: Nashville, TN</span>
              <span>Status: Open to Opportunities</span>
            </div>
          </div>
        </section>

        {/* About Me Section */}
        <section className="bg-white rounded-lg shadow p-6 relative">
          <button
            className="absolute top-4 right-4 bg-[#FF7043] hover:bg-[#F4511E] text-white px-3 py-1 rounded text-sm font-semibold"
            aria-label="Edit About Me"
            onClick={alertFeatureComingSoon('Edit About Me')}
          >
            Edit
          </button>
          <h2 className="text-2xl font-semibold text-[#FF7043] mb-4">About Me</h2>
          <p className="text-gray-700">
            Experienced leader with 20+ years in customer success, technical support, and team management. Passionate about building authentic professional relationships and leveraging AI to empower job seekers.
          </p>
        </section>

        {/* Professional History Link */}
        <section
          className="bg-white rounded-lg shadow p-6 flex justify-between items-center cursor-pointer hover:shadow-md transition-shadow"
          onClick={alertFeatureComingSoon('Professional History section')}
          tabIndex={0}
          role="button"
          aria-label="Go to Professional History"
          onKeyPress={(e) => { if (e.key === 'Enter') alertFeatureComingSoon('Professional History section')(); }}
        >
          <h2 className="text-2xl font-semibold text-[#FF7043]">Professional History</h2>
          <span className="text-[#FF7043] font-bold text-xl">→</span>
        </section>

        {/* Analytics Link */}
        <section
          className="bg-white rounded-lg shadow p-6 flex justify-between items-center cursor-pointer hover:shadow-md transition-shadow"
          onClick={alertFeatureComingSoon('Analytics dashboard')}
          tabIndex={0}
          role="button"
          aria-label="Go to Analytics Dashboard"
          onKeyPress={(e) => { if (e.key === 'Enter') alertFeatureComingSoon('Analytics dashboard')(); }}
        >
          <h2 className="text-2xl font-semibold text-[#FF7043]">Analytics</h2>
          <span className="text-[#FF7043] font-bold text-xl">→</span>
        </section>
      </main>

      <Footer />
    </>
  );
}
