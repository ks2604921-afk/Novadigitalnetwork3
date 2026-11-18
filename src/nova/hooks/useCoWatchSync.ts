import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  CompanionMessageKind,
  ControlMode,
  CoWatchRoomState,
  CoWatchServerEvent,
  ParticipantRole,
} from '@/lib/cowatch-hub.server';

export type { CompanionMessageKind, ControlMode, CoWatchRoomState, ParticipantRole };

export function generateCoWatchRoomId(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `CW-${num}`;
}

export function getOrCreatePeerId(prefix = 'peer'): string {
  if (typeof window === 'undefined') return `${prefix}-ssr`;
  const storageKey = `nova-cowatch-peer:${prefix}`;
  try {
    const existing = window.sessionStorage.getItem(storageKey);
    if (existing) return existing;
    const created = `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
    window.sessionStorage.setItem(storageKey, created);
    return created;
  } catch {
    return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

export function buildCompanionDashboardUrl(roomId: string, title: string): string {
  const cleanRoom = roomId.trim().toUpperCase();
  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://nova-tv.app';
  const params = new URLSearchParams({ room: cleanRoom, title });
  return `${origin}/cowatch?${params.toString()}`;
}

async function postCoWatchAction(payload: Record<string, unknown>): Promise<CoWatchRoomState | null> {
  if (typeof fetch !== 'function') return null;
  try {
    const res = await fetch('/api/cowatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { room?: CoWatchRoomState | null };
    return data.room ?? null;
  } catch {
    return null;
  }
}

export function useCoWatchSync({
  title,
  initialRoomId,
  preferredRole = 'host',
  participantName = 'TV Viewer',
  onRemotePlayback,
}: {
  title: string;
  initialRoomId?: string;
  preferredRole?: ParticipantRole;
  participantName?: string;
  onRemotePlayback?: (playing: boolean, currentTime: number) => void;
}) {
  const [peerId] = useState(() => getOrCreatePeerId(preferredRole));
  const [roomId, setRoomId] = useState<string>(() => {
    if (initialRoomId?.trim()) return initialRoomId.trim().toUpperCase();
    return '';
  });
  const [role, setRole] = useState<ParticipantRole>(preferredRole);
  const [room, setRoom] = useState<CoWatchRoomState | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');

  const lastSeqRef = useRef(0);
  const onRemotePlaybackRef = useRef(onRemotePlayback);
  onRemotePlaybackRef.current = onRemotePlayback;
  const channelRef = useRef<BroadcastChannel | null>(null);

  const applyServerRoom = useCallback(
    (incoming: CoWatchRoomState | null, eventType?: CoWatchServerEvent['type']) => {
      if (!incoming) return;
      setRoom(incoming);
      if (incoming.hostId) {
        setRole(incoming.hostId === peerId ? 'host' : 'guest');
      }
      if (incoming.closed) {
        setConnected(false);
        return;
      }
      if (
        (eventType === 'playback:sync' || eventType === 'room:state') &&
        incoming.playbackSeq > lastSeqRef.current &&
        incoming.updatedBy !== peerId
      ) {
        lastSeqRef.current = incoming.playbackSeq;
        onRemotePlaybackRef.current?.(incoming.playing, incoming.currentTime);
      } else if (incoming.playbackSeq > lastSeqRef.current) {
        lastSeqRef.current = incoming.playbackSeq;
      }
    },
    [peerId],
  );

  // Subscribe to SSE stream & same-device BroadcastChannel whenever roomId is active.
  useEffect(() => {
    if (!roomId) {
      setConnected(false);
      return;
    }

    let es: EventSource | null = null;
    if (typeof EventSource !== 'undefined') {
      try {
        es = new EventSource(`/api/cowatch?room=${encodeURIComponent(roomId)}&stream=1`);
        es.onopen = () => {
          setConnected(true);
          setError('');
        };
        const handleEvent = (rawEvent: MessageEvent<string>, type: CoWatchServerEvent['type']) => {
          try {
            const parsed = JSON.parse(rawEvent.data) as CoWatchServerEvent;
            applyServerRoom(parsed.room, type);
          } catch {
            /* ignore malformed frame */
          }
        };
        const eventTypes: CoWatchServerEvent['type'][] = [
          'room:state',
          'playback:sync',
          'control:mode',
          'chat:message',
          'room:ended',
        ];
        for (const t of eventTypes) {
          es.addEventListener(t, ev => handleEvent(ev as MessageEvent<string>, t));
        }
        es.onerror = () => {
          setConnected(false);
        };
      } catch {
        setConnected(false);
      }
    }

    let bc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        bc = new BroadcastChannel(`nova-cowatch:${roomId}`);
        channelRef.current = bc;
        bc.onmessage = (ev: MessageEvent<CoWatchServerEvent>) => {
          if (ev.data?.room) {
            applyServerRoom(ev.data.room, ev.data.type);
          }
        };
      } catch {
        channelRef.current = null;
      }
    }

    return () => {
      es?.close();
      bc?.close();
      channelRef.current = null;
    };
  }, [roomId, applyServerRoom]);

  const broadcastLocally = useCallback((type: CoWatchServerEvent['type'], nextRoom: CoWatchRoomState) => {
    try {
      channelRef.current?.postMessage({ type, room: nextRoom });
    } catch {
      /* ignore channel errors */
    }
  }, []);

  const startHostParty = useCallback(
    async (currentTime = 0, playing = false, forceNew = false) => {
      const nextId = !forceNew && roomId ? roomId : generateCoWatchRoomId();
      setRoomId(nextId);
      setRole('host');
      setError('');

      const optimistic: CoWatchRoomState = {
        roomId: nextId,
        title,
        hostId: peerId,
        controlMode: room?.controlMode ?? 'host-only',
        playing,
        currentTime,
        playbackSeq: 1,
        updatedAt: Date.now(),
        updatedBy: peerId,
        closed: false,
        participants: [
          {
            id: peerId,
            name: participantName,
            role: 'host',
            joinedAt: Date.now(),
          },
        ],
        messages: forceNew ? [] : (room?.messages ?? []),
      };
      setRoom(optimistic);

      const serverRoom = await postCoWatchAction({
        action: 'create',
        roomId: nextId,
        title,
        hostId: peerId,
        hostName: participantName,
        playing,
        currentTime,
        controlMode: optimistic.controlMode,
      });
      if (serverRoom) {
        applyServerRoom(serverRoom, 'room:state');
        broadcastLocally('room:state', serverRoom);
      }
      return nextId;
    },
    [roomId, title, peerId, room?.controlMode, room?.messages, participantName, applyServerRoom, broadcastLocally],
  );

  const joinPartyById = useCallback(
    async (targetRoomId: string, nameOverride?: string) => {
      const cleanId = targetRoomId.trim().toUpperCase();
      if (!cleanId) return null;
      const formatted = cleanId.startsWith('CW-') ? cleanId : `CW-${cleanId.replace(/^CW/, '')}`;
      setRoomId(formatted);
      setError('');

      const optimistic: CoWatchRoomState = {
        roomId: formatted,
        title,
        hostId: '',
        controlMode: 'host-only',
        playing: false,
        currentTime: 0,
        playbackSeq: 0,
        updatedAt: Date.now(),
        updatedBy: peerId,
        closed: false,
        participants: [
          {
            id: peerId,
            name: nameOverride?.trim() || participantName,
            role: 'guest',
            joinedAt: Date.now(),
          },
        ],
        messages: [],
      };
      setRole('guest');
      setRoom(optimistic);

      const serverRoom = await postCoWatchAction({
        action: 'join',
        roomId: formatted,
        participantId: peerId,
        name: nameOverride?.trim() || participantName,
        title,
      });
      if (serverRoom) {
        applyServerRoom(serverRoom, 'room:state');
        broadcastLocally('room:state', serverRoom);
        return serverRoom;
      }
      return optimistic;
    },
    [title, peerId, participantName, applyServerRoom, broadcastLocally],
  );

  const setControlMode = useCallback(
    async (mode: ControlMode) => {
      if (!roomId || role !== 'host') return;
      setRoom(prev => (prev ? { ...prev, controlMode: mode } : prev));
      const serverRoom = await postCoWatchAction({
        action: 'set-control-mode',
        roomId,
        actorId: peerId,
        controlMode: mode,
      });
      if (serverRoom) {
        applyServerRoom(serverRoom, 'control:mode');
        broadcastLocally('control:mode', serverRoom);
      }
    },
    [roomId, role, peerId, applyServerRoom, broadcastLocally],
  );

  const canControlPlayback = role === 'host' || room?.controlMode === 'everyone';

  const sendPlaybackSync = useCallback(
    async (playing: boolean, currentTime: number) => {
      if (!roomId || !canControlPlayback) return;
      const serverRoom = await postCoWatchAction({
        action: 'sync-playback',
        roomId,
        actorId: peerId,
        playing,
        currentTime,
      });
      if (serverRoom) {
        applyServerRoom(serverRoom, 'playback:sync');
        broadcastLocally('playback:sync', serverRoom);
      }
    },
    [roomId, canControlPlayback, peerId, applyServerRoom, broadcastLocally],
  );

  const sendMessage = useCallback(
    async (kind: CompanionMessageKind, author: string, text: string) => {
      if (!roomId || !text.trim()) return;
      const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const cleanAuthor = author.trim() || participantName;
      const cleanText = text.trim();
      setRoom(prev =>
        prev
          ? {
              ...prev,
              messages: [
                ...prev.messages,
                { id, author: cleanAuthor, kind, text: cleanText, createdAt: Date.now() },
              ],
            }
          : prev,
      );
      const serverRoom = await postCoWatchAction({
        action: 'send-message',
        roomId,
        id,
        author: cleanAuthor,
        kind,
        text: cleanText,
      });
      if (serverRoom) {
        applyServerRoom(serverRoom, 'chat:message');
        broadcastLocally('chat:message', serverRoom);
      }
    },
    [roomId, participantName, applyServerRoom, broadcastLocally],
  );

  const leaveParty = useCallback(async () => {
    const activeRoom = roomId;
    setRoomId('');
    setRoom(null);
    setConnected(false);
    if (activeRoom) {
      const serverRoom = await postCoWatchAction({
        action: 'leave',
        roomId: activeRoom,
        participantId: peerId,
      });
      if (serverRoom) {
        broadcastLocally('room:state', serverRoom);
      }
    }
  }, [roomId, peerId, broadcastLocally]);

  const endParty = useCallback(async () => {
    const activeRoom = roomId;
    if (activeRoom) {
      const serverRoom = await postCoWatchAction({
        action: 'end',
        roomId: activeRoom,
        actorId: peerId,
      });
      if (serverRoom) {
        broadcastLocally('room:ended', serverRoom);
      }
    }
    setRoomId('');
    setRoom(null);
    setConnected(false);
  }, [roomId, peerId, broadcastLocally]);

  const companionUrl = useMemo(
    () => (roomId ? buildCompanionDashboardUrl(roomId, title) : ''),
    [roomId, title],
  );

  return {
    peerId,
    roomId,
    role,
    room,
    connected,
    error,
    canControlPlayback,
    companionUrl,
    startHostParty,
    joinPartyById,
    setControlMode,
    sendPlaybackSync,
    sendMessage,
    leaveParty,
    endParty,
  };
}
