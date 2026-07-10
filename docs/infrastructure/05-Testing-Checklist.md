# ForgeTomorrow Migration Testing Checklist

**Document Version:** 1.0  
**Last Updated:** July 9, 2026  
**Owner:** Eric James  
**Status:** Pending Migration

---

# Purpose

This document defines every feature that must be tested before and after the database migration.

No migration is considered complete until every critical feature passes validation.

---

# Authentication

## Account Access

- [ ] Login
- [ ] Logout
- [ ] User Registration
- [ ] Password Reset
- [ ] Session Persistence
- [ ] Email Verification

---

# Seeker Platform

## Dashboard

- [ ] Dashboard loads
- [ ] Profile loads
- [ ] Navigation functions

## Resume

- [ ] Resume Builder
- [ ] Resume Save
- [ ] Resume Edit
- [ ] Resume Export

## Cover Letter

- [ ] Builder
- [ ] Save
- [ ] Export

## Applications

- [ ] Kanban Board
- [ ] Focus View
- [ ] List View
- [ ] Status Updates

## Jobs

- [ ] Search
- [ ] Save Job
- [ ] Apply
- [ ] Recommendations

## Analytics

- [ ] Profile Analytics
- [ ] Strength Analysis
- [ ] Engagement Analytics

## Messaging

- [ ] Inbox
- [ ] Send Message
- [ ] Receive Message
- [ ] Notifications

---

# Recruiter

- [ ] Dashboard
- [ ] Candidate Search
- [ ] Candidate Center
- [ ] Talent Pools
- [ ] Job Postings
- [ ] Analytics
- [ ] Messaging

---

# Coach

- [ ] Dashboard
- [ ] Client List
- [ ] Client Profile
- [ ] Sessions
- [ ] Documents
- [ ] CSAT
- [ ] Messaging

---

# CRM

- [ ] Ticket Creation
- [ ] Ticket Updates
- [ ] Workflow Rules
- [ ] SLA Processing
- [ ] Workflow Logging

---

# Foundry

- [ ] Room Creation
- [ ] Join Session
- [ ] Video
- [ ] Messaging
- [ ] Documents

---

# AI

- [ ] Striker
- [ ] Hammer
- [ ] Resume Intelligence
- [ ] Executive Snapshot
- [ ] Anvil

---

# Infrastructure

## Search

- [ ] Search Service
- [ ] Search Results
- [ ] Candidate Search

## Cron Jobs

- [ ] Jobs Cron
- [ ] Recommendation Cron
- [ ] Executive Snapshot Cron

---

# Storage

- [ ] Upload File
- [ ] Download File
- [ ] Delete File

---

# Email

- [ ] Verification Email
- [ ] Notification Email
- [ ] Password Reset Email

---

# Performance

- [ ] Homepage
- [ ] Dashboard
- [ ] Database Response
- [ ] Search Speed
- [ ] API Response Times

---

# Migration Sign-Off

## Development

- [ ] Complete

## Staging

- [ ] Complete

## Production

- [ ] Complete

---

# Notes

Record every issue discovered during migration testing.

Each issue should include:

- Date
- Feature
- Description
- Resolution
- Verified By