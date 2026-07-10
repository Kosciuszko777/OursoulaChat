import { useSeoMeta } from '@unhead/react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Lock,
  Globe,
  ArrowRight,
  ExternalLink,
  Moon,
  Sun,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';

/** A single entry on the Chat Control timeline. */
interface TimelineEntry {
  year: string;
  title: string;
  body: string;
  /** If the entry represents a contested or notable vote, highlight it. */
  highlight?: boolean;
}

const TIMELINE: TimelineEntry[] = [
  {
    year: '2021',
    title: 'Voluntary scanning begins',
    body: 'The EU adopts a temporary ePrivacy derogation (Reg. 2021/1232), allowing platforms to voluntarily scan unencrypted messages for known CSAM. Major US-based platforms opt in.',
  },
  {
    year: '2022',
    title: 'Chat Control 2.0 proposed',
    body: 'The European Commission proposes the CSA Regulation — a permanent framework that, as drafted, would require scanning of messages including client-side scanning that reaches into end-to-end-encrypted communications before they are sent.',
  },
  {
    year: '2023–24',
    title: 'Opposition grows',
    body: 'Security researchers, jurists, and civil-society organisations push back. The voluntary regime is extended to April 2026. Public consultation shows large majorities opposing the scanning of encrypted communication.',
  },
  {
    year: '2025',
    title: 'Parallel debates widen the scope',
    body: 'EU debates around Digital Services Act enforcement and age-verification mandates raise additional questions about anonymous access to online services.',
  },
  {
    year: 'Mar 2026',
    title: 'Parliament rejects extension',
    body: 'The European Parliament votes 311–228 to reject a further extension of Chat Control 1.0. The derogation legally lapses on 3 April 2026. Several large platforms announce they will keep scanning regardless.',
    highlight: true,
  },
  {
    year: '9 Jul 2026',
    title: 'Urgency procedure re-adopts scanning',
    body: 'Via urgency procedure the Parliament re-adopts Chat Control 1.0, extending voluntary scanning to 3 April 2028. 314 MEPs vote against, but the absolute majority of 361 needed to block it is not reached. An amendment exempting end-to-end-encrypted content passes; how that is reconciled technically remains open. Chat Control 2.0 (mandatory CSAR) is still in trilogue — not yet law.',
    highlight: true,
  },
];

const SOURCES = [
  {
    label: 'European Parliament press releases',
    url: 'https://www.europarl.europa.eu/news/en',
  },
  {
    label: 'Regulation 2021/1232 (EUR-Lex)',
    url: 'https://eur-lex.europa.eu/eli/reg/2021/1232',
  },
  {
    label: 'EDRi — European Digital Rights',
    url: 'https://edri.org/',
  },
  {
    label: "Patrick Breyer's Chat Control tracker",
    url: 'https://www.patrick-breyer.de/en/posts/chat-control/',
  },
];

