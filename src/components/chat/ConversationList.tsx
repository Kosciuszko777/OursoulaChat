/**
 * Conversation list — shows all decrypted conversations, sorted by most recent.
 * Distinguishes 1:1 chats from group chats (different routing, icons, names).
 */

import { Link, useParams, useLocation } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import { Lock, Loader2, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthor } from '@/hooks/useAuthor';
import { cn } from '@/lib/utils';
import type { Conversation } from '@/hooks/useConversations';
import type { NostrMetadata } from '@nostrify/nostrify';

interface ConversationListProps {
  conversations: Conversation[];
  currentUserPubkey: string;
  isLoading: boolean;
}

export function ConversationList({ conversations, currentUserPubkey, isLoading }: ConversationListProps) {
  const location = useLocation();

  if (isLoading && conversations.length === 0) {
    return (
      <div className="space-y-1 px-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <ConversationSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return null; // Let parent render the empty state
  }

  return (
    <div className="space-y-0.5 px-2">
      {isLoading && (
        <div className="flex items-center justify-center py-2 text-xs text-muted-foreground gap-1.5">
          <Loader2 className="size-3 animate-spin" />
          Syncing…
        </div>
      )}
      {conversations.map((conv) => {
        const isGroup = conv.participants.length > 2;

        if (isGroup) {
          return (
            <GroupConversationItem
              key={conv.id}
              conversation={conv}
              currentUserPubkey={currentUserPubkey}
              currentPath={location.pathname}
            />
          );
        }

        const otherPubkey = conv.participants.find((pk) => pk !== currentUserPubkey) ?? currentUserPubkey;
        const otherNpub = nip19.npubEncode(otherPubkey);

        return (
          <DirectConversationItem
            key={conv.id}
            conversation={conv}
            otherPubkey={otherPubkey}
            otherNpub={otherNpub}
            currentUserPubkey={currentUserPubkey}
            currentPath={location.pathname}
          />
        );
      })}
    </div>
  );
}

/** 1:1 chat item. */
function DirectConversationItem({
  conversation,
  otherPubkey,
  otherNpub,
  currentUserPubkey,
  currentPath,
}: {
  conversation: Conversation;
  otherPubkey: string;
  otherNpub: string;
  currentUserPubkey: string;
  currentPath: string;
}) {
  const author = useAuthor(otherPubkey);
  const metadata: NostrMetadata | undefined = author.data?.metadata;
  const displayName = metadata?.name || metadata?.display_name || otherNpub.slice(0, 12) + '…';
  const lastMsg = conversation.lastMessage;
  const isSentByMe = lastMsg.senderPubkey === currentUserPubkey;
  const preview = isSentByMe ? `You: ${lastMsg.content}` : lastMsg.content;
  const time = formatTime(lastMsg.createdAt);
  const href = `/app/chat/${otherNpub}`;
  const isActive = currentPath === href;

  return (
    <Link
      to={href}
      className={cn(
        'flex items-center gap-3 px-3 py-3 rounded-xl transition-colors',
        isActive ? 'bg-brand-indigo/10' : 'hover:bg-secondary',
      )}
    >
      <Avatar size="lg" className="flex-none">
        {metadata?.picture && <AvatarImage src={metadata.picture} alt={displayName} />}
        <AvatarFallback>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-sm truncate">{displayName}</span>
          <span className="text-xs text-muted-foreground flex-none">{time}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Lock className="size-3 text-brand-indigo flex-none" />
          <span className="text-xs text-muted-foreground truncate">{preview}</span>
        </div>
      </div>
    </Link>
  );
}

/** Group chat item. */
function GroupConversationItem({
  conversation,
  currentUserPubkey,
  currentPath,
}: {
  conversation: Conversation;
  currentUserPubkey: string;
  currentPath: string;
}) {
  const groupName = conversation.subject ?? `Group (${conversation.participants.length})`;
  const lastMsg = conversation.lastMessage;
  const isSentByMe = lastMsg.senderPubkey === currentUserPubkey;
  const preview = isSentByMe ? `You: ${lastMsg.content}` : lastMsg.content;
  const time = formatTime(lastMsg.createdAt);
  const href = `/app/group/${encodeURIComponent(conversation.id)}`;
  const isActive = currentPath === href;

  return (
    <Link
      to={href}
      className={cn(
        'flex items-center gap-3 px-3 py-3 rounded-xl transition-colors',
        isActive ? 'bg-brand-indigo/10' : 'hover:bg-secondary',
      )}
    >
      <div className="size-10 rounded-full bg-brand-indigo/15 flex items-center justify-center flex-none">
        <Users className="size-5 text-brand-indigo" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-sm truncate">{groupName}</span>
          <span className="text-xs text-muted-foreground flex-none">{time}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Lock className="size-3 text-brand-indigo flex-none" />
          <span className="text-xs text-muted-foreground truncate">{preview}</span>
        </div>
      </div>
    </Link>
  );
}

function ConversationSkeleton() {
  return (
    <div className="flex items-center gap-3 px-3 py-3">
      <Skeleton className="size-10 rounded-full flex-none" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-3 w-40" />
      </div>
    </div>
  );
}

function formatTime(unixTimestamp: number): string {
  const date = new Date(unixTimestamp * 1000);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) {
    return 'Yesterday';
  }
  if (diffDays < 7) {
    return date.toLocaleDateString(undefined, { weekday: 'short' });
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
