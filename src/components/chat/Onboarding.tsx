/**
 * 3-screen first-run onboarding.
 * Create identity → Back up → Start chatting.
 * Never says "gift wrap", "rumor", "seal", or any crypto jargon.
 */

import { useState } from 'react';
import { generateSecretKey, getPublicKey, nip19 } from 'nostr-tools';
import {
  Lock,
  Download,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLoginActions } from '@/hooks/useLoginActions';
import { useT } from '@/lib/i18n';

interface OnboardingProps {
  onComplete: () => void;
  onLoginInstead: () => void;
}

export function Onboarding({ onComplete, onLoginInstead }: OnboardingProps) {
  const [step, setStep] = useState<'welcome' | 'backup' | 'ready'>('welcome');
  const [nsec, setNsec] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const login = useLoginActions();
  const t = useT();

  const handleCreate = () => {
    const sk = generateSecretKey();
    const encoded = nip19.nsecEncode(sk);
    setNsec(encoded);
    login.nsec(encoded);
    setStep('backup');
  };

  const handleDownload = () => {
    try {
      const decoded = nip19.decode(nsec);
      if (decoded.type !== 'nsec') return;
      const pubkey = getPublicKey(decoded.data);
      const npub = nip19.npubEncode(pubkey);
      const filename = `oursula-${npub.slice(5, 9)}.nsec.txt`;
      const blob = new Blob([nsec], { type: 'text/plain; charset=utf-8' });
      const url = globalThis.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      globalThis.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      // fallback: just move on
    }
    setStep('ready');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(nsec);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60dvh] px-6 py-12 text-center">
      {step === 'welcome' && (
        <div className="max-w-sm space-y-6 motion-safe:animate-in motion-safe:fade-in">
          <div className="size-20 rounded-3xl bg-brand-indigo/10 flex items-center justify-center mx-auto">
            <Lock className="size-10 text-brand-indigo" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-display font-bold tracking-tight">
              {t('onboard.welcome.title')}
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              {t('onboard.welcome.sub')}
            </p>
          </div>
          <div className="space-y-3">
            <Button onClick={handleCreate} className="w-full h-12 rounded-full text-base">
              {t('onboard.welcome.create')}
              <ArrowRight className="size-4 ml-2" />
            </Button>
            <Button variant="ghost" onClick={onLoginInstead} className="w-full rounded-full">
              {t('onboard.welcome.login')}
            </Button>
          </div>
        </div>
      )}

      {step === 'backup' && (
        <div className="max-w-sm space-y-6 motion-safe:animate-in motion-safe:fade-in">
          <div className="size-20 rounded-3xl bg-brand-amber/10 flex items-center justify-center mx-auto">
            <Download className="size-10 text-brand-amber" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-display font-bold tracking-tight">
              {t('onboard.backup.title')}
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              {t('onboard.backup.body')}
            </p>
          </div>

          <div className="relative">
            <Input
              type={showKey ? 'text' : 'password'}
              value={nsec}
              readOnly
              className="pr-20 font-mono text-xs"
            />
            <div className="absolute right-0 top-0 h-full flex items-center gap-0.5 pr-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={handleCopy}
                aria-label="Copy"
              >
                {copied ? <Check className="size-3.5 text-green-600" /> : <Copy className="size-3.5" />}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => setShowKey(!showKey)}
                aria-label={showKey ? 'Hide key' : 'Show key'}
              >
                {showKey ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </Button>
            </div>
          </div>

          <Button onClick={handleDownload} className="w-full h-12 rounded-full text-base">
            <Download className="size-4 mr-2" />
            {t('onboard.backup.download')}
          </Button>
        </div>
      )}

      {step === 'ready' && (
        <div className="max-w-sm space-y-6 motion-safe:animate-in motion-safe:fade-in">
          <div className="size-20 rounded-3xl bg-green-500/10 flex items-center justify-center mx-auto">
            <ShieldCheck className="size-10 text-green-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-display font-bold tracking-tight">
              {t('onboard.ready.title')}
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              {t('onboard.ready.body')}
            </p>
          </div>
          <Button onClick={onComplete} className="w-full h-12 rounded-full text-base">
            {t('onboard.ready.start')}
            <ArrowRight className="size-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}
