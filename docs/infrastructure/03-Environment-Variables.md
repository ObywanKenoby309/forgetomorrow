# ForgeTomorrow Environment Variables

**Document Version:** 1.0  
**Last Updated:** July 9, 2026  
**Owner:** Eric James  
**Status:** Active

---

# Purpose

This document inventories every environment variable used by ForgeTomorrow.

No secret values should ever be stored in this document.

Instead, document:

- Purpose
- Provider
- Where it is used
- Production dependency
- Migration status

---

# Database

## DATABASE_URL

Purpose

Primary PostgreSQL connection string.

Provider

Supabase PostgreSQL

Used By

- Prisma
- API Routes
- Server-side services

Migration Status

Planned migration to Render PostgreSQL.

---

## DIRECT_URL

Purpose

Direct PostgreSQL connection.

Provider

Supabase PostgreSQL

Used By

- Prisma Migrations

Migration Status

Planned migration to Render PostgreSQL.

---

# Supabase

## NEXT_PUBLIC_SUPABASE_URL

Purpose

Public Supabase endpoint.

Provider

Supabase

Used By

- Client Authentication
- Client Storage
- Client APIs

Migration Status

Under Review.

---

## NEXT_PUBLIC_SUPABASE_ANON_KEY

Purpose

Public authentication key.

Provider

Supabase

Used By

- Browser authentication

Migration Status

Under Review.

---

## SUPABASE_SERVICE_ROLE_KEY

Purpose

Server-side administrative access.

Provider

Supabase

Used By

- Protected server operations
- Administrative API calls

Migration Status

Under Review.

---

# Redis

## UPSTASH_REDIS_REST_URL

Purpose

Redis REST endpoint.

Provider

Upstash

Used By

- Middleware Rate Limiting

Migration Status

Under Review.

---

## UPSTASH_REDIS_REST_TOKEN

Purpose

Redis authentication token.

Provider

Upstash

Used By

- Middleware Rate Limiting

Migration Status

Under Review.

---

# AI

## OPENAI_API_KEY

Purpose

OpenAI API authentication.

Provider

OpenAI

Used By

- AI Generation
- Hammer
- Resume Intelligence
- Striker
- Platform AI

Migration Status

Remain unchanged.

---

# Email

## RESEND_API_KEY

Purpose

Transactional email delivery.

Provider

Resend

Used By

- Verification emails
- Notifications
- Platform communications

Migration Status

Remain unchanged.

---

# Video

## DAILY_API_KEY

Purpose

Video session management.

Provider

Daily

Used By

- Foundry

Migration Status

Remain unchanged.

---

# Payments

## STRIPE_SECRET_KEY

Purpose

Stripe server authentication.

Provider

Stripe

Used By

- Billing
- Checkout
- Subscriptions

Migration Status

Remain unchanged.

---

## STRIPE_WEBHOOK_SECRET

Purpose

Webhook verification.

Provider

Stripe

Used By

- Payment processing
- Subscription events

Migration Status

Remain unchanged.

---

# Future Variables

As additional infrastructure is added, every new environment variable should be documented before deployment.

---

# Documentation Rules

- Never store secret values in Git.
- Never commit production credentials.
- Document purpose, not value.
- Update this file whenever infrastructure changes.