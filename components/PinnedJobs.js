// components/PinnedJobs.js
export default function PinnedJobs() {
  return (
    <section className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-[#FF7043] text-2xl font-semibold mb-4">Pinned Jobs</h2>

      <div className="space-y-4">
        <div className="p-4 border rounded-lg bg-[#FAFAFA] flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h3 className="text-lg font-semibold text-[#212121]">Customer Success Manager</h3>
            <p className="text-gray-600">Acme Corp • Remote</p>
          </div>
          <div className="flex gap-3 mt-3 md:mt-0">
            <button className="bg-[#FF7043] text-white px-4 py-2 rounded hover:bg-[#F4511E] transition-colors">
              Apply Now
            </button>
            <button className="border border-gray-400 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 transition-colors">
              Remove
            </button>
          </div>
        </div>

        <div className="p-4 border rounded-lg bg-[#FAFAFA] flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h3 className="text-lg font-semibold text-[#212121]">Operations Analyst</h3>
            <p className="text-gray-600">BrightPath • Nashville, TN</p>
          </div>
          <div className="flex gap-3 mt-3 md:mt-0">
            <button className="bg-[#FF7043] text-white px-4 py-2 rounded hover:bg-[#F4511E] transition-colors">
              Apply Now
            </button>
            <button className="border border-gray-400 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 transition-colors">
              Remove
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
