/**
 * Hook to fetch, decrypt, and group NIP-17 direct messages into conversations.
 *
 * Fetches kind:1059 gift wraps addressed to the current user, decrypts them
 * via the signer interface, and groups them by conversation (participant set).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNostr } from '@nostrify/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';

import { useCurrentUser } from './useCurrentUser';
import {
  unwrapGiftWrap,
  getConversationId,
  type DecryptedMessage,
} from '@/lib/secure/nip17';

export interface Conversation {
  /** Unique conversation ID (sorted participant pubkeys). */
  id: string;
  /** All participants in this conversation (including self). */
  participants: string[];
  /** Messages sorted by timestamp (oldest first). */
  messages: DecryptedMessage[];
  /** The most recent message (for the conversation list). */
  lastMessage: DecryptedMessage;
  /** Subject/title if set via a subject tag. */
  subject?: string;
  /** Count of unread messages (placeholder — always 0 for now). */
  unreadCount: number;
}

/** Cache of already-decrypted messages keyed by gift wrap id. */
const decryptionCache = new Map<string, DecryptedMessage>();

export function useConversations() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [isDecrypting, setIsDecrypting] = useState(false);

  // Ref to track the signer for async decryption
  const signerRef = useRef(user?.signer);
  useEffect(() => {
    signerRef.current = user?.signer;
  }, [user?.signer]);

  // Fetch gift wraps addressed to current user
  const wrapsQuery = useQuery({
    queryKey: ['nostr', 'gift-wraps', user?.pubkey],
    queryFn: async (c) => {
      if (!user?.pubkey) return [];
      return nostr.query(
        [{ kinds: [1059], '#p': [user.pubkey], limit: 200 }],
        { signal: c.signal },
      );
    },
    enabled: !!user?.pubkey,
    refetchInterval: 10_000, // Poll every 10 seconds for new messages
    staleTime: 5_000,
  });

  // Decrypt gift wraps and build conversation state
  const [decryptedMessages, setDecryptedMessages] = useState<DecryptedMessage[]>([]);

  const decryptWraps = useCallback(async (wraps: NostrEvent[]) => {
    const signer = signerRef.current;
    if (!signer) return;

    setIsDecrypting(true);
    const newMessages: DecryptedMessage[] = [];

    for (const wrap of wraps) {
      // Skip already-decrypted wraps
      if (decryptionCache.has(wrap.id)) {
        newMessages.push(decryptionCache.get(wrap.id)!);
        continue;
      }

      const msg = await unwrapGiftWrap(wrap, signer);
      if (msg) {
        decryptionCache.set(wrap.id, msg);
        newMessages.push(msg);
      }
    }

    setDecryptedMessages(newMessages);
    setIsDecrypting(false);
  }, []);

  // Trigger decryption when wraps change
  useEffect(() => {
    if (wrapsQuery.data && wrapsQuery.data.length > 0) {
      decryptWraps(wrapsQuery.data);
    } else if (wrapsQuery.data && wrapsQuery.data.length === 0) {
      setDecryptedMessages([]);
    }
  }, [wrapsQuery.data, decryptWraps]);

  // Group messages into conversations
  const conversations = useMemo((): Conversation[] => {
    if (!user?.pubkey || decryptedMessages.length === 0) return [];

    const convMap = new Map<string, DecryptedMessage[]>();

    for (const msg of decryptedMessages) {
      const convId = getConversationId(user.pubkey, msg);
      if (!convMap.has(convId)) {
        convMap.set(convId, []);
      }
      convMap.get(convId)!.push(msg);
    }

    const result: Conversation[] = [];

    for (const [id, messages] of convMap) {
      // Sort messages by timestamp (oldest first)
      messages.sort((a, b) => a.createdAt - b.createdAt);

      // Deduplicate by rumor id (in case we receive our own copy)
      const seen = new Set<string>();
      const deduped = messages.filter((m) => {
        if (seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
      });

      if (deduped.length === 0) continue;

      const lastMessage = deduped[deduped.length - 1];

      // Extract participants from the conversation ID
      const participants = id.split(',');

      // Find the latest subject tag
      const subject = [...deduped]
        .reverse()
        .map((m) => m.tags.find(([t]) => t === 'subject')?.[1])
        .find(Boolean);

      result.push({
        id,
        participants,
        messages: deduped,
        lastMessage,
        subject,
        unreadCount: 0,
      });
    }

    // Sort conversations by most recent message (newest first)
    result.sort((a, b) => b.lastMessage.createdAt - a.lastMessage.createdAt);

    return result;
  }, [user?.pubkey, decryptedMessages]);

  // Helper to invalidate and refetch
  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['nostr', 'gift-wraps'] });
  }, [queryClient]);

  return {
    conversations,
    isLoading: wrapsQuery.isLoading || isDecrypting,
    isError: wrapsQuery.isError,
    error: wrapsQuery.error,
    refresh,
  };
}
