// components/ContactsOrganizer.js
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';

const GLASS = {
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.22)',
  background: 'rgba(255,255,255,0.58)',
  boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};

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
  chrome = 'seeker',
  contacts = [],
  loading = false,
  categories = [],
  assignments = [],
  onViewProfile = () => {},
}) {
  const router = useRouter();
  const chromeFromRoute = router.query?.chrome;
  const effectiveChrome = chromeFromRoute || chrome;
  const [openMap, setOpenMap] = useState({});
  const [globalNewCat, setGlobalNewCat] = useState('');
  const [localCategories, setLocalCategories] = useState([]);
  const [localAssignments, setLocalAssignments] = useState([]);

  useEffect(() => {
  const incoming = Array.isArray(categories) ? categories : [];

  // 🔒 TEMP SAFETY FLAG
  const ENABLE_SYSTEM_CATEGORIES = true;

  if (!ENABLE_SYSTEM_CATEGORIES) {
    setLocalCategories(incoming);
    return;
  }

  const baseSystemCategories = [{ id: 'sys-personal', name: 'Personal', isSystem: true }];

  const recruiterSystemCategories =
    effectiveChrome === 'recruiter-smb' || effectiveChrome === 'recruiter-ent'
      ? [{ id: 'sys-candidates', name: 'Candidates', isSystem: true }]
      : [];

  const coachSystemCategories =
    effectiveChrome === 'coach'
      ? [{ id: 'sys-clients', name: 'Clients', isSystem: true }]
      : [];

  const systemCategories = [
    ...baseSystemCategories,
    ...recruiterSystemCategories,
    ...coachSystemCategories,
  ];

  const merged = [...systemCategories];

  incoming.forEach((cat) => {
    const exists = merged.some(
      (c) => String(c.name || '').toLowerCase() === String(cat.name || '').toLowerCase()
    );
    if (!exists) merged.push(cat);
  });

  setLocalCategories(merged);
}, [categories, effectiveChrome]);

  useEffect(() => {
    setLocalAssignments(Array.isArray(assignments) ? assignments : []);
  }, [assignments]);

  const sortedCategories = useMemo(() => {
    return [...localCategories].sort((a, b) =>
      String(a?.name || '').localeCompare(String(b?.name || ''))
    );
  }, [localCategories]);

  const categoryIdToName = useMemo(() => {
    const map = new Map();
    sortedCategories.forEach((cat) => {
      if (cat?.id) map.set(cat.id, cat.name);
    });
    return map;
  }, [sortedCategories]);

  const contactIdToCategoryId = useMemo(() => {
    const map = new Map();
    localAssignments.forEach((row) => {
      if (row?.contactId) {
        map.set(row.contactId, row.categoryId || null);
      }
    });
    return map;
  }, [localAssignments]);

  useEffect(() => {
    setOpenMap((prev) => {
      const next = { ...prev };
      sortedCategories.forEach((cat) => {
        const name = cat?.name;
        if (name && !(name in next)) next[name] = false;
      });
      Object.keys(next).forEach((k) => {
        if (!sortedCategories.some((cat) => cat?.name === k)) delete next[k];
      });
      return next;
    });
  }, [sortedCategories]);

  const groups = useMemo(() => {
    const map = { Unassigned: [] };

    sortedCategories.forEach((cat) => {
      if (cat?.name) map[cat.name] = [];
    });

    contacts.forEach((contact) => {
      const categoryId = contactIdToCategoryId.get(contact.id) || null;
      const categoryName = categoryId ? categoryIdToName.get(categoryId) : null;

      if (categoryName && map[categoryName]) {
        map[categoryName].push(contact);
      } else {
        map.Unassigned.push(contact);
      }
    });

    return map;
  }, [contacts, sortedCategories, contactIdToCategoryId, categoryIdToName]);

  const addCategory = async (name) => {
    const trimmed = String(name || '').trim();
	const lockedNames = ['unassigned', 'personal', 'candidates', 'clients'];
	if (!trimmed || lockedNames.includes(trimmed.toLowerCase())) return;

    try {
      const res = await fetch('/api/contacts/category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to create category');

      setLocalCategories((prev) => {
        const exists = prev.some(
          (c) =>
            c.id === data.category.id ||
            String(c.name || '').toLowerCase() === String(data.category.name || '').toLowerCase()
        );
        if (exists) return prev;
        return [...prev, data.category];
      });

      setOpenMap((prev) => ({ ...prev, [trimmed]: false }));
    } catch (err) {
      console.error('addCategory failed:', err);
    }
  };

  const deleteCategory = async (name) => {
    const trimmed = String(name || '').trim();
    if (!trimmed || trimmed === 'Unassigned') return;

    try {
      const res = await fetch('/api/contacts/category', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Delete failed');

      setLocalCategories((prev) => prev.filter((cat) => cat.name !== trimmed));

      setLocalAssignments((prev) =>
        prev.map((row) =>
          row.categoryId === data.deletedCategoryId
            ? { ...row, categoryId: null }
            : row
        )
      );

      setOpenMap((prev) => {
        const next = { ...prev };
        delete next[trimmed];
        return next;
      });
    } catch (err) {
      console.error('deleteCategory failed:', err);
    }
  };

  const assignContact = async (contactId, categoryName) => {
    if (!contactId) return;

    try {
      const res = await fetch('/api/contacts/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId,
          categoryName,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Assign failed');

      const assignment = data.assignment;

      setLocalAssignments((prev) => {
        const existing = prev.find((row) => row.contactId === contactId);
        if (existing) {
          return prev.map((row) => (row.contactId === contactId ? assignment : row));
        }
        return [...prev, assignment];
      });

      if (categoryName && categoryName !== 'Unassigned') {
        setLocalCategories((prev) => {
          const exists = prev.some(
            (c) => String(c.name || '').toLowerCase() === String(categoryName).toLowerCase()
          );
          if (exists) return prev;
          return [...prev, { id: assignment.categoryId, name: categoryName }];
        });
      }
    } catch (err) {
      console.error('assignContact failed:', err);
    }
  };

  const addAndAssignFromCard = async (contactId, categoryName) => {
  const trimmed = String(categoryName || '').trim();
  const lockedNames = ['unassigned', 'personal', 'candidates', 'clients'];
  if (!contactId || !trimmed || lockedNames.includes(trimmed.toLowerCase())) return;

  try {
    const res = await fetch('/api/contacts/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contactId,
        categoryName: trimmed,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Assign failed');

    const assignment = data.assignment;

    // ✅ Update assignments
    setLocalAssignments((prev) => {
      const existing = prev.find((row) => row.contactId === contactId);
      if (existing) {
        return prev.map((row) =>
          row.contactId === contactId ? assignment : row
        );
      }
      return [...prev, assignment];
    });

    // ✅ Ensure category exists locally
    if (trimmed.toLowerCase() !== 'unassigned') {
      setLocalCategories((prev) => {
        const exists = prev.some(
          (c) => c.id === assignment.categoryId
        );
        if (exists) return prev;

        return [
          ...prev,
          {
            id: assignment.categoryId,
            name: trimmed,
          },
        ];
      });
    }

  } catch (err) {
    console.error('addAndAssignFromCard failed:', err);
  }
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
              onClick={async () => {
                await addCategory(globalNewCat);
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
			key={cat.id || cat.name}
			name={cat.name}
			contacts={groups[cat.name] || []}
			categories={sortedCategories}
			onAssign={assignContact}
			onAddAndAssign={addAndAssignFromCard}
			onViewProfile={onViewProfile}
			deletable={!cat?.isSystem}
			onDeleteCategory={deleteCategory}
			collapsible
			isOpen={!!openMap[cat.name]}
			onToggle={() => toggleCategory(cat.name)}
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
            <option key={cat.id || cat.name} value={cat.name}>
              {cat.name}
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
        onClick={async () => {
          await onAdd(val);
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