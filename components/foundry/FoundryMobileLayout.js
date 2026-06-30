// components/foundry/FoundryMobileLayout.js
// Mobile-first Foundry room layout.
// Video fills the full screen. Controls overlay on top.
// Panels slide up as bottom sheets.
// Sheets: Chat | People | Files | Notes | More (screen share, record, invite, host controls)

import { useState, useEffect, useRef, useCallback } from 'react';
import FoundryLobbyPanel from './FoundryLobbyPanel';
import FoundryBrowserHelp from './FoundryBrowserHelp';

const ORANGE = '#FF7043';
const DARK = '#141720';

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  root: {
    position: 'fixed', inset: 0,
    background: '#000',
    display: 'flex', flexDirection: 'column',
    fontFamily: "'DM Sans', sans-serif",
    userSelect: 'none', WebkitUserSelect: 'none',
  },
  videoWrap: { position: 'absolute', inset: 0, zIndex: 1 },

  // Top overlay
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 16px',
    background: 'linear-gradient(to bottom, rgba(0,0,0,0.70) 0%, transparent 100%)',
  },
  topLeft: { display: 'flex', flexDirection: 'column', gap: 1 },
  sessionTitle: {
    fontSize: 13, fontWeight: 700, color: '#fff',
    maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  timer: { fontSize: 11, color: 'rgba(255,255,255,0.55)', fontVariantNumeric: 'tabular-nums' },
  endBtn: {
    background: '#c62828', border: 'none', color: '#fff',
    borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'inherit',
    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
  },

  // Recording badge
  recBadge: {
    position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
    zIndex: 11, display: 'flex', alignItems: 'center', gap: 5,
    background: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: '3px 10px',
    fontSize: 10, color: '#ef5350', fontWeight: 600,
  },
  recDot: {
    width: 6, height: 6, borderRadius: '50%', background: '#ef5350',
    animation: 'foundryPulse 1.4s ease-in-out infinite',
  },

  // Bottom controls bar
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
    padding: '12px 8px 28px',
    background: 'linear-gradient(to top, rgba(0,0,0,0.80) 0%, transparent 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-around',
  },
  ctrlBtn: (active, danger) => ({
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
    background: active
      ? (danger ? 'rgba(198,40,40,0.35)' : 'rgba(255,112,67,0.28)')
      : 'rgba(255,255,255,0.12)',
    border: 'none', borderRadius: 12, padding: '10px 12px',
    cursor: 'pointer', minWidth: 52,
    backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
    color: active ? (danger ? '#ef9a9a' : ORANGE) : 'rgba(255,255,255,0.85)',
    position: 'relative',
  }),
  ctrlIcon: { fontSize: 19, lineHeight: 1 },
  ctrlLabel: { fontSize: 9, fontWeight: 600, whiteSpace: 'nowrap' },
  badge: {
    position: 'absolute', top: 4, right: 4,
    background: ORANGE, color: '#fff',
    fontSize: 8, fontWeight: 800, borderRadius: 8,
    minWidth: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '0 3px',
  },
  inlineBadge: {
    marginLeft: 5,
    background: ORANGE,
    color: '#fff',
    fontSize: 8,
    fontWeight: 800,
    borderRadius: 8,
    minWidth: 14,
    height: 14,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 4px',
    verticalAlign: 'middle',
  },

  // Sheet system
  backdrop: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 20 },
  sheet: {
    position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 21,
    background: DARK, borderRadius: '16px 16px 0 0',
    maxHeight: '80vh', display: 'flex', flexDirection: 'column',
    boxShadow: '0 -8px 32px rgba(0,0,0,0.6)',
  },
  sheetHandle: { display: 'flex', justifyContent: 'center', padding: '10px 0 4px' },
  sheetHandleBar: { width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)' },
  sheetHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '4px 18px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  sheetTitle: { fontSize: 15, fontWeight: 700, color: '#f0f0f0' },
  sheetClose: { background: 'none', border: 'none', color: '#555', fontSize: 22, cursor: 'pointer', padding: 0 },
  sheetBody: { flex: 1, overflowY: 'auto', padding: '12px 16px' },

  // People
  participantRow: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  participantAvatar: {
    width: 36, height: 36, borderRadius: '50%', background: '#5C6BC0',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontWeight: 600, color: '#fff', flexShrink: 0,
  },
  participantName: { flex: 1, fontSize: 14, color: '#ddd', fontWeight: 500 },
  participantRole: { fontSize: 11, color: '#555' },
  hostCtrlBtn: {
    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
    color: '#ddd', borderRadius: 6, fontSize: 11, padding: '4px 8px', cursor: 'pointer',
  },
  banBtn: {
    background: 'rgba(239,83,80,0.12)', border: '1px solid rgba(239,83,80,0.24)',
    color: '#ef9a9a', borderRadius: 6, fontSize: 11, padding: '4px 8px', cursor: 'pointer',
  },

  // Chat
  chatMessages: { display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 12 },
  chatMsg: { display: 'flex', gap: 8 },
  chatAvatar: {
    width: 28, height: 28, borderRadius: '50%', background: '#5C6BC0',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 10, fontWeight: 600, color: '#fff', flexShrink: 0, marginTop: 2,
  },
  chatSender: { fontSize: 12, fontWeight: 700, color: '#aaa', marginBottom: 2 },
  chatTime: { fontWeight: 400, color: '#444', marginLeft: 4 },
  chatText: { fontSize: 13, color: '#ccc', lineHeight: 1.5 },
  chatInputRow: {
    display: 'flex', gap: 8, padding: '10px 16px 24px',
    borderTop: '1px solid rgba(255,255,255,0.06)', background: DARK, flexShrink: 0,
  },
  chatInput: {
    flex: 1, background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 20, padding: '10px 14px',
    color: '#e0e0e0', fontSize: 13, outline: 'none', fontFamily: 'inherit',
  },
  chatSendBtn: {
    background: ORANGE, border: 'none', color: '#fff',
    borderRadius: 20, padding: '10px 16px',
    fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700,
  },

  // Files
  filesSection: { marginBottom: 16 },
  filesSectionHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 8,
  },
  filesSectionTitle: {
    display: 'flex', alignItems: 'center', gap: 6,
    fontSize: 13, fontWeight: 700, color: '#bbb',
  },
  filesSectionCount: {
    fontSize: 10, color: '#444', background: 'rgba(255,255,255,0.05)',
    padding: '1px 5px', borderRadius: 3,
  },
  fileRow: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 10px', background: 'rgba(255,255,255,0.03)',
    borderRadius: 8, marginBottom: 6, border: '1px solid rgba(255,255,255,0.05)',
    cursor: 'pointer',
  },
  fileName: { flex: 1, fontSize: 12, color: '#ccc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  fileMeta: { fontSize: 10, color: '#4a4a4a' },
  fileOpenBtn: {
    background: 'rgba(255,112,67,0.12)', border: '1px solid rgba(255,112,67,0.2)',
    color: ORANGE, fontSize: 11, fontWeight: 700, padding: '5px 10px',
    borderRadius: 6, cursor: 'pointer', flexShrink: 0,
  },
  fileShareBtn: {
    background: 'rgba(255,112,67,0.12)', border: '1px solid rgba(255,112,67,0.2)',
    color: ORANGE, fontSize: 11, fontWeight: 700, padding: '5px 10px',
    borderRadius: 6, cursor: 'pointer', flexShrink: 0,
  },
  emptyFiles: {
    textAlign: 'center', padding: '20px 8px',
    background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.07)',
    borderRadius: 8, color: '#3a3a3a', fontSize: 12, lineHeight: 1.6,
  },
  filesDivider: { height: 1, background: 'rgba(255,255,255,0.05)', margin: '14px 0' },
  uploadBtn: {
    width: '100%', background: 'rgba(255,255,255,0.05)',
    border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 8,
    padding: '14px', textAlign: 'center', cursor: 'pointer', color: '#555',
    fontSize: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
  },

  // Notes
  notesArea: {
    width: '100%', background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,200,50,0.10)',
    borderRadius: 10, padding: '12px', color: '#ccc',
    fontSize: 13, lineHeight: 1.7, outline: 'none',
    fontFamily: 'inherit', resize: 'none', minHeight: 200, boxSizing: 'border-box',
  },
  notesSaveState: { fontSize: 10, color: '#3a3a3a', textAlign: 'right', marginTop: 6 },
  notesAiHint: {
    marginTop: 12, background: 'rgba(255,112,67,0.04)',
    border: '1px dashed rgba(255,112,67,0.15)',
    borderRadius: 8, padding: '10px 12px',
    display: 'flex', gap: 8, alignItems: 'flex-start',
  },

  // View switcher row
  viewRow: {
    display: 'flex', alignItems: 'center', gap: 6, marginTop: 6,
  },
  viewBtn: (active) => ({
    display: 'flex', alignItems: 'center', gap: 4,
    background: active ? 'rgba(255,112,67,0.22)' : 'rgba(255,255,255,0.10)',
    border: `1px solid ${active ? 'rgba(255,112,67,0.5)' : 'rgba(255,255,255,0.12)'}`,
    borderRadius: 20, padding: '4px 10px',
    fontSize: 11, fontWeight: active ? 700 : 500,
    color: active ? ORANGE : 'rgba(255,255,255,0.7)',
    cursor: 'pointer', fontFamily: 'inherit',
    backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
    whiteSpace: 'nowrap',
  }),

  // More menu
  moreMenu: { display: 'flex', flexDirection: 'column', gap: 2, paddingBottom: 8 },
  moreItem: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '14px 4px', borderRadius: 8, cursor: 'pointer',
    background: 'none', border: 'none', width: '100%', textAlign: 'left',
    fontFamily: 'inherit',
  },
  moreIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  moreLabel: { fontSize: 14, color: '#ddd', fontWeight: 500 },
  moreSublabel: { fontSize: 11, color: '#555', marginTop: 1 },
  moreSep: { height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 0' },

  // Invite panel
  inviteSection: { marginBottom: 14 },
  inviteLabel: { fontSize: 11, color: '#666', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' },
  inviteLinkRow: {
    display: 'flex', gap: 8, alignItems: 'center',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8, padding: '8px 10px',
  },
  inviteLinkText: { flex: 1, fontSize: 11, color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  copyBtn: {
    background: 'rgba(255,112,67,0.12)', border: '1px solid rgba(255,112,67,0.2)',
    color: ORANGE, fontSize: 11, fontWeight: 700, padding: '5px 10px',
    borderRadius: 6, cursor: 'pointer', flexShrink: 0,
  },
};

function initials(name) {
  return (name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
}

function formatLocalChatTime(value) {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function Timer({ startTime }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const tick = () => setElapsed(Math.floor((Date.now() - startTime) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startTime]);
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  const pad = n => String(n).padStart(2, '0');
  return <span>{h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`}</span>;
}

export default function FoundryMobileLayout({
  // Video
  children,

  // Session
  sessionTitle,
  startTime,
  isRecording,
  roomId,

  // AV
  micMuted, camOff, isScreenSharing,
  onMicToggle, onCamToggle, onShareScreen, onRecordToggle,

  // Panels — People
  participants,
  isHost,
  onMuteAll,
  onMuteParticipant,
  onKickParticipant,
  onBanParticipant,
  onLockRoom,
  onStopParticipantShare,
  onStopParticipantCamera,
  coHostUserId,
  coHostName,
  onCoHostAssigned,

  // Panels — Chat
  messages,
  onSend,
  sessionDms,
  selectedDmParticipant,
  onSelectDmParticipant,
  onSendDm,

  // Panels — Files
  sharedFiles,
  forgeFiles,
  onShare,
  onUpload,
  onRemoveFile,
  guestCode,

  // Panels — Notes
  notes,
  onNotesChange,

  // End
  onEnd,

  // Guest mode — no forge files, no host controls
  isGuest,
  guestToken,

  // Mobile settings bridge. If parent does not pass these, the mobile layout
  // dispatches a browser event that FoundryVideoGrid listens for.
  callObject = null,
  selectedBackground = 'none',
  onBackgroundChange,
  isFounder = false,
  guestFileSharingAllowed = false,
  onToggleGuestFileSharing,
  activeView = 'grid',
  onViewChange,
}) {
  const [activeSheet, setActiveSheet] = useState(null);
  const [chatMode, setChatMode] = useState('meeting');
  const [mobileDevices, setMobileDevices] = useState([]);
  const [mobileCameraId, setMobileCameraId] = useState('');
  const [mobileMicId, setMobileMicId] = useState('');
  const [mobileSpeakerId, setMobileSpeakerId] = useState('');
  const [mobileBackground, setMobileBackground] = useState(selectedBackground || 'none');
  const [bgError, setBgError] = useState('');
  const [mobileSettingsError, setMobileSettingsError] = useState('');
  const [mobileSettingsSaving, setMobileSettingsSaving] = useState(false);
  const [inviteTab, setInviteTab] = useState('contacts');
  const [inviteContacts, setInviteContacts] = useState([]);
  const [inviteContactQuery, setInviteContactQuery] = useState('');
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [externalName, setExternalName] = useState('');
  const [externalEmail, setExternalEmail] = useState('');

  const publicBackgroundOptions = [
    { id: 'none', label: 'None' },
    { id: 'blur', label: 'Blur' },
    { id: 'forge-office', label: 'Forge Office' },
    { id: 'coaching-library', label: 'Coaching Library' },
    { id: 'coaching-strategy-room', label: 'Coaching Strategy Room' },
    { id: 'forge-floor', label: 'Forge Floor' },
    { id: 'neutral-professional', label: 'Neutral Professional' },
  ];

  const backgroundOptions = isFounder
    ? [...publicBackgroundOptions, { id: 'founder-office', label: 'Founder Office' }]
    : publicBackgroundOptions;

  // Screen share support — iOS doesn't support getDisplayMedia at all
  const screenShareSupported = typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices?.getDisplayMedia === 'function';
  const [chatDraft, setChatDraft] = useState('');
  const [dmDraft, setDmDraft] = useState('');
  const [notesDraft, setNotesDraft] = useState('');
  const [notesSaveState, setNotesSaveState] = useState('idle');
  const [copiedLink, setCopiedLink] = useState('');
  const [unreadChat, setUnreadChat] = useState(0);
  const [unreadDms, setUnreadDms] = useState(0);
  // Safe defaults — prevent null/undefined crashes on any prop
  const safeMessages = messages || [];
  const safeParticipants = participants || [];
  const safeSharedFiles = sharedFiles || [];
  const safeForgeFiles = forgeFiles || [];
  const safeNotes = notes || '';
  const safeSessionDms = sessionDms || [];
  const canUploadFromDevice = !!onUpload && (isHost || !isGuest || guestFileSharingAllowed);
  const mobileCameras = mobileDevices.filter((d) => d.kind === 'videoinput');
  const mobileMicrophones = mobileDevices.filter((d) => d.kind === 'audioinput');
  const mobileSpeakers = mobileDevices.filter((d) => d.kind === 'audiooutput');
  const notesSaveTimer = useRef(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Track unread chat messages
  const prevMsgCount = useRef(0);
  const prevDmCount = useRef(0);
  useEffect(() => {
    if ((activeSheet !== 'chat' || chatMode !== 'meeting') && safeMessages.length > prevMsgCount.current) {
      setUnreadChat(v => v + (safeMessages.length - prevMsgCount.current));
    }
    prevMsgCount.current = safeMessages.length;
  }, [safeMessages, activeSheet, chatMode]);

  useEffect(() => {
    if ((activeSheet !== 'chat' || chatMode !== 'dms') && safeSessionDms.length > prevDmCount.current) {
      setUnreadDms(v => v + (safeSessionDms.length - prevDmCount.current));
    }
    prevDmCount.current = safeSessionDms.length;
  }, [safeSessionDms, activeSheet, chatMode]);

  // Clear unread when chat opens
  useEffect(() => {
    if (activeSheet === 'chat' && chatMode === 'meeting') setUnreadChat(0);
    if (activeSheet === 'chat' && chatMode === 'dms') setUnreadDms(0);
  }, [activeSheet, chatMode]);

  // Scroll chat to bottom
  useEffect(() => {
    if (activeSheet === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [safeMessages, activeSheet]);

  // Sync notes from parent
  useEffect(() => { setNotesDraft(safeNotes); }, [safeNotes]);

  useEffect(() => {
    setMobileBackground(selectedBackground || 'none');
  }, [selectedBackground]);

  const loadMobileDevices = useCallback(async () => {
    setMobileSettingsError('');

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
      setMobileSettingsError('Device settings are not available in this browser.');
      return;
    }

    try {
      const list = await navigator.mediaDevices.enumerateDevices();
      setMobileDevices(list);

      const firstCamera = list.find((d) => d.kind === 'videoinput');
      const firstMic = list.find((d) => d.kind === 'audioinput');
      const firstSpeaker = list.find((d) => d.kind === 'audiooutput');

      setMobileCameraId((prev) => prev || firstCamera?.deviceId || '');
      setMobileMicId((prev) => prev || firstMic?.deviceId || '');
      setMobileSpeakerId((prev) => prev || firstSpeaker?.deviceId || '');
    } catch (err) {
      setMobileSettingsError(err?.message || 'Could not load camera and microphone devices.');
    }
  }, []);

  const openMobileSettings = useCallback(() => {
    setActiveSheet('settings');
    loadMobileDevices();
  }, [loadMobileDevices]);

  const applyMobileSettings = useCallback(async () => {
    setMobileSettingsSaving(true);
    setMobileSettingsError('');

    try {
      const detail = {
        cameraId: mobileCameraId || '',
        micId: mobileMicId || '',
        speakerId: mobileSpeakerId || '',
        background: mobileBackground || 'none',
      };

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('foundry_background', detail.background);
        window.dispatchEvent(new CustomEvent('foundry-mobile-device-settings', { detail }));
      }

      onBackgroundChange?.(detail.background);

      if (callObject) {
        if (callObject.setInputDevicesAsync) {
          await callObject.setInputDevicesAsync({
            audioDeviceId: detail.micId || undefined,
            videoDeviceId: detail.cameraId || undefined,
          });
        } else if (callObject.setInputDevices) {
          await callObject.setInputDevices({
            audioDeviceId: detail.micId || undefined,
            videoDeviceId: detail.cameraId || undefined,
          });
        }

        if (detail.speakerId && detail.speakerId !== 'default') {
          const validOutputDevice = mobileDevices.some(
            (device) => device.kind === 'audiooutput' && device.deviceId === detail.speakerId
          );

          if (validOutputDevice && callObject.setOutputDeviceAsync) {
            await callObject.setOutputDeviceAsync(detail.speakerId);
          } else if (validOutputDevice && callObject.setOutputDevice) {
            await callObject.setOutputDevice(detail.speakerId);
          }
        }
      }

      setActiveSheet(null);
    } catch (err) {
      setMobileSettingsError(err?.message || 'Could not apply settings.');
    } finally {
      setMobileSettingsSaving(false);
    }
  }, [
    callObject,
    mobileBackground,
    mobileCameraId,
    mobileDevices,
    mobileMicId,
    mobileSpeakerId,
    onBackgroundChange,
  ]);


  // Listen for background apply failures from VideoGrid
  useEffect(() => {
    const handler = (e) => setBgError(e.detail?.message || 'Background effects not supported on this device.');
    window.addEventListener('foundry-bg-error', handler);
    return () => window.removeEventListener('foundry-bg-error', handler);
  }, []);

  const closeSheet = useCallback(() => setActiveSheet(null), []);

  const loadInviteContacts = useCallback(async () => {
    if (!roomId || !isHost) return;
    try {
      const fetchRes = await fetch(`/api/foundry/room/${roomId}/live-invite`);
      const fetchData = await fetchRes.json().catch(() => ({}));
      if (!fetchRes.ok) throw new Error(fetchData.error || 'Could not load contacts');
      setInviteContacts(Array.isArray(fetchData.contacts) ? fetchData.contacts : []);
      setInviteError('');
    } catch (fetchErr) {
      setInviteError(String(fetchErr?.message || 'Could not load contacts'));
    }
  }, [roomId, isHost]);

  const sendInternalInvite = useCallback(async (contact) => {
    if (!contact?.id || !roomId) return;
    setInviteBusy(true);
    setInviteError('');
    setInviteMessage('');
    try {
      const postRes = await fetch(`/api/foundry/room/${roomId}/live-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'internal', userId: contact.id }),
      });
      const postData = await postRes.json().catch(() => ({}));
      if (!postRes.ok) throw new Error(postData.error || 'Could not invite contact');
      setInviteMessage(`${contact.name || 'Contact'} invited.`);
      await loadInviteContacts();
    } catch (postErr) {
      setInviteError(String(postErr?.message || 'Could not invite contact'));
    } finally {
      setInviteBusy(false);
    }
  }, [roomId, loadInviteContacts]);

  const sendExternalInvite = useCallback(async () => {
    const cleanEmail = externalEmail.trim();
    const cleanName = externalName.trim();
    if (!cleanEmail) { setInviteError('Enter a guest email.'); return; }
    setInviteBusy(true);
    setInviteError('');
    setInviteMessage('');
    try {
      const extRes = await fetch(`/api/foundry/room/${roomId}/live-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'external', email: cleanEmail, name: cleanName }),
      });
      const extData = await extRes.json().catch(() => ({}));
      if (!extRes.ok) throw new Error(extData.error || 'Could not invite guest');
      setInviteMessage(`${cleanEmail} invited.`);
      setExternalEmail('');
      setExternalName('');
    } catch (extErr) {
      setInviteError(String(extErr?.message || 'Could not invite guest'));
    } finally {
      setInviteBusy(false);
    }
  }, [roomId, externalEmail, externalName]);

  // Load contacts when invite sheet opens — placed after all callbacks are defined
  useEffect(() => {
    if (activeSheet === 'invite' && isHost) {
      setInviteMessage('');
      setInviteError('');
      loadInviteContacts();
    }
  }, [activeSheet, isHost, loadInviteContacts]);

  const sendChat = () => {
    if (!chatDraft.trim()) return;
    onSend?.(chatDraft.trim());
    setChatDraft('');
  };

  const handleNotesChange = (val) => {
    setNotesDraft(val);
    setNotesSaveState('saving');
    clearTimeout(notesSaveTimer.current);
    notesSaveTimer.current = setTimeout(() => {
      onNotesChange?.(val);
      setNotesSaveState('saved');
    }, 1500);
  };

  const openSharedFile = (file) => {
    if (!file?.downloadUrl) return;
    const storedCode = typeof window !== 'undefined' ? sessionStorage.getItem('foundry_guest_code') || '' : '';
    const code = guestCode || storedCode;
    const url = code ? `${file.downloadUrl}&guestCode=${encodeURIComponent(code)}` : file.downloadUrl;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const copyText = (label, value) => {
    if (!value) return;
    navigator.clipboard.writeText(value).then(() => {
      setCopiedLink(label);
      setTimeout(() => setCopiedLink(''), 1800);
    }).catch(() => {});
  };

  const ftLink = roomId && typeof window !== 'undefined' ? `${window.location.origin}/foundry/${roomId}` : '';
  const effectiveCode = guestCode || guestToken || '';
  const guestLink = roomId && effectiveCode && typeof window !== 'undefined'
    ? `${window.location.origin}/foundry/join/${roomId}?code=${effectiveCode}`
    : '';

  return (
    <div style={S.root}>
      <style>{`
        @keyframes foundryPulse { 0%,100%{opacity:1} 50%{opacity:0.2} }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
      `}</style>

      {/* Video — full screen */}
      <div style={S.videoWrap}>{children}</div>

      {/* Top bar */}
      <div style={S.topBar}>
        <div style={S.topLeft}>
          <div style={S.sessionTitle}>{sessionTitle || 'Foundry'}</div>
          <div style={S.timer}>
            <Timer startTime={startTime} />
            {isRecording && ' · REC'}
          </div>
          {/* View switcher */}
          <div style={S.viewRow}>
            {[
              { id: 'grid',         label: '⊞ Grid' },
              { id: 'speaker',      label: '▣ Speaker' },
              { id: 'focus',        label: '⛶ Focus' },
              { id: 'presentation', label: '▤ Present' },
            ].map(opt => (
              <button
                key={opt.id}
                style={S.viewBtn(activeView === opt.id)}
                onClick={() => onViewChange?.(opt.id)}
                aria-pressed={activeView === opt.id}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <button style={S.endBtn} onClick={onEnd}>{isHost ? 'End' : 'Leave'}</button>
      </div>

      {/* Recording badge */}
      {isRecording && (
        <div style={S.recBadge}>
          <div style={S.recDot} />
          Recording
        </div>
      )}

      {/* Bottom controls */}
      <div style={S.bottomBar}>
        {/* Mic */}
        <button style={S.ctrlBtn(micMuted, micMuted)} onClick={onMicToggle}>
          <span style={S.ctrlIcon}>{micMuted ? '🔇' : '🎤'}</span>
          <span style={S.ctrlLabel}>{micMuted ? 'Unmute' : 'Mute'}</span>
        </button>

        {/* Camera */}
        <button style={S.ctrlBtn(camOff, camOff)} onClick={onCamToggle}>
          <span style={S.ctrlIcon}>{camOff ? '📵' : '📹'}</span>
          <span style={S.ctrlLabel}>Camera</span>
        </button>

        {/* Chat — with unread badge */}
        <button style={S.ctrlBtn(activeSheet === 'chat', false)} onClick={() => setActiveSheet(activeSheet === 'chat' ? null : 'chat')}>
          <span style={S.ctrlIcon}>💬</span>
          <span style={S.ctrlLabel}>Chat</span>
          {(unreadChat + unreadDms) > 0 && <span style={S.badge}>{(unreadChat + unreadDms) > 9 ? '9+' : (unreadChat + unreadDms)}</span>}
        </button>

        {/* Files */}
        <button style={S.ctrlBtn(activeSheet === 'files', false)} onClick={() => setActiveSheet(activeSheet === 'files' ? null : 'files')}>
          <span style={S.ctrlIcon}>📁</span>
          <span style={S.ctrlLabel}>Files</span>
          {(safeSharedFiles.length > 0) && <span style={S.badge}>{safeSharedFiles.length > 9 ? '9+' : safeSharedFiles.length}</span>}
        </button>

        {/* People */}
        <button style={S.ctrlBtn(activeSheet === 'people', false)} onClick={() => setActiveSheet(activeSheet === 'people' ? null : 'people')}>
          <span style={S.ctrlIcon}>👥</span>
          <span style={S.ctrlLabel}>People{safeParticipants.length > 0 ? ` (${safeParticipants.length})` : ''}</span>
        </button>

        {/* Notes — promoted from More for quick access */}
        <button style={S.ctrlBtn(activeSheet === 'notes', false)} onClick={() => setActiveSheet(activeSheet === 'notes' ? null : 'notes')}>
          <span style={S.ctrlIcon}>📝</span>
          <span style={S.ctrlLabel}>Notes</span>
        </button>

        {/* More */}
        <button style={{ ...S.ctrlBtn(activeSheet === 'more', false) }} onClick={() => setActiveSheet(activeSheet === 'more' ? null : 'more')}>
          <span style={S.ctrlIcon}>⋯</span>
          <span style={S.ctrlLabel}>More</span>
        </button>
      </div>

      {/* Sheet backdrop */}
      {activeSheet && <div style={S.backdrop} onClick={closeSheet} />}

      {/* ── PEOPLE SHEET ──────────────────────────────────────────────── */}
      {activeSheet === 'people' && (
        <div style={S.sheet}>
          <div style={S.sheetHandle}><div style={S.sheetHandleBar} /></div>
          <div style={S.sheetHeader}>
            <span style={S.sheetTitle}>In this Foundry ({safeParticipants.length})</span>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {isHost && (
                <button
                  style={{ ...S.hostCtrlBtn, color: '#FF7043', borderColor: 'rgba(255,112,67,0.3)', fontSize: 12, padding: '5px 10px' }}
                  onClick={() => setActiveSheet('invite')}
                >
                  + Invite
                </button>
              )}
              <button style={S.sheetClose} onClick={closeSheet}>×</button>
            </div>
          </div>
          <div style={S.sheetBody}>
            {isHost && (
              <>
                {/* Lobby panel — admit/co-host controls */}
                <FoundryLobbyPanel
                  roomId={roomId}
                  participants={safeParticipants}
                  coHostUserId={coHostUserId}
                  coHostName={coHostName}
                  isHost={isHost}
                  onCoHostAssigned={onCoHostAssigned}
                />
                <div style={{ marginBottom: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button style={{ ...S.hostCtrlBtn, fontSize: 12, padding: '7px 12px' }} onClick={() => { onMuteAll?.(); closeSheet(); }}>
                    🔇 Mute all
                  </button>
                  <button style={{ ...S.hostCtrlBtn, fontSize: 12, padding: '7px 12px' }} onClick={() => { onLockRoom?.(); closeSheet(); }}>
                    🔒 Lock Foundry
                  </button>
                  <button
                    style={{ ...S.hostCtrlBtn, fontSize: 12, padding: '7px 12px', color: ORANGE, borderColor: 'rgba(255,112,67,0.3)' }}
                    onClick={() => setActiveSheet('invite')}
                  >
                    + Invite
                  </button>
                </div>
              </>
            )}
            {/* Guest mobile: quick DM to host */}
            {isGuest && safeParticipants.filter(p => p.isHost && !p.local).length > 0 && (
              <div style={{ marginBottom: 12 }}>
                {safeParticipants.filter(p => p.isHost && !p.local).map(p => (
                  <button key={p.id} style={{ ...S.hostCtrlBtn, width: '100%', padding: '10px', textAlign: 'center', color: '#FF7043', borderColor: 'rgba(255,112,67,0.3)', marginBottom: 6 }}
                    onClick={() => { onSelectDmParticipant?.(p); setActiveSheet('dm'); }}>
                    💬 Message {p.name || 'Host'}
                  </button>
                ))}
              </div>
            )}
            {safeParticipants.map(p => (
              <div key={p.id} style={S.participantRow}>
                {p.avatarUrl
                  ? <img src={p.avatarUrl} alt={p.name} style={{ ...S.participantAvatar, objectFit: 'cover' }} />
                  : <div style={S.participantAvatar}>{initials(p.name)}</div>
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={S.participantName}>{p.name}{p.local ? ' (You)' : ''}</div>
                  <div style={S.participantRole}>{p.isHost ? 'Host' : 'Participant'}</div>
                </div>
                <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: 14, color: p.micMuted ? '#ef5350' : '#4caf50' }}>{p.micMuted ? '🔇' : '🎤'}</span>
                  <span style={{ fontSize: 14, color: p.videoOff ? '#ef5350' : '#4caf50' }}>{p.videoOff ? '📵' : '📹'}</span>
                  {!p.local && (isHost || (isGuest && p.isHost)) && (
  <>
    <button
      style={S.hostCtrlBtn}
      onClick={() => {
        onSelectDmParticipant?.(p);
        setActiveSheet('dm');
      }}
    >
      DM
    </button>

    {isHost && (
      <>
        {!p.micMuted && (
  <button style={S.hostCtrlBtn} onClick={() => onMuteParticipant?.(p)}>Mute</button>
)}

{!p.videoOff && (
  <button style={S.hostCtrlBtn} onClick={() => onStopParticipantCamera?.(p)}>Stop video</button>
)}

        {p.isScreenSharing && <button style={S.hostCtrlBtn} onClick={() => onStopParticipantShare?.(p)}>Stop share</button>}

        <button style={S.hostCtrlBtn} onClick={() => onKickParticipant?.(p)}>Kick</button>

        <button style={S.banBtn} onClick={() => onBanParticipant?.(p)}>Ban</button>
      </>
    )}
  </>
)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CHAT SHEET ────────────────────────────────────────────────── */}
      {activeSheet === 'chat' && (
        <div style={{ ...S.sheet, maxHeight: '82vh' }}>
          <div style={S.sheetHandle}><div style={S.sheetHandleBar} /></div>
          <div style={S.sheetHeader}>
            <span style={S.sheetTitle}>Chat</span>
            <button style={S.sheetClose} onClick={closeSheet}>×</button>
          </div>

          <div style={{ display: 'flex', gap: 6, padding: '10px 16px 0' }}>
            <button
              style={{
                flex: 1,
                background: chatMode === 'meeting' ? 'rgba(255,112,67,0.18)' : 'rgba(255,255,255,0.06)',
                border: chatMode === 'meeting' ? '1px solid rgba(255,112,67,0.35)' : '1px solid rgba(255,255,255,0.08)',
                color: chatMode === 'meeting' ? ORANGE : '#aaa',
                borderRadius: 8,
                padding: '8px 10px',
                fontSize: 12,
                fontWeight: 700,
                fontFamily: 'inherit',
              }}
              onClick={() => setChatMode('meeting')}
            >
              Meeting Chat {unreadChat > 0 && <span style={S.inlineBadge}>{unreadChat > 9 ? '9+' : unreadChat}</span>}
            </button>
            <button
              style={{
                flex: 1,
                background: chatMode === 'dms' ? 'rgba(255,112,67,0.18)' : 'rgba(255,255,255,0.06)',
                border: chatMode === 'dms' ? '1px solid rgba(255,112,67,0.35)' : '1px solid rgba(255,255,255,0.08)',
                color: chatMode === 'dms' ? ORANGE : '#aaa',
                borderRadius: 8,
                padding: '8px 10px',
                fontSize: 12,
                fontWeight: 700,
                fontFamily: 'inherit',
              }}
              onClick={() => setChatMode('dms')}
            >
              Direct Messages {unreadDms > 0 && <span style={S.inlineBadge}>{unreadDms > 9 ? '9+' : unreadDms}</span>}
            </button>
          </div>

          {chatMode === 'meeting' && (
            <>
              <div style={{ ...S.sheetBody, paddingBottom: 0 }}>
                <div style={S.chatMessages}>
                  {safeMessages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#444', fontSize: 12, padding: '20px 0' }}>
                      Chat is visible to everyone in this Foundry. Messages disappear when the session ends.
                    </div>
                  ) : (
                    safeMessages.map((msg, i) => (
                      <div key={i} style={S.chatMsg}>
                        {msg.avatarUrl
                          ? <img src={msg.avatarUrl} alt={msg.sender} style={{ ...S.chatAvatar, objectFit: 'cover' }} />
                          : <div style={S.chatAvatar}>{initials(msg.sender)}</div>
                        }
                        <div>
                          <span style={S.chatSender}>{msg.sender}</span>
                          <span style={S.chatTime}>{formatLocalChatTime(msg.createdAt || msg.time)}</span>
                          <div style={S.chatText}>{msg.text}</div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
              <div style={S.chatInputRow}>
                <input
                  style={S.chatInput}
                  placeholder="Send to everyone…"
                  value={chatDraft}
                  onChange={e => setChatDraft(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendChat()}
                  autoFocus
                />
                <button style={S.chatSendBtn} onClick={sendChat}>→</button>
              </div>
            </>
          )}

          {chatMode === 'dms' && (
            <div style={S.sheetBody}>
              {safeParticipants.filter((p) => !p.local).length === 0 ? (
                <div style={{ textAlign: 'center', color: '#444', fontSize: 12, padding: '20px 0' }}>
                  No one else is in this Foundry yet.
                </div>
              ) : (
                safeParticipants.filter((p) => !p.local).map((participant) => {
                  const last = safeSessionDms
                    .filter((dm) => dm.fromSessionId === participant.id || dm.toSessionId === participant.id)
                    .slice(-1)[0];

                  return (
                    <button
                      key={participant.id}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 0',
                        background: 'none',
                        border: 'none',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        textAlign: 'left',
                        fontFamily: 'inherit',
                      }}
                      onClick={() => {
                        onSelectDmParticipant?.(participant);
                        setActiveSheet('dm');
                      }}
                    >
                      {participant.avatarUrl
                        ? <img src={participant.avatarUrl} alt={participant.name} style={{ ...S.participantAvatar, objectFit: 'cover' }} />
                        : <div style={S.participantAvatar}>{initials(participant.name)}</div>
                      }
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={S.participantName}>{participant.name || 'Participant'}</div>
                        <div style={{ fontSize: 11, color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {last ? `${last.fromName}: ${last.text}` : 'Tap to message'}
                        </div>
                      </div>
                      <span style={{ fontSize: 11, color: ORANGE, fontWeight: 700 }}>
                        {participant.isGuest || !participant.userId ? 'Guest' : 'DM'}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

{activeSheet === 'dm' && (
  <div style={{ ...S.sheet, maxHeight: '82vh' }}>
    <div style={S.sheetHandle}><div style={S.sheetHandleBar} /></div>

    <div style={S.sheetHeader}>
      <span style={S.sheetTitle}>
        DM · {selectedDmParticipant?.name || 'Participant'}
      </span>

      <button
        style={S.sheetClose}
        onClick={closeSheet}
      >
        ×
      </button>
    </div>

    <div style={{ ...S.sheetBody, paddingBottom: 0 }}>
      <div style={S.chatMessages}>
        {(sessionDms || [])
          .filter(dm =>
            dm.fromSessionId === selectedDmParticipant?.id ||
            dm.toSessionId === selectedDmParticipant?.id
          )
          .map(dm => {
            const isMine = dm.toSessionId === selectedDmParticipant?.id;
            return (
              <div key={dm.id} style={{
                marginBottom: 10,
                display: 'flex',
                flexDirection: 'column',
                alignItems: isMine ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  display: 'flex', gap: 6, alignItems: 'baseline', marginBottom: 3,
                  flexDirection: isMine ? 'row-reverse' : 'row',
                }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: isMine ? '#FF7043' : '#b0b8c8' }}>
                    {isMine ? 'You' : dm.fromName}
                  </span>
                  <span style={{ fontSize: 10, color: '#4a5568' }}>
                    {formatLocalChatTime(dm.createdAt || dm.time)}
                  </span>
                </div>
                <div style={{
                  maxWidth: '80%',
                  background: isMine ? 'rgba(255,112,67,0.18)' : 'rgba(255,255,255,0.08)',
                  border: isMine ? '1px solid rgba(255,112,67,0.28)' : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: isMine ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
                  padding: '8px 12px',
                  color: isMine ? '#ffe0d8' : '#d4dae4',
                  fontSize: 13,
                  lineHeight: 1.5,
                }}>
                  {dm.text}
                </div>
              </div>
            );
          })}
      </div>
    </div>

    <div style={S.chatInputRow}>
      <input
  style={S.chatInput}
  placeholder={`Message ${selectedDmParticipant?.name || ''}`}
  value={dmDraft}
  onChange={(e) => setDmDraft(e.target.value)}
  onKeyDown={(e) => {
    if (
      e.key === 'Enter' &&
      dmDraft.trim() &&
      selectedDmParticipant
    ) {
      onSendDm?.(
        selectedDmParticipant,
        dmDraft.trim()
      );

      setDmDraft('');
    }
  }}
/>

      <button
  style={S.chatSendBtn}
  onClick={() => {
    if (!dmDraft.trim() || !selectedDmParticipant) return;

    onSendDm?.(
      selectedDmParticipant,
      dmDraft.trim()
    );

    setDmDraft('');
  }}
>
  →
</button>
    </div>
  </div>
)}

      {/* ── FILES SHEET ───────────────────────────────────────────────── */}
      {activeSheet === 'files' && (
        <div style={{ ...S.sheet, maxHeight: '85vh' }}>
          <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) onUpload?.(f); e.target.value = ''; }} />
          <div style={S.sheetHandle}><div style={S.sheetHandleBar} /></div>
          <div style={S.sheetHeader}>
            <span style={S.sheetTitle}>Files</span>
            <button style={S.sheetClose} onClick={closeSheet}>×</button>
          </div>
          <div style={S.sheetBody}>

            {/* Shared files */}
            <div style={S.filesSection}>
              <div style={S.filesSectionHeader}>
                <div style={S.filesSectionTitle}>
                  <span style={{ color: '#4caf50' }}>⊞</span>
                  Shared in session
                  <span style={S.filesSectionCount}>{safeSharedFiles.length}</span>
                </div>
                {canUploadFromDevice && (
  <button style={S.copyBtn} onClick={() => fileInputRef.current?.click()}>+ Add</button>
)}
              </div>
              {safeSharedFiles.length === 0 ? (
                <div style={S.emptyFiles}>Nothing shared yet. Share from Your Forge below.</div>
              ) : (
                safeSharedFiles.map((f, i) => (
                  <div key={f.id || i} style={S.fileRow} onClick={() => openSharedFile(f)}>
                    <span style={{ fontSize: 20 }}>📄</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={S.fileName}>{f.name}</div>
                      <div style={S.fileMeta}>{f.sharedBy || 'Shared'} · {f.ago || 'just now'}</div>
                    </div>
                    {f.hasFile && <button style={S.fileOpenBtn} onClick={e => { e.stopPropagation(); openSharedFile(f); }}>Open ↗</button>}
                    {isHost && f.id && (
                      <button
                        style={{ ...S.hostCtrlBtn, fontSize: 16, padding: '2px 6px' }}
                        onClick={e => { e.stopPropagation(); onRemoveFile?.(f); }}
                        title="Remove"
                      >×</button>
                    )}
                  </div>
                ))
              )}
            </div>

            {!isGuest && (
              <>
                <div style={S.filesDivider} />

                {/* Your Forge */}
                <div style={S.filesSection}>
                  <div style={S.filesSectionHeader}>
                    <div style={S.filesSectionTitle}>
                      <span style={{ color: ORANGE }}>🔨</span>
                      Your Forge
                    </div>
                    <button style={{ ...S.copyBtn, background: 'rgba(255,112,67,0.12)', borderColor: 'rgba(255,112,67,0.25)' }} onClick={() => onShare?.()}>↗ Share</button>
                  </div>
                  {safeForgeFiles.length === 0 ? (
                    <div style={{ fontSize: 11, color: '#3a3a3a', padding: '8px 0' }}>No documents in your Forge yet.</div>
                  ) : (
                    safeForgeFiles.slice(0, 8).map((f, i) => (
                      <div key={i} style={S.fileRow} onClick={() => onShare?.(f)}>
                        <span style={{ fontSize: 18 }}>📋</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={S.fileName}>{f.name}</div>
                          <div style={S.fileMeta}>{f.type} · {f.ago}</div>
                        </div>
                        <button style={S.fileShareBtn} onClick={e => { e.stopPropagation(); onShare?.(f); }}>↗</button>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
{canUploadFromDevice && (
  <>
    <div style={S.filesDivider} />

    {/* Device upload */}
    <div style={S.filesSection}>
      <div style={S.filesSectionHeader}>
        <div style={S.filesSectionTitle}>
          <span style={{ color: '#666' }}>💻</span>
          From Device
        </div>
      </div>
      <button style={S.uploadBtn} onClick={() => fileInputRef.current?.click()}>
        <span style={{ fontSize: 24, color: 'rgba(255,255,255,0.1)' }}>↑</span>
        <span>Tap to upload a file</span>
      </button>
    </div>
  </>
)}
          </div>
        </div>
      )}

      {/* ── NOTES SHEET ───────────────────────────────────────────────── */}
      {activeSheet === 'notes' && (
        <div style={{ ...S.sheet, maxHeight: '85vh' }}>
          <div style={S.sheetHandle}><div style={S.sheetHandleBar} /></div>
          <div style={S.sheetHeader}>
            <span style={S.sheetTitle}>📝 Session Notes</span>
            <button style={S.sheetClose} onClick={closeSheet}>×</button>
          </div>
          <div style={S.sheetBody}>
            <textarea
              style={S.notesArea}
              value={notesDraft}
              onChange={e => handleNotesChange(e.target.value)}
              placeholder="Quick notes, action items, reminders…"
              rows={10}
              autoFocus
            />
            <div style={S.notesSaveState}>
              {notesSaveState === 'saving' ? '⏳ Saving…' : notesSaveState === 'saved' ? '✓ Saved' : '💾 Auto-saves as you type'}
            </div>
            <div style={S.notesAiHint}>
              <span style={{ fontSize: 18, color: 'rgba(255,112,67,0.35)', flexShrink: 0 }}>🧠</span>
              <div>
                <div style={{ fontSize: 11, color: '#444', lineHeight: 1.6 }}>Forge AI will generate a structured coaching debrief at session end.</div>
                <div style={{ fontSize: 10, color: ORANGE, opacity: 0.5, marginTop: 2 }}>Coming soon · Forge Intelligence</div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ── SETTINGS SHEET ───────────────────────────────────────────── */}
      {activeSheet === 'settings' && (
        <div style={{ ...S.sheet, maxHeight: '85vh' }}>
          <div style={S.sheetHandle}><div style={S.sheetHandleBar} /></div>
          <div style={S.sheetHeader}>
            <span style={S.sheetTitle}>Foundry Settings</span>
            <button style={S.sheetClose} onClick={closeSheet}>×</button>
          </div>
          <div style={S.sheetBody}>
            {mobileSettingsError && (
              <div style={{
                color: '#ffcdd2',
                background: 'rgba(198,40,40,0.14)',
                border: '1px solid rgba(198,40,40,0.28)',
                borderRadius: 9,
                padding: 10,
                fontSize: 12,
                lineHeight: 1.5,
                marginBottom: 12,
              }}>
                {mobileSettingsError}
              </div>
            )}

            <label style={{ ...S.inviteLabel, display: 'block' }}>Camera</label>
            <select
              style={{ ...S.chatInput, width: '100%', borderRadius: 9, marginBottom: 12 }}
              value={mobileCameraId}
              onChange={(e) => setMobileCameraId(e.target.value)}
            >
              {mobileCameras.length === 0 ? <option value="">Default camera</option> : null}
              {mobileCameras.map((device, index) => (
                <option key={device.deviceId || `camera-${index}`} value={device.deviceId}>
                  {device.label || `Camera ${index + 1}`}
                </option>
              ))}
            </select>

            <label style={{ ...S.inviteLabel, display: 'block' }}>Microphone</label>
            <select
              style={{ ...S.chatInput, width: '100%', borderRadius: 9, marginBottom: 12 }}
              value={mobileMicId}
              onChange={(e) => setMobileMicId(e.target.value)}
            >
              {mobileMicrophones.length === 0 ? <option value="">Default microphone</option> : null}
              {mobileMicrophones.map((device, index) => (
                <option key={device.deviceId || `mic-${index}`} value={device.deviceId}>
                  {device.label || `Microphone ${index + 1}`}
                </option>
              ))}
            </select>

            <label style={{ ...S.inviteLabel, display: 'block' }}>Speaker</label>
            <select
              style={{ ...S.chatInput, width: '100%', borderRadius: 9, marginBottom: 12 }}
              value={mobileSpeakerId}
              onChange={(e) => setMobileSpeakerId(e.target.value)}
            >
              {mobileSpeakers.length === 0 ? <option value="">System default output</option> : null}
              {mobileSpeakers.map((device, index) => (
                <option key={device.deviceId || `speaker-${index}`} value={device.deviceId}>
                  {device.label || `Speaker ${index + 1}`}
                </option>
              ))}
            </select>

            <label style={{ ...S.inviteLabel, display: 'block' }}>Background</label>
            <select
              style={{ ...S.chatInput, width: '100%', borderRadius: 9, marginBottom: 12 }}
              value={mobileBackground}
              onChange={(e) => { setMobileBackground(e.target.value); setBgError(''); }}
            >
              {backgroundOptions.map((backgroundOption) => (
                <option key={backgroundOption.id} value={backgroundOption.id}>
                  {backgroundOption.label}
                </option>
              ))}
            </select>
            {bgError && (
              <div style={{ fontSize: 11, color: '#ef5350', marginBottom: 8, lineHeight: 1.5 }}>
                {bgError}
              </div>
            )}

            <button
              style={{ ...S.chatSendBtn, width: '100%', borderRadius: 9, padding: '12px 14px', opacity: mobileSettingsSaving ? 0.7 : 1 }}
              onClick={applyMobileSettings}
              disabled={mobileSettingsSaving}
            >
              {mobileSettingsSaving ? 'Applying…' : 'Apply Settings'}
            </button>
          </div>
        </div>
      )}

{/* ── BROWSER HELP SHEET ─────────────────────────────────────── */}
{activeSheet === 'browser-help' && (
  <div style={{ ...S.sheet, maxHeight: '85vh' }}>
    <div style={S.sheetHandle}>
      <div style={S.sheetHandleBar} />
    </div>

    <div style={S.sheetHeader}>
      <span style={S.sheetTitle}>Help & Troubleshooting</span>
      <button style={S.sheetClose} onClick={closeSheet}>
        ×
      </button>
    </div>

    <div style={S.sheetBody}>
      <FoundryBrowserHelp isMobile />
    </div>
  </div>
)}

      {/* ── INVITE SHEET ─────────────────────────────────────────────── */}
      {activeSheet === 'invite' && (
        <div style={{ ...S.sheet, maxHeight: '90vh' }}>
          <div style={S.sheetHandle}><div style={S.sheetHandleBar} /></div>
          <div style={S.sheetHeader}>
            <span style={S.sheetTitle}>Invite to Foundry</span>
            <button style={S.sheetClose} onClick={closeSheet}>×</button>
          </div>
          <div style={S.sheetBody}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              {['contacts', 'external', 'links'].map(invTab => (
                <button
                  key={invTab}
                  style={{
                    flex: 1,
                    background: inviteTab === invTab ? 'rgba(255,112,67,0.18)' : 'rgba(255,255,255,0.06)',
                    border: inviteTab === invTab ? '1px solid rgba(255,112,67,0.35)' : '1px solid rgba(255,255,255,0.08)',
                    color: inviteTab === invTab ? ORANGE : '#aaa',
                    borderRadius: 8, padding: '8px 4px',
                    fontSize: 11, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
                  }}
                  onClick={() => setInviteTab(invTab)}
                >
                  {invTab === 'contacts' ? 'Contacts' : invTab === 'external' ? 'External' : 'Links'}
                </button>
              ))}
            </div>
            {inviteError && <div style={{ fontSize: 11, color: '#ef5350', marginBottom: 10, lineHeight: 1.5 }}>{inviteError}</div>}
            {inviteMessage && <div style={{ fontSize: 11, color: '#4caf50', marginBottom: 10, lineHeight: 1.5 }}>{inviteMessage}</div>}

            {inviteTab === 'contacts' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input
                  style={{ ...S.chatInput, borderRadius: 9, marginBottom: 4 }}
                  placeholder="Search FT contacts…"
                  value={inviteContactQuery}
                  onChange={invEv => setInviteContactQuery(invEv.target.value)}
                />
                {inviteContacts.length === 0 && (
                  <div style={{ fontSize: 11, color: '#444', padding: '12px 0', textAlign: 'center', lineHeight: 1.6 }}>
                    No eligible contacts found. People already in the room or invite list are hidden.
                  </div>
                )}
                {inviteContacts
                  .filter(invContact => {
                    const invQuery = inviteContactQuery.trim().toLowerCase();
                    if (!invQuery) return true;
                    return [invContact.name, invContact.email, invContact.role].filter(Boolean).join(' ').toLowerCase().includes(invQuery);
                  })
                  .slice(0, 10)
                  .map(invContact => (
                    <div key={invContact.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px', background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8,
                    }}>
                      {invContact.avatarUrl
                        ? <img src={invContact.avatarUrl} alt={invContact.name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                        : <div style={{ ...S.participantAvatar, width: 32, height: 32, fontSize: 11, flexShrink: 0 }}>{(invContact.name || '?')[0].toUpperCase()}</div>
                      }
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: '#ddd', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{invContact.name}</div>
                        <div style={{ fontSize: 10, color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{invContact.email || invContact.role || 'ForgeTomorrow'}</div>
                      </div>
                      <button
                        disabled={inviteBusy}
                        style={{ ...S.hostCtrlBtn, color: ORANGE, borderColor: 'rgba(255,112,67,0.3)', flexShrink: 0 }}
                        onClick={() => sendInternalInvite(invContact)}
                      >
                        Invite
                      </button>
                    </div>
                  ))
                }
              </div>
            )}

            {inviteTab === 'external' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label style={{ ...S.inviteLabel, display: 'block' }}>Guest name (optional)</label>
                  <input
                    style={{ ...S.chatInput, width: '100%', borderRadius: 9, boxSizing: 'border-box' }}
                    placeholder="Jane Smith"
                    value={externalName}
                    onChange={extEv => setExternalName(extEv.target.value)}
                  />
                </div>
                <div>
                  <label style={{ ...S.inviteLabel, display: 'block' }}>Email address</label>
                  <input
                    style={{ ...S.chatInput, width: '100%', borderRadius: 9, boxSizing: 'border-box' }}
                    placeholder="guest@company.com"
                    value={externalEmail}
                    onChange={extEv => setExternalEmail(extEv.target.value)}
                    onKeyDown={extEv => extEv.key === 'Enter' && sendExternalInvite()}
                    type="email"
                    inputMode="email"
                    autoCapitalize="none"
                  />
                </div>
                <button
                  style={{ ...S.chatSendBtn, borderRadius: 9, padding: '12px', opacity: inviteBusy ? 0.7 : 1 }}
                  disabled={inviteBusy}
                  onClick={sendExternalInvite}
                >
                  {inviteBusy ? 'Sending…' : '+ Send guest invite'}
                </button>
                <div style={{ fontSize: 10, color: '#444', lineHeight: 1.6 }}>
                  Guest receives an email with a direct join link. No ForgeTomorrow account required.
                </div>
              </div>
            )}

            {inviteTab === 'links' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {ftLink && (
                  <div>
                    <div style={S.inviteLabel}>ForgeTomorrow members</div>
                    <div style={S.inviteLinkRow}>
                      <span style={S.inviteLinkText}>{ftLink}</span>
                      <button style={S.copyBtn} onClick={() => copyText('ft', ftLink)}>{copiedLink === 'ft' ? '✓' : 'Copy'}</button>
                    </div>
                  </div>
                )}
                {guestLink && (
                  <div>
                    <div style={S.inviteLabel}>External guests</div>
                    <div style={S.inviteLinkRow}>
                      <span style={S.inviteLinkText}>{guestLink}</span>
                      <button style={S.copyBtn} onClick={() => copyText('guest', guestLink)}>{copiedLink === 'guest' ? '✓' : 'Copy'}</button>
                    </div>
                  </div>
                )}
                {effectiveCode && (
                  <div>
                    <div style={S.inviteLabel}>Guest code</div>
                    <div style={S.inviteLinkRow}>
                      <span style={S.inviteLinkText}>{effectiveCode}</span>
                      <button style={S.copyBtn} onClick={() => copyText('code', effectiveCode)}>{copiedLink === 'code' ? '✓' : 'Copy'}</button>
                    </div>
                  </div>
                )}
                {!ftLink && !guestLink && (
                  <div style={{ fontSize: 12, color: '#444', padding: '20px 0', textAlign: 'center' }}>
                    Invite links are loading…
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MORE SHEET ────────────────────────────────────────────────── */}
      {activeSheet === 'more' && (
        <div style={{ ...S.sheet, maxHeight: '90vh' }}>
          <div style={S.sheetHandle}><div style={S.sheetHandleBar} /></div>
          <div style={S.sheetHeader}>
            <span style={S.sheetTitle}>More options</span>
            <button style={S.sheetClose} onClick={closeSheet}>×</button>
          </div>
          <div style={S.sheetBody}>
            <div style={S.moreMenu}>

              {/* Settings — mobile equivalent of desktop Foundry settings */}
              <button style={S.moreItem} onClick={openMobileSettings}>
                <span style={S.moreIcon}>⚙</span>
                <div>
                  <div style={S.moreLabel}>Settings</div>
                  <div style={S.moreSublabel}>Camera, microphone, speaker, and background</div>
                </div>
              </button>

<button
  style={S.moreItem}
  onClick={() => {
    closeSheet();
    setActiveSheet('browser-help');
  }}
>
  <span style={S.moreIcon}>🌐</span>
  <div>
    <div style={S.moreLabel}>Help & Troubleshooting</div>
    <div style={S.moreSublabel}>
      Browser setup, permissions, downloads, screen sharing
    </div>
  </div>
</button>

              {/* Notes — quick access */}
              <button style={S.moreItem} onClick={() => setActiveSheet('notes')}>
                <span style={S.moreIcon}>📝</span>
                <div>
                  <div style={S.moreLabel}>Session Notes</div>
                  <div style={S.moreSublabel}>Quick notes & action items</div>
                </div>
              </button>

              {/* Screen share */}
              {screenShareSupported ? (
                <button style={S.moreItem} onClick={() => { onShareScreen?.(); closeSheet(); }}>
                  <span style={S.moreIcon}>📺</span>
                  <span style={S.moreLabel}>{isScreenSharing ? 'Stop sharing screen' : 'Share screen'}</span>
                </button>
              ) : (
                <div style={{ ...S.moreItem, cursor: 'default', opacity: 0.4 }}>
                  <span style={S.moreIcon}>📺</span>
                  <div>
                    <div style={S.moreLabel}>Share screen</div>
                    <div style={S.moreSublabel}>Not supported on this device</div>
                  </div>
                </div>
              )}

              {/* Record — hosts/co-hosts only */}
              {isHost && (
                <button style={S.moreItem} onClick={() => { onRecordToggle?.(); closeSheet(); }}>
                  <span style={S.moreIcon}>{isRecording ? '⏹' : '⏺'}</span>
                  <span style={S.moreLabel}>{isRecording ? 'Stop recording' : 'Record session'}</span>
                </button>
              )}

              {/* Invite — host only */}
              {isHost && !isGuest && (
                <>
                  <div style={S.moreSep} />
                  <div style={{ padding: '8px 4px 4px' }}>
                    <div style={{ fontSize: 11, color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Invite links</div>

                    {ftLink && (
                      <div style={S.inviteSection}>
                        <div style={S.inviteLabel}>ForgeTomorrow members</div>
                        <div style={S.inviteLinkRow}>
                          <span style={S.inviteLinkText}>{ftLink}</span>
                          <button style={S.copyBtn} onClick={() => copyText('ft', ftLink)}>
                            {copiedLink === 'ft' ? '✓' : 'Copy'}
                          </button>
                        </div>
                      </div>
                    )}

                    {guestLink && (
                      <div style={S.inviteSection}>
                        <div style={S.inviteLabel}>External guests</div>
                        <div style={S.inviteLinkRow}>
                          <span style={S.inviteLinkText}>{guestLink}</span>
                          <button style={S.copyBtn} onClick={() => copyText('guest', guestLink)}>
                            {copiedLink === 'guest' ? '✓' : 'Copy'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Host controls */}
              {isHost && (
                <>
                  <div style={S.moreSep} />
                  <div style={{ padding: '4px 4px 2px', fontSize: 10, color: '#444', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Host Controls</div>
                  <button style={S.moreItem} onClick={onToggleGuestFileSharing}>
  <span style={S.moreIcon}>{guestFileSharingAllowed ? '✅' : '⬜'}</span>
  <div>
    <div style={S.moreLabel}>Allow guest file uploads</div>
    <div style={S.moreSublabel}>
      {guestFileSharingAllowed ? 'Guests can upload from their device' : 'Guests cannot upload files'}
    </div>
  </div>
</button>
                  <div style={S.moreSep} />
                  <button style={S.moreItem} onClick={() => { onMuteAll?.(); closeSheet(); }}>
                    <span style={S.moreIcon}>🔇</span>
                    <span style={S.moreLabel}>Mute all participants</span>
                  </button>
                  <button style={S.moreItem} onClick={() => { onLockRoom?.(); closeSheet(); }}>
                    <span style={S.moreIcon}>🔒</span>
                    <span style={S.moreLabel}>Lock / unlock Foundry</span>
                  </button>
                  <div style={S.moreSep} />
                  <button style={{ ...S.moreItem }} onClick={() => { closeSheet(); onEnd?.(); }}>
                    <span style={S.moreIcon}>📵</span>
                    <span style={{ ...S.moreLabel, color: '#ef5350' }}>End Foundry for all</span>
                  </button>
                </>
              )}

              {!isHost && (
                <>
                  <div style={S.moreSep} />
                  <button style={S.moreItem} onClick={() => { closeSheet(); onEnd?.(); }}>
                    <span style={S.moreIcon}>🚪</span>
                    <span style={S.moreLabel}>Leave Foundry</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}