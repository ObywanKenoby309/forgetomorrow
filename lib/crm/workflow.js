// lib/crm/workflow.js
//
// WORKFLOW ENGINE
//
// Evaluates automation rules stored in the WorkflowRule table and executes
// their actions when conditions match. Called after every ticket mutation
// and by the SLA cron route.
//
// USAGE:
//   import { runWorkflows } from "@/lib/crm/workflow"
//   await runWorkflows("TICKET_CREATED", ticket)
//   await runWorkflows("STATUS_CHANGED", updatedTicket)
//   await runWorkflows("SLA_BREACHED", ticket)
//
// HOW RULES ARE EVALUATED:
//   1. Load all active WorkflowRules matching the trigger (cached 60s)
//   2. For each rule, evaluate ALL conditions against the ticket
//   3. If all conditions pass, execute actions in order
//   4. Log each execution to WorkflowRun
//
// ============================================================================

import prisma from "@/lib/prisma";

// ============================================================================
//  RULE CACHE
//  Avoids a DB query on every single ticket mutation.
//  Cache expires every 60 seconds so rule changes take effect quickly.
// ============================================================================

const ruleCache = {
  data:      null,
  expiresAt: 0,
};

async function getActiveRules(trigger) {
  const now = Date.now();

  if (!ruleCache.data || now > ruleCache.expiresAt) {
    ruleCache.data = await prisma.workflowRule.findMany({
      where:   { isActive: true },
      orderBy: { runOrder: "asc" },
    });
    ruleCache.expiresAt = now + 60_000; // 60 seconds
  }

  return ruleCache.data.filter((r) => r.trigger === trigger);
}

export function invalidateRuleCache() {
  ruleCache.data      = null;
  ruleCache.expiresAt = 0;
}

// ============================================================================
//  CONDITION EVALUATOR
//  Supports: eq, neq, in, contains, gt, lt, gte, lte, is_null, is_not_null
//
//  Condition shape: { field, operator, value }
//  Example: { field: "priority", operator: "eq", value: "P1" }
// ============================================================================

function evaluateCondition(ticket, condition) {
  const { field, operator, value } = condition;
  const actual = ticket[field];

  switch (operator) {
    case "eq":
      return String(actual) === String(value);

    case "neq":
      return String(actual) !== String(value);

    case "in":
      return Array.isArray(value)
        ? value.map(String).includes(String(actual))
        : false;

    case "contains":
      return typeof actual === "string" &&
        actual.toLowerCase().includes(String(value).toLowerCase());

    case "gt":
      return Number(actual) > Number(value);

    case "gte":
      return Number(actual) >= Number(value);

    case "lt":
      return Number(actual) < Number(value);

    case "lte":
      return Number(actual) <= Number(value);

    case "is_null":
      return actual === null || actual === undefined;

    case "is_not_null":
      return actual !== null && actual !== undefined;

    default:
      console.warn(`[Workflow] Unknown operator: ${operator}`);
      return false;
  }
}

function evaluateConditions(ticket, conditions) {
  if (!conditions || conditions.length === 0) return true;
  return conditions.every((c) => evaluateCondition(ticket, c));
}

// ============================================================================
//  ACTION EXECUTORS
//  Each action type is a function that receives (ticket, params, context)
//  and returns { success, result?, error? }
//
//  Action shape: { type, params }
//  Example: { type: "set_status", params: { status: "ASSIGNED" } }
// ============================================================================

