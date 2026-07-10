/**
 * Relay Inspector — shows what relays can and cannot see.
 * Proves the privacy claim on screen as required by the spec.
 */

import { Eye, EyeOff, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useT } from '@/lib/i18n';

export function RelayInspector() {
  const t = useT();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="size-4" />
          {t('relay.inspector.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* What the relay DOES see */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Eye className="size-4 text-brand-amber" />
            {t('relay.inspector.sees')}
          </div>
          <ul className="ml-6 space-y-1 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-brand-amber mt-1">•</span>
              <span>Kind 1059 (opaque encrypted envelope)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-amber mt-1">•</span>
              <span>Recipient public key (p-tag)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-amber mt-1">•</span>
              <span>Random timestamp (±2 days)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-amber mt-1">•</span>
              <span>Random one-time sender key (not your real key)</span>
            </li>
          </ul>
        </div>

        {/* What the relay CANNOT see */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <EyeOff className="size-4 text-green-600" />
            {t('relay.inspector.cannotSee')}
          </div>
          <ul className="ml-6 space-y-1 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">•</span>
              <span>Your real identity</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">•</span>
              <span>Message content</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">•</span>
              <span>Real timestamp</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">•</span>
              <span>That you sent the message</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">•</span>
              <span>Group membership or structure</span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
