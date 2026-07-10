# ForgeTomorrow Operations Runbook

**Document Version:** 1.0
**Last Updated:** July 9, 2026
**Owner:** Eric James
**Status:** Active

---

# Purpose

This document defines the standard operating procedures used to operate ForgeTomorrow in production.

It serves as the primary operational reference for deployments, monitoring, maintenance, incident response, and infrastructure management.

---

# Production Environment

## Frontend

Provider

- Vercel

Purpose

Production website and application hosting.

---

## Infrastructure

Provider

- Render

Services

- Search Service
- Cron Jobs
- Future PostgreSQL
- Future Background Workers

---

## Database

Current

- Supabase PostgreSQL

Future

- Render PostgreSQL

---

# Daily Operations

## Verify Production

Daily checks:

- Confirm production website loads.
- Confirm login functions.
- Confirm API responses.
- Review production logs.
- Review cron job execution.
- Confirm search service availability.

---

## Monitor Scheduled Jobs

Verify:

- Jobs Cron
- Recommendation Cron
- Executive Snapshot Cron

Review logs for:

- Failed executions
- Long execution times
- Unexpected errors

---

## Database

Review:

- Database health
- Connection count
- Query performance
- Storage growth
- Backup status

---

# Deployments

Before Deployment

- Review pending changes.
- Confirm production backup.
- Verify environment variables.
- Confirm Prisma migrations (if applicable).

Deployment

- Deploy application.
- Monitor deployment logs.
- Verify successful startup.

After Deployment

Validate:

- Login
- Dashboard
- Messaging
- Search
- AI
- Resume Builder
- Recruiter
- Coach
- CRM

---

# Prisma

Before running migrations:

- Backup production database.
- Review migration.
- Verify staging.

After migration:

- Validate schema.
- Validate application.
- Review logs.

---

# Environment Variables

Rules

- Never commit secrets.
- Rotate compromised credentials immediately.
- Document every new variable.
- Remove obsolete variables.

---

# Monitoring

Review:

- Application logs
- Render logs
- Vercel logs
- Database logs
- Cron execution logs

Watch for:

- Increased response time
- Database errors
- Authentication failures
- API failures

---

# Incident Response

If production issues occur:

1. Determine scope.
2. Preserve data.
3. Restore service.
4. Investigate root cause.
5. Document incident.

---

# Monthly Maintenance

Review:

- Infrastructure costs
- Database growth
- Cron performance
- API usage
- Provider billing
- Security updates

---

# Quarterly Review

Review:

- Infrastructure architecture
- Provider usage
- Service costs
- Performance
- Security
- Disaster recovery procedures

---

# Documentation Maintenance

Whenever infrastructure changes:

Update:

- Architecture
- Services Inventory
- Environment Variables
- Migration Plan
- Operations Runbook
- Disaster Recovery
- Decision Log

Documentation should always reflect production.

---

# Operational Principles

- Stability before speed.
- Back up before changing production.
- Test before deploying.
- Document every major decision.
- Keep rollback available.
- Minimize infrastructure complexity.
- Continuously improve operational reliability.