const actionExecutors = {

  // --------------------------------------------------------------------------
  //  assign_to_agent — set ticket.assignedToId
  // --------------------------------------------------------------------------
  async assign_to_agent(ticket, params) {
    const { agentId } = params;
    if (!agentId) return { success: false, error: "Missing agentId" };

    await prisma.ticket.update({
      where: { id: ticket.id },
      data:  {
        assignedToId: agentId,
        status:       ticket.status === "OPEN" ? "ASSIGNED" : ticket.status,
      },
    });

    await prisma.ticketHistory.create({
      data: {
        ticketId:  ticket.id,
        actorId:   ticket.createdById,
        action:    "reassigned",
        fromValue: ticket.assignedToId ?? "unassigned",
        toValue:   agentId,
        metadata:  { source: "workflow" },
      },
    });

    return { success: true, result: `Assigned to ${agentId}` };
  },

  // --------------------------------------------------------------------------
  //  assign_to_queue — move ticket to a different queue
  // --------------------------------------------------------------------------
  async assign_to_queue(ticket, params) {
    const { queueId } = params;
    if (!queueId) return { success: false, error: "Missing queueId" };

    await prisma.ticket.update({
      where: { id: ticket.id },
      data:  {
        queueId,
        assignedToId: null, // clear assignment — needs re-assignment in new queue
      },
    });

    await prisma.ticketHistory.create({
      data: {
        ticketId:  ticket.id,
        actorId:   ticket.createdById,
        action:    "queue_transfer",
        fromValue: ticket.queueId,
        toValue:   queueId,
        metadata:  { source: "workflow" },
      },
    });

    return { success: true, result: `Transferred to queue ${queueId}` };
  },

  // --------------------------------------------------------------------------
  //  set_status — change ticket status
  // --------------------------------------------------------------------------
  async set_status(ticket, params) {
    const { status } = params;
    if (!status) return { success: false, error: "Missing status" };

    await prisma.ticket.update({
      where: { id: ticket.id },
      data:  { status },
    });

    await prisma.ticketHistory.create({
      data: {
        ticketId:  ticket.id,
        actorId:   ticket.createdById,
        action:    "status_change",
        fromValue: ticket.status,
        toValue:   status,
        metadata:  { source: "workflow" },
      },
    });

    return { success: true, result: `Status set to ${status}` };
  },

  // --------------------------------------------------------------------------
  //  set_priority — change priority (note: does NOT recalculate SLA here,
  //  the API route that calls this should recalculate after workflow runs)
  // --------------------------------------------------------------------------
  async set_priority(ticket, params) {
    const { priority } = params;
    if (!priority) return { success: false, error: "Missing priority" };

    await prisma.ticket.update({
      where: { id: ticket.id },
      data:  { priority },
    });

    await prisma.ticketHistory.create({
      data: {
        ticketId:  ticket.id,
        actorId:   ticket.createdById,
        action:    "priority_change",
        fromValue: ticket.priority,
        toValue:   priority,
        metadata:  { source: "workflow" },
      },
    });

    return { success: true, result: `Priority set to ${priority}` };
  },

  // --------------------------------------------------------------------------
  //  notify_on_call — notify all on-call agents in the ticket's queue
  // --------------------------------------------------------------------------
  async notify_on_call(ticket, params) {
    const ticketRef = `FT-${String(ticket.number).padStart(5, "0")}`;

    const onCallAgents = await prisma.queueAgent.findMany({
      where:   { queueId: ticket.queueId, isOnCall: true },
      include: { user: true },
    });

    if (onCallAgents.length === 0) {
      return { success: true, result: "No on-call agents found" };
    }

    for (const agent of onCallAgents) {
      await prisma.notification.upsert({
        where: {
          userId_dedupeKey: {
            userId:    agent.userId,
            dedupeKey: `oncall_${ticket.id}_${agent.userId}`,
          },
        },
        update: {},
        create: {
          userId:         agent.userId,
          title:          `📟 On-Call Alert — ${ticketRef}`,
          body:           `${ticket.title} requires immediate attention.`,
          category:       "CRM",
          scope:          "AGENT",
          entityType:     "TICKET",
          entityId:       ticket.id,
          dedupeKey:      `oncall_${ticket.id}_${agent.userId}`,
          requiresAction: true,
        },
      });
    }

    return { success: true, result: `Notified ${onCallAgents.length} on-call agents` };
  },

  // --------------------------------------------------------------------------
  //  notify_agent — notify a specific agent
  // --------------------------------------------------------------------------
  async notify_agent(ticket, params) {
    const { agentId, message } = params;
    if (!agentId) return { success: false, error: "Missing agentId" };

    const ticketRef = `FT-${String(ticket.number).padStart(5, "0")}`;

    await prisma.notification.upsert({
      where: {
        userId_dedupeKey: {
          userId:    agentId,
          dedupeKey: `wf_notify_${ticket.id}_${agentId}_${Date.now()}`,
        },
      },
      update: {},
      create: {
        userId:         agentId,
        title:          `🎫 ${ticketRef} — Action Required`,
        body:           message ?? ticket.title,
        category:       "CRM",
        scope:          "AGENT",
        entityType:     "TICKET",
        entityId:       ticket.id,
        dedupeKey:      `wf_notify_${ticket.id}_${agentId}_${Date.now()}`,
        requiresAction: true,
      },
    });

    return { success: true, result: `Notified agent ${agentId}` };
  },

  // --------------------------------------------------------------------------
  //  notify_managers — notify all managers in the ticket's queue
  // --------------------------------------------------------------------------
  async notify_managers(ticket, params) {
    const { message } = params ?? {};
    const ticketRef = `FT-${String(ticket.number).padStart(5, "0")}`;

    const managers = await prisma.queueAgent.findMany({
      where:   { queueId: ticket.queueId, role: "MANAGER" },
      include: { user: true },
    });

    for (const mgr of managers) {
      await prisma.notification.upsert({
        where: {
          userId_dedupeKey: {
            userId:    mgr.userId,
            dedupeKey: `wf_mgr_${ticket.id}_${mgr.userId}`,
          },
        },
        update: {},
        create: {
          userId:         mgr.userId,
          title:          `🔔 Manager Alert — ${ticketRef}`,
          body:           message ?? `${ticket.title} requires your attention.`,
          category:       "CRM",
          scope:          "MANAGER",
          entityType:     "TICKET",
          entityId:       ticket.id,
          dedupeKey:      `wf_mgr_${ticket.id}_${mgr.userId}`,
          requiresAction: true,
        },
      });
    }

    return { success: true, result: `Notified ${managers.length} managers` };
  },

  // --------------------------------------------------------------------------
  //  add_tag — append a tag to ticket.tags JSON array
  // --------------------------------------------------------------------------
  async add_tag(ticket, params) {
    const { tag } = params;
    if (!tag) return { success: false, error: "Missing tag" };

    const existing = Array.isArray(ticket.tags) ? ticket.tags : [];
    if (existing.includes(tag)) {
      return { success: true, result: `Tag '${tag}' already present` };
    }

    await prisma.ticket.update({
      where: { id: ticket.id },
      data:  { tags: [...existing, tag] },
    });

    return { success: true, result: `Tag '${tag}' added` };
  },

  // --------------------------------------------------------------------------
  //  escalate — shorthand: set priority to P1 + notify managers + log history
  // --------------------------------------------------------------------------
  async escalate(ticket, params) {
    const { reason } = params ?? {};

    await prisma.ticket.update({
      where: { id: ticket.id },
      data:  { priority: "P1" },
    });

    await prisma.ticketHistory.create({
      data: {
        ticketId:  ticket.id,
        actorId:   ticket.createdById,
        action:    "escalated",
        fromValue: ticket.priority,
        toValue:   "P1",
        metadata:  { reason: reason ?? "workflow escalation", source: "workflow" },
      },
    });

    // Also log SlaEvent
    await prisma.slaEvent.create({
      data: {
        ticketId: ticket.id,
        type:     "ESCALATED",
        target:   "resolution",
        notified: true,
      },
    });

    // Notify managers
    await actionExecutors.notify_managers(ticket, {
      message: `Ticket has been auto-escalated to P1. ${reason ?? ""}`.trim(),
    });

    return { success: true, result: "Ticket escalated to P1" };
  },
};

