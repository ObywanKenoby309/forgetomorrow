// pages/foundry/index.js

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';
import SeekerTitleCard from '@/components/seeker/SeekerTitleCard';
import FoundryLobbyWorkspace from '@/components/foundry/FoundryLobbyWorkspace';
import FoundryRightRail from '@/components/foundry/FoundryRightRail';
import { getTimeGreeting } from '@/lib/dashboardGreeting';

const CAN_HOST = ['COACH', 'RECRUITER', 'ADMIN', 'OWNER', 'SITE_ADMIN'];

const S = {
  wrapper: { display: 'flex', flexDirection: 'column', gap: 18 },
  rightStack: { display: 'flex', flexDirection: 'column', gap: 14 },
};

export default function FoundryLobby() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const greeting = getTimeGreeting();

  const [contacts, setContacts] = useState([]);
  const [recentRooms, setRecentRooms] = useState([]);
  const [todayRooms, setTodayRooms] = useState([]);

  const userRole = String(session?.user?.role || '').toUpperCase();
  const canHost = CAN_HOST.includes(userRole);

  const refreshFoundryData = () => {
    fetch('/api/foundry/today')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.rooms)) setTodayRooms(data.rooms);
      })
      .catch(() => {});

    if (canHost) {
      fetch('/api/foundry/recent')
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data.rooms)) setRecentRooms(data.rooms);
        })
        .catch(() => {});
    }
  };

  useEffect(() => {
    if (status !== 'authenticated') return;

    fetch('/api/foundry/today')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.rooms)) setTodayRooms(data.rooms);
      })
      .catch(() => {});

    if (!canHost) return;

    fetch('/api/contacts/list')
      .then((r) => r.json())
      .then((data) => {
        if (data.contacts) {
          setContacts(data.contacts.map((c) => ({
            id: c.contactUserId || c.id,
            name: c.name || [c.firstName, c.lastName].filter(Boolean).join(' ') || 'Unknown',
            avatarUrl: c.avatarUrl || null,
          })));
        }
      })
      .catch(() => {});

    fetch('/api/foundry/recent')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.rooms)) setRecentRooms(data.rooms);
      })
      .catch(() => {});
  }, [status, canHost]);

  if (status === 'loading') return null;

  if (status === 'unauthenticated') {
    router.replace('/login');
    return null;
  }

  return (
    <>
      <Head>
        <title>Foundries | ForgeTomorrow</title>
      </Head>

      <SeekerLayout
        title="Foundries | ForgeTomorrow"
        activeNav="foundry"
        right={
          <div style={S.rightStack}>
            <RightRailPlacementManager />
            <FoundryRightRail
              recentRooms={recentRooms}
              canHost={canHost}
              onOpenRoom={(roomId) => router.push(`/foundry/${roomId}`)}
            />
          </div>
        }
        rightVariant="light"
        header={
          <SeekerTitleCard
            greeting={greeting}
            title="Foundries"
            subtitle="A secure professional collaboration room — live video, coaching, document review, and direct messaging in one place."
          />
        }
      >
        <div style={S.wrapper}>
          <FoundryLobbyWorkspace
            canHost={canHost}
            contacts={contacts}
            todayRooms={todayRooms}
            onRefresh={refreshFoundryData}
            onJoinRoom={(roomId) => router.push(`/foundry/${roomId}`)}
          />
        </div>
      </SeekerLayout>
    </>
  );
}
