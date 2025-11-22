// components/JobFeed.js
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { client } from '../admin/groqClient'; // your GROQ client
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY });

export default function JobFeed({ userSkills = [], userLocation = '' }) {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);

  const [atsLoading, setAtsLoading] = useState(false);
  const [atsError, setAtsError] = useState(null);
  const [atsResult, setAtsResult] = useState(null);

  // Fetch jobs (still using GROQ for now)
  useEffect(() => {
    async function fetchJobs() {
      setLoading(true);

      try {
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

        // 2. (Optional) Enrich with AI match scores
        const jobsWithMatch = await Promise.all(
          jobList.map(async (job) => {
            if (!userSkills.length && !userLocation) {
              // If we don't know anything about the user, don't waste tokens
              return { ...job, matchScore: null };
            }

            const prompt = `
You are an applicant tracking system (ATS) assistant.

User skills: ${userSkills.join(', ') || 'not provided'}
User location: ${userLocation || 'not provided'}

Job:
- Title: ${job.title}
- Company: ${job.company}
- Location: ${job.location}
- Skills required: ${(job.skills || []).join(', ')}

On a scale of 0–100, how well does this user match this job based ONLY on skills and location?
Return ONLY an integer (no text, no explanation).
            `.trim();

            try {
              const response = await openai.chat.completions.create({
                model: 'gpt-5-mini',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.2,
              });

              const raw = response.choices?.[0]?.message?.content ?? '0';
              const score = parseInt(raw.replace(/[^0-9]/g, ''), 10);
              const matchScore = Number.isNaN(score) ? 0 : Math.max(0, Math.min(100, score));

              return { ...job, matchScore };
            } catch (err) {
              console.error('Error scoring job:', err);
              return { ...job, matchScore: null };
            }
          })
        );

        // Sort by matchScore if present, otherwise by original order
        const sorted = [...jobsWithMatch].sort((a, b) => {
          if (a.matchScore == null && b.matchScore == null) return 0;
          if (a.matchScore == null) return 1;
          if (b.matchScore == null) return -1;
          return b.matchScore - a.matchScore;
        });

        setJobs(sorted);
        // Default selected job = first one, if any
        if (sorted.length > 0) {
          setSelectedJob(sorted[0]);
        }
      } catch (err) {
        console.error('Error fetching jobs:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchJobs();
  }, [userSkills, userLocation]);

  // Run ATS alignment on the currently selected job
  async function handleRunATS(job) {
    if (!job) return;

    setAtsLoading(true);
    setAtsError(null);
    setAtsResult(null);

    try {
      const prompt = `
You are an expert ATS and resume coach.

User profile:
- Skills: ${userSkills.join(', ') || 'not provided'}
- Location: ${userLocation || 'not provided'}

Job description:
Title: ${job.title}
Company: ${job.company}
Location: ${job.location}

Full description:
${job.description}

1) Estimate how well this user matches this job on a scale of 0–100.
2) Briefly explain the main reasons for that score.
3) Suggest 3 concrete resume bullet improvements or additions the user could make to better match this job.

Return your answer as valid JSON with this shape:
{
  "score": number,
  "summary": string,
  "recommendations": string[]
}
      `.trim();

      const response = await openai.chat.completions.create({
        model: 'gpt-5-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
      });

      const content = response.choices?.[0]?.message?.content ?? '{}';
      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch {
        // Fallback if the model didn't return perfect JSON
        parsed = {
          score: null,
          summary: content.slice(0, 500),
          recommendations: [],
        };
      }

      setAtsResult({
        score: parsed.score ?? null,
        summary: parsed.summary ?? '',
        recommendations: Array.isArray(parsed.recommendations)
          ? parsed.recommendations
          : [],
      });
    } catch (err) {
      console.error('Error running ATS alignment:', err);
      setAtsError('Something went wrong running ATS alignment. Please try again.');
    } finally {
      setAtsLoading(false);
    }
  }

  if (loading) {
    return (
      <p className="text-gray-400 text-center mt-10">
        Loading jobs…
      </p>
    );
  }

  if (!jobs.length) {
    return (
      <p className="text-gray-400 text-center mt-10">
        No jobs are available right now. Please check back soon.
      </p>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-[2fr_3fr] gap-8">
      {/* LEFT: Job list */}
      <div className="space-y-4">
        {jobs.map((job) => (
          <div
            key={`${job.company}-${job.title}-${job.url}`}
            className={`bg-gray-900 p-6 rounded-xl shadow-lg transition cursor-pointer ${
              selectedJob && selectedJob.url === job.url
                ? 'ring-2 ring-[#FF7043]'
                : 'hover:shadow-2xl'
            }`}
          >
            <h3 className="text-lg font-bold text-[#FF7043]">{job.title}</h3>
            <p className="text-gray-300 mt-1">
              {job.company} — {job.location}
            </p>
            <p className="text-gray-400 mt-3">
              {Array.isArray(job.summary) && job.summary.length > 0
                ? job.summary.join(' • ')
                : (job.description || '').slice(0, 140) + '…'}
            </p>

            <div className="flex justify-between items-center mt-4">
              <div className="flex flex-col text-xs text-gray-500">
                {job.matchScore != null && (
                  <span>Match (pre-check): {job.matchScore}%</span>
                )}
                {/* You can add "Source" here later when pulling from the Postgres jobs table */}
              </div>

              <button
                onClick={() => {
                  setSelectedJob(job);
                  setAtsResult(null);
                  setAtsError(null);
                }}
                className="text-sm font-semibold text-[#FF7043] hover:text-white"
              >
                Show full posting →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* RIGHT: Full JD + Apply + ATS */}
      <div className="bg-gray-900 p-8 rounded-xl flex flex-col h-full">
        {!selectedJob ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <p>Select a job on the left to see full details.</p>
          </div>
        ) : (
          <>
            <div className="flex-1 flex flex-col">
              <h2 className="text-2xl font-bold text-white">
                {selectedJob.title}
              </h2>
              <p className="text-gray-300 mt-1">
                {selectedJob.company} — {selectedJob.location}
              </p>
              {/* Source can be shown here later when data comes from your jobs DB */}
              {/* <p className="text-gray-500 text-sm mt-1">Source: {selectedJob.source || 'Unknown'}</p> */}

              <div className="mt-4 flex flex-wrap gap-3 items-center">
                <Link
                  href={selectedJob.url || '#'}
                  target="_blank"
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[#FF7043] text-white font-semibold hover:bg-[#ff8a5f] transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Apply →
                </Link>

                <button
                  onClick={() => handleRunATS(selectedJob)}
                  disabled={atsLoading}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-[#FF7043] text-[#FF7043] font-semibold hover:bg-[#FF7043] hover:text-black transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {atsLoading ? 'Running ATS check…' : 'Run ATS Alignment'}
                </button>
              </div>

              <div className="mt-6 overflow-y-auto max-h-[60vh] pr-1">
                <pre className="whitespace-pre-wrap text-gray-200 text-sm leading-relaxed">
                  {selectedJob.description}
                </pre>
              </div>
            </div>

            {/* ATS Result panel */}
            <div className="mt-6 border-t border-gray-800 pt-4">
              <h3 className="text-sm font-semibold text-gray-200 mb-2">
                ATS Alignment Result
              </h3>
              {atsError && (
                <p className="text-sm text-red-400 mb-2">{atsError}</p>
              )}
              {!atsResult && !atsError && !atsLoading && (
                <p className="text-sm text-gray-500">
                  Run ATS Alignment to see how well your profile matches this job and
                  get suggestions to improve your resume.
                </p>
              )}
              {atsResult && (
                <div className="space-y-2 text-sm text-gray-200">
                  {atsResult.score != null && (
                    <p>
                      <span className="font-semibold">Estimated match score:</span>{' '}
                      {atsResult.score}%
                    </p>
                  )}
                  {atsResult.summary && (
                    <p>
                      <span className="font-semibold">Summary:</span>{' '}
                      {atsResult.summary}
                    </p>
                  )}
                  {atsResult.recommendations?.length > 0 && (
                    <div>
                      <p className="font-semibold mb-1">
                        Recommended resume improvements:
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        {atsResult.recommendations.map((rec, idx) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
