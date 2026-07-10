import { useState } from 'react';
import {
  Moon,
  Sun,
  Monitor,
  Shield,
  Lock,
  ArrowLeft,
  Globe,
  ExternalLink,
  Share2,
  Languages,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTheme } from '@/hooks/useTheme';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useLoginActions } from '@/hooks/useLoginActions';
import { useAppContext } from '@/hooks/useAppContext';
import { RelayInspector } from '@/components/chat/RelayInspector';
import { ShareDialog } from '@/components/chat/ShareDialog';
import { useT, useLocale, type Locale } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { Theme } from '@/contexts/AppContext';

export default function AppSettings() {
  const { theme, setTheme } = useTheme();
  const { user, metadata } = useCurrentUser();
  const actions = useLoginActions();
  const { config, updateConfig } = useAppContext();
  const t = useT();
  const locale = useLocale();
  const [shareOpen, setShareOpen] = useState(false);

  const setLocale = (newLocale: Locale) => {
    updateConfig((c) => ({ ...c, locale: newLocale }));
    // Also store directly for the I18nContext to read
    localStorage.setItem('oursula:locale', newLocale);
    window.location.reload(); // Simple reload to apply locale change
  };

  const themes: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: t('settings.theme.light'), icon: <Sun className="size-4" /> },
    { value: 'dark', label: t('settings.theme.dark'), icon: <Moon className="size-4" /> },
    { value: 'system', label: t('settings.theme.system'), icon: <Monitor className="size-4" /> },
  ];

  return (
    <ScrollArea className="h-full">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Mobile back button */}
        <div className="md:hidden">
          <Link to="/app" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" />
            {t('nav.back')}
          </Link>
        </div>

        <h1 className="text-2xl font-bold tracking-tight">{t('settings.title')}</h1>

        {/* Identity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="size-4" />
              {t('settings.identity')}
            </CardTitle>
            <CardDescription>{t('settings.identity.desc')}</CardDescription>
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
                  {t('settings.logout')}
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{t('settings.identity.loggedOut')}</p>
            )}
          </CardContent>
        </Card>

        {/* Theme */}
        <Card>
          <CardHeader>
            <CardTitle>{t('settings.appearance')}</CardTitle>
            <CardDescription>{t('settings.appearance.desc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {themes.map((th) => (
                <button
                  key={th.value}
                  type="button"
                  onClick={() => setTheme(th.value)}
                  className={cn(
                    'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                    theme === th.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
                  )}
                >
                  {th.icon}
                  {th.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Language */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Languages className="size-4" />
              {t('settings.language')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {(['en', 'de'] as Locale[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLocale(l)}
                  className={cn(
                    'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                    locale === l
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
                  )}
                >
                  {l === 'en' ? 'English' : 'Deutsch'}
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
              {t('settings.relays')}
            </CardTitle>
            <CardDescription>{t('settings.relays.desc')}</CardDescription>
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

        {/* Relay Inspector */}
        <RelayInspector />

        {/* Privacy info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="size-4" />
              {t('settings.privacy')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>{t('settings.privacy.p1')}</p>
            <p>{t('settings.privacy.p2')}</p>
            <p>
              <strong className="text-foreground">{t('settings.privacy.p3')}</strong>
            </p>
          </CardContent>
        </Card>

        {/* Share */}
        <Button
          variant="outline"
          className="w-full rounded-full"
          onClick={() => setShareOpen(true)}
        >
          <Share2 className="size-4 mr-2" />
          {t('share.title')}
        </Button>

        {/* About */}
        <div className="text-center space-y-2 pb-8">
          <p className="text-xs text-muted-foreground">{t('app.tagline')}</p>
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

      <ShareDialog isOpen={shareOpen} onClose={() => setShareOpen(false)} />
    </ScrollArea>
  );
}
