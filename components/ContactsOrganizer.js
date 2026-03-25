// components/ContactsOrganizer.js
import React, { useEffect, useMemo, useState } from 'react';

const LS_KEY = 'seekerContactsOrganizerV1';

const GLASS = {
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.22)',
  background: 'rgba(255,255,255,0.58)',
  boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};

const normalizeCats = (cats) =>
  Array.from(new Set((cats || []).map((c) => (c || '').trim()).filter(Boolean)));

function getContactImage(contact) {
  return (
    contact?.avatarUrl ||
    contact?.photo ||
    contact?.profileImage ||
    contact?.image ||
    contact?.avatar ||
    ''
  );
}

function getInitials(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function ContactsOrganizer({
  contacts = [],
  loading = false,
  onViewProfile = () => {},
}) {
  const [categories, setCategories] = useState(['Favorites']);
  const [assignments, setAssignments] = useState({});
  const [openMap, setOpenMap] = useState({});
  const [globalNewCat, setGlobalNewCat] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.categories)) setCategories(normalizeCats(parsed.categories));
        if (parsed.assignments && typeof parsed.assignments === 'object') setAssignments(parsed.assignments);
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    setOpenMap((prev) => {
      const next = { ...prev };
      categories.forEach((c) => {
        if (!(c in next)) next[c] = false;
      });
      Object.keys(next).forEach((k) => {
        if (!categories.includes(k)) delete next[k];
      });
      return next;
    });
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ categories, assignments }));
    } catch (_) {}
  }, [categories, assignments]);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.localeCompare(b)),
    [categories]
  );

  const groups = useMemo(() => {
    const map = { Unassigned: [] };
    sortedCategories.forEach((c) => {
      map[c] = [];
    });

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

  const addCategory = (name) => {
    const n = (name || '').trim();
    if (!n || n === 'Unassigned') return;
    if (categories.includes(n)) return;
    setCategories((prev) => normalizeCats([...prev, n]));
    setOpenMap((prev) => ({ ...prev, [n]: false }));
  };

  const deleteCategory = (name) => {
    if (!name || name === 'Unassigned') return;
    setCategories((prev) => prev.filter((c) => c !== name));
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
      if (!categories.includes(catName)) addCategory(catName);
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
    if (name === 'Unassigned') return;
    setOpenMap((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  if (loading) {
    return (
      <div style={{ ...GLASS, padding: 20 }}>
        <p style={{ margin: 0, color: '#607D8B', fontStyle: 'italic' }}>
          Loading your contacts…
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 20, width: '100%' }}>
      <section
        style={{
          ...GLASS,
          padding: 18,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 800,
                color: '#263238',
              }}
            >
              Manage Categories
            </h2>
            <div
              style={{
                marginTop: 4,
                fontSize: 13,
                color: '#607D8B',
              }}
            >
              Total contacts: <span style={{ fontWeight: 700 }}>{contacts.length}</span>
            </div>
          </div>

          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 10,
              alignItems: 'center',
            }}
          >
            <input
              value={globalNewCat}
              onChange={(e) => setGlobalNewCat(e.target.value)}
              placeholder="New category"
              className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300"
              style={{
                minWidth: 220,
                background: 'rgba(255,255,255,0.9)',
              }}
            />
            <button
              type="button"
              onClick={() => {
                addCategory(globalNewCat);
                setGlobalNewCat('');
              }}
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid rgba(255,112,67,0.28)',
                background: '#FF7043',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 6px 16px rgba(255,112,67,0.22)',
              }}
            >
              Add Category
            </button>
          </div>
        </div>
      </section>

      <section style={{ display: 'grid', gap: 20 }}>
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
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 14,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {collapsible ? (
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={isOpen}
            aria-controls={`cat-panel-${name}`}
            title={isOpen ? 'Collapse' : 'Expand'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              border: 'none',
              background: 'transparent',
              padding: 0,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span style={{ display: 'inline-block', width: 14, color: '#455A64' }}>
              {isOpen ? '▾' : '▸'}
            </span>
            <h3
              style={{
                margin: 0,
                color: '#263238',
                fontSize: 18,
                fontWeight: 800,
              }}
            >
              {name}
            </h3>
          </button>
        ) : (
          <h3
            style={{
              margin: 0,
              color: '#263238',
              fontSize: 18,
              fontWeight: 800,
            }}
          >
            {name}
          </h3>
        )}

        <span
          style={{
            fontSize: 12,
            fontWeight: 800,
            padding: '4px 10px',
            borderRadius: 999,
            background: 'rgba(255,255,255,0.88)',
            color: '#455A64',
            border: '1px solid rgba(0,0,0,0.06)',
          }}
        >
          {contacts.length}
        </span>
      </div>

      {deletable && (
        <button
          type="button"
          onClick={() => onDeleteCategory(name)}
          aria-label={`Delete category ${name}`}
          style={{
            fontSize: 12,
            fontWeight: 700,
            padding: '8px 12px',
            borderRadius: 10,
            border: '1px solid #D7DEE2',
            background: 'rgba(255,255,255,0.88)',
            color: '#455A64',
            cursor: 'pointer',
          }}
        >
          Delete Category
        </button>
      )}
    </div>
  );

  return (
    <div
      style={{
        ...GLASS,
        padding: 18,
      }}
    >
      {Header}

      <div
        id={`cat-panel-${name}`}
        className={collapsible ? (isOpen ? 'block' : 'hidden') : 'block'}
      >
        {contacts.length === 0 ? (
          <div
            style={{
              color: '#607D8B',
              fontStyle: 'italic',
              padding: '6px 2px 2px',
            }}
          >
            No contacts in this category.
          </div>
        ) : (
          <ul style={{ display: 'grid', gap: 12, margin: 0, padding: 0, listStyle: 'none' }}>
            {contacts.map((c) => (
              <ContactCard
                key={c.id}
                contact={c}
                categories={categories}
                currentCategory={name}
                onAssign={onAssign}
                onAddAndAssign={onAddAndAssign}
                onViewProfile={onViewProfile}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ContactCard({
  contact,
  categories,
  currentCategory,
  onAssign,
  onAddAndAssign,
  onViewProfile,
}) {
  const imageSrc = getContactImage(contact);
  const displayName = contact?.name || 'Member';
  const subtitle =
    contact?.status ||
    contact?.headline ||
    contact?.title ||
    contact?.role ||
    'Connection';

  return (
    <li
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr)',
        gap: 14,
        padding: 16,
        borderRadius: 14,
        border: '1px solid rgba(0,0,0,0.08)',
        background: 'rgba(255,255,255,0.82)',
        boxShadow: '0 6px 18px rgba(0,0,0,0.06)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 16,
          alignItems: 'flex-start',
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            minWidth: 0,
            flex: '1 1 320px',
          }}
        >
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={`${displayName} profile`}
              style={{
                width: 56,
                height: 56,
                borderRadius: '999px',
                objectFit: 'cover',
                border: '2px solid #FF7043',
                background: '#EAEFF2',
                flexShrink: 0,
              }}
            />
          ) : (
            <div
              aria-hidden="true"
              style={{
                width: 56,
                height: 56,
                borderRadius: '999px',
                background: 'linear-gradient(135deg, #FF7043, #FF8A65)',
                color: '#fff',
                fontWeight: 800,
                fontSize: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid rgba(255,112,67,0.25)',
                flexShrink: 0,
              }}
            >
              {getInitials(displayName)}
            </div>
          )}

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontWeight: 800,
                fontSize: 16,
                color: '#263238',
                lineHeight: 1.25,
              }}
            >
              {displayName}
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: 13,
                color: '#607D8B',
                lineHeight: 1.4,
              }}
            >
              {subtitle}
            </div>
          </div>
        </div>

        <button
          onClick={() => onViewProfile(contact)}
          aria-label={`View profile for ${displayName}`}
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            border: 'none',
            background: '#FF7043',
            color: '#fff',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 6px 16px rgba(255,112,67,0.22)',
            flex: '0 0 auto',
          }}
        >
          View Profile
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <select
          value={currentCategory === 'Unassigned' ? 'Unassigned' : currentCategory}
          onChange={(e) => onAssign(contact.id, e.target.value)}
          style={{
            minWidth: 180,
            padding: '9px 10px',
            borderRadius: 10,
            border: '1px solid #D7DEE2',
            background: 'rgba(255,255,255,0.95)',
            fontSize: 13,
            color: '#263238',
          }}
        >
          <option value="Unassigned">Unassigned</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <AddAndAssignInline onAdd={(newName) => onAddAndAssign(contact.id, newName)} />
      </div>
    </li>
  );
}

function AddAndAssignInline({ onAdd }) {
  const [val, setVal] = useState('');

  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        alignItems: 'center',
        flexWrap: 'wrap',
      }}
    >
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="New category"
        style={{
          minWidth: 170,
          padding: '9px 10px',
          borderRadius: 10,
          border: '1px solid #D7DEE2',
          background: 'rgba(255,255,255,0.95)',
          fontSize: 13,
        }}
      />
      <button
        type="button"
        onClick={() => {
          onAdd(val);
          setVal('');
        }}
        style={{
          padding: '9px 12px',
          borderRadius: 10,
          border: '1px solid #D7DEE2',
          background: 'rgba(255,255,255,0.9)',
          color: '#455A64',
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        Add & Assign
      </button>
    </div>
  );
}