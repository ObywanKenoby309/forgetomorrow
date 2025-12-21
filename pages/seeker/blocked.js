// pages/seeker/blocked.js
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import SeekerRightColumn from '@/components/seeker/SeekerRightColumn';
import ContactCenterToolbar from '@/components/contact-center/ContactCenterToolbar';

export default function BlockedUsersPage() {
  const router = useRouter();
  const chrome = String(router.query.chrome || '').toLowerCase();
  const withChrome = (path) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadBlockedUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/signal/blocked');
      if (!res.ok) {
        console.error('blocked list failed', await res.text());
        setBlockedUsers([]);
        return;
      }
      const data = await res.json();
      setBlockedUsers(data.blocked || []);
    } catch (err) {
      console.error('blocked list error', err);
      setBlockedUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlockedUsers();
  }, []);

  const handleUnblock = async (blockedId, name) => {
    const confirmed = window.confirm(
      `Unblock ${name || 'this member'}? Their posts will reappear in your feed and they will be able to message you again.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch('/api/signal/blocked', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockedId }),
      });
      if (!res.ok) {
        console.error('unblock failed', await res.text());
        alert('We could not unblock this member. Please try again.');
        return;
      }
      // Optimistic update
      setBlockedUsers((prev) => prev.filter((u) => u.id !== blockedId));
      alert(`${name || 'Member'} unblocked.`);
    } catch (err) {
      console.error('unblock error', err);
      alert('We could not unblock this member. Please try again.');
    }
  };

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const HeaderBox = (
    <section
      style={{
        background: 'white',
        borderRadius: 12,
        padding: 16,
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        border: '1px solid #eee',
        textAlign: 'center',
      }}
    >
      <h1
        style={{
          margin: 0,
          color: '#FF7043',
          fontSize: 24,
          fontWeight: 800,
        }}
      >
        Blocked Users
      </h1>
      <p
        style={{
          margin: '6px auto 0',
          color: '#607D8B',
          maxWidth: 720,
        }}
      >
        You won&apos;t see posts from these members in your feed, and they can&apos;t message you.
      </p>
    </section>
  );

  const RightRail = (
    <div style={{ display: 'grid', gap: 12 }}>
      <SeekerRightColumn variant="contacts" />
    </div>
  );

  return (
    <SeekerLayout
      title="Blocked Users | ForgeTomorrow"
      header={HeaderBox}
      right={RightRail}
      activeNav="contacts"
    >
      <ContactCenterToolbar currentTab="blocked" />

      <section
        style={{
          background: 'white',
          borderRadius: 12,
          padding: 16,
          border: '1px solid #eee',
          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        }}
      >
        {loading ? (
          <p style={{ color: '#607D8B', fontSize: 14 }}>Loading blocked users…</p>
        ) : blockedUsers.length === 0 ? (
          <p style={{ color: '#607D8B', fontSize: 14 }}>
            No blocked members yet. Block someone from their post to hide their content.
          </p>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {blockedUsers.map((user) => (
              <div
                key={user.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr auto',
                  alignItems: 'center',
                  gap: 16,
                  padding: '12px 16px',
                  borderRadius: 10,
                  background: '#F9FAFB',
                  border: '1px solid #eee',
                }}
              >
                {/* Avatar + Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      style={{ width: 48, height: 48, borderRadius: '50%' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        background: '#E2E8F0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#64748B',
                        fontWeight: 600,
                      }}
                    >
                      {user.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: 600, color: '#111827' }}>
                      {user.name || 'Member'}
                    </div>
                  </div>
                </div>

                {/* Reason & Date */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <span style={{ fontWeight: 600, color: '#374151' }}>Reason:</span>{' '}
                    <span style={{ color: '#607D8B' }}>
                      {user.reason || 'No reason provided'}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontWeight: 600, color: '#374151' }}>Blocked on:</span>{' '}
                    <span style={{ color: '#607D8B' }}>{formatDate(user.createdAt)}</span>
                  </div>
                </div>

                {/* Unblock button */}
                <button
                  onClick={() => handleUnblock(user.id, user.name)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    background: '#FF7043',
                    color: 'white',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Unblock
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </SeekerLayout>
  );
}