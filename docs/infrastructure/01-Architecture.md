# ForgeTomorrow Infrastructure Architecture

**Document Version:** 1.0  
**Last Updated:** July 9, 2026  
**Owner:** Eric James  
**Status:** Active

---

# Purpose

This document describes the current infrastructure powering ForgeTomorrow, the planned future architecture, and the reasoning behind major infrastructure decisions.

This document serves as the authoritative reference for deployments, migrations, disaster recovery planning, and future engineering work.

---

# Current Production Architecture

## Frontend

- Vercel
- Next.js application
- Public website
- Platform UI
- API Routes

---

## Database

Current Provider:

- Supabase PostgreSQL

Purpose:

- Primary production database
- Stores all application data
- Managed through Prisma ORM

---

## Authentication

Current Provider:

- Supabase Auth

Status:

Current production authentication provider.

---

## Storage

Current Provider:

- Supabase Storage

Purpose:

User uploads and platform storage.

---

## Background Processing

Provider:

- Render

Current Services:

- forge-jobs-cron
- forge-seeker-recommendations-cron
- forge-executive-snapshot-cron

Purpose:

Scheduled maintenance, recommendation generation, and background processing.

---

## Search Service

Provider:

- Render

Service:

- ft-search-service

Purpose:

Dedicated search service supporting platform functionality.

---

## Rate Limiting

Provider:

- Upstash Redis

Purpose:

API middleware rate limiting and abuse protection.

Current Status:

Minimal dependency. Redis currently appears isolated to middleware protection.

---

# Current Infrastructure Diagram

Internet

↓

Vercel (Next.js)

↓

Supabase PostgreSQL

↓

Prisma ORM

↓

Render Cron Jobs

↓

Upstash Redis (Middleware Rate Limiting)

---

# Target Architecture

Goal:

Reduce infrastructure complexity while improving reliability and lowering long-term operating costs.

Planned Direction:

- Render PostgreSQL
- Render Background Services
- Render Cron Jobs
- Render Search Service
- Optional Render Key Value (Redis)

Supabase may continue hosting Authentication and Storage if there is no operational advantage to migrating them.

---

# Migration Strategy

The migration strategy prioritizes safety over speed.

Production services will not be switched until:

- Render infrastructure is operational.
- Database copy is verified.
- Staging environment passes testing.
- Rollback procedures are documented.

---

# Guiding Principles

- Never migrate production without rollback.
- Keep infrastructure as simple as possible.
- Minimize third-party dependencies.
- Prefer managed services over self-hosting.
- Document every architectural decision.

---

# Open Questions

- Inventory all Supabase services currently in use.
- Confirm Redis usage beyond middleware.
- Determine long-term Authentication provider.
- Determine long-term Storage provider.
- Evaluate Render PostgreSQL performance under production load.