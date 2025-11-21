// pages/api/jobs.js — FINAL VERSION (safe + future-proof)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// Your current hard-coded jobs (keeps the site 100% working even if Supabase isn't set up yet)
const fallbackJobs = [
  {
    id: 1,
    title: 'Frontend Developer',
    company: 'ForgeTomorrow',
    description: 'Build cutting-edge UIs for modern professionals.',
    location: 'Remote',
  },
  {
    id: 2,
    title: 'Mentor Coordinator',
    company: 'ForgeTomorrow',
    description: 'Help manage and scale mentorship experiences.',
    location: 'Hybrid (Remote/Nashville)',
  },
];

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // If Supabase is configured → pull real jobs
    if (supabase) {
      const { data, error } = await supabase
        .from('jobs')                    // ← change if your table name is different
        .select('id, title, company, description, location, salary, type')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // If we got real jobs → use them
      if (data && data.length > 0) {
        return res.status(200).json({ jobs: data });
      }
    }

    // If no Supabase or no jobs in DB → fall back to your hard-coded ones
    console.log('Using fallback jobs (Supabase not ready or empty)');
    res.status(200).json({ jobs: fallbackJobs });

  } catch (error) {
    console.error('Jobs API error:', error);
    // Even if everything fails → still return fallback so site never breaks
    res.status(200).json({ jobs: fallbackJobs });
  }
}