# ForgeTomorrow Database Inventory

**Document Version:** 1.0  
**Last Updated:** July 9, 2026  
**Owner:** Eric James  
**Status:** In Progress

---

# Purpose

This document inventories every production table, its purpose, dependencies, and migration status.

This serves as the primary validation document during the Render PostgreSQL migration.

Every production table should be accounted for before migration.

---

# Validation Rules

For every table document:

- Purpose
- Primary relationships
- Approximate record count
- Criticality
- Migration status
- Validation status

---

# Core Identity

| Table | Purpose | Critical | Migrated | Verified |
|--------|---------|----------|-----------|----------|
| User | User accounts | Yes | ☐ | ☐ |
| Profile | User profile data | Yes | ☐ | ☐ |
| Session | Authentication | Yes | ☐ | ☐ |
| Account | OAuth accounts | Yes | ☐ | ☐ |

---

# Professional Platform

| Table | Purpose | Critical | Migrated | Verified |
|--------|---------|----------|-----------|----------|
| Resume | Resume Builder | Yes | ☐ | ☐ |
| CoverLetter | Cover Letter Builder | Yes | ☐ | ☐ |
| Portfolio | Portfolio | Yes | ☐ | ☐ |
| Project | Projects | Yes | ☐ | ☐ |
| Experience | Experience | Yes | ☐ | ☐ |
| Education | Education | Yes | ☐ | ☐ |
| Skill | Skills | Yes | ☐ | ☐ |

---

# Applications

| Table | Purpose | Critical | Migrated | Verified |
|--------|---------|----------|-----------|----------|
| Job | Job Listings | Yes | ☐ | ☐ |
| Application | Job Applications | Yes | ☐ | ☐ |
| SavedJob | Saved Jobs | Yes | ☐ | ☐ |

---

# Messaging

| Table | Purpose | Critical | Migrated | Verified |
|--------|---------|----------|-----------|----------|
| Conversation | Messaging | Yes | ☐ | ☐ |
| Message | Messages | Yes | ☐ | ☐ |
| Notification | Notifications | Yes | ☐ | ☐ |

---

# Recruiter

| Table | Purpose | Critical | Migrated | Verified |
|--------|---------|----------|-----------|----------|
| Candidate | Candidate Center | Yes | ☐ | ☐ |
| TalentPool | Talent Pools | Yes | ☐ | ☐ |
| JobPosting | Recruiter Jobs | Yes | ☐ | ☐ |

---

# Coaching

| Table | Purpose | Critical | Migrated | Verified |
|--------|---------|----------|-----------|----------|
| CoachClient | Client Records | Yes | ☐ | ☐ |
| Session | Coaching Sessions | Yes | ☐ | ☐ |
| CSAT | Satisfaction Scores | Yes | ☐ | ☐ |

---

# CRM

| Table | Purpose | Critical | Migrated | Verified |
|--------|---------|----------|-----------|----------|
| Ticket | CRM Tickets | Yes | ☐ | ☐ |
| WorkflowRule | CRM Automation | Yes | ☐ | ☐ |
| WorkflowRun | Workflow Execution | Yes | ☐ | ☐ |

---

# Foundry

| Table | Purpose | Critical | Migrated | Verified |
|--------|---------|----------|-----------|----------|
| FoundryRoom | Collaboration | Yes | ☐ | ☐ |
| FoundryParticipant | Participants | Yes | ☐ | ☐ |

---

# Analytics

| Table | Purpose | Critical | Migrated | Verified |
|--------|---------|----------|-----------|----------|
| Analytics | Reporting | Yes | ☐ | ☐ |
| Activity | Activity Tracking | Yes | ☐ | ☐ |

---

# Validation Notes

After migration every table should be checked for:

- Record count
- Foreign keys
- Indexes
- Constraints
- Application functionality

---

# Migration Status

Current Phase

Planning

Overall Progress

0%