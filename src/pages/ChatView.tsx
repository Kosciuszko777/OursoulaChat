/**
 * ChatView — the main messaging interface for a 1:1 conversation.
 *
 * Renders message bubbles, message input, lock glyph privacy explainer,
 * and delivery status. All messages are encrypted — there is no toggle.
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
import { cn } from '@/lib/utils';
import type { NostrMetadata } from '@nostrify/nostrify';
import type { DecryptedMessage } from '@/lib/secure/nip17';

export default function ChatView() {
  const { npub } = useParams<{ npub: string }>();
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const { conversations, isLoading } = useConversations();
  const sendMessage = useSendMessage();

  const [messageText, setMessageText] = useState('');
  const [lockInfoOpen, setLockInfoOpen] = useState(false);
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

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, [recipientPubkey]);

  const handleSend = useCallback(async () => {
    const text = messageText.trim();
    if (!text || !recipientPubkey || !user) return;

    setMessageText('');
    try {
      await sendMessage.mutateAsync({
        recipientPubkeys: [recipientPubkey],
        content: text,
      });
    } catch {
      // Error is handled by the mutation hook
      setMessageText(text); // Restore on failure
    }
    inputRef.current?.focus();
  }, [messageText, recipientPubkey, user, sendMessage]);

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
          aria-label="Back"
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

        {/* Lock glyph — tapping opens the privacy explainer */}
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

          {!isLoading && messages.length === 0 && (
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
            <MessageBubble
              key={msg.id}
              message={msg}
              isMine={msg.senderPubkey === user.pubkey}
            />
          ))}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message input */}
      <div className="flex-none border-t bg-card px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message…"
              rows={1}
              className={cn(
                'w-full resize-none rounded-2xl border bg-secondary px-4 py-2.5 text-sm',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent',
                'placeholder:text-muted-foreground',
                'max-h-32',
              )}
              style={{
                height: 'auto',
                minHeight: '2.5rem',
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
              }}
            />
          </div>
          <Button
            size="icon"
            className="rounded-full size-10 flex-none"
            onClick={handleSend}
            disabled={!messageText.trim() || sendMessage.isPending}
            aria-label="Send message"
          >
            {sendMessage.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Lock info dialog — one plain sentence explaining the encryption */}
      <Dialog open={lockInfoOpen} onOpenChange={setLockInfoOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="size-5 text-brand-indigo" />
              End-to-end encrypted
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <p>
                  Only you and <strong className="text-foreground">{displayName}</strong> can read
                  this. Relays see neither the message nor that it is from you.
                </p>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-secondary text-xs">
                  <Info className="size-4 flex-none mt-0.5 text-brand-indigo" />
                  <p>
                    Messages are encrypted with NIP-44 and wrapped in a sealed envelope (NIP-59)
                    before leaving your device. The relay receives only an anonymous, opaque packet
                    addressed to the recipient.
                  </p>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MessageBubble({
  message,
  isMine,
}: {
  message: DecryptedMessage;
  isMine: boolean;
}) {
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
        <div
          className={cn(
            'flex items-center gap-1 mt-1',
            isMine ? 'justify-end' : 'justify-start',
          )}
        >
          <Lock className="size-2.5 opacity-50" />
          <span className={cn('text-[10px] opacity-60')}>{time}</span>
        </div>
      </div>
    </div>
  );
}

function MessageSkeleton({ alignRight }: { alignRight: boolean }) {
  return (
    <div className={cn('flex', alignRight ? 'justify-end' : 'justify-start')}>
      <div className="space-y-1">
        <Skeleton className={cn('h-10 rounded-2xl', alignRight ? 'w-48' : 'w-56')} />
      </div>
    </div>
  );
}
