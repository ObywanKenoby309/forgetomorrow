// components/recruiter/pools/AddCandidatesPicker.js
import React, { useMemo, useState } from "react";
import { Pill, PrimaryButton, SecondaryButton } from "./Pills";

export default function AddCandidatesPicker({
  panelStyle,
  selectedPool,
  saving,
  loadingPicker,
  pickerQuery,
  setPickerQuery,
  pickerResults,
  pickerSelectedIds,
  pickerStatus,
  setPickerStatus,
  pickerFit,
  setPickerFit,
  pickerWhy,
  setPickerWhy,

  // ✅ NEW (bulk-applied snapshot fields)
  pickerLastRoleConsidered,
  setPickerLastRoleConsidered,
  pickerNotes,
  setPickerNotes,

  onClose,
  onSearch,
  onToggleSelect,
  onAddSelected,
  onClearSelected,
}) {
  // ✅ NEW: internal vs external add mode (UI-only)
  const [mode, setMode] = useState("internal"); // "internal" | "external"
  const [extSaving, setExtSaving] = useState(false);
  const [extError, setExtError] = useState("");

  // ✅ NEW: External candidate form fields
  const [extName, setExtName] = useState("");
  const [extEmail, setExtEmail] = useState("");
  const [extPhone, setExtPhone] = useState("");
  const [extLinkedIn, setExtLinkedIn] = useState("");
  const [extCompany, setExtCompany] = useState("");
  const [extTitle, setExtTitle] = useState("");
  const [extLocation, setExtLocation] = useState("");
  const [extHeadline, setExtHeadline] = useState("");

  // ✅ IMPORTANT: do NOT reuse full panelStyle in inner columns (it may contain position/width).
  // Only take safe “surface” styling so grid panels don’t overlap.
  const panelSurfaceStyle = useMemo(() => {
    const ps = panelStyle && typeof panelStyle === "object" ? panelStyle : {};
    return {
      background: ps.background,
      border: ps.border,
      borderRadius: ps.borderRadius,
      boxShadow: ps.boxShadow,
      backdropFilter: ps.backdropFilter,
      WebkitBackdropFilter: ps.WebkitBackdropFilter,
    };
  }, [panelStyle]);

  const canSubmitExternal = useMemo(() => {
    const n = String(extName || "").trim();
    const em = String(extEmail || "").trim();
    return Boolean(n && em);
  }, [extName, extEmail]);

  function resetExternalForm() {
    setExtName("");
    setExtEmail("");
    setExtPhone("");
    setExtLinkedIn("");
    setExtCompany("");
    setExtTitle("");
    setExtLocation("");
    setExtHeadline("");
    setExtError("");
  }

  async function submitExternalCandidate() {
    setExtError("");
    if (!selectedPool?.id) {
      setExtError("Missing pool id. Close and re-open the picker.");
      return;
    }

    const name = String(extName || "").trim();
    const email = String(extEmail || "").trim();

    if (!name) {
      setExtError("Name is required.");
      return;
    }
    if (!email) {
      setExtError("Email is required.");
      return;
    }

    const status = String(pickerStatus || "Warm").trim() || "Warm";
    const fit = String(pickerFit || "").trim();
    const lastRoleConsidered = String(pickerLastRoleConsidered || "").trim();
    const notes = String(pickerNotes || "").trim();

    const reasons = String(pickerWhy || "")
      .split("\n")
      .map((x) => String(x || "").trim())
      .filter(Boolean)
      .slice(0, 20);

    const payload = {
      source: "External",
      name,
      headline: String(extHeadline || extTitle || "").trim(),
      location: String(extLocation || "").trim(),
      status,
      fit: fit || String(extTitle || "").trim() || "",

      reasons,
      notes,
      lastRoleConsidered: lastRoleConsidered || "",

      // ✅ triggers API auto-create externalCandidate + link it to the TalentPoolEntry
      externalCandidate: {
        email,
        phone: String(extPhone || "").trim() || null,
        linkedinUrl: String(extLinkedIn || "").trim() || null,
        company: String(extCompany || "").trim() || null,
        title: String(extTitle || "").trim() || null,
        notes: null,
      },
    };

    setExtSaving(true);
    try {
      const res = await fetch(
        `/api/recruiter/pools/${encodeURIComponent(selectedPool.id)}/entries`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to add external candidate.");

      // Keep picker open so they can add another quickly
      resetExternalForm();
    } catch (e) {
      setExtError(String(e?.message || e || "Failed to add external candidate."));
    } finally {
      setExtSaving(false);
    }
  }

  return (
    <div style={{ ...panelStyle, padding: 12, marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 900, color: "#37474F" }}>
            Add candidates to: <span style={{ color: "#263238" }}>{selectedPool?.name || "Pool"}</span>
          </div>

          <div style={{ color: "#607D8B", fontSize: 12, marginTop: 2, lineHeight: 1.35 }}>
            Add <strong>Internal</strong> (Forge users) or <strong>External</strong> candidates.
          </div>

          <div style={{ height: 8 }} />

          {/* ✅ NEW: mode switch */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => {
                setMode("internal");
                setExtError("");
              }}
              style={{
                border: mode === "internal" ? "1px solid rgba(255,112,67,0.55)" : "1px solid rgba(38,50,56,0.14)",
                background: mode === "internal" ? "rgba(255,112,67,0.08)" : "white",
                borderRadius: 999,
                padding: "8px 12px",
                fontWeight: 900,
                cursor: "pointer",
              }}
              disabled={saving || extSaving}
            >
              Internal (Forge)
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("external");
              }}
              style={{
                border: mode === "external" ? "1px solid rgba(255,112,67,0.55)" : "1px solid rgba(38,50,56,0.14)",
                background: mode === "external" ? "rgba(255,112,67,0.08)" : "white",
                borderRadius: 999,
                padding: "8px 12px",
                fontWeight: 900,
                cursor: "pointer",
              }}
              disabled={saving || extSaving}
            >
              External (Email)
            </button>
          </div>
        </div>

        <SecondaryButton onClick={onClose} disabled={saving || extSaving}>
          Close
        </SecondaryButton>
      </div>

      <div style={{ height: 10 }} />

      <div className="ftPickerGrid" style={{ display: "grid", gap: 12, alignItems: "stretch" }}>
        {/* Left column */}
        <div style={{ ...panelSurfaceStyle, padding: 12, minWidth: 0 }}>
          {mode === "internal" ? (
            <>
              <div style={{ color: "#607D8B", fontSize: 12, marginBottom: 10, lineHeight: 1.35 }}>
                This pulls LIVE candidates from <strong>User</strong> via <code>/api/recruiter/candidates</code>.
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
                <input
                  value={pickerQuery}
                  onChange={(e) => setPickerQuery(e.target.value)}
                  placeholder="Search candidates (name, headline, about)..."
                  aria-label="Search candidates"
                  style={{
                    flex: "1 1 260px",
                    border: "1px solid rgba(38,50,56,0.18)",
                    borderRadius: 10,
                    padding: "10px 12px",
                    fontWeight: 700,
                    outline: "none",
                  }}
                />
                <PrimaryButton onClick={onSearch} disabled={loadingPicker || saving}>
                  {loadingPicker ? "Searching..." : "Search"}
                </PrimaryButton>
              </div>

              <div style={{ height: 10 }} />

              <div style={{ color: "#607D8B", fontSize: 12, fontWeight: 800 }}>
                {loadingPicker ? "Loading candidates..." : `${pickerResults.length} result${pickerResults.length === 1 ? "" : "s"}`}
                {pickerSelectedIds.length ? ` - ${pickerSelectedIds.length} selected` : ""}
              </div>

              <div style={{ height: 10 }} />

              {loadingPicker ? (
                <div style={{ color: "#607D8B", fontSize: 13, lineHeight: 1.45 }}>Loading...</div>
              ) : pickerResults.length === 0 ? (
                <div
                  style={{
                    border: "1px dashed rgba(38,50,56,0.22)",
                    borderRadius: 12,
                    padding: 14,
                    color: "#607D8B",
                    fontSize: 13,
                    lineHeight: 1.45,
                  }}
                >
                  No candidates found yet. Try a broader search, or leave blank and click <strong>Search</strong> to pull newest.
                </div>
              ) : (
                <div style={{ display: "grid", gap: 8, maxHeight: 340, overflow: "auto", paddingRight: 4 }}>
                  {pickerResults.map((c) => {
                    const id = String(c?.id || "").trim();
                    const selected = pickerSelectedIds.includes(id);

                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => onToggleSelect(id)}
                        style={{
                          textAlign: "left",
                          border: selected ? `1px solid rgba(255,112,67,0.55)` : "1px solid rgba(38,50,56,0.12)",
                          background: selected ? "rgba(255,112,67,0.08)" : "white",
                          borderRadius: 12,
                          padding: 10,
                          cursor: "pointer",
                          display: "grid",
                          gap: 6,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                          <div style={{ fontWeight: 900, color: "#263238", fontSize: 13 }}>{c?.name || "Unnamed"}</div>
                          {selected ? <Pill tone="hot">Selected</Pill> : <Pill tone="neutral">Pick</Pill>}
                        </div>
                        <div style={{ color: "#607D8B", fontSize: 12, lineHeight: 1.35 }}>
                          {String(c?.title || c?.headline || "").trim()}
                        </div>
                        <div style={{ color: "#90A4AE", fontSize: 11, fontWeight: 800 }}>{String(c?.location || "").trim()}</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <>
              <div style={{ color: "#607D8B", fontSize: 12, marginBottom: 10, lineHeight: 1.35 }}>
                Add an <strong>External candidate</strong> (email-based). This creates an <strong>ExternalCandidate</strong> and links it to this pool.
              </div>

              {extError ? (
                <div
                  style={{
                    border: "1px solid rgba(255,112,67,0.35)",
                    background: "rgba(255,112,67,0.08)",
                    borderRadius: 12,
                    padding: 10,
                    color: "#B23C17",
                    fontWeight: 900,
                    fontSize: 12,
                    lineHeight: 1.35,
                    marginBottom: 10,
                  }}
                >
                  {extError}
                </div>
              ) : null}

              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div style={{ display: "grid", gap: 6 }}>
                    <div style={{ fontWeight: 900, color: "#37474F", fontSize: 12 }}>Name *</div>
                    <input
                      value={extName}
                      onChange={(e) => setExtName(e.target.value)}
                      placeholder="Full name"
                      style={{
                        border: "1px solid rgba(38,50,56,0.18)",
                        borderRadius: 10,
                        padding: "10px 12px",
                        fontWeight: 800,
                        outline: "none",
                      }}
                      disabled={saving || extSaving}
                    />
                  </div>

                  <div style={{ display: "grid", gap: 6 }}>
                    <div style={{ fontWeight: 900, color: "#37474F", fontSize: 12 }}>Email *</div>
                    <input
                      value={extEmail}
                      onChange={(e) => setExtEmail(e.target.value)}
                      placeholder="name@email.com"
                      style={{
                        border: "1px solid rgba(38,50,56,0.18)",
                        borderRadius: 10,
                        padding: "10px 12px",
                        fontWeight: 800,
                        outline: "none",
                      }}
                      disabled={saving || extSaving}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div style={{ display: "grid", gap: 6 }}>
                    <div style={{ fontWeight: 900, color: "#37474F", fontSize: 12 }}>Title (optional)</div>
                    <input
                      value={extTitle}
                      onChange={(e) => setExtTitle(e.target.value)}
                      placeholder="e.g., Support Lead"
                      style={{
                        border: "1px solid rgba(38,50,56,0.18)",
                        borderRadius: 10,
                        padding: "10px 12px",
                        fontWeight: 700,
                        outline: "none",
                      }}
                      disabled={saving || extSaving}
                    />
                  </div>

                  <div style={{ display: "grid", gap: 6 }}>
                    <div style={{ fontWeight: 900, color: "#37474F", fontSize: 12 }}>Company (optional)</div>
                    <input
                      value={extCompany}
                      onChange={(e) => setExtCompany(e.target.value)}
                      placeholder="e.g., Acme Corp"
                      style={{
                        border: "1px solid rgba(38,50,56,0.18)",
                        borderRadius: 10,
                        padding: "10px 12px",
                        fontWeight: 700,
                        outline: "none",
                      }}
                      disabled={saving || extSaving}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div style={{ display: "grid", gap: 6 }}>
                    <div style={{ fontWeight: 900, color: "#37474F", fontSize: 12 }}>Location (optional)</div>
                    <input
                      value={extLocation}
                      onChange={(e) => setExtLocation(e.target.value)}
                      placeholder="e.g., Nashville, TN"
                      style={{
                        border: "1px solid rgba(38,50,56,0.18)",
                        borderRadius: 10,
                        padding: "10px 12px",
                        fontWeight: 700,
                        outline: "none",
                      }}
                      disabled={saving || extSaving}
                    />
                  </div>

                  <div style={{ display: "grid", gap: 6 }}>
                    <div style={{ fontWeight: 900, color: "#37474F", fontSize: 12 }}>Phone (optional)</div>
                    <input
                      value={extPhone}
                      onChange={(e) => setExtPhone(e.target.value)}
                      placeholder="e.g., 615-555-0123"
                      style={{
                        border: "1px solid rgba(38,50,56,0.18)",
                        borderRadius: 10,
                        padding: "10px 12px",
                        fontWeight: 700,
                        outline: "none",
                      }}
                      disabled={saving || extSaving}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gap: 6 }}>
                  <div style={{ fontWeight: 900, color: "#37474F", fontSize: 12 }}>LinkedIn URL (optional)</div>
                  <input
                    value={extLinkedIn}
                    onChange={(e) => setExtLinkedIn(e.target.value)}
                    placeholder="https://linkedin.com/in/..."
                    style={{
                      border: "1px solid rgba(38,50,56,0.18)",
                      borderRadius: 10,
                      padding: "10px 12px",
                      fontWeight: 700,
                      outline: "none",
                    }}
                    disabled={saving || extSaving}
                  />
                </div>

                <div style={{ display: "grid", gap: 6 }}>
                  <div style={{ fontWeight: 900, color: "#37474F", fontSize: 12 }}>Headline (optional)</div>
                  <input
                    value={extHeadline}
                    onChange={(e) => setExtHeadline(e.target.value)}
                    placeholder="Short headline (if different from title)"
                    style={{
                      border: "1px solid rgba(38,50,56,0.18)",
                      borderRadius: 10,
                      padding: "10px 12px",
                      fontWeight: 700,
                      outline: "none",
                    }}
                    disabled={saving || extSaving}
                  />
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 2 }}>
                  <PrimaryButton onClick={submitExternalCandidate} disabled={saving || extSaving || !canSubmitExternal}>
                    {extSaving ? "Saving..." : "Add external candidate"}
                  </PrimaryButton>

                  <SecondaryButton onClick={resetExternalForm} disabled={saving || extSaving}>
                    Clear form
                  </SecondaryButton>
                </div>

                <div style={{ color: "#90A4AE", fontSize: 11, lineHeight: 1.35 }}>
                  Required: Name + Email. Everything else optional.
                </div>
              </div>
            </>
          )}
        </div>

        {/* Settings (applies to internal adds + external adds) */}
        <div style={{ ...panelSurfaceStyle, padding: 12, minWidth: 0 }}>
          <div style={{ fontWeight: 900, color: "#37474F", marginBottom: 10 }}>Snapshot for this add</div>

          <label style={{ display: "block", color: "#607D8B", fontSize: 12, fontWeight: 900, marginBottom: 6 }}>
            Status (Hot / Warm / Hold)
          </label>
          <select
            value={pickerStatus}
            onChange={(e) => setPickerStatus(e.target.value)}
            style={{
              width: "100%",
              border: "1px solid rgba(38,50,56,0.18)",
              borderRadius: 10,
              padding: "10px 12px",
              fontWeight: 800,
              outline: "none",
              background: "white",
              marginBottom: 10,
            }}
            disabled={saving || extSaving}
          >
            <option value="Hot">Hot</option>
            <option value="Warm">Warm</option>
            <option value="Hold">Hold</option>
          </select>

          <label style={{ display: "block", color: "#607D8B", fontSize: 12, fontWeight: 900, marginBottom: 6 }}>
            Fit label (optional)
          </label>
          <input
            value={pickerFit}
            onChange={(e) => setPickerFit(e.target.value)}
            placeholder="e.g., CSM / AM, Support Ops"
            style={{
              width: "100%",
              border: "1px solid rgba(38,50,56,0.18)",
              borderRadius: 10,
              padding: "10px 12px",
              fontWeight: 700,
              outline: "none",
              marginBottom: 10,
            }}
            disabled={saving || extSaving}
          />

          <label style={{ display: "block", color: "#607D8B", fontSize: 12, fontWeight: 900, marginBottom: 6 }}>
            Last role considered (optional)
          </label>
          <input
            value={pickerLastRoleConsidered}
            onChange={(e) => setPickerLastRoleConsidered(e.target.value)}
            placeholder="e.g., CSM - Enterprise, Support Lead, Req #1234"
            style={{
              width: "100%",
              border: "1px solid rgba(38,50,56,0.18)",
              borderRadius: 10,
              padding: "10px 12px",
              fontWeight: 700,
              outline: "none",
              marginBottom: 10,
            }}
            disabled={saving || extSaving}
          />

          <label style={{ display: "block", color: "#607D8B", fontSize: 12, fontWeight: 900, marginBottom: 6 }}>
            Why saved (bullets, one per line)
          </label>
          <textarea
            value={pickerWhy}
            onChange={(e) => setPickerWhy(e.target.value)}
            placeholder={"Example:\nStrong leadership signal\nRelevant domain experience\nClear operational ownership"}
            rows={6}
            style={{
              width: "100%",
              border: "1px solid rgba(38,50,56,0.18)",
              borderRadius: 10,
              padding: "10px 12px",
              fontWeight: 700,
              outline: "none",
              resize: "vertical",
              marginBottom: 10,
            }}
            disabled={saving || extSaving}
          />

          <label style={{ display: "block", color: "#607D8B", fontSize: 12, fontWeight: 900, marginBottom: 6 }}>
            Notes (optional)
          </label>
          <textarea
            value={pickerNotes}
            onChange={(e) => setPickerNotes(e.target.value)}
            placeholder={"Add quick context to apply to all selected candidates.\nYou can refine per candidate later."}
            rows={4}
            style={{
              width: "100%",
              border: "1px solid rgba(38,50,56,0.18)",
              borderRadius: 10,
              padding: "10px 12px",
              fontWeight: 700,
              outline: "none",
              resize: "vertical",
              marginBottom: 12,
            }}
            disabled={saving || extSaving}
          />

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {mode === "internal" ? (
              <>
                <PrimaryButton onClick={onAddSelected} disabled={saving || !pickerSelectedIds.length}>
                  {saving ? "Saving..." : `Add (${pickerSelectedIds.length || 0})`}
                </PrimaryButton>
                <SecondaryButton onClick={onClearSelected} disabled={saving || !pickerSelectedIds.length}>
                  Clear
                </SecondaryButton>
              </>
            ) : (
              <div style={{ color: "#607D8B", fontSize: 12, lineHeight: 1.35 }}>
                These snapshot fields will be applied to the external candidate you add.
              </div>
            )}
          </div>

          <div style={{ color: "#90A4AE", fontSize: 11, lineHeight: 1.35, marginTop: 10 }}>
            Adds are written to <strong>TalentPoolEntry</strong> (DB-first). No localStorage.
          </div>
        </div>
      </div>

      {/* ✅ Responsive two-panel layout (no overlap) */}
      <style jsx>{`
        .ftPickerGrid {
          width: 100%;
          grid-template-columns: minmax(0, 1fr) minmax(320px, 460px);
        }

        @media (max-width: 1100px) {
          .ftPickerGrid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
