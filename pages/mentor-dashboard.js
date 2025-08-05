// pages/mentor-dashboard.js
import Head from 'next/head';
import MentorDashboard from '../components/MentorDashboard';

export default function MentorDashboardPage() {
  return (
    <>
      <Head>
        <title>ForgeTomorrow - Mentor Dashboard</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <MentorDashboard />
    </>
  );
}
