import React, { useEffect, useMemo, useRef, useState } from 'react';

const ORANGE = '#FF7043';

const inputStyle = {
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.16)',
  borderRadius: 10,
  padding: '8px 10px',
  outline: 'none',
  color: '#F8F4EF',
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};

const labelStyle = {
  fontSize: 12,
  fontWeight: 800,
  color: 'rgba(255,255,255,0.70)',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
};

function normalizeCustomEntry(entry, index) {
  if (!entry) return null;

  if (typeof entry === 'string') {
    return {
      id: `custom-${index}`,
      name: entry,
      organization: '',
      notes: '',
      startYear: '',
      endYear: '',
    };
  }

  if (typeof entry === 'object') {
    return {
      id: entry.id || `custom-${index}`,
      name: String(entry.name || entry.title || '').trim(),
      organization: String(entry.organization || entry.company || '').trim(),
      notes: String(entry.notes || entry.description || entry.summary || '').trim(),
      startYear: String(entry.startYear || '').trim(),
      endYear: String(entry.endYear || '').trim(),
    };
  }

  return null;
}

export default function ProfileCustomSection({
  value,
  setValue,
  editMode = false,
}) {
  const empty = {
    name: '',
    organization: '',
    notes: '',
    startYear: '',
    endYear: '',
  };

  const [draft, setDraft] = useState(empty);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingDraft, setEditingDraft] = useState(empty);
  const prevEditModeRef = useRef(editMode);

  const normalizedEntries = useMemo(() => {
    const source = Array.isArray(value)
      ? value
      : value && typeof value === 'object' && (value.name || value.organization || value.notes || value.startYear || value.endYear)
        ? [value]
        : [];

    return source
      .map((entry, index) => normalizeCustomEntry(entry, index))
      .filter(
        (entry) =>
          entry &&
          (entry.name ||
            entry.organization ||
            entry.notes ||
            entry.startYear ||
            entry.endYear)
      );
  }, [value]);

    const canEdit = editMode && typeof setValue === 'function';

  useEffect(() => {
    const wasEditing = prevEditModeRef.current;

    if (wasEditing && !editMode && typeof setValue === 'function') {
      if (editingIndex !== null && editingDraft.name.trim()) {
        const updatedEntry = {
          ...(normalizedEntries[editingIndex] || {}),
          name: editingDraft.name.trim(),
          organization: editingDraft.organization.trim(),
          notes: editingDraft.notes.trim(),
          startYear: editingDraft.startYear.trim(),
          endYear: editingDraft.endYear.trim(),
        };

        setValue((prev) =>
          Array.isArray(prev)
            ? prev.map((entry, index) =>
                index === editingIndex ? updatedEntry : entry
              )
            : []
        );

        setEditingIndex(null);
        setEditingDraft(empty);
      } else if (draft.name.trim()) {
        const entry = {
          id: `${Date.now()}`,
          name: draft.name.trim(),
          organization: draft.organization.trim(),
          notes: draft.notes.trim(),
          startYear: draft.startYear.trim(),
          endYear: draft.endYear.trim(),
        };

        setValue((prev) => [...(Array.isArray(prev) ? prev : []), entry]);
        setDraft(empty);
      }
    }

    prevEditModeRef.current = editMode;
  }, [editMode, editingIndex, editingDraft, draft, normalizedEntries, setValue]);

  const addEntry = () => {
    const name = draft.name.trim();
    if (!canEdit || !name) return;

    const entry = {
      id: `${Date.now()}`,
      name,
      organization: draft.organization.trim(),
      notes: draft.notes.trim(),
      startYear: draft.startYear.trim(),
      endYear: draft.endYear.trim(),
    };

    setValue((prev) => [...(Array.isArray(prev) ? prev : []), entry]);
    setDraft(empty);
  };

  const removeEntryAtIndex = (indexToRemove) => {
    if (!canEdit) return;

    setValue((prev) =>
      Array.isArray(prev) ? prev.filter((_, index) => index !== indexToRemove) : []
    );

    if (editingIndex === indexToRemove) {
      setEditingIndex(null);
      setEditingDraft(empty);
    }
  };

  const beginEditEntry = (entry, index) => {
    if (!canEdit) return;

    setEditingIndex(index);
    setEditingDraft({
      name: entry.name || '',
      organization: entry.organization || '',
      notes: entry.notes || '',
      startYear: entry.startYear || '',
      endYear: entry.endYear || '',
    });
  };

  const cancelEditEntry = () => {
    setEditingIndex(null);
    setEditingDraft(empty);
  };

  const saveEditEntry = (indexToSave) => {
    if (!canEdit) return;

    const name = editingDraft.name.trim();
    if (!name) return;

    const updatedEntry = {
      ...(normalizedEntries[indexToSave] || {}),
      name,
      organization: editingDraft.organization.trim(),
      notes: editingDraft.notes.trim(),
      startYear: editingDraft.startYear.trim(),
      endYear: editingDraft.endYear.trim(),
    };

    setValue((prev) =>
      Array.isArray(prev)
        ? prev.map((entry, index) => (index === indexToSave ? updatedEntry : entry))
        : []
    );

    setEditingIndex(null);
    setEditingDraft(empty);
  };

  if (!canEdit) {
    if (normalizedEntries.length === 0) {
      return (
        <div
          style={{
            fontSize: 13,
            color: 'rgba(248,244,239,0.35)',
            fontStyle: 'italic',
            lineHeight: 1.6,
          }}
        >
          No custom section content added yet.
        </div>
      );
    }

    return (
      <div style={{ display: 'grid', gap: 10 }}>
        {normalizedEntries.map((entry) => {
          const years = [entry.startYear, entry.endYear].filter(Boolean).join(' – ');

          return (
            <div
              key={entry.id}
              style={{
                position: 'relative',
                padding: '16px 14px 16px 18px',
                borderRadius: 14,
                background: 'rgba(13,27,42,0.66)',
                border: '1px solid rgba(255,255,255,0.10)',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 14,
                  bottom: 14,
                  width: 3,
                  background: 'linear-gradient(to bottom, #FF7043, #FF5722)',
                  borderRadius: '0 2px 2px 0',
                }}
              />
              <div
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#F8F4EF',
                }}
              >
                {entry.name || 'Custom'}
              </div>

              {(entry.organization || years) && (
                <div
                  style={{
                    fontSize: 12,
                    color: 'rgba(248,244,239,0.68)',
                    marginTop: 4,
                    fontWeight: 500,
                  }}
                >
                  {[entry.organization, years].filter(Boolean).join(' • ')}
                </div>
              )}

              {entry.notes && (
                <div
                  style={{
                    fontSize: 12,
                    color: 'rgba(248,244,239,0.65)',
                    lineHeight: 1.6,
                    marginTop: 6,
                    whiteSpace: 'pre-line',
                  }}
                >
                  {entry.notes}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <section style={{ display: 'grid', gap: 12 }}>
      {normalizedEntries.length > 0 && (
        <div style={{ display: 'grid', gap: 10 }}>
          {normalizedEntries.map((entry, index) => {
            const years = [entry.startYear, entry.endYear].filter(Boolean).join(' – ');
            const isEditing = editingIndex === index;

            return (
              <div
                key={entry.id}
                style={{
                  border: '1px solid rgba(255,255,255,0.10)',
                  borderRadius: 12,
                  padding: 12,
                  background: 'rgba(255,255,255,0.04)',
                  display: 'grid',
                  gap: 10,
                }}
              >
                {isEditing ? (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div style={{ display: 'grid', gap: 6 }}>
                        <label style={labelStyle}>Name</label>
                        <input
                          value={editingDraft.name}
                          onChange={(e) =>
                            setEditingDraft((prev) => ({ ...prev, name: e.target.value }))
                          }
                          placeholder="Name"
                          style={inputStyle}
                        />
                      </div>

                      <div style={{ display: 'grid', gap: 6 }}>
                        <label style={labelStyle}>Group/Org/Company</label>
                        <input
                          value={editingDraft.organization}
                          onChange={(e) =>
                            setEditingDraft((prev) => ({
                              ...prev,
                              organization: e.target.value,
                            }))
                          }
                          placeholder="Group/Org/Company"
                          style={inputStyle}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 10 }}>
                      <div style={{ display: 'grid', gap: 6 }}>
                        <label style={labelStyle}>Notes</label>
                        <textarea
                          value={editingDraft.notes}
                          onChange={(e) =>
                            setEditingDraft((prev) => ({ ...prev, notes: e.target.value }))
                          }
                          placeholder="Notes"
                          style={{
                            ...inputStyle,
                            minHeight: 56,
                            resize: 'vertical',
                          }}
                        />
                      </div>

                      <div style={{ display: 'grid', gap: 6 }}>
                        <label style={labelStyle}>Years</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          <input
                            value={editingDraft.startYear}
                            onChange={(e) =>
                              setEditingDraft((prev) => ({
                                ...prev,
                                startYear: e.target.value,
                              }))
                            }
                            placeholder="2018"
                            style={inputStyle}
                          />
                          <input
                            value={editingDraft.endYear}
                            onChange={(e) =>
                              setEditingDraft((prev) => ({
                                ...prev,
                                endYear: e.target.value,
                              }))
                            }
                            placeholder="2022"
                            style={inputStyle}
                          />
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => saveEditEntry(index)}
                        style={{
                          border: `1px solid ${ORANGE}`,
                          color: ORANGE,
                          background: 'transparent',
                          borderRadius: 999,
                          padding: '6px 12px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          fontFamily: 'inherit',
                        }}
                      >
                        Save
                      </button>

                      <button
                        type="button"
                        onClick={cancelEditEntry}
                        style={{
                          border: '1px solid rgba(255,255,255,0.20)',
                          color: 'rgba(255,255,255,0.70)',
                          background: 'transparent',
                          borderRadius: 999,
                          padding: '6px 12px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          fontFamily: 'inherit',
                        }}
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={() => removeEntryAtIndex(index)}
                        style={{
                          border: '1px solid #C62828',
                          color: '#EF9A9A',
                          background: 'transparent',
                          borderRadius: 999,
                          padding: '6px 12px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          fontFamily: 'inherit',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 900,
                          color: '#F8F4EF',
                          fontSize: 14,
                        }}
                      >
                        {entry.name}
                      </div>

                      {(entry.organization || years) && (
                        <div
                          style={{
                            fontSize: 13,
                            color: 'rgba(255,255,255,0.65)',
                            marginTop: 3,
                          }}
                        >
                          {[entry.organization, years].filter(Boolean).join(' • ')}
                        </div>
                      )}

                      {entry.notes && (
                        <div
                          style={{
                            fontSize: 12,
                            color: 'rgba(255,255,255,0.45)',
                            marginTop: 4,
                            whiteSpace: 'pre-line',
                            lineHeight: 1.55,
                          }}
                        >
                          {entry.notes}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => beginEditEntry(entry, index)}
                        style={{
                          border: `1px solid ${ORANGE}`,
                          color: ORANGE,
                          background: 'transparent',
                          borderRadius: 999,
                          padding: '6px 10px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          height: 'fit-content',
                          whiteSpace: 'nowrap',
                          fontFamily: 'inherit',
                        }}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => removeEntryAtIndex(index)}
                        style={{
                          border: '1px solid #C62828',
                          color: '#EF9A9A',
                          background: 'transparent',
                          borderRadius: 999,
                          padding: '6px 10px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          height: 'fit-content',
                          whiteSpace: 'nowrap',
                          fontFamily: 'inherit',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display: 'grid', gap: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ display: 'grid', gap: 6 }}>
            <label style={labelStyle}>Name</label>
            <input
              value={draft.name}
              onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Name"
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'grid', gap: 6 }}>
            <label style={labelStyle}>Group/Org/Company</label>
            <input
              value={draft.organization}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, organization: e.target.value }))
              }
              placeholder="Group/Org/Company"
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 10 }}>
          <div style={{ display: 'grid', gap: 6 }}>
            <label style={labelStyle}>Notes</label>
            <textarea
              value={draft.notes}
              onChange={(e) => setDraft((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Notes"
              style={{
                ...inputStyle,
                minHeight: 56,
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ display: 'grid', gap: 6 }}>
            <label style={labelStyle}>Years</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input
                value={draft.startYear}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, startYear: e.target.value }))
                }
                placeholder="2018"
                style={inputStyle}
              />
              <input
                value={draft.endYear}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, endYear: e.target.value }))
                }
                placeholder="2022"
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <button
            type="button"
            onClick={addEntry}
            style={{
              background: 'transparent',
              color: ORANGE,
              border: `1px solid ${ORANGE}`,
              borderRadius: 999,
              padding: '8px 14px',
              fontWeight: 800,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            + Add Custom Entry
          </button>
        </div>
      </div>
    </section>
  );
}