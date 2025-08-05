import React, { useState } from 'react';

export default function MentorDashboard() {
  // Dummy mentees data
  const [mentees, setMentees] = useState([
    { id: 1, name: 'Alice Smith', status: 'Active', notes: 'Resume review done' },
    { id: 2, name: 'Bob Johnson', status: 'New', notes: '' },
  ]);

  // Dummy appointments data
  const [appointments, setAppointments] = useState([
    { id: 1, menteeName: 'Alice Smith', date: '2025-08-10', time: '14:00' },
  ]);

  // Dummy reviews
  const [reviews, setReviews] = useState([
    { id: 1, menteeName: 'Alice Smith', rating: 5, comment: 'Great mentor!' },
  ]);

  return (
    <div className="min-h-screen p-6 bg-[#ECEFF1] text-[#212121] max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold mb-6 text-[#FF7043]">Mentor Dashboard</h1>

      {/* Mentee Tracker */}
      <section className="mb-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-4">Mentee Tracker</h2>
        <ul>
          {mentees.map(({ id, name, status, notes }) => (
            <li key={id} className="border-b py-2">
              <strong>{name}</strong> — <em>{status}</em>
              <p className="text-sm text-gray-600">{notes}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Calendar */}
      <section className="mb-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-4">Appointments</h2>
        <ul>
          {appointments.map(({ id, menteeName, date, time }) => (
            <li key={id} className="border-b py-2">
              {menteeName} — {date} at {time}
            </li>
          ))}
        </ul>
      </section>

      {/* Newsletter Manager (placeholder) */}
      <section className="mb-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-4">Newsletter Manager</h2>
        <p className="text-gray-600 italic">Newsletter creation and sending coming soon...</p>
      </section>

      {/* Services & Portfolio (placeholder) */}
      <section className="mb-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-4">Services & Portfolio</h2>
        <p className="text-gray-600 italic">Portfolio builder coming soon...</p>
      </section>

      {/* Reviews & Feedback */}
      <section className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-4">Reviews & Feedback</h2>
        <ul>
          {reviews.map(({ id, menteeName, rating, comment }) => (
            <li key={id} className="border-b py-2">
              <strong>{menteeName}</strong> — Rating: {rating} ⭐
              <p>{comment}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
