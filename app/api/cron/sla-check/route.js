// app/api/cron/sla-check/route.js
//
// SLA CHECK CRON ROUTE
//
// Triggered every 5 minutes by an external cron service.
// Protected by CRON_SECRET header — never expose this route publicly.
//
// SETUP (cron-job.org — free):
//   1. Create account at cron-job.org
//   2. New cronjob → URL: https://yoursite.com/api/cron/sla-check
//   3. Schedule: every 5 minutes
//   4. Add request header: Authorization: Bearer YOUR_CRON_SECRET
//   5. Done — no extra Railway job needed
//
// WHAT THIS DOES EACH RUN:
//   1. Finds tickets approaching SLA breach (warning threshold hit)
//   2. Finds tickets that have already breached
//   3. Fires Notifications to assigned agent + queue manager
//   4. Marks breached tickets as slaBreached = true
//   5. Logs SlaEvents so we never double-fire
//   6. Runs workflow rules for SLA_WARNING and SLA_BREACHED triggers
//
// ============================================================================

import { NextResponse } from "next/server";
import { PrismaClient }  from "@prisma/client";
import { getSlaStatus }  from "@/lib/crm/sla";

const prisma = new PrismaClient();

// ============================================================================
//  AUTH GUARD
// ============================================================================

function isAuthorized(request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return false;
  const token = authHeader.replace("Bearer ", "").trim();
  return token === process.env.CRON_SECRET;
}

// ============================================================================
//  NOTIFICATION HELPER
//  Fires into your existing Notification model using the CRM category/scope
// ============================================================================

async function fireNotification(prisma, { userId, title, body, entityId, dedupeKey }) {
  try {
    await prisma.notification.upsert({
      where: {
        userId_dedupeKey: { userId, dedupeKey },
      },
      update: {},
      create: {
        userId,
        title,
        body,
        category:   "CRM",
        scope:      "AGENT",
        entityType: "SLA_EVENT",
        entityId,
        dedupeKey,
        requiresAction: true,
      },
    });
  } catch (err) {
    // Non-fatal — log and continue
    console.error(`[SLA Cron] Failed to fire notification for ${userId}:`, err.message);
  }
}

// ============================================================================
//  WORKFLOW TRIGGER HELPER
//  Calls the workflow engine for SLA_WARNING and SLA_BREACHED triggers.
//  We import lazily here to avoid circular deps — workflow.js imports sla.js
// ============================================================================

async function runSlaWorkflows(ticket, trigger) {
  try {
    const { runWorkflows } = await import("@/lib/crm/workflow");
    await runWorkflows(trigger, ticket);
  } catch (err) {
    console.error(`[SLA Cron] Workflow error for ticket ${ticket.id}:`, err.message);
  }
}

// ============================================================================
//  MAIN HANDLER
// ============================================================================

