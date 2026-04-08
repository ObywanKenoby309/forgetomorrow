// components/recruiter/BulkMessageModal.js
// Unified group message modal for recruiters and coaches.
// Three-tab recipient builder: Groups | Within a Group | Search
// Persona-aware: labels, group sources, and copy adapt per context.

import { useEffect, useState, useMemo, useRef } from "react";
import { createPortal } from "react-dom";

/* ─────────────────────────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────────────────────────── */
const ORANGE = "#FF7043";
const SLATE = "#334155";
const MUTED = "#64748B";
const LIGHT_MUTED = "#94A3B8";
const BORDER = "rgba(15,23,42,0.08)";
const SURFACE = "rgba(255,255,255,0.98)";
const DANGER = "#DC2626";

const GLASS = {
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,0.22)",
  background: "rgba(255,255,255,0.92)",
  boxShadow: "0 24px 60px rgba(15,23,42,0.22)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
};

const WHITE_CARD = {
  background: SURFACE,
  border: `1px solid ${BORDER}`,
  borderRadius: 12,
  boxSizing: "border-box",
};

/* ─────────────────────────────────────────────────────────────
   PERSONA CONFIG
   Recruiters: groups = job groups + talent pools
   Coaches:    groups = client status buckets (At Risk, Active, New Intake)
───────────────────────────────────────────────────────────── */
function getPersonaConfig(persona) {
  if (persona === "coach") {
    return {
      title: "Group Message",
      recipientLabel: "client",
      recipientLabelPlural: "clients",
      groupLabel: "Client Groups",
      searchPlaceholder: "Search clients…",
      messagePlaceholder: "Write a personal note — it will be sent individually to each selected client.",
      emptyGroupsText: "No client groups yet. Add clients to see them grouped by status.",
      emptySearchText: "No clients found.",
      emptyRecipientsText: "No clients available yet.",
      sendLabel: "Send to",
    };
  }
  return {
    title: "Group Message",
    recipientLabel: "candidate",
    recipientLabelPlural: "candidates",
    groupLabel: "Groups & Pools",
    searchPlaceholder: "Search candidates…",
    messagePlaceholder: "Write your message once — it will be sent individually to each selected candidate.",
    emptyGroupsText: "No groups or talent pools yet.",
    emptySearchText: "No candidates found.",
    emptyRecipientsText: "No candidates available yet.",
    sendLabel: "Send to",
  };
}

/* ─────────────────────────────────────────────────────────────
   AVATAR CHIP (recipient tag in To: field)
───────────────────────────────────────────────────────────── */
function RecipientChip({ name, onRemove }) {
  const initials = (name || "?")
    .split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 8px 3px 5px",
      borderRadius: 999,
      background: "rgba(255,112,67,0.10)",
      border: "1px solid rgba(255,112,67,0.25)",
      fontSize: 12, fontWeight: 700, color: ORANGE,
      maxWidth: 160, flexShrink: 0,
    }}>
      <div style={{
        width: 18, height: 18, borderRadius: "50%",
        background: "linear-gradient(135deg, #FF7043 0%, #FF8A65 100%)",
        color: "white", fontSize: 8, fontWeight: 800,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>{initials}</div>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {name}
      </span>
      <button
        type="button"
        onClick={onRemove}
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: ORANGE, fontSize: 14, lineHeight: 1, padding: 0,
          flexShrink: 0, opacity: 0.7,
        }}
        aria-label={`Remove ${name}`}
      >×</button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   GROUP CHIP (group tag in To: field — shows count)
───────────────────────────────────────────────────────────── */
function GroupChip({ name, count, onRemove }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 8px 3px 8px",
      borderRadius: 999,
      background: "rgba(51,65,85,0.08)",
      border: "1px solid rgba(51,65,85,0.18)",
      fontSize: 12, fontWeight: 700, color: SLATE,
      flexShrink: 0,
    }}>
      <span>{name}</span>
      <span style={{
        fontSize: 10, fontWeight: 800, color: "white",
        background: ORANGE, borderRadius: 999, padding: "1px 5px",
      }}>{count}</span>
      <button
        type="button"
        onClick={onRemove}
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: SLATE, fontSize: 14, lineHeight: 1, padding: 0,
          flexShrink: 0, opacity: 0.6,
        }}
        aria-label={`Remove ${name}`}
      >×</button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   TAB: GROUPS
   One-click add entire group or talent pool / status bucket
