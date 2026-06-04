// lib/foundry/daily.js
// Server-side only. Never import this in client components.
// Handles all Daily.co API calls — room creation and meeting token generation.

const DAILY_API_KEY = process.env.DAILY_API_KEY;
const DAILY_DOMAIN = String(process.env.DAILY_DOMAIN || '')
  .replace(/^https?:\/\//, '')
  .replace(/\/.*$/, '')
  .replace(/\.daily\.co$/, '');
const DAILY_API = 'https://api.daily.co/v1';

function assertDailyEnv() {
  if (!DAILY_API_KEY) {
    throw new Error('Missing DAILY_API_KEY');
  }

  if (!DAILY_DOMAIN) {
    throw new Error('Missing DAILY_DOMAIN');
  }
}

function headers() {
  assertDailyEnv();

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${DAILY_API_KEY}`,
  };
}

async function readDailyError(res) {
  const body = await res.json().catch(() => ({}));
  return body?.error || body?.info || body?.message || res.status;
}

// Create a Daily room tied to a Foundry roomId.
// Rooms are private — no one can join without a token.
export async function createDailyRoom(roomId) {
  const res = await fetch(`${DAILY_API}/rooms`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      name: roomId,
      privacy: 'private',
      properties: {
        max_participants: 10,
        enable_chat: false,
        enable_screenshare: true,
        enable_recording: 'cloud',
        enable_knocking: true,           // required for lobby/admit flow
        owner_only_broadcast: false,     // participants can always speak
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8,
        eject_at_room_exp: true,
      },
    }),
  });

  if (!res.ok) {
    const err = await readDailyError(res);

    // If the room already exists, reuse it instead of failing the Foundry.
    if (res.status === 400 && String(err).toLowerCase().includes('already')) {
      return getDailyRoom(roomId);
    }

    throw new Error(`Daily room creation failed: ${err}`);
  }

  return res.json();
}

export async function getDailyRoom(roomId) {
  const res = await fetch(`${DAILY_API}/rooms/${encodeURIComponent(roomId)}`, {
    method: 'GET',
    headers: headers(),
  });

  if (!res.ok) {
    const err = await readDailyError(res);
    throw new Error(`Daily room lookup failed: ${err}`);
  }

  return res.json();
}

// Generate a meeting token for a specific participant.
// isOwner = true for the host.
export async function createDailyToken({ roomId, userId, userName, isOwner = false, avatarUrl = null, role = null }) {
  const safeUserId = String(userId || '').slice(0, 36);
  const safeUserName = String(userName || 'Guest').slice(0, 80);

  // IMPORTANT:
  // Daily meeting-token properties do not support arbitrary `user_data`.
  // Passing unknown properties to /meeting-tokens can cause token generation
  // to fail. Custom participant metadata is applied client-side with
  // call.setUserData() after join.
  const res = await fetch(`${DAILY_API}/meeting-tokens`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      properties: {
        room_name: roomId,
        user_id: safeUserId,
        user_name: safeUserName,
        is_owner: !!isOwner,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8,
        enable_screenshare: true,
        start_video_off: true,
        start_audio_off: true,
        permissions: {
          hasPresence: true,
          canSend: true,
          canReceive: true,
          canAdmin: isOwner ? ['participants'] : false,
        },
      },
    }),
  });

  if (!res.ok) {
    const err = await readDailyError(res);
    throw new Error(`Daily token creation failed: ${err}`);
  }

  const data = await res.json();
  return data.token;
}

// Delete a Daily room when a Foundry ends.
export async function deleteDailyRoom(roomId) {
  const res = await fetch(`${DAILY_API}/rooms/${encodeURIComponent(roomId)}`, {
    method: 'DELETE',
    headers: headers(),
  });

  if (!res.ok && res.status !== 404) {
    console.error(`[daily] failed to delete room ${roomId}:`, res.status);
  }
}

export function dailyRoomUrl(roomId) {
  assertDailyEnv();
  return `https://${DAILY_DOMAIN}.daily.co/${roomId}`;
}