export default function Landing() {
  useSeoMeta({
    title: 'OursulaChat — Encrypted messaging that is simply yours',
    description:
      'End-to-end encrypted by default. No company to subpoena. No center to seize. Built on Nostr.',
  });

  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-6 py-3">
          <Link to="/" className="flex items-center gap-2 font-semibold text-lg tracking-tight">
            <Lock className="size-5 text-brand-indigo" />
            <span>OursulaChat</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle theme"
              className="rounded-full"
            >
              {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            <Button asChild size="sm" className="rounded-full px-5">
              <Link to="/app">Open app</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative isolate overflow-hidden">
        <div
          className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-indigo/10 via-transparent to-brand-amber/10"
          aria-hidden
        />
        <div className="max-w-3xl mx-auto px-6 pt-20 pb-16 md:pt-28 md:pb-20 text-center">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-balance">
            They keep voting to read your messages.{' '}
            <span className="text-brand-indigo">So we built one they can't.</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-balance leading-relaxed">
            OursulaChat is end-to-end encrypted by default, has no company to subpoena, and runs on
            a network with no center to seize. Here's what prompted it.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="rounded-full px-8 text-base h-12">
              <Link to="/app">
                Start chatting <ArrowRight className="size-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full px-8 text-base h-12">
              <a href="#timeline">Read the timeline</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Three promises */}
      <section className="max-w-3xl mx-auto px-6 pb-20">
        <div className="grid sm:grid-cols-3 gap-6">
          <PromiseCard
            icon={<Lock className="size-6" />}
            title="Encrypted by default"
            body="NIP-44 encryption on every message. There is no unencrypted mode."
          />
          <PromiseCard
            icon={<Shield className="size-6" />}
            title="Metadata protected"
            body="NIP-59 gift wrapping hides who is talking to whom. Relays see only sealed envelopes."
          />
          <PromiseCard
            icon={<Globe className="size-6" />}
            title="No center to seize"
            body="No server, no company, no database. Just public relays and your key."
          />
        </div>
      </section>

      {/* Timeline */}
      <section id="timeline" className="bg-secondary/50 border-y">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-center mb-4">
            A brief history of Chat Control
          </h2>
          <p className="text-muted-foreground text-center max-w-xl mx-auto mb-14 text-balance">
            Every entry is dated and sourced. Contested points are attributed, not asserted.
          </p>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 sm:left-6 top-0 bottom-0 w-px bg-border" aria-hidden />

            <div className="space-y-10">
              {TIMELINE.map((entry, i) => (
                <div key={i} className="relative pl-12 sm:pl-16">
                  {/* Dot */}
                  <div
                    className={`absolute left-2.5 sm:left-4.5 top-1.5 size-3 rounded-full ring-2 ring-background ${
                      entry.highlight ? 'bg-brand-amber' : 'bg-brand-indigo'
                    }`}
                    aria-hidden
                  />
                  <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                    {entry.year}
                  </div>
                  <h3 className="text-lg font-semibold mb-1">{entry.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{entry.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Framing box — clearly labelled as opinion */}
      <section className="max-w-3xl mx-auto px-6 py-16">
        <div className="rounded-2xl border-2 border-brand-amber/40 bg-brand-amber-light/50 dark:bg-brand-amber-light p-8 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-amber mb-3">
            Our view
          </p>
          <p className="leading-relaxed text-foreground/90">
            Today's vote covers voluntary scanning of unencrypted messages, and encrypted content was
            exempted. This is narrower than the mandatory "Chat Control 2.0" still being negotiated.
            We built OursulaChat anyway — because a right that has to be re-won every few months
            against urgency procedures is not a right you should have to rely on a company to defend.{' '}
            <strong>Encryption by default is how you opt out of the debate.</strong>
          </p>
        </div>
      </section>

      {/* Sources */}
      <section className="max-w-3xl mx-auto px-6 pb-16">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">
          Sources &amp; further reading
        </h3>
        <ul className="space-y-2">
          {SOURCES.map((s) => (
            <li key={s.url}>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-brand-indigo hover:underline underline-offset-4"
              >
                {s.label}
                <ExternalLink className="size-3.5" />
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-muted-foreground">
          Corrections welcome — message{' '}
          <span className="font-mono text-foreground/70">npub19jg…78wmn</span> on Nostr.
        </p>
      </section>

      {/* CTA */}
      <section className="relative isolate overflow-hidden border-t">
        <div
          className="absolute inset-0 -z-10 bg-gradient-to-tr from-brand-indigo/10 via-transparent to-brand-amber/10"
          aria-hidden
        />
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Start chatting
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
            No phone number. No account with a company. Two taps and you're in.
          </p>
          <Button asChild size="lg" className="rounded-full px-10 text-base h-12">
            <Link to="/app">
              Open OursulaChat <ArrowRight className="size-4 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-3xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Lock className="size-4" />
            <span>OursulaChat — communication that is simply yours.</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://shakespeare.diy"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Vibed with Shakespeare
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function PromiseCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-6 space-y-3">
      <div className="size-10 rounded-xl bg-brand-indigo/10 text-brand-indigo flex items-center justify-center">
        {icon}
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}
