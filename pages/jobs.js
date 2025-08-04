import Head from 'next/head';
import Link from 'next/link';
import { useJobPipeline } from '../context/JobPipelineContext';

export default function Jobs() {
  const { addViewedJob, addAppliedJob } = useJobPipeline();

  const jobs = [
    { id: 'job-123', title: 'Software Engineer', company: 'Tech Innovators', date: '2025-07-30' },
    { id: 'job-456', title: 'Product Designer', company: 'Creative Solutions', date: '2025-07-31' },
    { id: 'job-789', title: 'Marketing Coordinator', company: 'MarketMedia', date: '2025-07-31' },
  ];

  const handleViewJob = (job) => {
    addViewedJob(job);
    alert(`Viewing job: ${job.title} at ${job.company}`);
  };

  const handleApplyJob = (job) => {
    addAppliedJob(job);
    alert(`Applied to job: ${job.title} at ${job.company}`);
  };

  return (
    <>
      <Head>
        <title>ForgeTomorrow - The Pipeline</title>
      </Head>

      <main className="max-w-7xl mx-auto p-6 min-h-[80vh] bg-[#ECEFF1] text-[#212121] space-y-8">
        <section>
          <h1 className="text-4xl font-bold text-[#FF7043] mb-2">The Pipeline</h1>
          <p className="text-gray-700 max-w-3xl mb-6">
            Welcome to your job discovery hub! Explore recent and featured job postings below. Find the role you want, then track your applications and progress from your personal Pipeline Dashboard.
          </p>
          <Link href="/pipeline" passHref>
            <button
              type="button"
              className="inline-block bg-[#FF7043] hover:bg-[#F4511E] text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              aria-label="Go to Pipeline Dashboard"
            >
              Go to Pipeline Dashboard
            </button>
          </Link>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content: 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search Filters (static for now) */}
            <form className="flex flex-col sm:flex-row gap-3" role="search" aria-label="Job search form">
              <input
                type="text"
                name="keywords"
                placeholder="Job title or keywords"
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300"
                aria-label="Job title or keywords"
              />
              <input
                type="text"
                name="location"
                placeholder="Location"
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300"
                aria-label="Location"
              />
              <button
                type="submit"
                className="bg-[#FF7043] hover:bg-[#F4511E] text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                aria-label="Search jobs"
              >
                Search
              </button>
            </form>

            {/* Recent Job Listings */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4 text-[#FF7043]">Recent Job Listings</h2>
              <ul className="space-y-3" role="list" aria-label="Recent job listings">
                {jobs.map((job) => (
                  <li
                    key={job.id}
                    className="flex justify-between items-center border-b border-gray-200 py-2"
                  >
                    <div>
                      <strong>{job.title}</strong> – {job.company}
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleViewJob(job)}
                        className="text-[#FF7043] hover:underline font-semibold"
                        aria-label={`View details for ${job.title}`}
                        type="button"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleApplyJob(job)}
                        className="bg-[#FF7043] hover:bg-[#F4511E] text-white px-3 py-1 rounded"
                        aria-label={`Apply to ${job.title}`}
                        type="button"
                      >
                        Apply
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Featured Jobs (static example) */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4 text-[#FF7043]">Featured Jobs</h2>
              <ul className="space-y-4" role="list" aria-label="Featured job listings">
                <li className="bg-gray-100 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                  <strong>Sales Representative</strong><br />
                  Global Enterprises – New York, NY
                </li>
                <li className="bg-gray-100 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                  <strong>UI/UX Designer</strong><br />
                  Design Hub – Remote
                </li>
              </ul>
            </div>
          </div>

          {/* Sidebar: 1/3 width */}
          <aside className="bg-[#37474F] text-white p-6 rounded-lg shadow-lg flex flex-col justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-3">Find your dream job</h2>
              <p className="mb-6 text-sm leading-relaxed">
                Browse through hundreds of job listings and apply to opportunities in seconds.
              </p>
              <Link href="/signup" passHref>
                <button
                  type="button"
                  className="bg-[#FF7043] hover:bg-[#F4511E] w-full py-3 rounded-lg font-semibold transition-colors"
                  aria-label="Create account"
                >
                  Create Account
                </button>
              </Link>
            </div>
          </aside>
        </section>
      </main>
    </>
  );
}
