# ForgeTomorrow Prisma Schema Inventory

**Document Version:** 1.0
**Last Updated:** July 9, 2026
**Owner:** Eric James
**Status:** In Progress

---

# Purpose

This document inventories the complete Prisma schema used by ForgeTomorrow.

It serves as the authoritative reference for:

- Database migration
- Schema validation
- Data relationships
- Application architecture
- Database troubleshooting
- Future development

This document should always match the production Prisma schema.

---

# Schema Overview

ORM

- Prisma

Primary Database

- PostgreSQL

Current Provider

- Supabase

Target Provider

- Render PostgreSQL

---

# Schema Statistics

| Metric | Value |
|----------|-------|
| Total Models | TBD |
| Total Enums | TBD |
| Total Relations | TBD |
| Total Indexes | TBD |
| Total Views | TBD |

---

# Core Identity Models

## User

Purpose

Primary platform identity.

Status

☐ Documented

---

## Profile

Purpose

Professional identity and profile data.

Status

☐ Documented

---

## Session

Purpose

Authentication sessions.

Status

☐ Documented

---

## Account

Purpose

OAuth and linked authentication providers.

Status

☐ Documented

---

# Professional Platform

## Resume

Purpose

Resume Builder.

Status

☐ Documented

---

## CoverLetter

Purpose

Cover Letter Builder.

Status

☐ Documented

---

## Experience

Purpose

Professional experience.

Status

☐ Documented

---

## Education

Purpose

Education history.

Status

☐ Documented

---

## Skills

Purpose

Professional skills.

Status

☐ Documented

---

## Portfolio

Purpose

Professional portfolio.

Status

☐ Documented

---

# Job Platform

## Job

Purpose

Job listings.

Status

☐ Documented

---

## Application

Purpose

Job applications.

Status

☐ Documented

---

## SavedJob

Purpose

Saved jobs.

Status

☐ Documented

---

# Messaging

## Conversation

Purpose

Messaging conversations.

Status

☐ Documented

---

## Message

Purpose

User messaging.

Status

☐ Documented

---

## Notification

Purpose

Platform notifications.

Status

☐ Documented

---

# Recruiter

## Candidate

Purpose

Candidate management.

Status

☐ Documented

---

## TalentPool

Purpose

Recruiter talent pools.

Status

☐ Documented

---

## JobPosting

Purpose

Recruiter job postings.

Status

☐ Documented

---

# Coaching

## CoachClient

Purpose

Coaching client management.

Status

☐ Documented

---

## CoachingSession

Purpose

Coaching sessions.

Status

☐ Documented

---

## CSAT

Purpose

Client satisfaction tracking.

Status

☐ Documented

---

# CRM

## Ticket

Purpose

CRM support tickets.

Status

☐ Documented

---

## WorkflowRule

Purpose

CRM automation rules.

Status

☐ Documented

---

## WorkflowRun

Purpose

Workflow execution history.

Status

☐ Documented

---

# Foundry

## FoundryRoom

Purpose

Collaboration sessions.

Status

☐ Documented

---

## FoundryParticipant

Purpose

Session participants.

Status

☐ Documented

---

# Analytics

## Analytics

Purpose

Reporting and metrics.

Status

☐ Documented

---

## Activity

Purpose

Platform activity logging.

Status

☐ Documented

---

# Enums

This section will inventory every Prisma enum.

Status

☐ Pending

---

# Relationships

This section will document major entity relationships.

Status

☐ Pending

---

# Indexes

This section will document custom indexes.

Status

☐ Pending

---

# Migration Validation

After migration verify:

- [ ] All models exist.
- [ ] All relations exist.
- [ ] All indexes exist.
- [ ] All enums exist.
- [ ] Prisma generates successfully.
- [ ] No schema drift detected.

---

# Notes

This document should be updated whenever the Prisma schema changes.

It should always represent the production schema.