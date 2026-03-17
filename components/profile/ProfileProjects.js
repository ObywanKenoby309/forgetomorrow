// components/profile/ProfileProjects.js
import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';

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

function normalizeProject(project, index) {
  if (!project) return null;

  if (typeof project === 'string') {
    return {
      id: `project-${index}`,
      name: project,
      organization: '',
      notes: '',
      startYear: '',
      endYear: '',
      url: '',
    };
  }

  if (typeof project === 'object') {
    return {
      id: project.id || `project-${index}`,
      name: String(project.name || project.title || '').trim(),
      organization: String(project.organization || project.company || '').trim(),
      notes: String(project.notes || project.description || project.summary || '').trim(),
      startYear: String(project.startYear || '').trim(),
      endYear: String(project.endYear || '').trim(),
      url: String(project.url || project.link || '').trim(),
    };
  }

  return null;
}

const ProfileProjects = forwardRef(function ProfileProjects({
  projects = [],
  setProjects,
  editMode = false,
}, ref) {
  const empty = {
    name: '',
    organization: '',
    notes: '',
    startYear: '',
    endYear: '',
    url: '',
  };

  const [draft, setDraft] = useState(empty);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingDraft, setEditingDraft] = useState(empty);
  const prevEditModeRef = useRef(editMode);

  const normalizedProjects = useMemo(() => {
    if (!Array.isArray(projects)) return [];
    return projects
      .map((project, index) => normalizeProject(project, index))
      .filter(
        (project) =>
          project &&
          (project.name ||
            project.organization ||
            project.notes ||
            project.startYear ||
            project.endYear ||
            project.url)
      );
  }, [projects]);

      const canEdit = editMode && typeof setProjects === 'function';

  useImperativeHandle(ref, () => ({
    commitPending() {
      if (typeof setProjects !== 'function') return;

      if (editingIndex !== null && editingDraft.name.trim()) {
        const updatedEntry = {
          ...(normalizedProjects[editingIndex] || {}),
          name: editingDraft.name.trim(),
          organization: editingDraft.organization.trim(),
          notes: editingDraft.notes.trim(),
          startYear: editingDraft.startYear.trim(),
          endYear: editingDraft.endYear.trim(),
          url: editingDraft.url.trim(),
        };

        setProjects((prev) =>
          Array.isArray(prev)
            ? prev.map((project, index) =>
                index === editingIndex ? updatedEntry : project
              )
            : []
        );

        setEditingIndex(null);
        setEditingDraft(empty);
        return;
      }

      if (draft.name.trim()) {
        const entry = {
          id: `${Date.now()}`,
          name: draft.name.trim(),
          organization: draft.organization.trim(),
          notes: draft.notes.trim(),
          startYear: draft.startYear.trim(),
          endYear: draft.endYear.trim(),
          url: draft.url.trim(),
        };

        setProjects((prev) => [...(Array.isArray(prev) ? prev : []), entry]);
        setDraft(empty);
      }
    },
  }), [draft, editingDraft, editingIndex, normalizedProjects, setProjects]);

  useEffect(() => {
    const wasEditing = prevEditModeRef.current;

    if (wasEditing && !editMode && typeof setProjects === 'function') {
      if (editingIndex !== null && editingDraft.name.trim()) {
        const updatedEntry = {
          ...(normalizedProjects[editingIndex] || {}),
          name: editingDraft.name.trim(),
          organization: editingDraft.organization.trim(),
          notes: editingDraft.notes.trim(),
          startYear: editingDraft.startYear.trim(),
          endYear: editingDraft.endYear.trim(),
          url: editingDraft.url.trim(),
        };

        setProjects((prev) =>
          Array.isArray(prev)
            ? prev.map((project, index) =>
                index === editingIndex ? updatedEntry : project
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
          url: draft.url.trim(),
        };

        setProjects((prev) => [...(Array.isArray(prev) ? prev : []), entry]);
        setDraft(empty);
      }
    }

    prevEditModeRef.current = editMode;
  }, [editMode, editingIndex, editingDraft, draft, normalizedProjects, setProjects]);

  const addProject = () => {
    const name = draft.name.trim();
    if (!canEdit || !name) return;

    const entry = {
      id: `${Date.now()}`,
      name,
      organization: draft.organization.trim(),
      notes: draft.notes.trim(),
      startYear: draft.startYear.trim(),
      endYear: draft.endYear.trim(),
      url: draft.url.trim(),
    };

    setProjects((prev) => [...(Array.isArray(prev) ? prev : []), entry]);
    setDraft(empty);
  };

  const removeProjectAtIndex = (indexToRemove) => {
    if (!canEdit) return;
    setProjects((prev) =>
      Array.isArray(prev) ? prev.filter((_, index) => index !== indexToRemove) : []
    );

    if (editingIndex === indexToRemove) {
      setEditingIndex(null);
      setEditingDraft(empty);
    }
  };

  const beginEditProject = (project, index) => {
    if (!canEdit) return;
    setEditingIndex(index);
    setEditingDraft({
      name: project.name || '',
      organization: project.organization || '',
      notes: project.notes || '',
      startYear: project.startYear || '',
      endYear: project.endYear || '',
      url: project.url || '',
    });
  };

  const cancelEditProject = () => {
    setEditingIndex(null);
    setEditingDraft(empty);
  };

  const saveEditProject = (indexToSave) => {
    if (!canEdit) return;

    const name = editingDraft.name.trim();
    if (!name) return;

    const updatedEntry = {
      ...(normalizedProjects[indexToSave] || {}),
      name,
      organization: editingDraft.organization.trim(),
      notes: editingDraft.notes.trim(),
      startYear: editingDraft.startYear.trim(),
      endYear: editingDraft.endYear.trim(),
      url: editingDraft.url.trim(),
    };

    setProjects((prev) =>
      Array.isArray(prev)
        ? prev.map((project, index) =>
            index === indexToSave ? updatedEntry : project
          )
        : []
    );

    setEditingIndex(null);
    setEditingDraft(empty);
  };

  if (!canEdit) {
    if (normalizedProjects.length === 0) {
      return (
        <div
          style={{
            fontSize: 13,
            color: 'rgba(248,244,239,0.35)',
            fontStyle: 'italic',
          }}
        >
          No projects added yet.
        </div>
      );
    }

    return (
      <div style={{ display: 'grid', gap: 10 }}>
        {normalizedProjects.map((project) => {
          const years = [project.startYear, project.endYear].filter(Boolean).join(' – ');

          return (
            <div
              key={project.id}
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
                {project.name || 'Project'}
              </div>

              {(project.organization || years) && (
                <div
                  style={{
                    fontSize: 12,
                    color: 'rgba(248,244,239,0.68)',
                    marginTop: 4,
                    fontWeight: 500,
                  }}
                >
                  {[project.organization, years].filter(Boolean).join(' • ')}
                </div>
              )}

              {project.notes && (
                <div
                  style={{
                    fontSize: 12,
                    color: 'rgba(248,244,239,0.65)',
                    lineHeight: 1.6,
                    marginTop: 6,
                    whiteSpace: 'pre-line',
                  }}
                >
                  {project.notes}
                </div>
              )}

              {project.url && (
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    marginTop: 8,
                    fontSize: 12,
                    color: ORANGE,
                    fontWeight: 700,
                    textDecoration: 'none',
                    wordBreak: 'break-word',
                  }}
                >
                  {project.url}
                </a>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <section style={{ display: 'grid', gap: 12 }}>
      {normalizedProjects.length > 0 && (
        <div style={{ display: 'grid', gap: 10 }}>
          {normalizedProjects.map((project, index) => {
            const years = [project.startYear, project.endYear].filter(Boolean).join(' – ');
            const isEditing = editingIndex === index;

            return (
              <div
                key={project.id}
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
                          placeholder="Project name"
                          style={inputStyle}
                        />
                      </div>

                      <div style={{ display: 'grid', gap: 6 }}>
                        <label style={labelStyle}>Organization</label>
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

                    <div style={{ display: 'grid', gap: 6 }}>
                      <label style={labelStyle}>URL</label>
                      <input
                        value={editingDraft.url}
                        onChange={(e) =>
                          setEditingDraft((prev) => ({ ...prev, url: e.target.value }))
                        }
                        placeholder="https://..."
                        style={inputStyle}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => saveEditProject(index)}
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
                        onClick={cancelEditProject}
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
                        onClick={() => removeProjectAtIndex(index)}
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
                        {project.name}
                      </div>

                      {(project.organization || years) && (
                        <div
                          style={{
                            fontSize: 13,
                            color: 'rgba(255,255,255,0.65)',
                            marginTop: 3,
                          }}
                        >
                          {[project.organization, years].filter(Boolean).join(' • ')}
                        </div>
                      )}

                      {project.notes && (
                        <div
                          style={{
                            fontSize: 12,
                            color: 'rgba(255,255,255,0.45)',
                            marginTop: 4,
                            whiteSpace: 'pre-line',
                            lineHeight: 1.55,
                          }}
                        >
                          {project.notes}
                        </div>
                      )}

                      {project.url && (
                        <a
                          href={project.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-block',
                            marginTop: 6,
                            fontSize: 12,
                            color: ORANGE,
                            fontWeight: 700,
                            textDecoration: 'none',
                            wordBreak: 'break-word',
                          }}
                        >
                          {project.url}
                        </a>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => beginEditProject(project, index)}
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
                        onClick={() => removeProjectAtIndex(index)}
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
              placeholder="Project name"
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'grid', gap: 6 }}>
            <label style={labelStyle}>Organization</label>
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

        <div style={{ display: 'grid', gap: 6 }}>
          <label style={labelStyle}>URL</label>
          <input
            value={draft.url}
            onChange={(e) => setDraft((prev) => ({ ...prev, url: e.target.value }))}
            placeholder="https://..."
            style={inputStyle}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <button
            type="button"
            onClick={addProject}
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
            + Add Project
          </button>
        </div>
      </div>
    </section>
  );
});

export default ProfileProjects;