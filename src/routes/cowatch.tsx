import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import {
  Check,
  ChevronsLeft,
  ChevronsRight,
  Lock,
  LogOut,
  MessageCircle,
  Pause,
  Play,
  Send,
  Share2,
  ThumbsUp,
  Users,
} from 'lucide-react';
import {
  useCoWatchSync,
  type CompanionMessageKind,
} from '@/nova/hooks/useCoWatchSync';

export const Route = createFileRoute('/cowatch')({
  head: () => ({
    meta: [
      { title: 'NOVA Co-Watch — Mobile Companion Dashboard' },
      {
        name: 'description',
        content: 'Invite friends, live chat, comments, feedback and sync playback in your NOVA Co-Watch party.',
      },
    ],
  }),
  component: MobileCompanionDashboard,
});

export function MobileCompanionDashboard() {
  const params =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
  const initialRoom = params.get('room') || '';
  const initialTitle = params.get('title') || 'NOVA Co-Watch Stream';

  const [displayName, setDisplayName] = useState('Mobile Guest');
  const [joinRoomInput, setJoinRoomInput] = useState(initialRoom);
  const [activeFeedTab, setActiveFeedTab] = useState<CompanionMessageKind>('chat');
  const [messageInput, setMessageInput] = useState('');
  const [copiedInvite, setCopiedInvite] = useState(false);

  const {
    roomId,
    room,
    connected,
    canControlPlayback,
    companionUrl,
    joinPartyById,
    sendPlaybackSync,
    sendMessage,
    leaveParty,
  } = useCoWatchSync({
    title: initialTitle,
    initialRoomId: initialRoom,
    preferredRole: 'guest',
    participantName: displayName,
  });

  useEffect(() => {
    if (initialRoom) {
      void joinPartyById(initialRoom, displayName);
    }
    // Join initial room once on mount when opened via QR scan.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const messages = (room?.messages ?? []).filter(m => m.kind === activeFeedTab);

  const handleCopyInvite = () => {
    const text = `Join my NOVA Co-Watch (${roomId}): ${companionUrl}`;
    try {
      if (navigator.clipboard?.writeText) {
        void navigator.clipboard.writeText(text).catch(() => {});
      }
      setCopiedInvite(true);
      window.setTimeout(() => setCopiedInvite(false), 2000);
    } catch {
      /* ignore clipboard error */
    }
  };

  if (room?.closed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#06040d] px-4 text-white">
        <div className="w-full max-w-md rounded-3xl border border-white/15 bg-white/[0.06] p-6 text-center backdrop-blur-xl">
          <h1 className="text-xl font-extrabold">Party Ended by Host</h1>
          <p className="mt-2 text-sm text-white/70">
            Room <span className="font-mono font-bold text-white">{room.roomId}</span> has closed cleanly.
          </p>
          <a
            href="/"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-gradient-to-r from-[#7200ff] to-[#ec4899] px-6 text-sm font-bold text-white"
          >
            Open NOVA Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06040d] px-4 py-6 text-white">
      <div className="mx-auto max-w-xl space-y-4">
        <header className="rounded-3xl border border-white/15 bg-white/[0.06] p-5 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#e879f9]">
                Mobile Companion Dashboard
              </p>
              <h1 className="mt-1 text-lg font-extrabold text-white">
                {room?.title || initialTitle}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/75">
                <span className="rounded-full border border-white/15 bg-white/[0.08] px-2.5 py-0.5 font-mono font-bold text-white">
                  {roomId || 'NO ROOM'}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-[#d8b4fe]" />
                  {room?.participants.length ?? 1} connected
                </span>
                <span className={connected ? 'text-emerald-300' : 'text-amber-300'}>
                  {connected ? 'Live Sync' : 'Ready'}
                </span>
              </div>
            </div>

            {roomId && (
              <button
                type="button"
                onClick={handleCopyInvite}
                className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-[#c084fc]/45 bg-[#7200ff]/30 px-3.5 text-xs font-bold text-white transition hover:bg-[#7200ff]/45"
              >
                {copiedInvite ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
                <span>{copiedInvite ? 'Copied' : 'Invite'}</span>
              </button>
            )}
          </div>

          {!roomId && (
            <form
              onSubmit={e => {
                e.preventDefault();
                if (!joinRoomInput.trim()) return;
                void joinPartyById(joinRoomInput, displayName);
              }}
              className="mt-4 flex flex-wrap gap-2"
            >
              <input
                type="text"
                value={joinRoomInput}
                onChange={e => setJoinRoomInput(e.target.value)}
                placeholder="Enter Room ID (e.g. CW-8492)"
                aria-label="Room ID"
                className="h-10 flex-1 rounded-xl border border-white/20 bg-black/40 px-3 font-mono text-sm uppercase text-white placeholder:text-white/40"
              />
              <button
                type="submit"
                className="h-10 rounded-xl bg-gradient-to-r from-[#7200ff] to-[#ec4899] px-5 text-xs font-bold text-white"
              >
                Join Room
              </button>
            </form>
          )}
        </header>

        {/* Playback Control Card synced to TV controlMode */}
        {roomId && (
          <section className="rounded-3xl border border-white/15 bg-white/[0.06] p-4 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-white/75">
                TV Playback Remote
              </span>
              {!canControlPlayback && (
                <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-0.5 text-[11px] text-amber-200">
                  <Lock className="h-3 w-3" />
                  Host Only Control
                </span>
              )}
            </div>

            <div className="mt-3 flex items-center justify-center gap-4">
              <button
                type="button"
                disabled={!canControlPlayback}
                onClick={() =>
                  void sendPlaybackSync(
                    Boolean(room?.playing),
                    Math.max(0, (room?.currentTime ?? 0) - 10),
                  )
                }
                className="inline-flex h-10 items-center gap-1 rounded-full border border-white/20 bg-white/10 px-4 text-xs font-bold disabled:opacity-40"
              >
                <ChevronsLeft className="h-4 w-4" />
                <span>10s</span>
              </button>

              <button
                type="button"
                disabled={!canControlPlayback}
                aria-label={room?.playing ? 'Pause party video' : 'Play party video'}
                onClick={() =>
                  void sendPlaybackSync(!room?.playing, room?.currentTime ?? 0)
                }
                className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-r from-[#7200ff] to-[#ec4899] text-white shadow-lg disabled:opacity-40"
              >
                {room?.playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </button>

              <button
                type="button"
                disabled={!canControlPlayback}
                onClick={() =>
                  void sendPlaybackSync(
                    Boolean(room?.playing),
                    (room?.currentTime ?? 0) + 10,
                  )
                }
                className="inline-flex h-10 items-center gap-1 rounded-full border border-white/20 bg-white/10 px-4 text-xs font-bold disabled:opacity-40"
              >
                <span>10s</span>
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          </section>
        )}

        {/* Live Chat, Comments, Feedback Tabs */}
        {roomId && (
          <section className="rounded-3xl border border-white/15 bg-white/[0.06] p-4 backdrop-blur-xl">
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'chat', label: 'Live Chat', Icon: MessageCircle },
                  { id: 'comment', label: 'Comments', Icon: Users },
                  { id: 'feedback', label: 'Feedback', Icon: ThumbsUp },
                ] as const
              ).map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveFeedTab(id)}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-bold transition ${
                    activeFeedTab === id
                      ? 'border-[#c084fc] bg-[#7200ff]/35 text-white'
                      : 'border-white/10 bg-white/[0.04] text-white/70 hover:text-white'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            <div className="mt-3 flex items-center gap-2">
              <label htmlFor="companion-name" className="text-[11px] text-white/60">
                Your name:
              </label>
              <input
                id="companion-name"
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="h-7 flex-1 rounded-lg border border-white/15 bg-black/40 px-2 text-xs text-white"
              />
            </div>

            <div className="mt-3 max-h-60 space-y-2 overflow-y-auto rounded-2xl border border-white/10 bg-black/30 p-3">
              {messages.length === 0 ? (
                <p className="py-6 text-center text-xs text-white/50">
                  No {activeFeedTab} yet. Say hello to everyone in {roomId}!
                </p>
              ) : (
                messages.map(msg => (
                  <div
                    key={msg.id}
                    className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs"
                  >
                    <span className="font-bold text-[#e9d5ff]">{msg.author}: </span>
                    <span className="text-white/90">{msg.text}</span>
                  </div>
                ))
              )}
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                if (!messageInput.trim()) return;
                void sendMessage(activeFeedTab, displayName, messageInput);
                setMessageInput('');
              }}
              className="mt-3 flex gap-2"
            >
              <input
                type="text"
                value={messageInput}
                onChange={e => setMessageInput(e.target.value)}
                placeholder={`Write ${activeFeedTab}...`}
                aria-label="Message input"
                className="h-10 flex-1 rounded-xl border border-white/20 bg-black/40 px-3 text-xs text-white placeholder:text-white/40"
              />
              <button
                type="submit"
                aria-label="Send message"
                className="inline-flex h-10 items-center gap-1 rounded-xl bg-gradient-to-r from-[#7200ff] to-[#ec4899] px-4 text-xs font-bold text-white"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Send</span>
              </button>
            </form>
          </section>
        )}

        {roomId && (
          <div className="flex justify-center pt-1">
            <button
              type="button"
              onClick={() => void leaveParty()}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-amber-400/45 bg-amber-500/20 px-5 text-xs font-bold text-amber-100"
            >
              <LogOut className="h-4 w-4" />
              <span>Leave Party</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
