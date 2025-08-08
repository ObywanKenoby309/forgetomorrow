import Head from 'next/head';
import { useState } from 'react';

import SeekerSidebar from '../components/SeekerSidebar';
import ToolkitLanding from '../components/roadmap/ToolkitLanding';
import ProfileDevelopment from '../components/roadmap/ProfileDevelopment';
import OfferNegotiation from '../components/roadmap/OfferNegotiation';
import OnboardingGrowth from '../components/roadmap/OnboardingGrowth';

export default function CareerRoadmap() {
  const [activeModule, setActiveModule] = useState(null);

  return (
    <>
      <Head>
        <title>Career Development Toolkit | ForgeTomorrow</title>
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
            justifyContent: 'center',
          }}
        >
          <div
            style={{
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
                fontSize: '2.25rem',
                fontWeight: '700',
                textAlign: 'center',
                marginBottom: '24px',
              }}
            >
              Career Development Toolkit
            </h1>

            {!activeModule && (
              <>
                <p
                  style={{
                    color: '#4A5568',
                    fontSize: '1.125rem',
                    maxWidth: '600px',
                    margin: '0 auto 32px auto',
                    lineHeight: '1.6',
                  }}
                >
                  Welcome to your Career Development Toolkit! This powerful AI-driven
                  resource is designed to guide you through every stage of your job
                  search and early career growth. From personalized insights on your
                  resume and professional background, to expert advice on job offers and
                  onboarding success, we’re here to help you build the career you deserve.
                </p>

                <p
                  style={{
                    color: '#4A5568',
                    fontSize: '1.125rem',
                    maxWidth: '600px',
                    margin: '0 auto 16px auto',
                    lineHeight: '1.6',
                  }}
                >
                  Here’s what you can expect:
                </p>

                <ul
                  style={{
                    color: '#4A5568',
                    maxWidth: '600px',
                    margin: '0 auto 32px auto',
                    lineHeight: '1.6',
                    listStyleType: 'disc',
                    paddingLeft: '20px',
                  }}
                >
                  <li>Tailored recommendations based on your unique skills and goals</li>
                  <li>
                    Step-by-step guidance through Profile Development, Offer Negotiation,
                    and Onboarding & Growth
                  </li>
                  <li>Practical tools to help you land your ideal job and thrive in your new role</li>
                  <li>
                    Flexibility to take these results and work on your plan independently—
                    or collaborate with a trainer,
