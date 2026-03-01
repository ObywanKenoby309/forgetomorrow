// lib/crm/sla.js
//
// SLA CALCULATION UTILITY
//
// Two exported functions you'll use throughout the CRM:
//
//   calculateSlaDeadlines(policy, priority, fromDate?)
//   → returns { slaResponseDue, slaResolveDue }
//   → call this on ticket CREATE and on PRIORITY CHANGE
//
//   getBusinessMinutesElapsed(from, to, policy)
//   → returns how many business minutes have elapsed between two dates
//   → used by the cron route to check breach/warning status
//
// ============================================================================

import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { addMinutes, isWeekend, getDay, getHours } from "date-fns";

// ============================================================================
//  INTERNAL HELPERS
// ============================================================================

/**
 * Given a policy and a priority string, return the response + resolution
 * targets in minutes.
 */
function getTargetMinutes(policy, priority) {
  const map = {
    P1: {
      response:   policy.p1ResponseMin,
      resolution: policy.p1ResolutionMin,
    },
    P2: {
      response:   policy.p2ResponseMin,
      resolution: policy.p2ResolutionMin,
    },
    P3: {
      response:   policy.p3ResponseMin,
      resolution: policy.p3ResolutionMin,
    },
    P4: {
      response:   policy.p4ResponseMin,
      resolution: policy.p4ResolutionMin,
    },
  };

  const targets = map[priority];
  if (!targets) throw new Error(`Unknown priority: ${priority}`);
  return targets;
}

/**
 * Check if a given UTC Date is within business hours defined by the policy.
 * Converts to the policy timezone before checking day + hour.
 */
function isBusinessTime(utcDate, policy) {
  const zoned = toZonedTime(utcDate, policy.timezone);
  const hour = zoned.getHours();
  const dayOfWeek = zoned.getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat

  // date-fns-tz getDay() returns 0-6 (Sun=0), but our businessDays
  // uses ISO 1-7 (Mon=1, Sun=7) — convert
  const isoDay = dayOfWeek === 0 ? 7 : dayOfWeek;

  const businessDays = Array.isArray(policy.businessDays)
    ? policy.businessDays
    : JSON.parse(policy.businessDays);

  const isDayOk  = businessDays.includes(isoDay);
  const isHourOk = hour >= policy.businessStart && hour < policy.businessEnd;

  return isDayOk && isHourOk;
}

/**
 * Walk forward from a UTC start date, counting only business minutes,
 * until we've accumulated the target number of business minutes.
 * Returns the UTC Date when the target is reached.
 *
 * Resolution: 1-minute increments. Accurate enough for SLA windows
 * measured in hours/days. For sub-minute precision use smaller steps.
 */
function addBusinessMinutes(utcStart, minutesToAdd, policy) {
  if (!policy.useBusinessHours) {
    // No business hours restriction — just add raw minutes
    return addMinutes(utcStart, minutesToAdd);
  }

  let current     = new Date(utcStart);
  let accumulated = 0;

  // Safety cap: never loop more than 30 days worth of minutes (43200)
  // to prevent infinite loops on misconfigured policies
  const maxIterations = 43200;
  let iterations = 0;

  while (accumulated < minutesToAdd) {
    if (iterations++ > maxIterations) {
      console.warn("[SLA] addBusinessMinutes hit safety cap — check policy config");
      break;
    }

    if (isBusinessTime(current, policy)) {
      accumulated++;
    }

    current = addMinutes(current, 1);
  }

  return current;
}

// ============================================================================
//  EXPORTED: calculateSlaDeadlines
//
//  Call this whenever a ticket is created or its priority changes.
//
//  @param policy    — SlaPolicy row from DB (with all fields)
//  @param priority  — TicketPriority string: 'P1' | 'P2' | 'P3' | 'P4'
//  @param fromDate  — optional Date to calculate from (defaults to now)
//
//  @returns { slaResponseDue: Date, slaResolveDue: Date }
//
//  Example:
//    const { slaResponseDue, slaResolveDue } = calculateSlaDeadlines(
//      cxPolicy, 'P2'
//    )
// ============================================================================

export function calculateSlaDeadlines(policy, priority, fromDate = new Date()) {
  const targets = getTargetMinutes(policy, priority);

  const slaResponseDue = addBusinessMinutes(
    fromDate,
    targets.response,
    policy
  );

  const slaResolveDue = addBusinessMinutes(
    fromDate,
    targets.resolution,
    policy
  );

  return { slaResponseDue, slaResolveDue };
}

// ============================================================================
//  EXPORTED: getBusinessMinutesElapsed
//
//  Returns how many business minutes have elapsed between two UTC dates.
//  Used by the SLA cron to calculate what % of the SLA window is consumed.
//
//  @param from    — UTC Date (e.g. ticket.createdAt)
//  @param to      — UTC Date (e.g. new Date() for "right now")
//  @param policy  — SlaPolicy row from DB
//
//  @returns number (business minutes elapsed)
//
//  Example:
//    const elapsed = getBusinessMinutesElapsed(ticket.createdAt, new Date(), policy)
//    const pctConsumed = (elapsed / policy.p2ResponseMin) * 100
// ============================================================================

export function getBusinessMinutesElapsed(from, to, policy) {
  if (!policy.useBusinessHours) {
    // Raw minutes — no business hours filtering
    return Math.floor((to - from) / 60000);
  }

  let current  = new Date(from);
  let elapsed  = 0;
  const end    = new Date(to);

  const maxIterations = 43200;
  let iterations = 0;

  while (current < end) {
    if (iterations++ > maxIterations) {
      console.warn("[SLA] getBusinessMinutesElapsed hit safety cap");
      break;
    }

    if (isBusinessTime(current, policy)) {
      elapsed++;
    }

    current = addMinutes(current, 1);
  }

  return elapsed;
}

// ============================================================================
//  EXPORTED: getSlaStatus
//
//  Convenience function — returns a status string for a ticket right now.
//  Useful for coloring UI badges and deciding what the cron should do.
//
//  @param ticket   — Ticket row with slaResponseDue, slaResolveDue, slaBreached
//  @param policy   — SlaPolicy row from DB
//
//  @returns 'breached' | 'warning' | 'ok' | 'none'
//
//  Example:
//    const status = getSlaStatus(ticket, policy)
//    // 'warning' → show yellow badge
//    // 'breached' → show red badge, fire escalation
// ============================================================================

export function getSlaStatus(ticket, policy) {
  // No SLA tracking on this ticket
  if (!ticket.slaResolveDue) return "none";

  // Already marked breached
  if (ticket.slaBreached) return "breached";

  const now = new Date();

  // Check resolution deadline first (most important)
  if (now > ticket.slaResolveDue) return "breached";
  if (now > ticket.slaResponseDue && !ticket.firstResponseAt) return "breached";

  // Check if we're inside the warning window
  // Warning fires when X% of the SLA window is consumed
  const threshold = (policy.warningThreshold ?? 75) / 100;

  // Response warning — only if not yet responded
  if (!ticket.firstResponseAt && ticket.slaResponseDue) {
    const totalWindow  = ticket.slaResponseDue - new Date(ticket.createdAt);
    const elapsed      = now - new Date(ticket.createdAt);
    const pct          = elapsed / totalWindow;
    if (pct >= threshold) return "warning";
  }

  // Resolution warning
  if (ticket.slaResolveDue) {
    const totalWindow = ticket.slaResolveDue - new Date(ticket.createdAt);
    const elapsed     = now - new Date(ticket.createdAt);
    const pct         = elapsed / totalWindow;
    if (pct >= threshold) return "warning";
  }

  return "ok";
}