/**
 * NIP-17 Private Direct Messages — secure module.
 *
 * Implements the NIP-17/44/59 gift-wrap protocol:
 *   kind 14 (rumor, unsigned) → kind 13 (seal, signed by author) → kind 1059 (gift wrap, signed by ephemeral key)
 *
 * All cryptographic operations use the signer interface (NIP-44) or nostr-tools.
 * No private key material is ever exposed outside this module.
 *
 * SPEC-CHECK: follows NIP-17 construction — rumor → seal → gift wrap.
 * SPEC-CHECK: timestamps randomized per NIP-59 guidance (up to 2 days in the past).
 * SPEC-CHECK: seal has empty tags per NIP-59.
 * SPEC-CHECK: gift wrap signed by random ephemeral key per NIP-59.
 */

import type { NostrEvent, NostrSigner } from '@nostrify/nostrify';
import { generateSecretKey, getPublicKey, getEventHash, finalizeEvent } from 'nostr-tools';
import { nip44 } from 'nostr-tools';

// ─── Types ───

/** A rumor is an unsigned event with an id but no sig. */
export interface Rumor {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
}

/** A decrypted DM with its metadata. */
export interface DecryptedMessage {
  /** The rumor id — unique per message. */
  id: string;
  /** The real sender's pubkey (from the seal). */
  senderPubkey: string;
  /** The pubkeys of all recipients (from the rumor's p-tags). */
  recipientPubkeys: string[];
  /** The plaintext content. */
  content: string;
  /** The rumor's created_at (the real timestamp). */
  createdAt: number;
  /** The kind of the inner event (14 = chat, 15 = file, etc). */
  kind: number;
  /** Full rumor tags for threading, subjects, etc. */
  tags: string[][];
  /** The gift wrap event id (for deduplication). */
  wrapId: string;
}

// ─── Constants ───

const TWO_DAYS_SECONDS = 2 * 24 * 60 * 60;

// ─── Helpers ───

/** Current unix timestamp in seconds. */
function now(): number {
  return Math.floor(Date.now() / 1000);
}

/** Random timestamp up to 2 days in the past per NIP-59. */
function randomTimestamp(): number {
  return now() - Math.floor(Math.random() * TWO_DAYS_SECONDS);
}

/**
 * NIP-44 encrypt using a raw secret key (for ephemeral wrapping).
 * This is used for the gift-wrap layer where we control the ephemeral key.
 */
function nip44Encrypt(plaintext: string, senderSecretKey: Uint8Array, recipientPubkey: string): string {
  const conversationKey = nip44.v2.utils.getConversationKey(
    senderSecretKey,
    recipientPubkey,
  );
  return nip44.v2.encrypt(plaintext, conversationKey);
}

/**
 * NIP-44 decrypt using a raw secret key (for testing/internal use).
 */
function nip44DecryptWithKey(ciphertext: string, receiverSecretKey: Uint8Array, senderPubkey: string): string {
  const conversationKey = nip44.v2.utils.getConversationKey(
    receiverSecretKey,
    senderPubkey,
  );
  return nip44.v2.decrypt(ciphertext, conversationKey);
}

// ─── Core Protocol ───

/**
 * Create a kind-14 chat rumor (unsigned event with id).
 */
export function createRumor(
  senderPubkey: string,
  recipientPubkeys: string[],
  content: string,
  extraTags?: string[][],
): Rumor {
  const tags: string[][] = recipientPubkeys.map((pk) => ['p', pk]);
  if (extraTags) tags.push(...extraTags);

  const rumor = {
    created_at: now(),
    content,
    tags,
    kind: 14,
    pubkey: senderPubkey,
  };

  const id = getEventHash(rumor as Parameters<typeof getEventHash>[0]);

  return { ...rumor, id };
}

/**
 * Create a sealed event (kind 13) containing an encrypted rumor.
 * The seal is signed by the sender's real key via the signer interface.
 *
 * SPEC-CHECK: seal tags are always empty.
 * SPEC-CHECK: seal created_at is randomized.
 */
export async function createSeal(
  rumor: Rumor,
  recipientPubkey: string,
  signer: NostrSigner,
): Promise<NostrEvent> {
  // Use signer's NIP-44 to encrypt the rumor to the recipient
  if (!signer.nip44) {
    throw new Error('Signer does not support NIP-44 encryption');
  }

  const encryptedRumor = await signer.nip44.encrypt(
    recipientPubkey,
    JSON.stringify(rumor),
  );

  return signer.signEvent({
    kind: 13,
    content: encryptedRumor,
    created_at: randomTimestamp(),
    tags: [], // SPEC-CHECK: always empty
  });
}

/**
 * Create a gift wrap (kind 1059) containing an encrypted seal.
 * Signed by a fresh ephemeral key — the sender's identity is fully hidden.
 *
 * SPEC-CHECK: gift wrap uses random one-time key.
 * SPEC-CHECK: gift wrap created_at is randomized.
 * SPEC-CHECK: p-tag addresses the recipient.
 */
