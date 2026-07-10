/**
 * GroupChatView — messaging interface for group conversations.
 *
 * Shows sender names on each bubble, group info header, member count,
 * and the lock-glyph explainer adapted for groups.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Lock,
  Send,
  Loader2,
  ShieldCheck,
  Info,
  Users,
} from 'lucide-react';
import { nip19 } from 'nostr-tools';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuthor } from '@/hooks/useAuthor';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useConversations } from '@/hooks/useConversations';
import { useSendMessage } from '@/hooks/useSendMessage';
import { cn } from '@/lib/utils';
import type { NostrMetadata } from '@nostrify/nostrify';
import type { DecryptedMessage } from '@/lib/secure/nip17';

export default function GroupChatView() {
  const { id: rawId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const { conversations, isLoading } = useConversations();
  const sendMessage = useSendMessage();

  const [messageText, setMessageText] = useState('');
  const [lockInfoOpen, setLockInfoOpen] = useState(false);
  const [groupInfoOpen, setGroupInfoOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Decode the conversation ID from the URL
  const conversationId = rawId ? decodeURIComponent(rawId) : '';
  const participants = conversationId ? conversationId.split(',') : [];
  const otherMembers = participants.filter((pk) => pk !== user?.pubkey);

  // Find the matching conversation
  const conversation = conversations.find((c) => c.id === conversationId);
  const messages = conversation?.messages ?? [];
  const groupName = conversation?.subject ?? `Group (${participants.length})`;

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [conversationId]);

  const handleSend = useCallback(async () => {
    const text = messageText.trim();
    if (!text || otherMembers.length === 0 || !user) return;

    setMessageText('');
    try {
      await sendMessage.mutateAsync({
        recipientPubkeys: otherMembers,
        content: text,
      });
    } catch {
      setMessageText(text);
    }
    inputRef.current?.focus();
  }, [messageText, otherMembers, user, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

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

  if (participants.length < 2) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Invalid group.
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background">
      {/* Group chat header */}
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

        <button
          type="button"
          className="flex items-center gap-3 flex-1 min-w-0 text-left"
          onClick={() => setGroupInfoOpen(true)}
        >
          <div className="size-8 rounded-full bg-brand-indigo/15 flex items-center justify-center flex-none">
            <Users className="size-4 text-brand-indigo" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{groupName}</p>
            <p className="text-xs text-muted-foreground">
              {participants.length} members
            </p>
          </div>
        </button>

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

      {/* Messages */}
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
              <p className="font-semibold mb-1">{groupName}</p>
              <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                Each member receives their own sealed copy. Relays see no group. Send the first message below.
              </p>
            </div>
          )}

          {messages.map((msg, i) => {
            const isMine = msg.senderPubkey === user.pubkey;
            const prevMsg = messages[i - 1];
            const showSender = !isMine && prevMsg?.senderPubkey !== msg.senderPubkey;

            return (
              <GroupMessageBubble
                key={msg.id}
                message={msg}
                isMine={isMine}
                showSender={showSender}
              />
            );
          })}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="flex-none border-t bg-card px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message…"
            rows={1}
            className={cn(
              'flex-1 resize-none rounded-2xl border bg-secondary px-4 py-2.5 text-sm',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent',
              'placeholder:text-muted-foreground max-h-32',
            )}
            style={{ height: 'auto', minHeight: '2.5rem' }}
            onInput={(e) => {
              const t = e.target as HTMLTextAreaElement;
              t.style.height = 'auto';
              t.style.height = `${Math.min(t.scrollHeight, 128)}px`;
            }}
          />
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

      {/* Lock info dialog — group variant */}
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
                  Each member receives their own sealed copy. Relays see no group structure, no
                  member list, and no message content.
                </p>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-secondary text-xs">
                  <Info className="size-4 flex-none mt-0.5 text-brand-indigo" />
                  <p>
                    Every message is individually gift-wrapped (NIP-59) to each of the{' '}
                    {participants.length} members. This means {participants.length} sealed
                    envelopes per message — more wraps, but no group metadata leaks.
                  </p>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Group info dialog */}
      <GroupInfoDialog
        isOpen={groupInfoOpen}
        onClose={() => setGroupInfoOpen(false)}
        participants={participants}
        groupName={groupName}
        currentUserPubkey={user.pubkey}
      />
    </div>
  );
}

/** Group info dialog showing member list. */
function GroupInfoDialog({
  isOpen,
  onClose,
  participants,
  groupName,
  currentUserPubkey,
}: {
  isOpen: boolean;
  onClose: () => void;
  participants: string[];
  groupName: string;
  currentUserPubkey: string;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-sm rounded-2xl max-h-[80dvh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="size-5 text-brand-indigo" />
            {groupName}
          </DialogTitle>
          <DialogDescription>
            {participants.length} members · End-to-end encrypted
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0 -mx-6">
          <div className="px-6 space-y-1">
            {participants.map((pk) => (
              <GroupMemberRow
                key={pk}
                pubkey={pk}
                isAdmin={pk === currentUserPubkey}
                isYou={pk === currentUserPubkey}
              />
            ))}
          </div>
        </ScrollArea>

        <div className="flex items-start gap-2 p-3 rounded-lg bg-secondary text-xs text-muted-foreground">
          <Lock className="size-4 flex-none mt-0.5 text-brand-indigo" />
          <p>
            Removing a member stops wrapping new messages to them. Past messages they received
            remain on their device — forward secrecy is not claimed.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function GroupMemberRow({
  pubkey,
  isAdmin,
  isYou,
}: {
  pubkey: string;
  isAdmin: boolean;
  isYou: boolean;
}) {
  const author = useAuthor(pubkey);
  const metadata: NostrMetadata | undefined = author.data?.metadata;
  const displayName = metadata?.name || metadata?.display_name || nip19.npubEncode(pubkey).slice(0, 16) + '…';

  return (
    <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-secondary/50">
      <Avatar size="sm">
        {metadata?.picture && <AvatarImage src={metadata.picture} alt={displayName} />}
        <AvatarFallback>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <span className="text-sm truncate">{displayName}</span>
        {isYou && <span className="text-xs text-muted-foreground ml-1">(you)</span>}
      </div>
      {isAdmin && (
        <span className="text-[10px] font-medium text-brand-indigo bg-brand-indigo/10 rounded px-1.5 py-0.5">
          Admin
        </span>
      )}
    </div>
  );
}

function GroupMessageBubble({
  message,
  isMine,
  showSender,
}: {
  message: DecryptedMessage;
  isMine: boolean;
  showSender: boolean;
}) {
  const time = new Date(message.createdAt * 1000).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
      <div className="max-w-[80%] sm:max-w-[70%]">
        {showSender && (
          <SenderLabel pubkey={message.senderPubkey} />
        )}
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
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
    </div>
  );
}

function SenderLabel({ pubkey }: { pubkey: string }) {
  const author = useAuthor(pubkey);
  const metadata: NostrMetadata | undefined = author.data?.metadata;
  const name = metadata?.name || metadata?.display_name || nip19.npubEncode(pubkey).slice(0, 12) + '…';

  return (
    <p className="text-xs font-medium text-brand-indigo mb-0.5 ml-1">{name}</p>
  );
}

function MessageSkeleton({ alignRight }: { alignRight: boolean }) {
  return (
    <div className={cn('flex', alignRight ? 'justify-end' : 'justify-start')}>
      <Skeleton className={cn('h-10 rounded-2xl', alignRight ? 'w-48' : 'w-56')} />
    </div>
  );
}