───────────────────────────────────────────────────────────── */
function GroupsTab({ groups, selectedGroupIds, onToggleGroup, config }) {
  if (groups.length === 0) {
    return (
      <div style={{ padding: "32px 16px", textAlign: "center", color: LIGHT_MUTED, fontSize: 13 }}>
        {config.emptyGroupsText}
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 6 }}>
      {groups.map((g) => {
        const isSelected = selectedGroupIds.includes(g.id);
        const count = g.members?.length || g.candidates?.length || g.count || 0;
        return (
          <button
            key={g.id}
            type="button"
            onClick={() => onToggleGroup(g)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 14px", borderRadius: 10,
              background: isSelected ? "rgba(255,112,67,0.08)" : SURFACE,
              border: `1px solid ${isSelected ? "rgba(255,112,67,0.30)" : BORDER}`,
              cursor: "pointer", textAlign: "left", gap: 10,
              transition: "all 0.12s",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: isSelected ? ORANGE : SLATE,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {g.name}
              </div>
              {g.sublabel && (
                <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{g.sublabel}</div>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <span style={{
                fontSize: 11, fontWeight: 700,
                color: isSelected ? "white" : MUTED,
                background: isSelected ? ORANGE : "rgba(100,116,139,0.12)",
                borderRadius: 999, padding: "2px 8px",
              }}>
                {count} {count === 1 ? config.recipientLabel : config.recipientLabelPlural}
              </span>
              <div style={{
                width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                border: `2px solid ${isSelected ? ORANGE : BORDER}`,
                background: isSelected ? ORANGE : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {isSelected && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5L4.5 7.5L8 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   TAB: WITHIN A GROUP
   Pick a group, then check/uncheck individual members
───────────────────────────────────────────────────────────── */
function WithinGroupTab({ groups, selectedIds, onToggleId, config }) {
  const [activeGroupId, setActiveGroupId] = useState(null);

  const activeGroup = groups.find((g) => g.id === activeGroupId) || groups[0] || null;
  const members = activeGroup?.members || activeGroup?.candidates || [];

  useEffect(() => {
    if (groups.length > 0 && !activeGroupId) {
      setActiveGroupId(groups[0].id);
    }
  }, [groups, activeGroupId]);

  if (groups.length === 0) {
    return (
      <div style={{ padding: "32px 16px", textAlign: "center", color: LIGHT_MUTED, fontSize: 13 }}>
        {config.emptyGroupsText}
      </div>
    );
  }

  const allInGroupSelected = members.length > 0 && members.every((m) => selectedIds.includes(m.id || m.userId));
  const someInGroupSelected = members.some((m) => selectedIds.includes(m.id || m.userId));

  return (
    <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 0, height: 260, ...WHITE_CARD, overflow: "hidden" }}>
      {/* Group selector — left column */}
      <div style={{ borderRight: `1px solid ${BORDER}`, overflowY: "auto" }}>
        {groups.map((g) => {
          const isActive = g.id === (activeGroup?.id);
          const mems = g.members || g.candidates || [];
          const selectedCount = mems.filter((m) => selectedIds.includes(m.id || m.userId)).length;
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => setActiveGroupId(g.id)}
              style={{
                width: "100%", textAlign: "left", padding: "10px 12px",
                background: isActive ? "rgba(255,112,67,0.06)" : "transparent",
                borderLeft: isActive ? `3px solid ${ORANGE}` : "3px solid transparent",
                border: "none", borderBottom: `1px solid ${BORDER}`,
                cursor: "pointer",
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: isActive ? ORANGE : SLATE,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {g.name}
              </div>
              {selectedCount > 0 && (
                <div style={{ fontSize: 10, color: ORANGE, fontWeight: 700, marginTop: 2 }}>
                  {selectedCount} selected
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Member list — right column */}
      <div style={{ overflowY: "auto", padding: "8px 0" }}>
        {members.length === 0 ? (
          <div style={{ padding: "24px 16px", textAlign: "center", color: LIGHT_MUTED, fontSize: 12 }}>
            No {config.recipientLabelPlural} in this group yet.
          </div>
        ) : (
          <>
            {/* Select all row */}
            <label style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 14px", cursor: "pointer",
              borderBottom: `1px solid ${BORDER}`,
            }}>
              <input
                type="checkbox"
                checked={allInGroupSelected}
                ref={(el) => { if (el) el.indeterminate = someInGroupSelected && !allInGroupSelected; }}
                onChange={(e) => {
                  members.forEach((m) => {
                    const id = m.id || m.userId;
                    const inSelected = selectedIds.includes(id);
                    if (e.target.checked && !inSelected) onToggleId(id, m.name);
                    if (!e.target.checked && inSelected) onToggleId(id, m.name);
                  });
                }}
                style={{ accentColor: ORANGE, cursor: "pointer" }}
              />
              <span style={{ fontSize: 12, fontWeight: 700, color: MUTED }}>
                Select all in {activeGroup?.name}
              </span>
            </label>
            {members.map((m) => {
              const id = m.id || m.userId;
              const isChecked = selectedIds.includes(id);
              return (
                <label key={id} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 14px", cursor: "pointer",
                  background: isChecked ? "rgba(255,112,67,0.04)" : "transparent",
                  transition: "background 0.1s",
                }}>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => onToggleId(id, m.name)}
                    style={{ accentColor: ORANGE, cursor: "pointer" }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: isChecked ? 700 : 500,
                      color: isChecked ? ORANGE : SLATE,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {m.name}
                    </div>
                    {(m.headline || m.role || m.status) && (
                      <div style={{ fontSize: 11, color: MUTED, marginTop: 1 }}>
                        {m.headline || m.role || m.status}
                      </div>
                    )}
                  </div>
                </label>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   TAB: SEARCH
   Typeahead across entire universe, multi-select
───────────────────────────────────────────────────────────── */
function SearchTab({ allRecipients, selectedIds, onToggleId, config }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) return allRecipients;
    const q = query.toLowerCase();
    return allRecipients.filter((r) =>
      r.name?.toLowerCase().includes(q) ||
      r.role?.toLowerCase().includes(q) ||
      r.headline?.toLowerCase().includes(q) ||
      r.status?.toLowerCase().includes(q)
    );
  }, [query, allRecipients]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ position: "relative" }}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"
          style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: LIGHT_MUTED }}>
          <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={config.searchPlaceholder}
          style={{
            width: "100%", boxSizing: "border-box",
            border: `1px solid ${BORDER}`, borderRadius: 10,
            padding: "9px 12px 9px 32px",
            fontSize: 13, color: SLATE, outline: "none",
            background: "rgba(248,250,252,0.9)",
            fontFamily: "inherit",
          }}
        />
      </div>

      <div style={{ ...WHITE_CARD, maxHeight: 220, overflowY: "auto" }}>
        {results.length === 0 ? (
          <div style={{ padding: "24px 16px", textAlign: "center", color: LIGHT_MUTED, fontSize: 13 }}>
            {config.emptySearchText}
          </div>
        ) : results.map((r) => {
          const id = r.id || r.userId;
          const isChecked = selectedIds.includes(id);
          return (
            <label key={id} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "9px 14px", cursor: "pointer",
              borderBottom: `1px solid ${BORDER}`,
              background: isChecked ? "rgba(255,112,67,0.04)" : "transparent",
            }}>
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => onToggleId(id, r.name)}
                style={{ accentColor: ORANGE, cursor: "pointer", flexShrink: 0 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: isChecked ? 700 : 500,
                  color: isChecked ? ORANGE : SLATE,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {r.name}
                </div>
                {(r.headline || r.role || r.status) && (
                  <div style={{ fontSize: 11, color: MUTED, marginTop: 1 }}>
                    {r.headline || r.role || r.status}
                  </div>
                )}
              </div>
              {isChecked && (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                  <circle cx="7" cy="7" r="7" fill={ORANGE}/>
                  <path d="M3.5 7L6 9.5L10.5 5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN EXPORT
───────────────────────────────────────────────────────────── */
/**
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - onSend: (ids[], text) => void
 * - persona: 'recruiter' | 'coach'
 *
 * Recruiter props:
 * - jobGroups: [{ id, name, status, candidates: [{userId, name, headline}] }]
 * - talentPoolGroups: [{ id, name, members: [{userId, name, headline}] }]
 *
 * Coach props:
 * - clients: [{ id, name, status, headline }]
 *   (auto-grouped by status: At Risk, Active, New Intake)
 *
 * Legacy flat-list support (non-breaking):
 * - candidates: [{id, name, role, location}]
 * - title, recipientLabelPlural, emptyRecipientsText, messagePlaceholder
 */
export default function BulkMessageModal({
  open,
  onClose,
  onSend,
  persona = "recruiter",

  // Recruiter
  jobGroups = [],
  talentPoolGroups = [],

  // Coach
  clients = [],

  // Legacy flat-list (non-breaking)
  candidates = [],

  // Legacy overrides
  title,
  recipientLabelPlural,
  emptyRecipientsText,
  messagePlaceholder,
}) {
  const config = getPersonaConfig(persona);

  // Allow legacy prop overrides
  const resolvedConfig = {
    ...config,
    ...(title && { title }),
    ...(recipientLabelPlural && { recipientLabelPlural }),
    ...(emptyRecipientsText && { emptyRecipientsText }),
    ...(messagePlaceholder && { messagePlaceholder }),
  };

  const [activeTab, setActiveTab] = useState("groups");
  const [selectedIds, setSelectedIds] = useState([]); // individual ids
  const [selectedGroups, setSelectedGroups] = useState([]); // {id, name, count, memberIds[]}
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) {
      setSelectedIds([]);
      setSelectedGroups([]);
      setText("");
      setSending(false);
      setActiveTab("groups");
    }
  }, [open]);

  // ── Build groups from data ────────────────────────────────────────────────
  const groups = useMemo(() => {
    if (persona === "coach") {
      // Auto-group clients by status
      const statusOrder = ["At Risk", "New Intake", "Active"];
      const buckets = {};
      for (const c of clients) {
        const status = c.status || "Active";
        if (!buckets[status]) buckets[status] = [];
        buckets[status].push({ ...c, id: c.id || c.userId });
      }
      return statusOrder
        .filter((s) => buckets[s]?.length > 0)
        .map((s) => ({
          id: `status-${s}`,
          name: s,
          sublabel: `${buckets[s].length} client${buckets[s].length !== 1 ? "s" : ""}`,
          members: buckets[s],
          count: buckets[s].length,
        }))
        .concat(
          Object.keys(buckets)
            .filter((s) => !statusOrder.includes(s))
            .map((s) => ({
              id: `status-${s}`,
              name: s,
              members: buckets[s],
              count: buckets[s].length,
            }))
        );
    }

    // Recruiter: job groups + talent pools
    const jg = (jobGroups || []).map((g) => ({
      id: `job-${g.id}`,
      name: g.name,
      sublabel: g.status !== "active" ? "Archived" : null,
      candidates: (g.candidates || []).map((c) => ({ ...c, id: c.id || c.userId })),
      count: g.candidateCount || g.candidates?.length || 0,
    }));
    const tp = (talentPoolGroups || []).map((p) => ({
      id: `pool-${p.id}`,
      name: p.name,
      sublabel: "Talent Pool",
      members: (p.members || []).map((m) => ({ ...m, id: m.id || m.userId })),
      count: p.memberCount || p.members?.length || 0,
    }));

    // Legacy flat candidates
    if (jg.length === 0 && tp.length === 0 && candidates.length > 0) {
      return [{
        id: "all",
        name: "All Recipients",
        members: candidates.map((c) => ({ ...c })),
        count: candidates.length,
      }];
    }

    return [...jg, ...tp];
  }, [persona, clients, jobGroups, talentPoolGroups, candidates]);

  // ── All recipients flat list (for search) ────────────────────────────────
  const allRecipients = useMemo(() => {
    const seen = new Set();
    const list = [];
    for (const g of groups) {
      const mems = g.members || g.candidates || [];
      for (const m of mems) {
        const id = m.id || m.userId;
        if (!seen.has(id)) { seen.add(id); list.push({ ...m, id }); }
      }
    }
    return list;
  }, [groups]);

  // ── Recipient name map ────────────────────────────────────────────────────
  const nameMap = useMemo(() => {
    const map = {};
    for (const r of allRecipients) map[r.id] = r.name;
    return map;
  }, [allRecipients]);

  // ── Computed final recipient ids (groups expand + individuals + dedup) ────
  const finalIds = useMemo(() => {
    const set = new Set(selectedIds);
    for (const g of selectedGroups) {
      for (const id of g.memberIds) set.add(id);
    }
    return Array.from(set);
  }, [selectedIds, selectedGroups]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleToggleGroup = (g) => {
    const mems = g.members || g.candidates || [];
    const memberIds = mems.map((m) => m.id || m.userId);
    const alreadySelected = selectedGroups.find((sg) => sg.id === g.id);
    if (alreadySelected) {
      setSelectedGroups((prev) => prev.filter((sg) => sg.id !== g.id));
    } else {
      setSelectedGroups((prev) => [...prev, {
        id: g.id, name: g.name, count: memberIds.length, memberIds,
      }]);
    }
  };

  const handleToggleId = (id, name) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleRemoveGroup = (groupId) => {
    setSelectedGroups((prev) => prev.filter((g) => g.id !== groupId));
  };

  const handleRemoveId = (id) => {
    setSelectedIds((prev) => prev.filter((x) => x !== id));
    // Also remove from any group that only had this person
    setSelectedGroups((prev) =>
      prev.filter((g) => !(g.memberIds.length === 1 && g.memberIds[0] === id))
    );
  };

  const handleSend = async () => {
    if (!finalIds.length || !text.trim() || sending) return;
    setSending(true);
    try {
      await onSend?.(finalIds, text.trim());
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  const tabs = [
    { id: "groups", label: resolvedConfig.groupLabel },
    { id: "within", label: "Within a Group" },
    { id: "search", label: "Search" },
  ];

  // Individual recipients not already covered by a group
  const individualRecipients = selectedIds.filter((id) => {
    const coveredByGroup = selectedGroups.some((g) => g.memberIds.includes(id));
    return !coveredByGroup;
  });

  return createPortal(
    <div style={{
      position: "fixed", inset: 0, zIndex: 99999,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16, background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)",
    }}>
      {/* Backdrop */}
      <div style={{ position: "absolute", inset: 0 }} onClick={onClose} />

      {/* Modal */}
      <div style={{
        ...GLASS,
        position: "relative", zIndex: 1,
        width: "100%", maxWidth: 620,
        maxHeight: "90vh", display: "flex", flexDirection: "column",
        overflow: "hidden",
      }}>

        {/* ── Header ── */}
        <div style={{
          padding: "18px 20px 14px",
          borderBottom: `1px solid ${BORDER}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: ORANGE,
              textShadow: "0 2px 4px rgba(15,23,42,0.65)", letterSpacing: "-0.01em" }}>
              {resolvedConfig.title}
            </h2>
            <div style={{ fontSize: 12, color: MUTED, marginTop: 3 }}>
              Build your recipient list, then write one message.
            </div>
          </div>
          <button type="button" onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer",
              fontSize: 22, lineHeight: 1, color: LIGHT_MUTED, padding: 4 }}>
            ×
          </button>
        </div>

        {/* ── To: field ── */}
        <div style={{
          padding: "12px 20px",
          borderBottom: `1px solid ${BORDER}`,
          flexShrink: 0,
        }}>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase",
            letterSpacing: "0.07em", color: LIGHT_MUTED, marginBottom: 8 }}>
            To: {finalIds.length > 0 && (
              <span style={{ color: ORANGE, fontWeight: 900 }}>
                {finalIds.length} {finalIds.length === 1 ? resolvedConfig.recipientLabel : resolvedConfig.recipientLabelPlural}
              </span>
            )}
          </div>

          {finalIds.length === 0 ? (
            <div style={{ fontSize: 13, color: LIGHT_MUTED, fontStyle: "italic" }}>
              No recipients yet — use the tabs below to add {resolvedConfig.recipientLabelPlural}.
            </div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {selectedGroups.map((g) => (
                <GroupChip key={g.id} name={g.name} count={g.count}
                  onRemove={() => handleRemoveGroup(g.id)} />
              ))}
              {individualRecipients.map((id) => (
                <RecipientChip key={id} name={nameMap[id] || id}
                  onRemove={() => handleRemoveId(id)} />
              ))}
            </div>
          )}
        </div>

        {/* ── Tabs ── */}
        <div style={{
          display: "flex", borderBottom: `1px solid ${BORDER}`,
          flexShrink: 0, paddingLeft: 20,
        }}>
          {tabs.map((tab) => (
            <button key={tab.id} type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "10px 16px", background: "none", border: "none",
                borderBottom: activeTab === tab.id ? `2px solid ${ORANGE}` : "2px solid transparent",
                fontSize: 13, fontWeight: activeTab === tab.id ? 800 : 600,
                color: activeTab === tab.id ? ORANGE : MUTED,
                cursor: "pointer", marginBottom: -1, transition: "all 0.12s",
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          {activeTab === "groups" && (
            <GroupsTab
              groups={groups}
              selectedGroupIds={selectedGroups.map((g) => g.id)}
              onToggleGroup={handleToggleGroup}
              config={resolvedConfig}
            />
          )}
          {activeTab === "within" && (
            <WithinGroupTab
              groups={groups}
              selectedIds={selectedIds}
              onToggleId={handleToggleId}
              config={resolvedConfig}
            />
          )}
          {activeTab === "search" && (
            <SearchTab
              allRecipients={allRecipients}
              selectedIds={selectedIds}
              onToggleId={handleToggleId}
              config={resolvedConfig}
            />
          )}
        </div>

        {/* ── Message composer ── */}
        <div style={{
          padding: "14px 20px 6px",
          borderTop: `1px solid ${BORDER}`,
          flexShrink: 0,
        }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={resolvedConfig.messagePlaceholder}
            rows={3}
            style={{
              width: "100%", boxSizing: "border-box",
              border: `1px solid ${BORDER}`, borderRadius: 10,
              padding: "10px 12px", fontSize: 13, fontFamily: "inherit",
              color: SLATE, outline: "none", resize: "none",
              background: "rgba(248,250,252,0.9)", lineHeight: 1.6,
            }}
          />
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: "10px 20px 18px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <button type="button" onClick={onClose}
            style={{
              padding: "9px 18px", borderRadius: 10,
              border: `1px solid ${BORDER}`, background: "white",
              fontSize: 13, fontWeight: 600, color: MUTED, cursor: "pointer",
            }}>
            Cancel
          </button>

          <button type="button" onClick={handleSend}
            disabled={finalIds.length === 0 || !text.trim() || sending}
            style={{
              padding: "9px 22px", borderRadius: 10, border: "none",
              background: finalIds.length > 0 && text.trim() && !sending
                ? "linear-gradient(135deg, #FF7043 0%, #FF8A65 100%)"
                : "rgba(15,23,42,0.15)",
              color: finalIds.length > 0 && text.trim() && !sending ? "white" : MUTED,
              fontSize: 13, fontWeight: 700,
              cursor: finalIds.length > 0 && text.trim() && !sending ? "pointer" : "not-allowed",
              boxShadow: finalIds.length > 0 && text.trim() && !sending
                ? "0 4px 14px rgba(255,112,67,0.35)" : "none",
              transition: "all 0.15s",
            }}>
            {sending ? "Sending…" : `${resolvedConfig.sendLabel} ${finalIds.length || 0}`}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}