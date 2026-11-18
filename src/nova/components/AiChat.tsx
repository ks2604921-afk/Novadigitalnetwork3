import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { createPortal } from 'react-dom';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message';
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  type PromptInputMessage,
} from '@/components/ai-elements/prompt-input';
import { Shimmer } from '@/components/ai-elements/shimmer';
import ChatGptMark from '@/nova/components/ChatGptMark';
import { Button } from '@/components/ui/button';

const SUGGESTIONS = ['Aaj raat kya dekhun?', 'Kuch funny Hindi series batao', 'Premium plan mein kya milta hai?'];

type Origin = { x: number; y: number };
const BOUNCY = [0.34, 1.56, 0.64, 1] as const;

function TypingHint({ active }: { active: boolean }) {
  const reducedMotion = useReducedMotion();
  const [phrase, setPhrase] = useState(0);
  const [length, setLength] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const current = SUGGESTIONS[phrase] ?? SUGGESTIONS[0] ?? '';

  useEffect(() => {
    if (!active || reducedMotion) return;
    const atEnd = length === current.length && !deleting;
    const atStart = length === 0 && deleting;
    const timer = window.setTimeout(() => {
      if (atEnd) setDeleting(true);
      else if (atStart) { setDeleting(false); setPhrase(value => (value + 1) % SUGGESTIONS.length); }
      else setLength(value => value + (deleting ? -1 : 1));
    }, atEnd ? 1800 : atStart ? 350 : deleting ? 30 : 65);
    return () => window.clearTimeout(timer);
  }, [active, reducedMotion, current, length, deleting]);

  if (!active) return null;
  return <span aria-hidden="true" className="pointer-events-none absolute inset-x-3 top-3 z-10 flex items-center gap-0.5 overflow-hidden text-sm"><span className="nova-ai-gradient-text truncate">{reducedMotion ? 'ChatGPT se kuch bhi poochhein...' : current.slice(0, length)}</span><span className="nova-ai-caret h-4 w-px shrink-0 bg-nova-accent" /></span>;
}

