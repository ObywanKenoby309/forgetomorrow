// components/JobFeed.js
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { client } from '../admin/groqClient'; // your GROQ client
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY });

export default function JobFeed({ userSkills = [], userLocation = '' }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchJobs() {
      setLoading(true);

      // 1. Pull jobs from GROQ
      const query = `*[_type == "job"] | order(postedAt desc){
        title,
        company,
        location,
        type,
        url,
        description,
        summary,
        skills
      }`;
      const jobList = await client.fetch(query);

      // 2. Enrich with AI match scores
      const jobsWithMatch = await Promise.all(
        jobList.map(async (job) => {
          const prompt = `
            Given the user's skills: ${userSkills.join(', ')}
            and location: ${userLocation || 'anywhere'},
            rate the match to this job on a scale of 0-100:
            Job title: ${job.title}
            Company: ${job.company}
            Location: ${job.location}
            Skills required: ${job.skills.join(', ')}
          `;
          try {
            const response = await openai.chat.completions.create({
              model: 'gpt-5-mini',
              messages: [{ role: 'user', content: prompt }],
              temperature: 0.2,
            });
            const matchScore = parseInt(response.choices[0].message.content, 10);
            return { ...job, matchScore: isNaN(matchScore) ? 0 : matchScore };
          } catch (err) {
            console.error('Error scoring job:', err);
            return { ...job, matchScore: 0 };
          }
        })
      );

      setJobs(jobsWithMatch.sort((a, b) => b.matchScore - a.matchScore));
      setLoading(false);
    }

    fetchJobs();
  }, [userSkills, userLocation]);

  if (loading) return <p className="text-gray-400 text-center mt-10">Loading jobs…</p>;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-2 gap-8">
      {jobs.map((job) => (
        <div key={`${job.company}-${job.title}`} className="bg-gray-900 p-6 rounded-xl shadow-lg hover:shadow-2xl transition">
          <h3 className="text-xl font-bold text-[#FF7043]">{job.title}</h3>
          <p className="text-gray-300 mt-1">{job.company} — {job.location}</p>
          <p className="text-gray-400 mt-3">{job.summary?.join(' • ') || job.description.slice(0, 120) + '…'}</p>
          <div className="flex justify-between items-center mt-4">
            <span className="text-gray-400 font-medium">Match: {job.matchScore}%</span>
            <Link href={job.url} target="_blank" className="text-white font-bold hover:text-[#FF7043]">
              Apply →
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
