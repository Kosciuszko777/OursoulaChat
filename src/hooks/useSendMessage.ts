/**
 * Hook to send NIP-17 encrypted direct messages.
 *
 * Creates the full gift-wrap pipeline (rumor → seal → wrap) and publishes
 * to relays. Every message is encrypted by default — there is no toggle.
 */

import { useNostr } from '@nostrify/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from './useCurrentUser';
import { sendDirectMessage } from '@/lib/secure/nip17';
import type { NostrEvent } from '@nostrify/nostrify';

interface SendMessageParams {
  /** The recipient pubkey(s) for the message. */
  recipientPubkeys: string[];
  /** Plaintext content (will be encrypted). */
  content: string;
  /** Optional extra tags (e.g. reply, subject). */
  extraTags?: string[][];
}

export function useSendMessage() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: SendMessageParams): Promise<NostrEvent[]> => {
      if (!user) {
        throw new Error('Must be logged in to send messages');
      }

      if (!user.signer.nip44) {
        throw new Error(
          'Your signer does not support NIP-44 encryption. Please upgrade your Nostr extension.',
        );
      }

      // Create gift wraps for all recipients + self
      const wraps = await sendDirectMessage(
        user.pubkey,
        params.recipientPubkeys,
        params.content,
        user.signer,
        params.extraTags,
      );

      // Publish each wrap to relays
      const publishPromises = wraps.map((wrap) =>
        nostr.event(wrap, { signal: AbortSignal.timeout(10_000) }).catch((err) => {
          console.warn('Failed to publish gift wrap to some relays:', err);
          // Don't throw — partial delivery is acceptable
        }),
      );

      await Promise.allSettled(publishPromises);

      return wraps;
    },
    onSuccess: () => {
      // Refetch conversations to show the new message
      queryClient.invalidateQueries({ queryKey: ['nostr', 'gift-wraps'] });
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
    },
  });
}
