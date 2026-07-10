/**
 * Share OursulaChat surface that deep-links back to the educational header.
 */

import { useState } from 'react';
import { Share2, Copy, Check, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n';

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShareDialog({ isOpen, onClose }: ShareDialogProps) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: do nothing
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: t('app.name'),
          text: t('share.body'),
          url: shareUrl,
        });
      } catch {
        // User cancelled
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="size-5 text-brand-indigo" />
            {t('share.title')}
          </DialogTitle>
          <DialogDescription>
            {t('share.body')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary font-mono text-xs break-all">
            {shareUrl}
          </div>

          <div className="flex gap-2">
            <Button onClick={handleCopy} variant="outline" className="flex-1 rounded-full">
              {copied ? (
                <>
                  <Check className="size-4 mr-2 text-green-600" />
                  {t('share.copied')}
                </>
              ) : (
                <>
                  <Copy className="size-4 mr-2" />
                  {t('share.link')}
                </>
              )}
            </Button>
            {typeof navigator.share === 'function' && (
              <Button onClick={handleNativeShare} className="flex-1 rounded-full">
                <ExternalLink className="size-4 mr-2" />
                Share
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