export function createGiftWrap(
  seal: NostrEvent,
  recipientPubkey: string,
): NostrEvent {
  const ephemeralSecretKey = generateSecretKey();

  const encryptedSeal = nip44Encrypt(
    JSON.stringify(seal),
    ephemeralSecretKey,
    recipientPubkey,
  );

  return finalizeEvent(
    {
      kind: 1059,
      content: encryptedSeal,
      created_at: randomTimestamp(),
      tags: [['p', recipientPubkey]],
    },
    ephemeralSecretKey,
  ) as unknown as NostrEvent;
}

/**
 * Full send pipeline: rumor → seal → gift wrap for each recipient + self.
 *
 * Returns an array of gift-wrapped events ready to publish to relays.
 * One wrap per recipient plus one wrap to the sender (for their own copy).
 */
export async function sendDirectMessage(
  senderPubkey: string,
  recipientPubkeys: string[],
  content: string,
  signer: NostrSigner,
  extraTags?: string[][],
): Promise<NostrEvent[]> {
  const rumor = createRumor(senderPubkey, recipientPubkeys, content, extraTags);
  const wraps: NostrEvent[] = [];

  // Send to each recipient
  for (const recipientPubkey of recipientPubkeys) {
    const seal = await createSeal(rumor, recipientPubkey, signer);
    const wrap = createGiftWrap(seal, recipientPubkey);
    wraps.push(wrap);
  }

  // Send a copy to self (so sender can see their own messages)
  const selfSeal = await createSeal(rumor, senderPubkey, signer);
  const selfWrap = createGiftWrap(selfSeal, senderPubkey);
  wraps.push(selfWrap);

  return wraps;
}

// ─── Decryption ───

/**
 * Unwrap a kind-1059 gift wrap event and return the decrypted message.
 *
 * Uses the signer interface for NIP-44 decryption (the user's real key).
 * Validates that the seal's pubkey matches the rumor's pubkey (NIP-17 requirement).
 *
 * Returns null if decryption fails (e.g. not addressed to us, malformed).
 */
export async function unwrapGiftWrap(
  wrap: NostrEvent,
  signer: NostrSigner,
): Promise<DecryptedMessage | null> {
  try {
    if (wrap.kind !== 1059) return null;
    if (!signer.nip44) return null;

    // Layer 1: decrypt the gift wrap to get the seal
    const sealJson = await signer.nip44.decrypt(wrap.pubkey, wrap.content);
    const seal: NostrEvent = JSON.parse(sealJson);

    if (seal.kind !== 13) return null;

    // Layer 2: decrypt the seal to get the rumor
    const rumorJson = await signer.nip44.decrypt(seal.pubkey, seal.content);
    const rumor: Rumor = JSON.parse(rumorJson);

    // SPEC-CHECK: verify seal pubkey matches rumor pubkey (anti-impersonation)
    if (seal.pubkey !== rumor.pubkey) {
      console.warn('NIP-17: seal pubkey does not match rumor pubkey — possible impersonation attempt');
      return null;
    }

    const recipientPubkeys = rumor.tags
      .filter(([t]) => t === 'p')
      .map(([, pk]) => pk);

    return {
      id: rumor.id,
      senderPubkey: rumor.pubkey,
      recipientPubkeys,
      content: rumor.content,
      createdAt: rumor.created_at,
      kind: rumor.kind,
      tags: rumor.tags,
      wrapId: wrap.id,
    };
  } catch (error) {
    // Decryption failure is expected for messages not addressed to us
    // or malformed events — return null, never crash.
    console.debug('Gift wrap decryption failed (expected if not for us):', error);
    return null;
  }
}

/**
 * Derive the conversation key for a direct message.
 * For 1:1 DMs, this is simply the other party's pubkey.
 * For group DMs, it's a sorted comma-joined list of all participant pubkeys.
 */
export function getConversationId(
  myPubkey: string,
  message: DecryptedMessage,
): string {
  // Collect all participants: sender + all p-tagged recipients
  const allParticipants = new Set<string>();
  allParticipants.add(message.senderPubkey);
  for (const pk of message.recipientPubkeys) {
    allParticipants.add(pk);
  }
  // Remove self to get the "other" participants for the key
  // But include self in the full set for group identification
  const sorted = [...allParticipants].sort();
  return sorted.join(',');
}

/**
 * Get the "other" party's pubkey for a 1:1 conversation.
 * For group chats, returns the first non-self pubkey.
 */
export function getOtherPubkey(
  myPubkey: string,
  message: DecryptedMessage,
): string {
  if (message.senderPubkey !== myPubkey) {
    return message.senderPubkey;
  }
  const other = message.recipientPubkeys.find((pk) => pk !== myPubkey);
  return other ?? myPubkey; // Fallback to self for self-messages
}

// Re-export for testing
export { nip44DecryptWithKey as _testDecryptWithKey };