// ============================================================================
//  MAIN EXPORT: runWorkflows
//
//  Call this after any ticket mutation.
//
//  @param trigger  — WorkflowTrigger string e.g. "TICKET_CREATED"
//  @param ticket   — the ticket object (fresh from DB or after update)
//
//  @returns { rulesEvaluated, rulesMatched, actionsExecuted, errors }
// ============================================================================

export async function runWorkflows(trigger, ticket) {
  const summary = {
    rulesEvaluated:  0,
    rulesMatched:    0,
    actionsExecuted: 0,
    errors:          [],
  };

  try {
    const rules = await getActiveRules(trigger);
    summary.rulesEvaluated = rules.length;

    for (const rule of rules) {
      try {
        const conditions = Array.isArray(rule.conditions)
          ? rule.conditions
          : JSON.parse(rule.conditions ?? "[]");

        const actions = Array.isArray(rule.actions)
          ? rule.actions
          : JSON.parse(rule.actions ?? "[]");

        const matched = evaluateConditions(ticket, conditions);
        if (!matched) continue;

        summary.rulesMatched++;

        const actionLog = [];

        // Execute each action in order
        for (const action of actions) {
          const executor = actionExecutors[action.type];

          if (!executor) {
            const err = `Unknown action type: ${action.type}`;
            console.warn(`[Workflow] ${err}`);
            actionLog.push({ action: action.type, success: false, error: err });
            continue;
          }

          try {
            const result = await executor(ticket, action.params ?? {});
            actionLog.push({ action: action.type, ...result });
            if (result.success) summary.actionsExecuted++;
          } catch (actionErr) {
            const err = actionErr.message;
            console.error(`[Workflow] Action '${action.type}' failed:`, err);
            actionLog.push({ action: action.type, success: false, error: err });
            summary.errors.push({ ruleId: rule.id, action: action.type, error: err });
          }
        }

        // Log the workflow run
        await prisma.workflowRun.create({
          data: {
            ruleId:   rule.id,
            ticketId: ticket.id,
            status:   actionLog.every((a) => a.success) ? "success" : "partial",
            log:      actionLog,
          },
        });

      } catch (ruleErr) {
        console.error(`[Workflow] Rule ${rule.id} failed:`, ruleErr.message);
        summary.errors.push({ ruleId: rule.id, error: ruleErr.message });
      }
    }

  } catch (err) {
    console.error("[Workflow] Fatal error in runWorkflows:", err.message);
    summary.errors.push({ error: err.message });
  }

  if (summary.rulesMatched > 0) {
    console.log(
      `[Workflow] trigger=${trigger} | ` +
      `evaluated=${summary.rulesEvaluated} | ` +
      `matched=${summary.rulesMatched} | ` +
      `actions=${summary.actionsExecuted} | ` +
      `errors=${summary.errors.length}`
    );
  }

  return summary;
}