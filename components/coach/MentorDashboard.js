import React from 'react';

export default function MentorDashboard() {
  return (
    <div className="min-h-screen p-6 bg-[#ECEFF1] text-[#212121] max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold mb-6 text-[#FF7043]">
        Mentor Dashboard
      </h1>

      {/* Mentee Tracker */}
      <section className="mb-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-4">Mentee Tracker</h2>
        <p className="text-gray-600">
          No mentees yet. When someone connects with you through The Hearth,
          they will appear here.
        </p>
      </section>

      {/* Appointments */}
      <section className="mb-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-4">Appointments</h2>
        <p className="text-gray-600">
          No appointments scheduled. Upcoming sessions will appear here once
          calendar integration is enabled.
        </p>
      </section>

      {/* Newsletter Manager */}
      <section className="mb-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-4">Newsletter Manager</h2>
        <p className="text-gray-600">
          This tool will allow you to send updates and resources to your mentees.
        </p>
      </section>

      {/* Services & Portfolio */}
      <section className="mb-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-4">Services & Portfolio</h2>
        <p className="text-gray-600">
          Define your mentorship offerings, specialties, and experience here.
        </p>
      </section>

      {/* Reviews & Feedback */}
      <section className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-4">Reviews & Feedback</h2>
        <p className="text-gray-600">
          No reviews yet. Feedback from mentees will appear here once sessions
          are completed.
        </p>
      </section>
    </div>
  );
}
