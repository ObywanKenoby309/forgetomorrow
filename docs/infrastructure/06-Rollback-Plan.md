# ForgeTomorrow Rollback Plan

**Document Version:** 1.0
**Last Updated:** July 9, 2026
**Owner:** Eric James
**Status:** Active

---

# Purpose

This document defines the rollback procedure if the Render PostgreSQL migration introduces critical issues.

The objective is to restore production service as quickly and safely as possible while preserving data integrity.

---

# Rollback Philosophy

Rollback is not failure.

Rollback is a controlled recovery procedure designed to minimize customer impact.

If production stability is in question, rollback immediately.

Investigate later.

---

# Conditions That Trigger Rollback

Immediate rollback should occur if any of the following are observed:

- Production login failures
- Database connection failures
- Data corruption
- Missing production records
- Authentication failures
- Critical API failures
- Severe application instability
- Major performance degradation
- Failed migrations that cannot be corrected immediately

---

# Rollback Preparation

Before any production migration:

- [ ] Confirm Supabase production database remains untouched.
- [ ] Confirm production backup exists.
- [ ] Record current environment variables.
- [ ] Verify rollback credentials.
- [ ] Verify production deployment access.
- [ ] Verify Render database backup.

---

# Rollback Procedure

## Step 1

Pause further deployment activity.

No additional code changes should be deployed during rollback.

---

## Step 2

Restore production database connection.

Update:

DATABASE_URL

DIRECT_URL

to point back to the Supabase production database.

---

## Step 3

Redeploy or restart production services.

Verify successful startup.

---

## Step 4

Validate core functionality.

Confirm:

- Login
- Dashboard
- Messaging
- Search
- Resume Builder
- Recruiter
- Coach
- CRM
- Foundry

---

## Step 5

Monitor production logs.

Watch for:

- Database errors
- Authentication failures
- Elevated response times
- API exceptions

---

## Step 6

Notify project stakeholders that rollback has completed.

Document:

- Time rollback started
- Time rollback completed
- Root cause (if known)
- Immediate impact
- Next actions

---

# Rollback Validation Checklist

## Database

- [ ] Database connected
- [ ] Record counts appear correct
- [ ] Prisma functioning

---

## Authentication

- [ ] Login
- [ ] Registration
- [ ] Sessions

---

## Platform

- [ ] Seeker
- [ ] Recruiter
- [ ] Coach
- [ ] CRM
- [ ] Foundry

---

## Infrastructure

- [ ] Search Service
- [ ] Cron Jobs
- [ ] Email
- [ ] AI Services

---

# Incident Report

After rollback, document:

## Date

---

## Cause

---

## Impact

---

## Resolution

---

## Preventive Actions

---

# Success Criteria

Rollback is complete when:

- Production is stable.
- All critical features are operational.
- Users can access the platform.
- No active data integrity issues exist.
- Monitoring confirms normal operation.

---

# Lessons Learned

Every rollback should result in improvements to:

- Migration process
- Testing
- Monitoring
- Documentation
- Infrastructure