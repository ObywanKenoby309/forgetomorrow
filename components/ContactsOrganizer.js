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

const SYSTEM_CATEGORY_NAMES = ['Personal', 'Candidates', 'Clients', 'Talent Pools'];
const LOCKED_NAMES = ['personal', 'candidates', 'clients', 'talent pools'];

const SINGLE_BUCKET_ROOTS = ['personal', 'clients'];
const MULTI_BUCKET_ROOTS = ['candidates', 'talent pools'];

const ROOT_VISIBILITY = {
  seeker: ['personal'],
  coach: ['personal', 'clients'],
  'recruiter-smb': ['personal', 'candidates', 'talent pools'],
  'recruiter-ent': ['personal', 'candidates', 'talent pools'],
  recruiter: ['personal', 'candidates', 'talent pools'],
};

const CATEGORY_OPTION_UNASSIGNED = '__UNASSIGNED__';
const CATEGORY_OPTION_NEW = '__NEW_CATEGORY__';
const GROUP_OPTION_UNASSIGNED = '__UNASSIGNED_GROUP__';
const GROUP_OPTION_NEW = '__NEW_GROUP__';

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

function getTargetUserId(contact) {
  return contact?.contactUserId || contact?.userId || contact?.id || null;
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
    const visibleRoots = new Set(ROOT_VISIBILITY[effectiveChrome] || ['personal']);

    const filtered = incoming.filter((cat) => {
      const lower = String(cat.name || '').toLowerCase();
      const isSystemRoot =
        SYSTEM_CATEGORY_NAMES.map((n) => n.toLowerCase()).includes(lower) &&
        !cat.parentCategoryId;

      if (isSystemRoot) return visibleRoots.has(lower);
      return true;
    });

    setLocalCategories(filtered);
  }, [categories, effectiveChrome]);

  useEffect(() => {
    setLocalAssignments(Array.isArray(assignments) ? assignments : []);
  }, [assignments]);

  const sortedCategories = useMemo(() => {
    return [...localCategories].sort((a, b) =>
      String(a?.name || '').localeCompare(String(b?.name || ''))
    );
  }, [localCategories]);

  const categoriesById = useMemo(() => {
    const map = new Map();
    sortedCategories.forEach((cat) => {
      if (cat?.id) map.set(String(cat.id), cat);
    });
    return map;
  }, [sortedCategories]);

  const getRootName = useMemo(() => {
    return (categoryId) => {
      let cat = categoriesById.get(String(categoryId || ''));
      while (cat?.parentCategoryId) {
        cat = categoriesById.get(String(cat.parentCategoryId));
      }
      return String(cat?.name || '').toLowerCase();
    };
  }, [categoriesById]);

  const categoryTree = useMemo(() => {
    const byId = {};
    const roots = [];

    sortedCategories.forEach((cat) => {
      byId[String(cat.id)] = { ...cat, children: [] };
    });

    sortedCategories.forEach((cat) => {
      const parentCategoryId = cat?.parentCategoryId ? String(cat.parentCategoryId) : null;
      const currentId = String(cat.id);

      if (parentCategoryId && byId[parentCategoryId]) {
        byId[parentCategoryId].children.push(byId[currentId]);
      } else if (!parentCategoryId) {
        roots.push(byId[currentId]);
      }
    });

    return { roots, byId };
  }, [sortedCategories]);

  const contactsByCategoryId = useMemo(() => {
    const map = new Map();
    sortedCategories.forEach((cat) => map.set(String(cat.id), []));

    localAssignments.forEach((assignment) => {
      const categoryId = assignment?.categoryId ? String(assignment.categoryId) : null;
      const contactId = assignment?.contactId ? String(assignment.contactId) : null;
      if (!categoryId || !contactId) return;

      const category = categoriesById.get(categoryId);
      if (!category) return;

      const contact = contacts.find((c) => String(c.id) === contactId);
      if (!contact) return;

      const bucket = map.get(categoryId);
      if (!bucket) return;

      if (!bucket.some((row) => String(row.id) === String(contact.id))) {
        bucket.push(contact);
      }
    });

    return map;
  }, [sortedCategories, localAssignments, categoriesById, contacts]);

  const unassignedContacts = useMemo(() => {
    return contacts.filter((contact) => {
      const contactId = String(contact.id);
      const hasAnyAssignment = localAssignments.some((assignment) => {
        if (String(assignment?.contactId || '') !== contactId) return false;
        const categoryId = assignment?.categoryId ? String(assignment.categoryId) : null;
        if (!categoryId) return false;
        return categoriesById.has(categoryId);
      });
      return !hasAnyAssignment;
    });
  }, [contacts, localAssignments, categoriesById]);

  useEffect(() => {
    setOpenMap((prev) => {
      const next = { ...prev };
      sortedCategories.forEach((cat) => {
        const name = cat?.name;
        if (name && !(name in next)) next[name] = false;
      });
      Object.keys(next).forEach((k) => {
        if (k === 'Unassigned') return;
        if (!sortedCategories.some((cat) => cat?.name === k)) delete next[k];
      });
      return next;
    });
  }, [sortedCategories]);

  const addCategory = async (name, parentCategoryId = null) => {
    const trimmed = String(name || '').trim();
    if (!trimmed) return null;

    try {
      const res = await fetch('/api/contacts/category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed, parentCategoryId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to create category');

      setLocalCategories((prev) => {
        const exists = prev.some((c) => c.id === data.category.id);
        if (exists) return prev;
        return [...prev, data.category];
      });

      setOpenMap((prev) => ({ ...prev, [trimmed]: false }));
      return data.category;
    } catch (err) {
      console.error('addCategory failed:', err);
      return null;
    }
  };

  const deleteCategory = async (categoryId, name) => {
    const trimmed = String(name || '').trim();
    if (!trimmed || trimmed === 'Unassigned' || LOCKED_NAMES.includes(trimmed.toLowerCase())) {
      return;
    }

    try {
      const res = await fetch('/api/contacts/category', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Delete failed');

      setLocalCategories((prev) => prev.filter((cat) => cat.id !== categoryId));
      setLocalAssignments((prev) =>
        prev.filter((row) => row.categoryId !== data.deletedCategoryId)
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

  const assignContact = async (contactId, categoryId) => {
    if (!contactId || !categoryId || categoryId === CATEGORY_OPTION_UNASSIGNED) return false;

    try {
      const res = await fetch('/api/contacts/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId, categoryId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Assign failed');

      const { assignment, category } = data;
      const resolvedContactId = String(assignment?.contactId || contactId);
      const rootName = getRootName(category?.id);
      const isSingleBucket = SINGLE_BUCKET_ROOTS.includes(rootName);

      setLocalAssignments((prev) => {
        let updated = prev;

        if (isSingleBucket) {
          const rootCategoryId = category?.parentCategoryId
            ? String(category.parentCategoryId)
            : String(category.id);

          const sameRootIds = sortedCategories
            .filter((c) => {
              const cId = String(c.id);
              const cParentId = c.parentCategoryId ? String(c.parentCategoryId) : null;
              return cId === rootCategoryId || cParentId === rootCategoryId;
            })
            .map((c) => String(c.id))
            .filter((id) => id !== String(category.id));

          updated = prev.filter(
            (row) =>
              String(row.contactId) !== resolvedContactId ||
              !sameRootIds.includes(String(row.categoryId))
          );
        }

        const exists = updated.some(
          (row) =>
            String(row.contactId) === resolvedContactId &&
            String(row.categoryId) === String(category.id)
        );

        if (exists) {
          return updated.map((row) =>
            String(row.contactId) === resolvedContactId &&
            String(row.categoryId) === String(category.id)
              ? { ...row, ...assignment, contactId: resolvedContactId }
              : row
          );
        }

        return [...updated, { ...assignment, contactId: resolvedContactId }];
      });

      return true;
    } catch (err) {
      console.error('assignContact failed:', err);
      return false;
    }
  };

  const unassignContact = async (contactId, categoryId) => {
    if (!contactId || !categoryId) return false;

    try {
      const res = await fetch('/api/contacts/unassign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId, categoryId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Unassign failed');

      const resolvedContactId = String(data?.contactId || contactId);
      const resolvedCategoryId = String(data?.categoryId || categoryId);

      setLocalAssignments((prev) =>
        prev.filter(
          (row) =>
            !(
              String(row.contactId) === resolvedContactId &&
              String(row.categoryId) === resolvedCategoryId
            )
        )
      );

      return true;
    } catch (err) {
      console.error('unassignContact failed:', err);
      return false;
    }
  };

  const removeContact = async (contact) => {
    const targetUserId = getTargetUserId(contact);
    if (!targetUserId) {
      alert('Unable to determine contact id');
      return false;
    }

    const confirmed = window.confirm(`Remove ${contact?.name || 'this contact'} from your contacts?`);
    if (!confirmed) return false;

    try {
      const res = await fetch('/api/contacts/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactUserId: targetUserId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Remove failed');

      window.location.reload();
      return true;
    } catch (err) {
      console.error('removeContact failed:', err);
      alert('Failed to remove contact');
      return false;
    }
  };

  const blockContact = async (contact) => {
    const targetUserId = getTargetUserId(contact);
    if (!targetUserId) {
      alert('Unable to determine contact id');
      return false;
    }

    const confirmed = window.confirm(`Block ${contact?.name || 'this contact'}?`);
    if (!confirmed) return false;

    try {
      const res = await fetch('/api/signal/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId,
          reason: 'Blocked from contact card',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Block failed');

      alert('Contact blocked');
      return true;
    } catch (err) {
      console.error('blockContact failed:', err);
      alert('Failed to block contact');
      return false;
    }
  };

  const reportContact = async (contact) => {
    const targetUserId = getTargetUserId(contact);
    if (!targetUserId) {
      alert('Unable to determine contact id');
      return false;
    }

    const reason = window.prompt(
      `Report ${contact?.name || 'this contact'}.\nEnter a reason:`,
      ''
    );

    if (reason === null) return false;

    try {
      const res = await fetch('/api/contacts/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId,
          reason,
          source: 'contact-card',
          contextType: 'contact',
          contextId: contact?.id || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Report failed');

      alert('Report submitted');
      return true;
    } catch (err) {
      console.error('reportContact failed:', err);
      alert('Failed to submit report');
      return false;
    }
  };

  const toggleCategory = (name) => {
    if (name === 'Unassigned') return;
    setOpenMap((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const rootCategories = useMemo(() => {
    return sortedCategories.filter((cat) => !cat.parentCategoryId);
  }, [sortedCategories]);

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
      <section style={{ ...GLASS, padding: 18 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#263238' }}>
              Manage Categories
            </h2>
            <div style={{ marginTop: 4, fontSize: 13, color: '#607D8B' }}>
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
              style={{ minWidth: 220, background: 'rgba(255,255,255,0.9)' }}
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
          contacts={unassignedContacts}
          allCategories={sortedCategories}
          rootCategories={rootCategories}
          onAssign={assignContact}
          onUnassign={unassignContact}
          onRemoveContact={removeContact}
          onBlockContact={blockContact}
          onReportContact={reportContact}
          onAddCategory={addCategory}
          onViewProfile={onViewProfile}
          deletable={false}
          onDeleteCategory={() => {}}
          collapsible={false}
          isOpen
          onToggle={() => {}}
          depth={0}
        />

        {categoryTree.roots.map((root) => {
          const rootNameLower = String(root.name || '').toLowerCase();
          const isSystemRoot = SYSTEM_CATEGORY_NAMES.map((n) => n.toLowerCase()).includes(
            rootNameLower
          );

          return (
            <div key={root.id} style={{ display: 'grid', gap: 12 }}>
              <CategoryBlock
                name={root.name}
                contacts={contactsByCategoryId.get(String(root.id)) || []}
                allCategories={sortedCategories}
                rootCategories={rootCategories}
                onAssign={assignContact}
                onUnassign={unassignContact}
                onRemoveContact={removeContact}
                onBlockContact={blockContact}
                onReportContact={reportContact}
                onAddCategory={addCategory}
                onViewProfile={onViewProfile}
                deletable={!isSystemRoot}
                onDeleteCategory={() => deleteCategory(root.id, root.name)}
                collapsible
                isOpen={!!openMap[root.name]}
                onToggle={() => toggleCategory(root.name)}
                depth={0}
              />

              {openMap[root.name] &&
                root.children.map((child) => {
                  const childNameLower = String(child.name || '').toLowerCase();
                  const isSystemChild = SYSTEM_CATEGORY_NAMES.map((n) =>
                    n.toLowerCase()
                  ).includes(childNameLower);
                  const childContacts = contactsByCategoryId.get(String(child.id)) || [];

                  return (
                    <CategoryBlock
                      key={child.id}
                      name={child.name}
                      contacts={childContacts}
                      allCategories={sortedCategories}
                      rootCategories={rootCategories}
                      onAssign={assignContact}
                      onUnassign={unassignContact}
                      onRemoveContact={removeContact}
                      onBlockContact={blockContact}
                      onReportContact={reportContact}
                      onAddCategory={addCategory}
                      onViewProfile={onViewProfile}
                      deletable={!isSystemChild}
                      onDeleteCategory={() => deleteCategory(child.id, child.name)}
                      collapsible
                      isOpen={!!openMap[child.name]}
                      onToggle={() => toggleCategory(child.name)}
                      depth={1}
                    />
                  );
                })}
            </div>
          );
        })}
      </section>
    </div>
  );
}

function CategoryBlock({
  name,
  contacts,
  allCategories,
  rootCategories,
  onAssign,
  onUnassign,
  onRemoveContact,
  onBlockContact,
  onReportContact,
  onAddCategory,
  onViewProfile,
  deletable,
  onDeleteCategory,
  collapsible,
  isOpen,
  onToggle,
  depth = 0,
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
                fontSize: depth === 0 ? 18 : 16,
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
              fontSize: depth === 0 ? 18 : 16,
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
          onClick={onDeleteCategory}
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
        marginLeft: depth > 0 ? 18 : 0,
      }}
    >
      {Header}

      <div
        id={`cat-panel-${name}`}
        className={collapsible ? (isOpen ? 'block' : 'hidden') : 'block'}
      >
        {contacts.length === 0 ? (
          <div style={{ color: '#607D8B', fontStyle: 'italic', padding: '6px 2px 2px' }}>
            No contacts in this category.
          </div>
        ) : (
          <ul style={{ display: 'grid', gap: 12, margin: 0, padding: 0, listStyle: 'none' }}>
            {contacts.map((c) => (
              <ContactCard
                key={`${name}-${c.id}`}
                contact={c}
                allCategories={allCategories}
                rootCategories={rootCategories}
                currentCategoryName={name}
                onAssign={onAssign}
                onUnassign={onUnassign}
                onRemoveContact={onRemoveContact}
                onBlockContact={onBlockContact}
                onReportContact={onReportContact}
                onAddCategory={onAddCategory}
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
  allCategories,
  rootCategories,
  currentCategoryName,
  onAssign,
  onUnassign,
  onRemoveContact,
  onBlockContact,
  onReportContact,
  onAddCategory,
  onViewProfile,
}) {
  const [actionsOpen, setActionsOpen] = useState(false);

  const imageSrc = getContactImage(contact);
  const displayName = contact?.name || 'Member';
  const subtitle =
    contact?.status ||
    contact?.headline ||
    contact?.title ||
    contact?.role ||
    'Connection';

  const currentCategory = useMemo(
    () =>
      allCategories.find(
        (cat) => String(cat.name || '') === String(currentCategoryName || '')
      ) || null,
    [allCategories, currentCategoryName]
  );

  const currentRootCategory = useMemo(() => {
    if (!currentCategory) return null;
    if (!currentCategory.parentCategoryId) return currentCategory;
    return (
      allCategories.find(
        (cat) => String(cat.id) === String(currentCategory.parentCategoryId)
      ) || null
    );
  }, [allCategories, currentCategory]);

  const currentRootId = currentRootCategory?.id
    ? String(currentRootCategory.id)
    : CATEGORY_OPTION_UNASSIGNED;

  const currentGroupId =
    currentCategory && currentCategory.parentCategoryId
      ? String(currentCategory.id)
      : GROUP_OPTION_UNASSIGNED;

  const [pendingRootId, setPendingRootId] = useState(currentRootId);
  const [pendingGroupId, setPendingGroupId] = useState(currentGroupId);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newGroupName, setNewGroupName] = useState('');

  useEffect(() => {
    setPendingRootId(currentRootId);
    setPendingGroupId(currentGroupId);
    setNewCategoryName('');
    setNewGroupName('');
  }, [currentRootId, currentGroupId, currentCategoryName]);

  const availableGroups = useMemo(() => {
    if (
      !pendingRootId ||
      pendingRootId === CATEGORY_OPTION_UNASSIGNED ||
      pendingRootId === CATEGORY_OPTION_NEW
    ) {
      return [];
    }

    return allCategories
      .filter(
        (cat) => String(cat.parentCategoryId || '') === String(pendingRootId)
      )
      .sort((a, b) =>
        String(a?.name || '').localeCompare(String(b?.name || ''))
      );
  }, [allCategories, pendingRootId]);

  const isGroupDisabled = pendingRootId === CATEGORY_OPTION_UNASSIGNED;
  const showNewCategoryInput = pendingRootId === CATEGORY_OPTION_NEW;
  const showNewGroupInput = pendingGroupId === GROUP_OPTION_NEW;
  const canUseExistingRoot =
    pendingRootId !== CATEGORY_OPTION_UNASSIGNED &&
    pendingRootId !== CATEGORY_OPTION_NEW;

  const handleCategoryChange = (val) => {
    setPendingRootId(val);

    if (val === CATEGORY_OPTION_UNASSIGNED) {
      setPendingGroupId(GROUP_OPTION_UNASSIGNED);
      setNewCategoryName('');
      setNewGroupName('');
      return;
    }

    if (val === CATEGORY_OPTION_NEW) {
      setPendingGroupId(GROUP_OPTION_UNASSIGNED);
      setNewGroupName('');
      return;
    }

    const currentGroupStillValid = allCategories.some(
      (cat) =>
        String(cat.id) === String(pendingGroupId) &&
        String(cat.parentCategoryId || '') === String(val)
    );

    setPendingGroupId(
      currentGroupStillValid ? pendingGroupId : GROUP_OPTION_UNASSIGNED
    );
    setNewCategoryName('');
    setNewGroupName('');
  };

  const handleAddAndAssign = async () => {
    try {
      if (pendingRootId === CATEGORY_OPTION_UNASSIGNED) {
        if (currentCategory?.id) {
          await onUnassign(contact.id, currentCategory.id);
        }
        return;
      }

      let rootCategory = null;

      if (pendingRootId === CATEGORY_OPTION_NEW) {
        const trimmedRootName = String(newCategoryName || '').trim();
        if (!trimmedRootName) {
          alert('Please enter a category name.');
          return;
        }

        rootCategory = await onAddCategory(trimmedRootName, null);
        if (!rootCategory?.id) return;
      } else {
        rootCategory =
          rootCategories.find(
            (cat) => String(cat.id) === String(pendingRootId)
          ) || null;
      }

      if (!rootCategory?.id) {
        alert('Please select a valid category.');
        return;
      }

      if (pendingGroupId === GROUP_OPTION_UNASSIGNED) {
        await onAssign(contact.id, rootCategory.id);
        return;
      }

      let targetGroup = null;

      if (pendingGroupId === GROUP_OPTION_NEW) {
        const trimmedGroupName = String(newGroupName || '').trim();
        if (!trimmedGroupName) {
          alert('Please enter a group name.');
          return;
        }

        targetGroup = await onAddCategory(trimmedGroupName, rootCategory.id);
        if (!targetGroup?.id) return;
      } else {
        targetGroup =
          allCategories.find(
            (cat) => String(cat.id) === String(pendingGroupId)
          ) || null;
      }

      if (!targetGroup?.id) {
        alert('Please select a valid group.');
        return;
      }

      await onAssign(contact.id, targetGroup.id);
    } catch (err) {
      console.error('handleAddAndAssign failed:', err);
      alert('Failed to update contact placement');
    }
  };

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
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
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

            <button
              type="button"
              onClick={() => onViewProfile(contact)}
              aria-label={`View profile for ${displayName}`}
              style={{
                marginTop: 10,
                padding: '10px 14px',
                borderRadius: 10,
                border: 'none',
                background: '#FF7043',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 6px 16px rgba(255,112,67,0.22)',
              }}
            >
              View Profile
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <select
          value={pendingRootId}
          onChange={(e) => handleCategoryChange(e.target.value)}
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
          <option value={CATEGORY_OPTION_UNASSIGNED}>Unassigned</option>
          <option value={CATEGORY_OPTION_NEW}>New category</option>
          {rootCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        <select
          value={pendingGroupId}
          disabled={isGroupDisabled}
          onChange={(e) => {
            setPendingGroupId(e.target.value);
            if (e.target.value !== GROUP_OPTION_NEW) {
              setNewGroupName('');
            }
          }}
          style={{
            minWidth: 180,
            padding: '9px 10px',
            borderRadius: 10,
            border: '1px solid #D7DEE2',
            background: isGroupDisabled
              ? 'rgba(240,240,240,0.95)'
              : 'rgba(255,255,255,0.95)',
            fontSize: 13,
            color: '#263238',
          }}
        >
          <option value={GROUP_OPTION_UNASSIGNED}>Unassigned</option>
          {pendingRootId !== CATEGORY_OPTION_UNASSIGNED && (
            <option value={GROUP_OPTION_NEW}>New group</option>
          )}
          {canUseExistingRoot &&
            availableGroups.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
        </select>

        {showNewCategoryInput && (
          <input
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
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
        )}

        {showNewGroupInput && (
          <input
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="New group"
            style={{
              minWidth: 170,
              padding: '9px 10px',
              borderRadius: 10,
              border: '1px solid #D7DEE2',
              background: 'rgba(255,255,255,0.95)',
              fontSize: 13,
            }}
          />
        )}

        <button
          type="button"
          onClick={handleAddAndAssign}
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

      <div style={{ position: 'relative', justifySelf: 'start' }}>
        <button
          type="button"
          onClick={() => setActionsOpen((v) => !v)}
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid #D7DEE2',
            background: 'rgba(255,255,255,0.95)',
            color: '#455A64',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Actions
        </button>

        {actionsOpen && (
          <div
            style={{
              position: 'absolute',
              top: 46,
              left: 0,
              minWidth: 170,
              borderRadius: 12,
              border: '1px solid #D7DEE2',
              background: 'rgba(255,255,255,0.98)',
              boxShadow: '0 10px 24px rgba(0,0,0,0.14)',
              overflow: 'hidden',
              zIndex: 20,
            }}
          >
            <button
              type="button"
              onClick={async () => {
                setActionsOpen(false);
                await onRemoveContact(contact);
              }}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: 'none',
                borderBottom: '1px solid #ECEFF1',
                background: 'transparent',
                color: '#263238',
                textAlign: 'left',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Remove Contact
            </button>

            <button
              type="button"
              onClick={async () => {
                setActionsOpen(false);
                await onReportContact(contact);
              }}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: 'none',
                borderBottom: '1px solid #ECEFF1',
                background: 'transparent',
                color: '#263238',
                textAlign: 'left',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Report Contact
            </button>

            <button
              type="button"
              onClick={async () => {
                setActionsOpen(false);
                await onBlockContact(contact);
              }}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: 'none',
                background: 'transparent',
                color: '#263238',
                textAlign: 'left',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Block Contact
            </button>
          </div>
        )}
      </div>
    </li>
  );
}