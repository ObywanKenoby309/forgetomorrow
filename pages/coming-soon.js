import Head from 'next/head';

export default function ComingSoon() {
  return (
    <>
      <Head>
        <title>ForgeTomorrow – Coming Soon</title>
      </Head>

      <main className="min-h-screen bg-[#ECEFF1] flex flex-col items-center justify-center px-6">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-lg text-center">
          <h1 className="text-4xl font-bold text-[#FF7043] mb-4">
            🚀 ForgeTomorrow
          </h1>
          <p className="text-gray-700 mb-6 text-lg">
            We’re building something powerful for job seekers, businesses, and coaches.  
            Our platform is currently in a private stage while we prepare for launch.
          </p>
          <p className="text-gray-600 mb-6">
            Want to be first in line when we open?  
            Join our waiting list today and get early access.
          </p>
          <a
            href="/waiting-list"
            className="bg-[#FF7043] hover:bg-[#E64A19] text-white px-6 py-3 rounded-lg font-semibold transition"
          >
            Join the Waiting List
          </a>
        </div>

        <footer className="mt-10 text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} ForgeTomorrow. All rights reserved.
        </footer>
      </main>
    </>
  );
}
