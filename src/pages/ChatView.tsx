/**
 * ChatView — the main messaging interface for a 1:1 conversation.
 *
 * Features: optimistic send with pending/failed/retry states,
 * lock glyph privacy explainer, accessible keyboard nav.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import {
  ArrowLeft,
  Lock,
  Send,
  Loader2,
  ShieldCheck,
  Info,
  AlertCircle,
  RotateCw,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuthor } from '@/hooks/useAuthor';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useConversations } from '@/hooks/useConversations';
import { useSendMessage } from '@/hooks/useSendMessage';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { NostrMetadata } from '@nostrify/nostrify';
import type { DecryptedMessage } from '@/lib/secure/nip17';

interface PendingMessage {
  id: string;
  content: string;
  createdAt: number;
  status: 'sending' | 'failed';
}

export default function ChatView() {
  const { npub } = useParams<{ npub: string }>();
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const { conversations, isLoading } = useConversations();
  const sendMessage = useSendMessage();
  const t = useT();

  const [messageText, setMessageText] = useState('');
  const [lockInfoOpen, setLockInfoOpen] = useState(false);
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Decode npub to hex pubkey
  let recipientPubkey: string | null = null;
  try {
    if (npub) {
      const decoded = nip19.decode(npub);
      if (decoded.type === 'npub') {
        recipientPubkey = decoded.data;
      } else if (decoded.type === 'nprofile') {
        recipientPubkey = decoded.data.pubkey;
      }
    }
  } catch {
    // Invalid npub
  }

  const author = useAuthor(recipientPubkey ?? undefined);
  const metadata: NostrMetadata | undefined = author.data?.metadata;
  const displayName = metadata?.name || metadata?.display_name || (npub ? npub.slice(0, 12) + '…' : 'Unknown');

  // Find messages for this conversation
  const messages = conversations
    .find((c) => recipientPubkey && c.participants.includes(recipientPubkey))
    ?.messages ?? [];

  // Remove pending messages that now appear in the real list
  useEffect(() => {
    if (messages.length > 0) {
      setPendingMessages((prev) =>
        prev.filter((pm) => !messages.some((m) => m.content === pm.content && Math.abs(m.createdAt - pm.createdAt) < 10)),
      );
    }
  }, [messages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, pendingMessages.length]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, [recipientPubkey]);

  const doSend = useCallback(async (text: string, pendingId: string) => {
    if (!recipientPubkey || !user) return;

    try {
      await sendMessage.mutateAsync({
        recipientPubkeys: [recipientPubkey],
        content: text,
      });
      // Remove from pending on success
      setPendingMessages((prev) => prev.filter((m) => m.id !== pendingId));
    } catch {
      // Mark as failed
      setPendingMessages((prev) =>
        prev.map((m) => (m.id === pendingId ? { ...m, status: 'failed' as const } : m)),
      );
    }
  }, [recipientPubkey, user, sendMessage]);

  const handleSend = useCallback(async () => {
    const text = messageText.trim();
    if (!text || !recipientPubkey || !user) return;

    const pendingId = `pending-${Date.now()}-${Math.random()}`;
    const pending: PendingMessage = {
      id: pendingId,
      content: text,
      createdAt: Math.floor(Date.now() / 1000),
      status: 'sending',
    };

    setMessageText('');
    setPendingMessages((prev) => [...prev, pending]);
    inputRef.current?.focus();

    doSend(text, pendingId);
  }, [messageText, recipientPubkey, user, doSend]);

  const handleRetry = (pending: PendingMessage) => {
    setPendingMessages((prev) =>
      prev.map((m) => (m.id === pending.id ? { ...m, status: 'sending' as const } : m)),
    );
    doSend(pending.content, pending.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!recipientPubkey) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Invalid contact address.
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
        <Lock className="size-10 text-brand-indigo mb-4" />
        <p className="text-lg font-semibold mb-2">Sign in to chat</p>
        <p className="text-sm text-muted-foreground">
          You need a Nostr identity to send encrypted messages.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background">
      {/* Chat header */}
      <header className="flex-none flex items-center gap-3 px-4 py-2.5 border-b bg-card">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full size-8 md:hidden"
          onClick={() => navigate('/app')}
          aria-label={t('nav.back')}
        >
          <ArrowLeft className="size-4" />
        </Button>

        <Link to={`/${npub}`} className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar>
            {metadata?.picture && <AvatarImage src={metadata.picture} alt={displayName} />}
            <AvatarFallback>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground truncate font-mono">
              {npub?.slice(0, 16)}…
            </p>
          </div>
        </Link>

        <Button
          variant="ghost"
          size="icon"
          className="rounded-full size-8"
          onClick={() => setLockInfoOpen(true)}
          aria-label="Encryption info"
        >
          <Lock className="size-4 text-brand-indigo" />
        </Button>
      </header>

      {/* Messages area */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-1">
          {isLoading && messages.length === 0 && (
            <div className="space-y-3 py-8">
              {Array.from({ length: 3 }).map((_, i) => (
                <MessageSkeleton key={i} alignRight={i % 2 === 0} />
              ))}
            </div>
          )}

          {!isLoading && messages.length === 0 && pendingMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="size-14 rounded-2xl bg-brand-indigo/10 flex items-center justify-center mb-4">
                <ShieldCheck className="size-7 text-brand-indigo" />
              </div>
              <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                This conversation is end-to-end encrypted. Send your first message below.
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} isMine={msg.senderPubkey === user.pubkey} />
          ))}

          {/* Pending / optimistic messages */}
          {pendingMessages.map((pm) => (
            <PendingBubble key={pm.id} message={pm} onRetry={() => handleRetry(pm)} />
          ))}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message input */}
      <div className="flex-none border-t bg-card px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('chat.messagePlaceholder')}
            rows={1}
            aria-label="Message input"
            className={cn(
              'flex-1 resize-none rounded-2xl border bg-secondary px-4 py-2.5 text-sm',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent',
              'placeholder:text-muted-foreground max-h-32',
            )}
            style={{ height: 'auto', minHeight: '2.5rem' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
            }}
          />
          <Button
            size="icon"
            className="rounded-full size-10 flex-none"
            onClick={handleSend}
            disabled={!messageText.trim()}
            aria-label="Send message"
          >
            <Send className="size-4" />
          </Button>
        </div>
      </div>

      {/* Lock info dialog */}
      <Dialog open={lockInfoOpen} onOpenChange={setLockInfoOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="size-5 text-brand-indigo" />
              {t('chat.encrypted.title')}
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <p>{t('chat.encrypted.dm', { name: displayName })}</p>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-secondary text-xs">
                  <Info className="size-4 flex-none mt-0.5 text-brand-indigo" />
                  <p>{t('chat.encrypted.detail')}</p>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MessageBubble({ message, isMine }: { message: DecryptedMessage; isMine: boolean }) {
  const time = new Date(message.createdAt * 1000).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
          isMine
            ? 'bg-brand-indigo text-white rounded-br-md'
            : 'bg-secondary text-foreground rounded-bl-md',
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <div className={cn('flex items-center gap-1 mt-1', isMine ? 'justify-end' : 'justify-start')}>
          <Lock className="size-2.5 opacity-50" />
          <span className="text-[10px] opacity-60">{time}</span>
        </div>
      </div>
    </div>
  );
}

