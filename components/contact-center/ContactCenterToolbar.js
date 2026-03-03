// components/contact-center/ContactCenterToolbar.js
import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function ContactCenterToolbar({ currentTab = 'contacts' }) {
  const router = useRouter();
  const chrome = String(router.query.chrome || '').toLowerCase();
  const withChrome = (path) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

  // Counts state
  const [contactsCount, setContactsCount] = useState(0);
  const [invitesInCount, setInvitesInCount] = useState(0);
  const [invitesOutCount, setInvitesOutCount] = useState(0);
  const [profileViewsCount, setProfileViewsCount] = useState(0);
  const [blockedCount, setBlockedCount] = useState(0);

  const reloadCounts = async () => {
    try {
      const summaryRes = await fetch('/api/contacts/summary');
      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setContactsCount(data.contacts?.length || 0);
        setInvitesInCount(data.incoming?.length || 0);
        setInvitesOutCount(data.outgoing?.length || 0);
      }

      const pvRes = await fetch('/api/profile/views?limit=5');
      if (pvRes.ok) {
        const data = await pvRes.json();
        setProfileViewsCount(data.views?.length || 0);
      }

      const blockedRes = await fetch('/api/signal/blocked?countOnly=true');
      if (blockedRes.ok) {
        const data = await blockedRes.json();
        setBlockedCount(data.count || 0);
      }
    } catch (err) {
      console.error('ContactCenterToolbar counts error', err);
    }
  };

  useEffect(() => {
    reloadCounts();
  }, []);

  const counts = useMemo(
    () => ({
      contacts: contactsCount,
      invitesIn: invitesInCount,
      invitesOut: invitesOutCount,
      profileViews: profileViewsCount,
      blocked: blockedCount,
    }),
    [contactsCount, invitesInCount, invitesOutCount, profileViewsCount, blockedCount]
  );

  const TabButton = ({ href, label, badge, tabKey }) => {
    const isActive = currentTab === tabKey;
    const hasBadge = typeof badge === 'number' && badge > 0;
    const bg = isActive || (hasBadge && tabKey !== 'contacts') ? '#FFF3E9' : 'white';
    const border = isActive || (hasBadge && tabKey !== 'contacts') ? '#FFCCBC' : '#eee';
    const color = isActive || (hasBadge && tabKey !== 'contacts') ? '#D84315' : '#374151';

    return (
      <Link
        href={withChrome(href)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          borderRadius: 10,
          border: `1px solid ${border}`,
          background: bg,
          color,
          fontWeight: 700,
          textDecoration: 'none',
        }}
      >
        <span>{label}</span>
        {typeof badge === 'number' && (
          <span
            style={{
              background: hasBadge ? '#FFE0B2' : '#ECEFF1',
              color: '#374151',
              borderRadius: 999,
              padding: '2px 8px',
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            {badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <section
      style={{
        background: 'white',
        borderRadius: 12,
        padding: 12,
        border: '1px solid #eee',
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        marginBottom: 16,
      }}
    >
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <TabButton
          href="/seeker/contact-center"
          label="Contacts"
          badge={counts.contacts}
          tabKey="contacts"
        />
        <TabButton
          href="/seeker/contact-incoming"
          label="Invites"
          badge={counts.invitesIn}
          tabKey="invites"
          highlight={counts.invitesIn > 0}
        />
        <TabButton
          href="/seeker/contact-outgoing"
          label="Requests"
          badge={counts.invitesOut}
          tabKey="requests"
          highlight={counts.invitesOut > 0}
        />
        <TabButton
          href="/seeker/profile-views"
          label="Profile Views"
          badge={counts.profileViews}
          tabKey="profileViews"
          highlight={counts.profileViews > 0}
        />
        <TabButton
          href="/seeker/blocked"
          label="Blocked Users"
          badge={counts.blocked}
          tabKey="blocked"
          highlight={counts.blocked > 0}
        />
      </div>
    </section>
  );
}