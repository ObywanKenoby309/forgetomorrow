// lib/foundry/daily.js
// Server-side only. Never import this in client components.
// Handles all Daily.co API calls — room creation and meeting token generation.

const DAILY_API_KEY = process.env.DAILY_API_KEY;
const DAILY_DOMAIN = process.env.DAILY_DOMAIN;
const DAILY_API = 'https://api.daily.co/v1';

function headers() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${DAILY_API_KEY}`,
  };
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
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8,
        eject_at_room_exp: true,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Daily room creation failed: ${err.error || res.status}`);
  }

  return res.json();
}

// Generate a meeting token for a specific participant.
// avatarUrl is passed via user_data so VideoTile can render the real profile photo.
// isOwner = true for the host.
export async function createDailyToken({ roomId, userId, userName, isOwner = false, avatarUrl = null }) {
  const res = await fetch(`${DAILY_API}/meeting-tokens`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      properties: {
        room_name: roomId,
        user_id: userId,
        user_name: userName,
        is_owner: isOwner,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8,
        enable_screenshare: true,
        start_video_off: false,
        start_audio_off: true,
        // avatarUrl flows to participant.userData in the client
        user_data: { avatarUrl: avatarUrl || null },
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Daily token creation failed: ${err.error || res.status}`);
  }

  const data = await res.json();
  return data.token;
}

// Delete a Daily room when a Foundry ends.
export async function deleteDailyRoom(roomId) {
  const res = await fetch(`${DAILY_API}/rooms/${roomId}`, {
    method: 'DELETE',
    headers: headers(),
  });
  if (!res.ok && res.status !== 404) {
    console.error(`[daily] failed to delete room ${roomId}:`, res.status);
  }
}

export function dailyRoomUrl(roomId) {
  return `https://${DAILY_DOMAIN}/${roomId}`;
}