# ForgeTomorrow Database Migration Plan

**Document Version:** 1.0  
**Last Updated:** July 9, 2026  
**Owner:** Eric James  
**Status:** Planning

---

# Objective

Safely migrate ForgeTomorrow's production PostgreSQL database from Supabase to Render with minimal downtime and a fully tested rollback plan.

This migration prioritizes platform stability over migration speed.

---

# Migration Goals

Primary Goals

- Build Render infrastructure before production changes.
- Create a complete copy of the production database.
- Validate every major platform feature.
- Keep rollback available at all times.
- Minimize production downtime.

---

# Current Architecture

Production

Vercel

↓

Next.js

↓

Supabase PostgreSQL

↓

Prisma ORM

↓

Render Cron Jobs

↓

Upstash Redis (Middleware)

---

# Target Architecture

Production

Vercel

↓

Next.js

↓

Render PostgreSQL

↓

Prisma ORM

↓

Render Cron Jobs

↓

Upstash Redis (or Render Key Value if adopted)

---

# Phase 1 — Infrastructure Audit

## Render

- [ ] Inventory existing services.
- [ ] Create PostgreSQL instance.
- [ ] Review available networking options.
- [ ] Configure backups.
- [ ] Record connection information.

---

## Supabase

- [ ] Inventory PostgreSQL usage.
- [ ] Inventory Authentication.
- [ ] Inventory Storage.
- [ ] Inventory Edge Functions.
- [ ] Inventory Realtime.
- [ ] Verify backup configuration.

---

## Application

- [ ] Inventory Prisma configuration.
- [ ] Inventory environment variables.
- [ ] Inventory Redis usage.
- [ ] Inventory cron dependencies.
- [ ] Inventory storage dependencies.

---

# Phase 2 — Build Render Database

Tasks

- [ ] Create PostgreSQL.
- [ ] Enable backups.
- [ ] Configure connection pooling (if required).
- [ ] Verify SSL configuration.
- [ ] Record DATABASE_URL.
- [ ] Record DIRECT_URL.

Production remains on Supabase.

---

# Phase 3 — Copy Production Database

Tasks

- [ ] Export production database.
- [ ] Restore into Render PostgreSQL.
- [ ] Verify schema.
- [ ] Verify extensions.
- [ ] Verify indexes.
- [ ] Verify record counts.
- [ ] Verify Prisma connectivity.

Production remains on Supabase.

---

# Phase 4 — Staging Validation

Point a staging deployment to Render PostgreSQL.

Validate

## Authentication

- [ ] Login
- [ ] Logout
- [ ] Registration
- [ ] Password reset

---

## Seeker

- [ ] Dashboard
- [ ] Resume Builder
- [ ] Cover Letter
- [ ] Applications
- [ ] Job Search
- [ ] Messaging
- [ ] Analytics
- [ ] Hammer
- [ ] Vault

---

## Recruiter

- [ ] Dashboard
- [ ] Candidate Search
- [ ] Candidate Center
- [ ] Talent Pools
- [ ] Analytics
- [ ] Messaging

---

## Coach

- [ ] Dashboard
- [ ] Clients
- [ ] Sessions
- [ ] Documents
- [ ] Messaging
- [ ] CSAT

---

## CRM

- [ ] Tickets
- [ ] Workflow Rules
- [ ] Workflow Runs
- [ ] SLA Processing

---

## Foundry

- [ ] Session creation
- [ ] Join session
- [ ] Messaging
- [ ] Documents

---

## AI

- [ ] Striker
- [ ] Resume Intelligence
- [ ] Hammer
- [ ] Anvil
- [ ] Executive Snapshot

---

## Infrastructure

- [ ] Search Service
- [ ] Cron Jobs
- [ ] Recommendation Engine
- [ ] Email
- [ ] File Uploads

---

# Phase 5 — Production Cutover

Tasks

- [ ] Freeze deployments.
- [ ] Backup production database.
- [ ] Update DATABASE_URL.
- [ ] Update DIRECT_URL.
- [ ] Restart services.
- [ ] Verify application health.
- [ ] Monitor logs.
- [ ] Monitor database performance.

---

# Rollback Plan

If any critical issue occurs:

- Restore previous DATABASE_URL.
- Restart application.
- Verify production functionality.
- Investigate failure before attempting migration again.

Rollback should require only environment variable changes and service restart.

---

# Success Criteria

Migration is considered complete only when:

- All production data is verified.
- All platform features pass testing.
- Cron jobs complete successfully.
- No authentication failures occur.
- No data loss is detected.
- Monitoring confirms stable operation.

---

# Post-Migration Tasks

- Update infrastructure documentation.
- Remove obsolete environment variables.
- Evaluate retirement of Supabase PostgreSQL.
- Review infrastructure costs.
- Update disaster recovery documentation.
- Record lessons learned.