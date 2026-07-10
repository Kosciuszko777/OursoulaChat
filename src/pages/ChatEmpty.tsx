import { Lock, Shield, Globe } from 'lucide-react';

/**
 * Default content area when no conversation is selected (desktop).
 * Shows a friendly brand illustration and privacy promise.
 */
export default function ChatEmpty() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-secondary/30 px-8 text-center">
      <div className="size-20 rounded-3xl bg-brand-indigo/10 flex items-center justify-center mb-6">
        <Lock className="size-10 text-brand-indigo" />
      </div>
      <h2 className="text-2xl font-display font-bold tracking-tight mb-2">
        Welcome to OursulaChat
      </h2>
      <p className="text-muted-foreground max-w-sm mb-10 leading-relaxed">
        Select a conversation or start a new chat. Every message is encrypted end-to-end — there is
        no unencrypted mode.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Lock className="size-4 text-brand-indigo" />
          NIP-44 encrypted
        </div>
        <div className="flex items-center gap-2">
          <Shield className="size-4 text-brand-indigo" />
          NIP-59 metadata hidden
        </div>
        <div className="flex items-center gap-2">
          <Globe className="size-4 text-brand-indigo" />
          No central server
        </div>
      </div>
    </div>
  );
}