function ChatPanel({ onClose, origin }: { onClose: () => void; origin: Origin }) {
  const [text, setText] = useState('');
  const [chatError, setChatError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { messages, sendMessage, status, stop } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
    onError: (error) => {
      const msg = error.message || '';
      setChatError(msg.includes('not configured') ? 'ChatGPT replies abhi available nahi hain. Thodi der baad try karein.' : 'AI se connect nahi ho paya. Dobara try karein.');
      if (msg.includes('429')) toast.error('Bahut saare requests. Thodi der baad try karein.');
      else if (msg.includes('402')) toast.error('AI credits khatam ho gaye hain.');
      else toast.error('AI se connect nahi ho paya. Dobara try karein.');
    },
  });
  const busy = status === 'submitted' || status === 'streaming';

  useEffect(() => {
    if (!busy) textareaRef.current?.focus();
  }, [busy]);

  const send = (value: string) => {
    const v = value.trim();
    if (!v || busy) return;
    setChatError('');
    void sendMessage({ text: v });
    setText('');
  };

  const handleSubmit = (message: PromptInputMessage) => send(message.text ?? '');

  return (
    <motion.div
      className="dark fixed inset-0 z-[120] flex items-end justify-center bg-[#0f1219]/[0.92] sm:items-center"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.3, delay: 0.05 } }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        role="dialog"
        initial={{ x: origin.x, y: origin.y, scale: 0.04, opacity: 0, borderRadius: 999 }}
        animate={{ x: 0, y: 0, scale: 1, opacity: 1, borderRadius: 24, transition: { duration: 0.55, ease: BOUNCY } }}
        exit={{ x: origin.x, y: origin.y, scale: 0.04, opacity: 0, borderRadius: 999, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } }}
        aria-label="ChatGPT chat"
        onClick={(e) => e.stopPropagation()}
        className="flex h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-nova-line bg-nova-black text-foreground shadow-2xl sm:h-[80vh] sm:rounded-3xl"
      >
        <header className="flex shrink-0 items-center gap-3 border-b border-nova-line px-4 py-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-nova-dark p-1.5 text-nova-text">
            <ChatGptMark className="h-full w-full" />
          </span>

          <div className="flex-1">
            <p className="nova-ai-gradient-text text-sm font-bold">Ask ChatGPT</p>
            <p className="text-[11px] text-nova-muted">Aapka watch buddy</p>
          </div>
          <Button variant="novaAction" size="icon" onClick={onClose} aria-label="Close chat" className="h-9 w-9 rounded-full p-0">
            <X className="h-5 w-5" />
          </Button>
        </header>

        <Conversation className="min-h-0 flex-1">
          <ConversationContent>
            {messages.length === 0 ? (
              <ConversationEmptyState className="h-auto p-0 py-4">
                <div className="flex flex-col items-center gap-3">
                  <ChatGptMark className="nova-ai-float h-[72px] w-[72px] text-nova-text" />
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold">Namaste! Main ChatGPT hoon</h3>
                    <p className="text-xs text-nova-muted">Mood batao, main dekhne ke liye kuch accha dhoondh deta hoon.</p>
                  </div>
                  <div className="mt-2 flex flex-wrap justify-center gap-2">
                    {SUGGESTIONS.map((s) => (
                      <Button variant="novaAction" key={s} onClick={() => send(s)} className="nova-pill h-auto whitespace-normal rounded-full border border-white/10 px-3 py-1.5 text-xs text-nova-text hover:brightness-125">
                        {s}
                      </Button>
                    ))}
                  </div>
                </div>
              </ConversationEmptyState>
            ) : (
              messages.map((m) => (
                <Message key={m.id} from={m.role}>
                  <MessageContent className="group-[.is-user]:bg-nova-red group-[.is-user]:text-nova-text">
                    {m.parts.map((part, i) =>
                      part.type === 'text' ? (
                        m.role === 'assistant' ? <MessageResponse key={i}>{part.text}</MessageResponse> : <span key={i} className="whitespace-pre-wrap">{part.text}</span>
                      ) : null,
                    )}
                  </MessageContent>
                </Message>
              ))
            )}
            {status === 'submitted' && (
              <Message from="assistant">
                <MessageContent>
                  <Shimmer>Soch raha hoon...</Shimmer>
                </MessageContent>
              </Message>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="shrink-0 border-t border-nova-line p-3">
          {chatError && <p role="alert" className="mb-2 text-xs text-nova-muted">{chatError}</p>}
          <div className="nova-ai-prompt-glow">
            <PromptInput onSubmit={handleSubmit} className="relative">
              <TypingHint active={!text && !busy} />
              <PromptInputTextarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                aria-label="Ask ChatGPT"
                placeholder=""
                autoFocus
              />
              <PromptInputFooter className="justify-end">
                <PromptInputSubmit status={status} onStop={stop} disabled={!busy && !text.trim()} />
              </PromptInputFooter>
            </PromptInput>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function TypingLabel() {
  const word = 'ChatGPT';
  const [n, setN] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setN(v => (v >= word.length + 8 ? 0 : v + 1)), n === 0 ? 700 : 140);
    return () => clearTimeout(t);
  }, [n]);
  return (
    <span className="nova-ai-gradient-text inline-flex whitespace-nowrap" aria-hidden>
      Ask&nbsp;{word.slice(0, Math.min(n, word.length))}<span className="nova-ai-caret">|</span>
    </span>
  );
}

export default function AiChatButton({ className = '', onOpenChange }: { className?: string; onOpenChange?: (open: boolean) => void }) {
  const [open, setOpen] = useState(false);
  const [origin, setOrigin] = useState<Origin>({ x: 0, y: 0 });
  useEffect(() => {
    onOpenChange?.(open);
    if (!open) return;
    document.documentElement.dataset['novaChat'] = 'open';
    return () => { delete document.documentElement.dataset['novaChat']; };
  }, [open]);
  const openFrom = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    const sm = window.matchMedia('(min-width: 640px)').matches;
    const panelCenterY = sm ? window.innerHeight / 2 : window.innerHeight * 0.575;
    setOrigin({ x: r.left + r.width / 2 - window.innerWidth / 2, y: r.top + r.height / 2 - panelCenterY });
    setOpen(true);
  };
  return (
    <>
      <Button variant="novaAction"
        onClick={(e) => openFrom(e.currentTarget)}
        aria-label="Open ChatGPT chat"
        className={`nova-pill h-7 shrink-0 gap-1 rounded-full border border-white/10 bg-[#0f1219]/[0.92] py-0.5 pl-1 pr-2 text-[10px] font-semibold hover:brightness-125 ${className}`}
      >
        <ChatGptMark className="!h-5 !w-5 text-nova-text" />
        <TypingLabel />

      </Button>
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>{open && <ChatPanel key="ai-chat" origin={origin} onClose={() => setOpen(false)} />}</AnimatePresence>,
          document.body,
        )}
    </>
  );
}