function PendingBubble({ message, onRetry }: { message: PendingMessage; onRetry: () => void }) {
  const time = new Date(message.createdAt * 1000).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="flex justify-end">
      <div
        className={cn(
          'max-w-[80%] sm:max-w-[70%] rounded-2xl rounded-br-md px-4 py-2.5 text-sm leading-relaxed',
          message.status === 'failed'
            ? 'bg-brand-indigo/60 text-white'
            : 'bg-brand-indigo/80 text-white',
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <div className="flex items-center gap-1.5 mt-1 justify-end">
          {message.status === 'sending' ? (
            <>
              <Loader2 className="size-2.5 animate-spin opacity-60" />
              <span className="text-[10px] opacity-60">{time}</span>
            </>
          ) : (
            <button
              type="button"
              onClick={onRetry}
              className="flex items-center gap-1 text-[10px] opacity-80 hover:opacity-100 transition-opacity"
              aria-label="Retry sending"
            >
              <AlertCircle className="size-3" />
              <span>Failed</span>
              <RotateCw className="size-2.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function MessageSkeleton({ alignRight }: { alignRight: boolean }) {
  return (
    <div className={cn('flex', alignRight ? 'justify-end' : 'justify-start')}>
      <Skeleton className={cn('h-10 rounded-2xl', alignRight ? 'w-48' : 'w-56')} />
    </div>
  );
}
