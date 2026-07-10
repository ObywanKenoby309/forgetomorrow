# ForgeTomorrow Services Inventory

**Document Version:** 1.0  
**Last Updated:** July 9, 2026  
**Owner:** Eric James  
**Status:** Active

---

# Purpose

This document inventories every production service used by ForgeTomorrow.

It serves as the master reference for:

- Infrastructure
- Monthly operating costs
- Ownership
- Dependencies
- Migration planning
- Disaster recovery

---

# Production Services

| Service | Provider | Purpose | Status | Migration |
|----------|----------|---------|--------|-----------|
| Frontend | Vercel | Next.js Production Hosting | Active | Stay |
| Search Service | Render | Dedicated Search Service | Active | Complete |
| Jobs Cron | Render | Scheduled Job Processing | Active | Complete |
| Seeker Recommendation Cron | Render | Recommendation Engine | Active | Complete |
| Executive Snapshot Cron | Render | Executive Snapshot Generation | Active | Complete |
| PostgreSQL Database | Supabase | Primary Production Database | Active | Planned |
| Authentication | Supabase | User Authentication | Active | Under Review |
| Storage | Supabase | File Storage | Active | Under Review |
| Redis | Upstash | Middleware Rate Limiting | Active | Under Review |

---

# Render Services

## Current

- ft-search-service
- forge-jobs-cron
- forge-seeker-recommendations-cron
- forge-executive-snapshot-cron

Future Planned

- PostgreSQL Database
- Optional Key Value (Redis)
- Background Workers (if required)

---

# Supabase Services

Current

- PostgreSQL
- Authentication
- Storage

Pending Verification

- Realtime
- Edge Functions
- Scheduled Jobs
- Backups

---

# Third Party Services

## OpenAI

Purpose

- AI generation
- Resume intelligence
- Hammer
- Platform AI
- Striker

Status

Production

---

## Daily

Purpose

- Foundry video sessions

Status

Production

---

## Resend

Purpose

- Transactional email

Status

Production

---

## Stripe

Purpose

- Billing
- Subscriptions

Status

Production

---

# Infrastructure Goals

Primary Goals

- Reduce infrastructure complexity.
- Minimize monthly operating costs.
- Increase operational resilience.
- Maintain rollback capability.
- Centralize services where practical.

---

# Planned Consolidation

Target Provider

Render

Candidate Services

- PostgreSQL
- Background Workers
- Additional Cron Jobs
- Optional Redis

Potential Remaining Supabase Services

- Authentication
- Storage

---

# Services Requiring Investigation

- Confirm all Supabase features currently in use.
- Confirm all Redis dependencies.
- Verify authentication dependencies.
- Verify storage dependencies.
- Verify production environment variables.
- Document all monthly operating costs.

---

# Notes

This document should be updated whenever:

- A new service is added.
- A service is removed.
- Infrastructure changes.
- Providers change.
- Billing changes.