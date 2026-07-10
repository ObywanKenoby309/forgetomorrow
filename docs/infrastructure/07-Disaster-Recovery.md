# ForgeTomorrow Disaster Recovery Plan

**Document Version:** 1.0
**Last Updated:** July 9, 2026
**Owner:** Eric James
**Status:** Active

---

# Purpose

This document defines the recovery procedures for major production incidents affecting ForgeTomorrow.

Its objective is to minimize downtime, preserve customer data, and restore production service as quickly as possible.

---

# Recovery Priorities

Priority 1

Protect customer data.

Priority 2

Restore production availability.

Priority 3

Restore full platform functionality.

Priority 4

Investigate root cause.

---

# Critical Infrastructure

## Frontend

Provider

- Vercel

Purpose

Production website and application hosting.

---

## Database

Current Provider

- Supabase PostgreSQL

Future Provider

- Render PostgreSQL

Purpose

Primary production database.

---

## Background Processing

Provider

- Render

Services

- Jobs Cron
- Recommendation Cron
- Executive Snapshot Cron

---

## Authentication

Provider

- Supabase Auth

---

## Storage

Provider

- Supabase Storage

---

## Search

Provider

- Render

Service

- ft-search-service

---

## AI

Provider

- OpenAI

Purpose

Platform intelligence services.

---

## Video

Provider

- Daily

Purpose

Foundry collaboration.

---

## Email

Provider

- Resend

Purpose

Transactional email.

---

# Incident Types

## Database Failure

Symptoms

- Database unavailable
- API failures
- Login failures
- Missing data

Response

- Verify provider status.
- Restore latest backup if required.
- Redirect to standby database if available.
- Validate application functionality.

---

## Hosting Failure

Symptoms

- Site unavailable
- API unavailable
- Deployment failures

Response

- Verify Vercel status.
- Review deployment logs.
- Restore previous deployment if necessary.

---

## Render Service Failure

Symptoms

- Search unavailable
- Cron failures
- Background processing stops

Response

- Verify Render service status.
- Restart affected service.
- Review logs.
- Confirm scheduled jobs resume.

---

## Authentication Failure

Symptoms

- Users cannot log in.
- Sessions invalid.
- Registration failures.

Response

- Verify Supabase Auth.
- Verify environment variables.
- Validate API connectivity.

---

## Storage Failure

Symptoms

- Upload failures.
- Download failures.
- Missing files.

Response

- Verify Supabase Storage.
- Confirm bucket access.
- Validate permissions.

---

## OpenAI Failure

Symptoms

- AI unavailable.
- Hammer unavailable.
- Striker unavailable.

Response

- Verify OpenAI status.
- Review API quota.
- Review API logs.

Platform should remain usable without AI services.

---

## Daily Failure

Symptoms

- Foundry sessions unavailable.

Response

- Verify Daily service.
- Confirm API credentials.
- Notify users if required.

---

## Email Failure

Symptoms

- Verification emails fail.
- Password reset unavailable.

Response

- Verify Resend status.
- Verify API credentials.
- Review delivery logs.

---

# Backup Strategy

Production database backups should exist before:

- Infrastructure changes
- Schema migrations
- Major releases
- Database migrations

---

# Recovery Objectives

Target Recovery Time (RTO)

Less than one hour for critical production incidents.

Target Data Loss (RPO)

Near zero.

---

# Recovery Validation

Following recovery verify:

- Login
- Dashboard
- Messaging
- Search
- Resume Builder
- Recruiter
- Coach
- CRM
- Foundry
- AI
- Email
- Cron Jobs

---

# Incident Documentation

Every production incident should record:

- Date
- Duration
- Root Cause
- Impact
- Resolution
- Lessons Learned
- Preventive Actions

---

# Annual Review

This document should be reviewed whenever:

- Infrastructure changes
- Providers change
- Recovery procedures change
- Major production incidents occur