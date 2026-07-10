/**
 * Local conversation search over decrypted message cache.
 * Filters conversations by name, message content, or subject.
 */

import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n';
import type { Conversation } from '@/hooks/useConversations';

interface ConversationSearchProps {
  conversations: Conversation[];
  onFilter: (filtered: Conversation[] | null) => void;
}

export function ConversationSearch({ conversations, onFilter }: ConversationSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const t = useT();

  const filtered = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.toLowerCase();
    return conversations.filter((conv) => {
      // Match subject
      if (conv.subject?.toLowerCase().includes(q)) return true;
      // Match any message content
      if (conv.messages.some((m) => m.content.toLowerCase().includes(q))) return true;
      // Match conversation ID (pubkeys — for searching by npub partial)
      if (conv.id.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [query, conversations]);

  // Propagate filtered results to parent
  useMemo(() => {
    onFilter(filtered);
  }, [filtered, onFilter]);

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full size-8"
        aria-label="Search"
        onClick={() => setIsOpen(true)}
      >
        <Search className="size-4" />
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1 flex-1">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('chat.search.placeholder')}
          className="h-8 pl-8 pr-8 text-sm rounded-full"
          autoFocus
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 size-8 rounded-full"
            onClick={() => setQuery('')}
          >
            <X className="size-3" />
          </Button>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full size-8 flex-none"
        onClick={() => {
          setIsOpen(false);
          setQuery('');
        }}
      >
        <X className="size-4" />
      </Button>
    </div>
  );
}
