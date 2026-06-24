// pages/demo/applications.js
// Demo — Applications board with fake data
import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import ApplicationsBoard from '@/components/applications/ApplicationsBoard';

const FAKE_STAGES = {
  Pinned: [
    { id: 'p1', title: 'Senior Product Manager', company: 'Stripe', location: 'Remote', dateAdded: '2026-06-20', jobId: null },
    { id: 'p2', title: 'VP of Product', company: 'Airbnb', location: 'San Francisco, CA', dateAdded: '2026-06-21', jobId: null },
    { id: 'p3', title: 'Director of Product Strategy', company: 'Figma', location: 'Remote', dateAdded: '2026-06-22', jobId: null },
  ],
  Applied: [
    { id: 'a1', title: 'Chief Product Officer', company: 'Notion', location: 'New York, NY', dateAdded: '2026-06-18', jobId: 'j1' },
    { id: 'a2', title: 'Head of Product', company: 'Linear', location: 'Remote', dateAdded: '2026-06-19', jobId: null },
    { id: 'a3', title: 'Product Lead — Platform', company: 'Vercel', location: 'Remote', dateAdded: '2026-06-20', jobId: null },
    { id: 'a4', title: 'Senior PM, Growth', company: 'Loom', location: 'San Francisco, CA', dateAdded: '2026-06-21', jobId: null },
    { id: 'a5', title: 'Group Product Manager', company: 'Atlassian', location: 'Austin, TX', dateAdded: '2026-06-22', jobId: null },
  ],
  Interviewing: [
    { id: 'i1', title: 'VP Product Management', company: 'Anthropic', location: 'San Francisco, CA', dateAdded: '2026-06-15', jobId: 'j2' },
    { id: 'i2', title: 'Principal Product Manager', company: 'Databricks', location: 'Remote', dateAdded: '2026-06-17', jobId: null },
  ],
  Offers: [
    { id: 'o1', title: 'SVP Product', company: 'Scale AI', location: 'San Francisco, CA', dateAdded: '2026-06-10', jobId: 'j3' },
  ],
  'Closed Out': [
    { id: 'c1', title: 'Senior PM', company: 'Meta', location: 'Menlo Park, CA', dateAdded: '2026-06-01', jobId: null },
    { id: 'c2', title: 'Product Manager III', company: 'Google', location: 'Mountain View, CA', dateAdded: '2026-06-03', jobId: null },
  ],
};

const TRACKER = Object.fromEntries(Object.entries(FAKE_STAGES).map(([k, v]) => [k, v]));

export default function DemoApplications() {
  return (
    <>
      <Head><title>Applications — ForgeTomorrow</title></Head>
      <SeekerLayout
        header={
          <div style={{ background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 10px 28px rgba(15,23,42,0.12)', backdropFilter: 'blur(12px)', borderRadius: 18, padding: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#FF7043', fontStyle: 'italic' }}>Applications</div>
            <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Track your job search across stages, keep notes, and move roles forward.</div>
          </div>
        }
      >
        <ApplicationsBoard
          stagesData={FAKE_STAGES}
          compact={false}
          columns={5}
          onMove={() => {}}
          onEdit={() => {}}
          onDelete={() => {}}
          onView={() => {}}
          onOpenPrep={() => {}}
          onAdd={() => {}}
        />
      </SeekerLayout>
    </>
  );
}