export async function GET(request) {
  // --- Auth ---
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();
  const results = {
    warnings:  { checked: 0, fired: 0 },
    breaches:  { checked: 0, fired: 0 },
    errors:    [],
  };

  try {
    const now = new Date();

    // -----------------------------------------------------------------------
    //  FETCH ALL ACTIVE TICKETS WITH SLA DEADLINES
    //  We fetch open/in-progress tickets that have SLA due dates set
    //  and haven't been fully resolved/closed/cancelled yet.
    // -----------------------------------------------------------------------

    const activeTickets = await prisma.ticket.findMany({
      where: {
        status: {
          notIn: ["RESOLVED", "CLOSED", "CANCELLED"],
        },
        slaResolveDue: { not: null },
        slaBreached: false,
      },
      include: {
        slaPolicy:   true,
        assignedTo:  true,
        queue: {
          include: {
            agents: {
              where: { role: "MANAGER" },
              include: { user: true },
            },
          },
        },
        // Only fetch existing SLA events so we know what's already fired
        slaEvents: {
          orderBy: { firedAt: "desc" },
        },
      },
    });

    results.warnings.checked = activeTickets.length;
    results.breaches.checked = activeTickets.length;

    // -----------------------------------------------------------------------
    //  PROCESS EACH TICKET
    // -----------------------------------------------------------------------

    for (const ticket of activeTickets) {
      try {
        const policy = ticket.slaPolicy;
        if (!policy) continue;

        const status = getSlaStatus(ticket, policy);

        // --- Already fine ---
        if (status === "ok" || status === "none") continue;

        const alreadyFiredWarning  = ticket.slaEvents.some(e => e.type === "WARNING");
        const alreadyFiredBreach   = ticket.slaEvents.some(e => e.type === "BREACHED");

        const ticketRef = `FT-${String(ticket.number).padStart(5, "0")}`;
        const managers  = ticket.queue.agents.map(a => a.user);

        // -----------------------------------------------------------------
        //  BREACH
        // -----------------------------------------------------------------

        if (status === "breached" && !alreadyFiredBreach) {
          // Mark ticket as breached
          await prisma.ticket.update({
            where: { id: ticket.id },
            data:  { slaBreached: true },
          });

          // Log SlaEvent
          await prisma.slaEvent.create({
            data: {
              ticketId: ticket.id,
              type:     "BREACHED",
              target:   now > ticket.slaResolveDue ? "resolution" : "response",
              notified: true,
            },
          });

          // Log TicketHistory
          await prisma.ticketHistory.create({
            data: {
              ticketId:  ticket.id,
              actorId:   ticket.createdById,
              action:    "sla_breach",
              fromValue: "within_sla",
              toValue:   "breached",
              metadata:  { firedAt: now.toISOString() },
            },
          });

          // Notify assigned agent
          if (ticket.assignedToId) {
            await fireNotification(prisma, {
              userId:    ticket.assignedToId,
              title:     `🔴 SLA Breached — ${ticketRef}`,
              body:      `${ticket.title} has breached its SLA window.`,
              entityId:  ticket.id,
              dedupeKey: `sla_breach_${ticket.id}`,
            });
          }

          // Notify all queue managers
          for (const manager of managers) {
            await fireNotification(prisma, {
              userId:    manager.id,
              title:     `🔴 SLA Breach — ${ticketRef}`,
              body:      `${ticket.title} (${ticket.queue.name} queue) has breached SLA.`,
              entityId:  ticket.id,
              dedupeKey: `sla_breach_mgr_${ticket.id}_${manager.id}`,
            });
          }

          // Run SLA_BREACHED workflow rules
          await runSlaWorkflows(ticket, "SLA_BREACHED");

          results.breaches.fired++;
          console.log(`[SLA Cron] BREACH fired: ${ticketRef}`);
        }

        // -----------------------------------------------------------------
        //  WARNING
        // -----------------------------------------------------------------

        else if (status === "warning" && !alreadyFiredWarning) {
          // Log SlaEvent
          await prisma.slaEvent.create({
            data: {
              ticketId: ticket.id,
              type:     "WARNING",
              target:   !ticket.firstResponseAt ? "response" : "resolution",
              notified: true,
            },
          });

          // Notify assigned agent
          if (ticket.assignedToId) {
            await fireNotification(prisma, {
              userId:    ticket.assignedToId,
              title:     `⚠️ SLA Warning — ${ticketRef}`,
              body:      `${ticket.title} is approaching its SLA deadline.`,
              entityId:  ticket.id,
              dedupeKey: `sla_warning_${ticket.id}`,
            });
          }

          // Notify managers on P1/P2 warnings only
          if (["P1", "P2"].includes(ticket.priority)) {
            for (const manager of managers) {
              await fireNotification(prisma, {
                userId:    manager.id,
                title:     `⚠️ SLA Warning — ${ticketRef}`,
                body:      `${ticket.title} (${ticket.priority}) is approaching SLA breach.`,
                entityId:  ticket.id,
                dedupeKey: `sla_warning_mgr_${ticket.id}_${manager.id}`,
              });
            }
          }

          // Run SLA_WARNING workflow rules
          await runSlaWorkflows(ticket, "SLA_WARNING");

          results.warnings.fired++;
          console.log(`[SLA Cron] WARNING fired: ${ticketRef}`);
        }

      } catch (ticketErr) {
        // Per-ticket error — don't let one bad ticket kill the whole run
        results.errors.push({
          ticketId: ticket.id,
          error:    ticketErr.message,
        });
        console.error(`[SLA Cron] Error processing ticket ${ticket.id}:`, ticketErr.message);
      }
    }

  } catch (err) {
    console.error("[SLA Cron] Fatal error:", err);
    return NextResponse.json(
      {
        ok:    false,
        error: err.message,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }

  const duration = Date.now() - startedAt;

  console.log(
    `[SLA Cron] Run complete in ${duration}ms — ` +
    `Warnings: ${results.warnings.fired}/${results.warnings.checked} | ` +
    `Breaches: ${results.breaches.fired}/${results.breaches.checked} | ` +
    `Errors: ${results.errors.length}`
  );

  return NextResponse.json({
    ok:       true,
    duration: `${duration}ms`,
    results,
  });
}