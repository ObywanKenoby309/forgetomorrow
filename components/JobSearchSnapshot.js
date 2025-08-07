// components/JobSearchSnapshot.js
export default function JobSearchSnapshot() {
  return (
    <section className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-[#FF7043] text-2xl font-semibold mb-4">Job Search Snapshot</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        <div className="bg-[#FFE0B2] p-4 rounded">
          <h3 className="text-lg font-semibold text-[#BF360C]">Applications Sent</h3>
          <p className="text-3xl font-bold text-[#BF360C]">27</p>
        </div>

        <div className="bg-[#C8E6C9] p-4 rounded">
          <h3 className="text-lg font-semibold text-[#1B5E20]">Viewed by Employers</h3>
          <p className="text-3xl font-bold text-[#1B5E20]">11</p>
        </div>

        <div className="bg-[#BBDEFB] p-4 rounded">
          <h3 className="text-lg font-semibold text-[#0D47A1]">Interviews Scheduled</h3>
          <p className="text-3xl font-bold text-[#0D47A1]">3</p>
        </div>

        <div className="bg-[#F8BBD0] p-4 rounded">
          <h3 className="text-lg font-semibold text-[#880E4F]">Offers Received</h3>
          <p className="text-3xl font-bold text-[#880E4F]">1</p>
        </div>

        <div className="bg-[#E0F7FA] p-4 rounded col-span-2 md:col-span-1">
          <h3 className="text-lg font-semibold text-[#006064]">Last Application Sent</h3>
          <p className="text-xl font-medium text-[#006064]">3 days ago</p>
        </div>
      </div>
    </section>
  );
}
