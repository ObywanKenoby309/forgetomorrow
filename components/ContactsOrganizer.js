// components/ContactsOrganizer.js
import React, { useEffect, useMemo, useState } from 'react';

// LocalStorage key (scoped to seeker contacts organizer)
const LS_KEY = 'seekerContactsOrganizerV1';

// Helper: normalize category list (no dupes, trim)
const normalizeCats = (cats) =>
  Array.from(new Set((cats || []).map((c) => (c || '').trim()).filter(Boolean)));

export default function ContactsOrganizer({ contacts = [], onViewProfile = () => {} }) {
  // Categories (exclude the implicit "Unassigned")
  const [categories, setCategories] = useState(['Favorites']);
  // Single-category assignment: { [contactId]: 'CategoryName' }
  const [assignments, setAssignments] = useState({});
  // Collapsible state for custom categories only (Unassigned is always open)
  const [openMap, setOpenMap] = useState({}); // { [category]: boolean }
  // UI
  const [globalNewCat, setGlobalNewCat] = useState('');

  // Load persisted cats + assignments
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.categories)) setCategories(normalizeCats(parsed.categories));
        if (parsed.assignments && typeof parsed.assignments === 'object') setAssignments(parsed.assignments);
      }
    } catch (_) { /* ignore */ }
  }, []);

  // Ensure openMap has an entry for each category (default collapsed for custom)
  useEffect(() => {
    setOpenMap((prev) => {
      const next = { ...prev };
      categories.forEach((c) => {
        if (!(c in next)) next[c] = false;
      });
      // remove stale keys
      Object.keys(next).forEach((k) => {
        if (!categories.includes(k)) delete next[k];
      });
      return next;
    });
  }, [categories]);

  // Persist on change (cats + assignments only)
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ categories, assignments }));
    } catch (_) { /* ignore */ }
  }, [categories, assignments]);

  // Derived
  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.localeCompare(b)),
    [categories]
  );

  const groups = useMemo(() => {
    const map = { Unassigned: [] };
    sortedCategories.forEach((c) => { map[c] = []; });
    contacts.forEach((c) => {
      const cat = assignments[c.id];
      if (cat && sortedCategories.includes(cat)) {
        map[cat].push(c);
      } else {
        map.Unassigned.push(c);
      }
    });
    return map;
  }, [contacts, assignments, sortedCategories]);

  // Handlers
  const addCategory = (name) => {
    const n = (name || '').trim();
    if (!n || n === 'Unassigned') return;
    if (categories.includes(n)) return;
    setCategories((prev) => normalizeCats([...prev, n]));
    setOpenMap((prev) => ({ ...prev, [n]: false })); // new custom cat starts collapsed
  };

  const deleteCategory = (name) => {
    if (!name || name === 'Unassigned') return;
    setCategories((prev) => prev.filter((c) => c !== name));
    // move all contacts in this category back to Unassigned (clear assignment)
    setAssignments((prev) => {
      const next = { ...prev };
      for (const [cid, cat] of Object.entries(prev)) {
        if (cat === name) next[cid] = null;
      }
      return next;
    });
    setOpenMap((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const assignContact = (contactId, catName) => {
    if (catName === 'Unassigned') {
      setAssignments((prev) => ({ ...prev, [contactId]: null }));
    } else {
      if (!categories.includes(catName)) addCategory(catName); // guard (should exist already)
      setAssignments((prev) => ({ ...prev, [contactId]: catName }));
    }
  };

  const addAndAssignFromCard = (contactId, name) => {
    const n = (name || '').trim();
    if (!n || n === 'Unassigned') return;
    if (!categories.includes(n)) {
      setCategories((prev) => normalizeCats([...prev, n]));
      setOpenMap((prev) => ({ ...prev, [n]: false }));
    }
    setAssignments((prev) => ({ ...prev, [contactId]: n }));
  };

  const toggleCategory = (name) => {
    if (name === 'Unassigned') return; // Unassigned stays open
    setOpenMap((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <section
        style={{
          background: 'white',
          borderRadius: 12,
          padding: 16,
          border: '1px solid #eee',
          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        }}
      >
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900 m-0">Manage Categories</h2>

          <div className="flex items-center gap-2">
            <input
              value={globalNewCat}
              onChange={(e) => setGlobalNewCat(e.target.value)}
              placeholder="New category"
              className="min-w-[200px] border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
            <button
              type="button"
              className="px-3 py-2 rounded border border-gray-300 hover:bg-gray-50"
              onClick={() => {
                addCategory(globalNewCat);
                setGlobalNewCat('');
              }}
            >
              Add
            </button>
          </div>

          <div className="ml-auto text-sm text-gray-600">
            Total contacts: <span className="font-semibold">{contacts.length}</span>
          </div>
        </div>
      </section>

      {/* Groups */}
      <section className="space-y-8">
        {/* Unassigned always first and always open (not collapsible) */}
        <CategoryBlock
          name="Unassigned"
          contacts={groups.Unassigned}
          categories={sortedCategories}
          onAssign={assignContact}
          onAddAndAssign={addAndAssignFromCard}
          onViewProfile={onViewProfile}
          deletable={false}
          onDeleteCategory={deleteCategory}
          collapsible={false}
          isOpen
          onToggle={() => {}}
        />

        {/* Then alphabetical categories (collapsible) */}
        {sortedCategories.map((cat) => (
          <CategoryBlock
            key={cat}
            name={cat}
            contacts={groups[cat]}
            categories={sortedCategories}
            onAssign={assignContact}
            onAddAndAssign={addAndAssignFromCard}
            onViewProfile={onViewProfile}
            deletable
            onDeleteCategory={deleteCategory}
            collapsible
            isOpen={!!openMap[cat]}
            onToggle={() => toggleCategory(cat)}
          />
        ))}
      </section>
    </div>
  );
}

function CategoryBlock({
  name,
  contacts,
  categories,
  onAssign,
  onAddAndAssign,
  onViewProfile,
  deletable,
  onDeleteCategory,
  collapsible,
  isOpen,
  onToggle,
}) {
  const Header = (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-3">
        {collapsible ? (
          <button
            type="button"
            className="text-left flex items-center gap-2"
            onClick={onToggle}
            aria-expanded={isOpen}
            aria-controls={`cat-panel-${name}`}
            title={isOpen ? 'Collapse' : 'Expand'}
          >
            <span className="inline-block w-4 select-none">
              {isOpen ? '▾' : '▸'}
            </span>
            <h3 className="text-gray-900 font-semibold m-0">{name}</h3>
          </button>
        ) : (
          <h3 className="text-gray-900 font-semibold m-0">{name}</h3>
        )}
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
          {contacts.length}
        </span>
      </div>

      {deletable && (
        <button
          type="button"
          className="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-50"
          onClick={() => onDeleteCategory(name)}
          aria-label={`Delete category ${name}`}
        >
          Delete Category
        </button>
      )}
    </div>
  );

  return (
    <div
      style={{
        background: 'white',
        borderRadius: 12,
        padding: 16,
        border: '1px solid #eee',
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
      }}
    >
      {Header}

      <div id={`cat-panel-${name}`} className={collapsible ? (isOpen ? 'block' : 'hidden') : 'block'}>
        {contacts.length === 0 ? (
          <div className="text-gray-500 italic">No contacts in this category.</div>
        ) : (
          <ul className="space-y-3">
            {contacts.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between p-3 rounded border border-gray-200"
                style={{ background: 'white' }}
              >
                <div className="flex items-center gap-4">
                  <img
                    src={c.photo}
                    alt={`${c.name} Photo`}
                    className="w-12 h-12 rounded-full border-2"
                    style={{ borderColor: '#FF7043' }}
                  />
                  <div>
                    <div className="font-semibold text-gray-900">{c.name}</div>
                    <div className="text-sm text-gray-600">{c.status}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* View profile */}
                  <button
                    className="text-sm bg-[#FF7043] text-white px-3 py-1 rounded hover:bg-[#F4511E] transition"
                    onClick={() => onViewProfile(c)}
                    aria-label={`View profile for ${c.name}`}
                  >
                    View Profile
                  </button>

                  {/* Assign to existing */}
                  <select
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                    value={name === 'Unassigned' ? 'Unassigned' : name}
                    onChange={(e) => onAssign(c.id, e.target.value)}
                  >
                    <option value="Unassigned">Unassigned</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>

                  {/* Add new + assign (inline) */}
                  <AddAndAssignInline onAdd={(newName) => onAddAndAssign(c.id, newName)} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function AddAndAssignInline({ onAdd }) {
  const [val, setVal] = useState('');
  return (
    <div className="flex items-center gap-2">
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="New category"
        className="text-sm border border-gray-300 rounded px-2 py-1 min-w-[150px]"
      />
      <button
        type="button"
        className="text-sm px-2 py-1 border border-gray-300 rounded hover:bg-gray-50"
        onClick={() => {
          onAdd(val);
          setVal('');
        }}
      >
        Add & Assign
      </button>
    </div>
  );
}
