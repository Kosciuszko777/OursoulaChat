/**
 * Dialog to start a new chat. Accepts an npub, hex pubkey, or NIP-05 identifier.
 * Resolves contact info and navigates to the chat view.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import { AtSign, Loader2, MessageCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface NewChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewChatDialog({ isOpen, onClose }: NewChatDialogProps) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const navigate = useNavigate();

  const reset = () => {
    setInput('');
    setError('');
    setIsResolving(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const resolveInput = async (value: string): Promise<string | null> => {
    const trimmed = value.trim();
    if (!trimmed) return null;

    // Try npub
    if (trimmed.startsWith('npub1')) {
      try {
        const decoded = nip19.decode(trimmed);
        if (decoded.type === 'npub') return decoded.data;
      } catch {
        // Not a valid npub
      }
    }

    // Try nprofile
    if (trimmed.startsWith('nprofile1')) {
      try {
        const decoded = nip19.decode(trimmed);
        if (decoded.type === 'nprofile') return decoded.data.pubkey;
      } catch {
        // Not a valid nprofile
      }
    }

    // Try hex pubkey (64 chars)
    if (/^[a-f0-9]{64}$/.test(trimmed)) {
      return trimmed;
    }

    // Try NIP-05 (user@domain or _@domain)
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
        if (typeof pubkey === 'string' && /^[a-f0-9]{64}$/.test(pubkey)) {
          return pubkey;
        }
      } catch {
        // NIP-05 resolution failed
      }
    }

    return null;
  };

  const handleSubmit = async () => {
    if (!input.trim()) {
      setError('Enter an npub, hex key, or NIP-05 address.');
      return;
    }

    setError('');
    setIsResolving(true);

    try {
      const pubkey = await resolveInput(input);
      if (pubkey) {
        const npub = nip19.npubEncode(pubkey);
        handleClose();
        navigate(`/app/chat/${npub}`);
      } else {
        setError('Could not find a Nostr identity. Check the address and try again.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="size-5 text-brand-indigo" />
            New chat
          </DialogTitle>
          <DialogDescription>
            Enter a Nostr public key (npub), NIP-05 address, or hex key.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="space-y-4"
        >
          <div className="relative">
            <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                if (error) setError('');
              }}
              placeholder="npub1… or name@domain.com"
              className="pl-9"
              autoComplete="off"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button
            type="submit"
            disabled={isResolving || !input.trim()}
            className="w-full rounded-full"
          >
            {isResolving ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Looking up…
              </>
            ) : (
              'Start chat'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
