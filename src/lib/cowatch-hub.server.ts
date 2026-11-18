export type ControlMode = 'host-only' | 'everyone';
export type ParticipantRole = 'host' | 'guest';
export type CompanionMessageKind = 'chat' | 'comment' | 'feedback';

export type CoWatchParticipant = {
  id: string;
  name: string;
  role: ParticipantRole;
  joinedAt: number;
};

export type CoWatchMessage = {
  id: string;
  author: string;
  kind: CompanionMessageKind;
  text: string;
  createdAt: number;
};

export type CoWatchRoomState = {
  roomId: string;
  title: string;
  hostId: string;
  controlMode: ControlMode;
  playing: boolean;
  currentTime: number;
  playbackSeq: number;
  updatedAt: number;
  updatedBy: string;
  closed: boolean;
  participants: CoWatchParticipant[];
  messages: CoWatchMessage[];
};

export type CoWatchServerEvent =
  | { type: 'room:state'; room: CoWatchRoomState }
  | { type: 'playback:sync'; room: CoWatchRoomState }
  | { type: 'control:mode'; room: CoWatchRoomState }
  | { type: 'chat:message'; room: CoWatchRoomState; message: CoWatchMessage }
  | { type: 'room:ended'; room: CoWatchRoomState };

type RoomListener = (event: CoWatchServerEvent) => void;

type InternalRoom = {
  state: CoWatchRoomState;
  listeners: Set<RoomListener>;
};

const globalStore = globalThis as typeof globalThis & {
  __novaCoWatchRooms?: Map<string, InternalRoom>;
};

function getRoomMap(): Map<string, InternalRoom> {
  if (!globalStore.__novaCoWatchRooms) {
    globalStore.__novaCoWatchRooms = new Map<string, InternalRoom>();
  }
  return globalStore.__novaCoWatchRooms;
}

export function normalizeRoomId(raw: string): string {
  const cleaned = raw.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
  if (!cleaned) return '';
  return cleaned.startsWith('CW-') ? cleaned : `CW-${cleaned.replace(/^CW/, '')}`;
}

function broadcast(room: InternalRoom, event: CoWatchServerEvent): void {
  const snapshot = cloneState(room.state);
  const payload: CoWatchServerEvent =
    event.type === 'chat:message'
      ? { type: 'chat:message', room: snapshot, message: { ...event.message } }
      : { type: event.type, room: snapshot };
  for (const listener of room.listeners) {
    try {
      listener(payload);
    } catch {
      room.listeners.delete(listener);
    }
  }
}

function cloneState(state: CoWatchRoomState): CoWatchRoomState {
  return {
    ...state,
    participants: state.participants.map(p => ({ ...p })),
    messages: state.messages.map(m => ({ ...m })),
  };
}

export function getCoWatchRoom(roomId: string): CoWatchRoomState | null {
  const key = normalizeRoomId(roomId);
  const room = getRoomMap().get(key);
  return room ? cloneState(room.state) : null;
}

export function createCoWatchRoom(params: {
  roomId: string;
  title: string;
  hostId: string;
  hostName?: string;
  playing?: boolean;
  currentTime?: number;
  controlMode?: ControlMode;
}): CoWatchRoomState {
  const key = normalizeRoomId(params.roomId);
  const map = getRoomMap();
  const existing = map.get(key);
  const now = Date.now();

  if (existing && !existing.state.closed) {
    if (!existing.state.participants.some(p => p.id === params.hostId)) {
      existing.state.participants.push({
        id: params.hostId,
        name: params.hostName?.trim() || 'TV Host',
        role: 'host',
        joinedAt: now,
      });
      broadcast(existing, { type: 'room:state', room: existing.state });
    }
    return cloneState(existing.state);
  }

  const initialState: CoWatchRoomState = {
    roomId: key,
    title: params.title.trim() || 'NOVA Stream',
    hostId: params.hostId,
    controlMode: params.controlMode ?? 'host-only',
    playing: Boolean(params.playing),
    currentTime: Math.max(0, Number(params.currentTime ?? 0) || 0),
    playbackSeq: 1,
    updatedAt: now,
    updatedBy: params.hostId,
    closed: false,
    participants: [
      {
        id: params.hostId,
        name: params.hostName?.trim() || 'TV Host',
        role: 'host',
        joinedAt: now,
      },
    ],
    messages: [],
  };

  const entry: InternalRoom = {
    state: initialState,
    listeners: existing?.listeners ?? new Set<RoomListener>(),
  };
  map.set(key, entry);
  broadcast(entry, { type: 'room:state', room: entry.state });
  return cloneState(entry.state);
}

export function joinCoWatchRoom(params: {
  roomId: string;
  participantId: string;
  name?: string | undefined;
  title?: string | undefined;
}): CoWatchRoomState {
  const key = normalizeRoomId(params.roomId);
  const map = getRoomMap();
  let room = map.get(key);
  const now = Date.now();

  if (!room || room.state.closed) {
    createCoWatchRoom({
      roomId: key,
      title: params.title?.trim() || 'NOVA Co-Watch Party',
      hostId: params.participantId,
      hostName: params.name?.trim() || 'Host',
    });
    room = map.get(key)!;
    return cloneState(room.state);
  }

  // Idempotent guard against reconnect duplicates.
  if (!room.state.participants.some(p => p.id === params.participantId)) {
    room.state.participants.push({
      id: params.participantId,
      name: params.name?.trim() || `Guest ${room.state.participants.length}`,
      role: params.participantId === room.state.hostId ? 'host' : 'guest',
      joinedAt: now,
    });
    broadcast(room, { type: 'room:state', room: room.state });
  }
  return cloneState(room.state);
}

