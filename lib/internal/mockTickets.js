// lib/internal/mockTickets.js

// Ticket Types: incident | request
// States: new | assigned | on_hold | in_progress | cancelled | completed | closed_complete (incidents only)
// Incidents can be reopened (within 3 days of completed) -> assigned to lastAssignedTo
// Requests cannot be reopened once completed.

export const TICKET_TYPES = {
  INCIDENT: 'incident',
  REQUEST: 'request',
};

export const TICKET_STATES = {
  NEW: 'new',
  ASSIGNED: 'assigned',
  ON_HOLD: 'on_hold',
  IN_PROGRESS: 'in_progress',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  CLOSED_COMPLETE: 'closed_complete',
};

export const QUEUES = [
  { key: 'cx', name: 'CX Queue' },
  { key: 'eng', name: 'Engineering Queue' },
  { key: 'qa', name: 'QA Queue' },
  { key: 'ops', name: 'Ops / Delivery Queue' },
];

export function formatState(state, type) {
  if (state === TICKET_STATES.COMPLETED && type === TICKET_TYPES.INCIDENT) return 'Resolved';
  if (state === TICKET_STATES.COMPLETED && type === TICKET_TYPES.REQUEST) return 'Completed';
  if (state === TICKET_STATES.CLOSED_COMPLETE) return 'Closed Complete';
  if (state === TICKET_STATES.ON_HOLD) return 'On Hold';
  if (state === TICKET_STATES.IN_PROGRESS) return 'In Progress';
  if (state === TICKET_STATES.ASSIGNED) return 'Assigned';
  if (state === TICKET_STATES.NEW) return 'New';
  if (state === TICKET_STATES.CANCELLED) return 'Cancelled';
  return state;
}

export function minutesBetween(a, b) {
  const da = a ? new Date(a).getTime() : null;
  const db = b ? new Date(b).getTime() : null;
  if (!da || !db) return 0;
  return Math.max(0, Math.round((db - da) / 60000));
}

export function humanDurationMinutes(mins) {
  const m = Math.max(0, Number(mins || 0));
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h < 24) return `${h}h ${r}m`;
  const d = Math.floor(h / 24);
  const hh = h % 24;
  return `${d}d ${hh}h`;
}

export function calcMetrics(ticket) {
  const openedToCreatedMins = minutesBetween(ticket.openedAt, ticket.createdAt);
  const createdToCompletedMins = minutesBetween(ticket.createdAt, ticket.completedAt);

  // Active work time: sum of in_progress blocks
  const workMins = (ticket.workLogs || [])
    .filter((w) => w.kind === 'work' && w.startAt && w.endAt)
    .reduce((sum, w) => sum + minutesBetween(w.startAt, w.endAt), 0);

  const holdMins = (ticket.workLogs || [])
    .filter((w) => w.kind === 'hold' && w.startAt && w.endAt)
    .reduce((sum, w) => sum + minutesBetween(w.startAt, w.endAt), 0);

  const resolvedToClosedCompleteMins =
    ticket.type === TICKET_TYPES.INCIDENT ? minutesBetween(ticket.completedAt, ticket.closedCompleteAt) : 0;

  const totalOpenedToClosedMins =
    ticket.closedCompleteAt
      ? minutesBetween(ticket.openedAt, ticket.closedCompleteAt)
      : ticket.completedAt
      ? minutesBetween(ticket.openedAt, ticket.completedAt)
      : minutesBetween(ticket.openedAt, new Date().toISOString());

  return {
    openedToCreatedMins,
    createdToCompletedMins,
    workMins,
    holdMins,
    resolvedToClosedCompleteMins,
    totalOpenedToClosedMins,
  };
}

function isoMinusMinutes(mins) {
  const t = Date.now() - mins * 60000;
  return new Date(t).toISOString();
}

