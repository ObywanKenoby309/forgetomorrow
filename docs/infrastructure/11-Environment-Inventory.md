# ForgeTomorrow Environment Inventory

**Document Version:** 1.0
**Last Updated:** July 9, 2026
**Owner:** Eric James
**Status:** Active

---

# Purpose

This document inventories every production environment variable used by ForgeTomorrow.

Unlike **03-Environment-Variables.md**, which explains what variables exist and why they exist, this document records how ForgeTomorrow actually uses them.

This document should always reflect production.

---

# Environment Overview

| Environment | Status | Purpose |
|------------|--------|---------|
| Local Development | Active | Development and testing |
| Production | Active | Live platform |
| Render Services | Active | Search service and cron jobs |
| Future Render PostgreSQL | Planned | Production database |

---

# Database

## DATABASE_URL

Provider

Supabase PostgreSQL

Environment

- Local
- Production

Used By

- Prisma ORM
- API Routes
- Server-side services

Migration Status

Planned → Render PostgreSQL

Critical

Yes

---

## DIRECT_URL

Provider

Supabase PostgreSQL

Environment

- Local
- Production

Used By

- Prisma Migrations

Migration Status

Planned → Render PostgreSQL

Critical

Yes

---

# Supabase

## NEXT_PUBLIC_SUPABASE_URL

Provider

Supabase

Environment

- Local
- Production

Purpose

Client API endpoint.

Critical

Yes

Migration Status

Under Review

---

## NEXT_PUBLIC_SUPABASE_ANON_KEY

Provider

Supabase

Environment

- Local
- Production

Purpose

Client authentication.

Critical

Yes

Migration Status

Under Review

---

## SUPABASE_SERVICE_ROLE_KEY

Provider

Supabase

Environment

Production

Purpose

Administrative server access.

Critical

Yes

Migration Status

Under Review

---

# Redis

## UPSTASH_REDIS_REST_URL

Provider

Upstash

Environment

Production

Purpose

Middleware rate limiting.

Critical

Medium

Migration Status

Under Review

---

## UPSTASH_REDIS_REST_TOKEN

Provider

Upstash

Environment

Production

Purpose

Middleware authentication.

Critical

Medium

Migration Status

Under Review

---

# AI

## OPENAI_API_KEY

Provider

OpenAI

Environment

Production

Used By

- Hammer
- Striker
- Resume Builder
- Executive Snapshot
- Platform AI

Critical

High

Migration Status

No Changes Planned

---

# Email

## RESEND_API_KEY

Provider

Resend

Environment

Production

Purpose

Transactional email delivery.

Critical

Medium

Migration Status

No Changes Planned

---

# Video

## DAILY_API_KEY

Provider

Daily

Environment

Production

Purpose

Foundry video sessions.

Critical

Medium

Migration Status

No Changes Planned

---

# Payments

## STRIPE_SECRET_KEY

Provider

Stripe

Environment

Production

Purpose

Billing and subscriptions.

Critical

High

Migration Status

No Changes Planned

---

## STRIPE_WEBHOOK_SECRET

Provider

Stripe

Environment

Production

Purpose

Webhook verification.

Critical

High

Migration Status

No Changes Planned

---

# Render Services

## Search Service

Environment

Production

Purpose

Dedicated search functionality.

Migration Status

Complete

---

## Jobs Cron

Environment

Production

Purpose

Job synchronization.

Migration Status

Complete

---

## Recommendation Cron

Environment

Production

Purpose

Recommendation generation.

Migration Status

Complete

---

## Executive Snapshot Cron

Environment

Production

Purpose

Executive snapshot generation.

Migration Status

Complete

---

# Validation Checklist

Whenever infrastructure changes:

- [ ] Variable documented.
- [ ] Provider documented.
- [ ] Environment documented.
- [ ] Usage documented.
- [ ] Migration status updated.
- [ ] Criticality reviewed.

---

# Notes

This document intentionally does **not** store environment variable values.

Production secrets must remain in the appropriate provider and deployment platforms.