export function setCoWatchControlMode(params: {
  roomId: string;
  actorId: string;
  controlMode: ControlMode;
}): { ok: true; room: CoWatchRoomState } | { ok: false; status: number; error: string } {
  const key = normalizeRoomId(params.roomId);
  const room = getRoomMap().get(key);
  if (!room || room.state.closed) {
    return { ok: false, status: 404, error: 'Co-Watch room not found or has ended.' };
  }
  if (params.actorId !== room.state.hostId) {
    return { ok: false, status: 403, error: 'Only the host can change control permissions.' };
  }
  room.state.controlMode = params.controlMode;
  room.state.updatedAt = Date.now();
  broadcast(room, { type: 'control:mode', room: room.state });
  return { ok: true, room: cloneState(room.state) };
}

export function syncCoWatchPlayback(params: {
  roomId: string;
  actorId: string;
  playing: boolean;
  currentTime: number;
}): { ok: true; room: CoWatchRoomState } | { ok: false; status: number; error: string } {
  const key = normalizeRoomId(params.roomId);
  const room = getRoomMap().get(key);
  if (!room || room.state.closed) {
    return { ok: false, status: 404, error: 'Co-Watch room not found or has ended.' };
  }
  if (room.state.controlMode === 'host-only' && params.actorId !== room.state.hostId) {
    return { ok: false, status: 403, error: 'Host Only Control is enabled.' };
  }
  room.state.playing = Boolean(params.playing);
  room.state.currentTime = Math.max(0, Number(params.currentTime) || 0);
  room.state.playbackSeq += 1;
  room.state.updatedAt = Date.now();
  room.state.updatedBy = params.actorId;
  broadcast(room, { type: 'playback:sync', room: room.state });
  return { ok: true, room: cloneState(room.state) };
}

export function addCoWatchMessage(params: {
  roomId: string;
  id: string;
  author: string;
  kind: CompanionMessageKind;
  text: string;
}): { ok: true; room: CoWatchRoomState } | { ok: false; status: number; error: string } {
  const key = normalizeRoomId(params.roomId);
  const room = getRoomMap().get(key);
  if (!room || room.state.closed) {
    return { ok: false, status: 404, error: 'Co-Watch room not found or has ended.' };
  }
  const cleanText = params.text.trim().slice(0, 400);
  if (!cleanText) {
    return { ok: false, status: 400, error: 'Message text cannot be empty.' };
  }
  // Idempotent duplicate check.
  if (room.state.messages.some(m => m.id === params.id)) {
    return { ok: true, room: cloneState(room.state) };
  }
  const msg: CoWatchMessage = {
    id: params.id,
    author: params.author.trim().slice(0, 40) || 'Viewer',
    kind: params.kind,
    text: cleanText,
    createdAt: Date.now(),
  };
  room.state.messages = [...room.state.messages.slice(-79), msg];
  broadcast(room, { type: 'chat:message', room: room.state, message: msg });
  return { ok: true, room: cloneState(room.state) };
}

export function leaveCoWatchRoom(params: {
  roomId: string;
  participantId: string;
}): { ok: true; room: CoWatchRoomState | null } {
  const key = normalizeRoomId(params.roomId);
  const room = getRoomMap().get(key);
  if (!room) return { ok: true, room: null };
  room.state.participants = room.state.participants.filter(p => p.id !== params.participantId);
  broadcast(room, { type: 'room:state', room: room.state });
  return { ok: true, room: cloneState(room.state) };
}

export function endCoWatchRoom(params: {
  roomId: string;
  actorId: string;
}): { ok: true; room: CoWatchRoomState } | { ok: false; status: number; error: string } {
  const key = normalizeRoomId(params.roomId);
  const room = getRoomMap().get(key);
  if (!room) {
    return { ok: false, status: 404, error: 'Co-Watch room not found.' };
  }
  if (params.actorId !== room.state.hostId) {
    return { ok: false, status: 403, error: 'Only the host can end this party.' };
  }
  room.state.closed = true;
  room.state.updatedAt = Date.now();
  broadcast(room, { type: 'room:ended', room: room.state });
  return { ok: true, room: cloneState(room.state) };
}

export function subscribeCoWatchRoom(roomId: string, listener: RoomListener): () => void {
  const key = normalizeRoomId(roomId);
  const map = getRoomMap();
  let room = map.get(key);
  if (!room) {
    // Initialize listener bucket so TV / companion opening stream first receives initial room events cleanly.
    room = {
      state: {
        roomId: key,
        title: 'NOVA Co-Watch',
        hostId: '',
        controlMode: 'host-only',
        playing: false,
        currentTime: 0,
        playbackSeq: 0,
        updatedAt: Date.now(),
        updatedBy: '',
        closed: false,
        participants: [],
        messages: [],
      },
      listeners: new Set<RoomListener>(),
    };
    map.set(key, room);
  }
  room.listeners.add(listener);
  return () => {
    room?.listeners.delete(listener);
  };
}
