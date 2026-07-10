import {
  Moon,
  Sun,
  Monitor,
  Shield,
  Lock,
  ArrowLeft,
  Globe,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTheme } from '@/hooks/useTheme';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useLoginActions } from '@/hooks/useLoginActions';
import { useAppContext } from '@/hooks/useAppContext';
import { cn } from '@/lib/utils';
import type { Theme } from '@/contexts/AppContext';

export default function AppSettings() {
  const { theme, setTheme } = useTheme();
  const { user, metadata } = useCurrentUser();
  const actions = useLoginActions();
  const { config } = useAppContext();

  const themes: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: 'Light', icon: <Sun className="size-4" /> },
    { value: 'dark', label: 'Dark', icon: <Moon className="size-4" /> },
    { value: 'system', label: 'System', icon: <Monitor className="size-4" /> },
  ];

  return (
    <ScrollArea className="h-full">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Mobile back button */}
        <div className="md:hidden">
          <Link to="/app" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </div>

        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

        {/* Identity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="size-4" />
              Identity
            </CardTitle>
            <CardDescription>
              Your Nostr key is your identity. Nobody can take it from you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {user ? (
              <>
                <div className="space-y-1">
                  <p className="text-sm font-medium">{metadata?.name ?? 'Anonymous'}</p>
                  <p className="text-xs font-mono text-muted-foreground break-all">
                    {user.pubkey}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => actions.logout()}
                >
                  Log out
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                You are not logged in. Tap "Join" in the top bar to create an identity or sign in.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Theme */}
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Choose your preferred theme.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {themes.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTheme(t.value)}
                  className={cn(
                    'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                    theme === t.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
                  )}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Relays */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="size-4" />
              Relays
            </CardTitle>
            <CardDescription>
              Relays carry your encrypted messages. They cannot read the content.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {config.relayMetadata.relays.map((r) => (
                <li
                  key={r.url}
                  className="flex items-center justify-between rounded-lg bg-secondary px-3 py-2 text-sm"
                >
                  <span className="font-mono text-xs truncate">{r.url}</span>
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    {r.read && <span>R</span>}
                    {r.write && <span>W</span>}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Privacy info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="size-4" />
              Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              Every message in OursulaChat is encrypted with NIP-44 before it leaves your device.
              Messages are then sealed and gift-wrapped (NIP-59) so that relays cannot see the
              content or even who is talking to whom.
            </p>
            <p>
              Your private key never leaves this device. It is stored encrypted at rest and is
              never transmitted in plaintext.
            </p>
            <p>
              <strong className="text-foreground">There is no way to disable encryption.</strong>{' '}
              Every chat, every message, always.
            </p>
          </CardContent>
        </Card>

        {/* About */}
        <div className="text-center space-y-2 pb-8">
          <p className="text-xs text-muted-foreground">
            OursulaChat — communication that is simply yours.
          </p>
          <a
            href="https://shakespeare.diy"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Vibed with Shakespeare
            <ExternalLink className="size-3" />
          </a>
        </div>
      </div>
    </ScrollArea>
  );
}