export function getMockTickets() {
  // NOTE: deterministic-ish but “real feeling”
  return [
    {
      id: 'FT-10241',
      type: TICKET_TYPES.INCIDENT,
      state: TICKET_STATES.IN_PROGRESS,
      priority: 'P2',
      queueKey: 'eng',
      title: 'Recruiter Candidates page: compare drawer freezes on mobile',
      description:
        'On iPhone/Android, opening Compare sometimes locks scroll and requires refresh. Needs a safe overflow clamp.',
      openedBy: { name: 'Ted', department: 'CX' },
      createdAt: isoMinusMinutes(320),
      openedAt: isoMinusMinutes(348),
      updatedAt: isoMinusMinutes(18),
      completedAt: null,
      closedCompleteAt: null,
      assignedTo: { name: 'Eric', team: 'Engineering' },
      lastAssignedTo: { name: 'Eric', team: 'Engineering' },
      tags: ['mobile', 'recruiter', 'ux'],
      workLogs: [
        { kind: 'work', startAt: isoMinusMinutes(120), endAt: isoMinusMinutes(70), note: 'Repro + isolated overflow region' },
        { kind: 'hold', startAt: isoMinusMinutes(70), endAt: isoMinusMinutes(55), note: 'Waiting on confirmation from Ted (device + browser)' },
        { kind: 'work', startAt: isoMinusMinutes(55), endAt: isoMinusMinutes(18), note: 'Implemented clamp + tested basic flows' },
      ],
      activity: [
        { at: isoMinusMinutes(320), by: 'Ted', kind: 'created', message: 'Ticket submitted' },
        { at: isoMinusMinutes(300), by: 'Queue Manager', kind: 'assigned', message: 'Assigned to Eric (ENG)' },
        { at: isoMinusMinutes(120), by: 'Eric', kind: 'status', message: 'Moved to In Progress' },
        { at: isoMinusMinutes(70), by: 'Eric', kind: 'status', message: 'Moved to On Hold (needs device confirmation)' },
        { at: isoMinusMinutes(55), by: 'Eric', kind: 'status', message: 'Back to In Progress' },
      ],
    },
    {
      id: 'FT-10236',
      type: TICKET_TYPES.REQUEST,
      state: TICKET_STATES.ASSIGNED,
      priority: 'P3',
      queueKey: 'cx',
      title: 'Add “Forge Workspace” return button in Forge Site header for employees',
      description:
        'When employees are browsing the customer site, provide a clear “Forge Workspace” button to jump back to /internal/dashboard.',
      openedBy: { name: 'Ted', department: 'CX' },
      openedAt: isoMinusMinutes(780),
      createdAt: isoMinusMinutes(740),
      updatedAt: isoMinusMinutes(65),
      completedAt: null,
      closedCompleteAt: null,
      assignedTo: { name: 'Joel', team: 'Delivery' },
      lastAssignedTo: { name: 'Joel', team: 'Delivery' },
      tags: ['navigation', 'internal', 'ux'],
      workLogs: [],
      activity: [
        { at: isoMinusMinutes(740), by: 'Ted', kind: 'created', message: 'Ticket submitted' },
        { at: isoMinusMinutes(90), by: 'Queue Manager', kind: 'assigned', message: 'Assigned to Joel (Delivery)' },
      ],
    },
    {
      id: 'FT-10211',
      type: TICKET_TYPES.INCIDENT,
      state: TICKET_STATES.COMPLETED, // resolved
      priority: 'P1',
      queueKey: 'eng',
      title: 'Login: occasional redirect loop after auth callback',
      description: 'Some users see a loop after sign-in; suspected cookie timing + redirect fallback.',
      openedBy: { name: 'System', department: 'N/A' },
      openedAt: isoMinusMinutes(4200),
      createdAt: isoMinusMinutes(4180),
      updatedAt: isoMinusMinutes(3800),
      completedAt: isoMinusMinutes(3800),
      closedCompleteAt: null, // within 3-day window
      assignedTo: { name: 'Eric', team: 'Engineering' },
      lastAssignedTo: { name: 'Eric', team: 'Engineering' },
      tags: ['auth', 'incident', 'p1'],
      workLogs: [
        { kind: 'work', startAt: isoMinusMinutes(4150), endAt: isoMinusMinutes(4040), note: 'Added guard + verified redirect targets' },
        { kind: 'work', startAt: isoMinusMinutes(4010), endAt: isoMinusMinutes(3800), note: 'Validated in prod logs + patch deployed' },
      ],
      activity: [
        { at: isoMinusMinutes(4180), by: 'System', kind: 'created', message: 'Auto-created from error threshold' },
        { at: isoMinusMinutes(4170), by: 'Queue Manager', kind: 'assigned', message: 'Assigned to Eric (ENG)' },
        { at: isoMinusMinutes(4150), by: 'Eric', kind: 'status', message: 'Moved to In Progress' },
        { at: isoMinusMinutes(3800), by: 'Eric', kind: 'status', message: 'Resolved' },
      ],
    },
    {
      id: 'FT-10177',
      type: TICKET_TYPES.REQUEST,
      state: TICKET_STATES.CANCELLED,
      priority: 'P4',
      queueKey: 'cx',
      title: 'Change button label “Close” → “Done” in modal',
      description: 'Small polish. Cancelled due to broader modal overhaul planned.',
      openedBy: { name: 'Ted', department: 'CX' },
      openedAt: isoMinusMinutes(9800),
      createdAt: isoMinusMinutes(9780),
      updatedAt: isoMinusMinutes(9700),
      completedAt: null,
      closedCompleteAt: null,
      assignedTo: { name: '—', team: '—' },
      lastAssignedTo: { name: '—', team: '—' },
      tags: ['copy', 'ux'],
      workLogs: [],
      activity: [
        { at: isoMinusMinutes(9780), by: 'Ted', kind: 'created', message: 'Ticket submitted' },
        { at: isoMinusMinutes(9700), by: 'Eric', kind: 'cancelled', message: 'Cancelled (superseded by modal overhaul)' },
      ],
    },
  ];
}

export function getMockTicketById(id) {
  const list = getMockTickets();
  return list.find((t) => String(t.id) === String(id)) || null;
}
