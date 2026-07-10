/**
 * Dialog to create a new group chat.
 * Add members by npub/NIP-05, set a group name, and start chatting.
 * Fan-out cap: 50 members max (documented trade-off vs metadata privacy).
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import {
  AtSign,
  Loader2,
  Users,
  X,
  Plus,
  AlertTriangle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuthor } from '@/hooks/useAuthor';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useSendMessage } from '@/hooks/useSendMessage';
import { toast } from '@/hooks/useToast';

const MAX_GROUP_SIZE = 50;

interface CreateGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateGroupDialog({ isOpen, onClose }: CreateGroupDialogProps) {
  const { user } = useCurrentUser();
  const sendMessage = useSendMessage();
  const navigate = useNavigate();

  const [groupName, setGroupName] = useState('');
  const [memberInput, setMemberInput] = useState('');
  const [members, setMembers] = useState<string[]>([]); // hex pubkeys
  const [inputError, setInputError] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const reset = () => {
    setGroupName('');
    setMemberInput('');
    setMembers([]);
    setInputError('');
    setIsResolving(false);
    setIsCreating(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const resolveInput = async (value: string): Promise<string | null> => {
    const trimmed = value.trim();
    if (!trimmed) return null;

    if (trimmed.startsWith('npub1')) {
      try {
        const decoded = nip19.decode(trimmed);
        if (decoded.type === 'npub') return decoded.data;
      } catch { /* */ }
    }

    if (trimmed.startsWith('nprofile1')) {
      try {
        const decoded = nip19.decode(trimmed);
        if (decoded.type === 'nprofile') return decoded.data.pubkey;
      } catch { /* */ }
    }

    if (/^[a-f0-9]{64}$/.test(trimmed)) return trimmed;

    if (trimmed.includes('@') || trimmed.includes('.')) {
      try {
        const nip05 = trimmed.startsWith('@') ? `_${trimmed}` : trimmed;
        const [name, domain] = nip05.split('@');
        if (!domain) return null;
        const url = `https://${domain}/.well-known/nostr.json?name=${encodeURIComponent(name)}`;
        const proxyUrl = `https://proxy.shakespeare.diy/?url=${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl, { signal: AbortSignal.timeout(5000) });
        if (!response.ok) return null;
        const data = await response.json();
        const pubkey = data?.names?.[name];
        if (typeof pubkey === 'string' && /^[a-f0-9]{64}$/.test(pubkey)) return pubkey;
      } catch { /* */ }
    }

    return null;
  };

  const handleAddMember = async () => {
    if (!memberInput.trim()) return;

    if (members.length >= MAX_GROUP_SIZE - 1) {
      setInputError(`Groups are limited to ${MAX_GROUP_SIZE} members.`);
      return;
    }

    setIsResolving(true);
    setInputError('');

    const pubkey = await resolveInput(memberInput);
    if (!pubkey) {
      setInputError('Could not resolve this identity.');
      setIsResolving(false);
      return;
    }

    if (pubkey === user?.pubkey) {
      setInputError("You're automatically included in the group.");
      setIsResolving(false);
      return;
    }

    if (members.includes(pubkey)) {
      setInputError('This person is already in the group.');
      setIsResolving(false);
      return;
    }

    setMembers((prev) => [...prev, pubkey]);
    setMemberInput('');
    setIsResolving(false);
  };

  const handleRemoveMember = (pubkey: string) => {
    setMembers((prev) => prev.filter((pk) => pk !== pubkey));
  };

  const handleCreate = async () => {
    if (!user || members.length === 0) return;
    if (!groupName.trim()) {
      setInputError('Give your group a name.');
      return;
    }

    setIsCreating(true);
    try {
      // Send an initial message to establish the group conversation
      // The subject tag sets the group name per NIP-17
      await sendMessage.mutateAsync({
        recipientPubkeys: members,
        content: `${user.pubkey === user.pubkey ? 'Group created' : ''} Welcome to ${groupName.trim()}!`,
        extraTags: [['subject', groupName.trim()]],
      });

      // Build conversation ID for navigation (sorted pubkeys including self)
      const allPubkeys = [...members, user.pubkey].sort();
      const convId = encodeURIComponent(allPubkeys.join(','));
      handleClose();
      navigate(`/app/group/${convId}`);
    } catch {
      toast({
        title: 'Failed to create group',
        description: 'Could not send the initial message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-md rounded-2xl max-h-[85dvh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="size-5 text-brand-indigo" />
            New group
          </DialogTitle>
          <DialogDescription>
            Create an encrypted group chat. Each member receives their own sealed copy — relays see no group.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 min-h-0">
          {/* Group name */}
          <Input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Group name"
            autoFocus
          />

          {/* Member list */}
          {members.length > 0 && (
            <ScrollArea className="max-h-40">
              <div className="space-y-1">
                {members.map((pk) => (
                  <MemberChip key={pk} pubkey={pk} onRemove={() => handleRemoveMember(pk)} />
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Add member input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAddMember();
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={memberInput}
                onChange={(e) => {
                  setMemberInput(e.target.value);
                  if (inputError) setInputError('');
                }}
                placeholder="npub1… or name@domain.com"
                className="pl-9"
                autoComplete="off"
              />
            </div>
            <Button
              type="submit"
              variant="outline"
              size="icon"
              disabled={isResolving || !memberInput.trim()}
              className="rounded-full flex-none"
            >
              {isResolving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
            </Button>
          </form>

          {inputError && <p className="text-sm text-destructive">{inputError}</p>}

          {/* Fan-out warning for large groups */}
          {members.length > 20 && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-brand-amber-light border border-brand-amber/30 text-xs">
              <AlertTriangle className="size-4 flex-none mt-0.5 text-brand-amber" />
              <p className="text-foreground/80">
                Each message is individually gift-wrapped to every member ({members.length + 1} wraps per message). Large groups may send slowly.
              </p>
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            {members.length} of {MAX_GROUP_SIZE} members · You are included automatically
          </div>

          {/* Create button */}
          <Button
            onClick={handleCreate}
            disabled={isCreating || members.length === 0 || !groupName.trim()}
            className="w-full rounded-full"
          >
            {isCreating ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Creating…
              </>
            ) : (
              `Create group (${members.length + 1} members)`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** A chip showing a member with their profile info and a remove button. */
function MemberChip({ pubkey, onRemove }: { pubkey: string; onRemove: () => void }) {
  const author = useAuthor(pubkey);
  const metadata = author.data?.metadata;
  const displayName = metadata?.name || metadata?.display_name || nip19.npubEncode(pubkey).slice(0, 16) + '…';

  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-secondary">
      <Avatar size="sm">
        {metadata?.picture && <AvatarImage src={metadata.picture} alt={displayName} />}
        <AvatarFallback>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <span className="text-sm truncate flex-1">{displayName}</span>
      <button
        type="button"
        onClick={onRemove}
        className="text-muted-foreground hover:text-destructive transition-colors rounded-full p-0.5"
        aria-label={`Remove ${displayName}`}
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
