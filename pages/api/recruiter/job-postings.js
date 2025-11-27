// pages/api/recruiter/job-postings.js
// Create new recruiter-owned job postings in the shared jobs feed (Railway Postgres)

import { Pool } from "pg";
import { getServerSession } from "next-auth";
import authOptions from "../auth/[...nextauth]";

// Reuse the same DB as /api/jobs (forge-jobs-cron on Railway)
const connectionString =
  process.env.FORGE_JOBS_DATABASE_URL ||
  process.env.DATABASE_URL ||
  null;

let pool = null;

function getPool() {
  if (!connectionString) return null;
  if (!pool) {
    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false, // Railway uses managed certs
      },
    });
  }
  return pool;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const dbPool = getPool();
  if (!dbPool) {
    return res
      .status(500)
      .json({ error: "Jobs database is not configured for this environment." });
  }

  // Require an authenticated user (recruiter)
  let session;
  try {
    session = await getServerSession(req, res, authOptions);
  } catch (err) {
    console.error("[recruiter/job-postings] session error:", err);
  }

  if (!session?.user?.email) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { title, company, location, description } = req.body || {};

  if (!title || !company) {
    return res.status(400).json({
      error: "Missing required fields: title and company are required.",
    });
  }

  const client = await dbPool.connect();

  try {
    // Insert into the same jobs table used by the cron pipeline.
    // We keep fields honest: many can be null/blank until we expand schema.
    const result = await client.query(
      `
      INSERT INTO jobs (
        title,
        company,
        location,
        description,
        url,
        salary,
        tags,
        source,
        publishedat
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING
        id,
        title,
        company,
        location,
        description,
        url,
        salary,
        tags,
        source,
        publishedat
      `,
      [
        title,
        company,
        location || "",
        description || "",
        null, // url for now; can add a Forge job details URL later
        null, // salary (optional / future)
        null, // tags (future: skills or metadata)
        "ForgeTomorrow Recruiter", // allows us to distinguish internal postings
      ]
    );

    const createdJob = result.rows[0];
    return res.status(201).json(createdJob);
  } catch (err) {
    console.error("[recruiter/job-postings] insert error:", err);
    return res
      .status(500)
      .json({ error: "Failed to create job posting in the shared feed." });
  } finally {
    client.release();
  }
}
