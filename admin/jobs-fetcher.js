// admin/jobs-fetcher.js
import fetch from 'node-fetch';
import { client } from './groqClient'; // your GROQ client
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Function to fetch jobs from a public API
async function fetchJobs() {
  const res = await fetch('https://remotive.io/api/remote-jobs'); 
  const data = await res.json();
  return data.jobs; // array of jobs
}

// Normalize job data
function normalizeJob(job) {
  return {
    title: job.title,
    company: job.company_name,
    location: job.candidate_required_location,
    type: job.job_type,
    url: job.url,
    description: job.description,
    postedAt: job.publication_date,
  };
}

// Use GPT to summarize & extract skills
async function enrichJob(job) {
  const prompt = `
    Summarize the following job description in 3 bullet points
    and extract the key skills needed. Return JSON:
    {
      summary: [],
      skills: []
    }
    
    Job Description: """${job.description}"""
  `;

  const response = await openai.chat.completions.create({
    model: 'gpt-5-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
  });

  try {
    const content = response.choices[0].message.content;
    const parsed = JSON.parse(content);
    return {
      ...job,
      summary: parsed.summary,
      skills: parsed.skills,
    };
  } catch (err) {
    console.error('Error parsing GPT output:', err);
    return job;
  }
}

// Store job in GROQ
async function storeJob(job) {
  await client.createOrReplace({
    _id: `job-${job.company}-${job.title}-${job.postedAt}`,
    _type: 'job',
    ...job,
  });
}

export async function runJobFetch() {
  console.log('Fetching jobs...');
  const jobs = await fetchJobs();
  for (const rawJob of jobs) {
    const normalized = normalizeJob(rawJob);
    const enriched = await enrichJob(normalized);
    await storeJob(enriched);
  }
  console.log('Job fetch complete.');
}

// Run script
if (require.main === module) {
  runJobFetch().catch(console.error);
}
