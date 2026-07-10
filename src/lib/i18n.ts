/**
 * Minimal i18n system for OursulaChat.
 * EN + DE complete. No build-time tooling — just a lookup map + React context.
 */

import { createContext, useContext } from 'react';

export type Locale = 'en' | 'de';

export const translations = {
  en: {
    // App chrome
    'app.name': 'OursulaChat',
    'app.tagline': 'Communication that is simply yours.',
    'nav.chats': 'Chats',
    'nav.settings': 'Settings',
    'nav.back': 'Back',
    'nav.openApp': 'Open app',

    // Onboarding
    'onboard.welcome.title': 'Welcome to OursulaChat',
    'onboard.welcome.sub': 'Encrypted messaging. No phone number. No company. Just your key.',
    'onboard.welcome.create': 'Create your identity',
    'onboard.welcome.login': 'I already have a Nostr key',
    'onboard.backup.title': 'Back up your key',
    'onboard.backup.body': 'This key is the only way to access your account. Save it somewhere safe — nobody can recover it for you.',
    'onboard.backup.download': 'Download key file',
    'onboard.backup.copied': 'Copied!',
    'onboard.ready.title': 'You\'re in',
    'onboard.ready.body': 'Every message you send is encrypted end-to-end. There is no unencrypted mode.',
    'onboard.ready.start': 'Start chatting',

    // Conversations
    'chat.empty.loggedOut.title': 'Sign in to start chatting',
    'chat.empty.loggedOut.body': 'Create an identity or log in with your Nostr key. No phone number, no email.',
    'chat.empty.noConvos.title': 'No conversations yet',
    'chat.empty.noConvos.body': 'Start a new chat by tapping the compose button above.',
    'chat.newChat': 'New chat',
    'chat.newGroup': 'New group',
    'chat.search.placeholder': 'Search conversations…',
    'chat.search.noResults': 'No conversations match your search.',
    'chat.sending': 'Sending…',
    'chat.sent': 'Sent',
    'chat.failed': 'Failed to send — tap to retry',
    'chat.messagePlaceholder': 'Message…',
    'chat.encrypted.title': 'End-to-end encrypted',
    'chat.encrypted.dm': 'Only you and {name} can read this. Relays see neither the message nor that it is from you.',
    'chat.encrypted.group': 'Each member receives their own sealed copy. Relays see no group structure.',
    'chat.encrypted.detail': 'Messages are encrypted with NIP-44 and wrapped in a sealed envelope (NIP-59) before leaving your device.',

    // Group
    'group.create.title': 'New group',
    'group.create.desc': 'Create an encrypted group chat. Each member receives their own sealed copy.',
    'group.create.name': 'Group name',
    'group.create.addMember': 'Add member',
    'group.create.button': 'Create group ({count} members)',
    'group.info.members': '{count} members',
    'group.fanoutWarning': 'Each message is individually gift-wrapped to every member ({count} wraps per message). Large groups may send slowly.',
    'group.privacyNote': 'Removing a member stops new messages to them. Past messages remain on their device.',

    // Settings
    'settings.title': 'Settings',
    'settings.identity': 'Identity',
    'settings.identity.desc': 'Your Nostr key is your identity. Nobody can take it from you.',
    'settings.identity.loggedOut': 'You are not logged in. Tap "Join" in the top bar to create an identity.',
    'settings.appearance': 'Appearance',
    'settings.appearance.desc': 'Choose your preferred theme.',
    'settings.theme.light': 'Light',
    'settings.theme.dark': 'Dark',
    'settings.theme.system': 'System',
    'settings.relays': 'Relays',
    'settings.relays.desc': 'Relays carry your encrypted messages. They cannot read the content.',
    'settings.privacy': 'Privacy',
    'settings.privacy.p1': 'Every message is encrypted with NIP-44 before it leaves your device. Messages are then sealed and gift-wrapped (NIP-59) so that relays cannot see the content or even who is talking to whom.',
    'settings.privacy.p2': 'Your private key never leaves this device.',
    'settings.privacy.p3': 'There is no way to disable encryption. Every chat, every message, always.',
    'settings.language': 'Language',
    'settings.logout': 'Log out',

    // Relay inspector
    'relay.inspector.title': 'What relays can see',
    'relay.inspector.sees': 'The relay sees:',
    'relay.inspector.seesList': 'An opaque encrypted envelope (kind 1059), the recipient\'s public key, a random timestamp, a random one-time sender key.',
    'relay.inspector.cannotSee': 'The relay cannot see:',
    'relay.inspector.cannotSeeList': 'Your identity, the message content, the real timestamp, or that you sent it.',

    // Share
    'share.title': 'Share OursulaChat',
    'share.body': 'Encrypted messaging that is simply yours. No phone number, no company, no center to seize.',
    'share.link': 'Share the link',
    'share.copied': 'Link copied!',

    // Landing
    'landing.hero.title': 'They keep voting to read your messages.',
    'landing.hero.highlight': 'So we built one they can\'t.',
    'landing.hero.sub': 'OursulaChat is end-to-end encrypted by default, has no company to subpoena, and runs on a network with no center to seize.',
    'landing.cta': 'Start chatting',
    'landing.timeline': 'Read the timeline',
  },

  de: {
    // App chrome
    'app.name': 'OursulaChat',
    'app.tagline': 'Kommunikation, die einfach dir gehört.',
    'nav.chats': 'Chats',
    'nav.settings': 'Einstellungen',
    'nav.back': 'Zurück',
    'nav.openApp': 'App öffnen',

    // Onboarding
    'onboard.welcome.title': 'Willkommen bei OursulaChat',
    'onboard.welcome.sub': 'Verschlüsselte Nachrichten. Keine Telefonnummer. Kein Unternehmen. Nur dein Schlüssel.',
    'onboard.welcome.create': 'Identität erstellen',
    'onboard.welcome.login': 'Ich habe bereits einen Nostr-Schlüssel',
    'onboard.backup.title': 'Schlüssel sichern',
    'onboard.backup.body': 'Dieser Schlüssel ist der einzige Zugang zu deinem Konto. Bewahre ihn sicher auf — niemand kann ihn für dich wiederherstellen.',
    'onboard.backup.download': 'Schlüsseldatei herunterladen',
    'onboard.backup.copied': 'Kopiert!',
    'onboard.ready.title': 'Du bist drin',
    'onboard.ready.body': 'Jede Nachricht, die du sendest, ist Ende-zu-Ende verschlüsselt. Es gibt keinen unverschlüsselten Modus.',
    'onboard.ready.start': 'Jetzt chatten',

    // Conversations
    'chat.empty.loggedOut.title': 'Anmelden zum Chatten',
    'chat.empty.loggedOut.body': 'Erstelle eine Identität oder melde dich mit deinem Nostr-Schlüssel an. Keine Telefonnummer, keine E-Mail.',
    'chat.empty.noConvos.title': 'Noch keine Unterhaltungen',
    'chat.empty.noConvos.body': 'Starte einen neuen Chat über die Schreiben-Schaltfläche oben.',
    'chat.newChat': 'Neuer Chat',
    'chat.newGroup': 'Neue Gruppe',
    'chat.search.placeholder': 'Unterhaltungen suchen…',
    'chat.search.noResults': 'Keine Unterhaltungen gefunden.',
    'chat.sending': 'Wird gesendet…',
    'chat.sent': 'Gesendet',
    'chat.failed': 'Senden fehlgeschlagen — zum Wiederholen tippen',
    'chat.messagePlaceholder': 'Nachricht…',
    'chat.encrypted.title': 'Ende-zu-Ende verschlüsselt',
    'chat.encrypted.dm': 'Nur du und {name} können dies lesen. Relays sehen weder die Nachricht noch, dass sie von dir stammt.',
    'chat.encrypted.group': 'Jedes Mitglied erhält eine eigene versiegelte Kopie. Relays sehen keine Gruppenstruktur.',
    'chat.encrypted.detail': 'Nachrichten werden mit NIP-44 verschlüsselt und in einen versiegelten Umschlag (NIP-59) eingewickelt, bevor sie dein Gerät verlassen.',

    // Group
    'group.create.title': 'Neue Gruppe',
    'group.create.desc': 'Erstelle einen verschlüsselten Gruppenchat. Jedes Mitglied erhält eine eigene versiegelte Kopie.',
    'group.create.name': 'Gruppenname',
    'group.create.addMember': 'Mitglied hinzufügen',
    'group.create.button': 'Gruppe erstellen ({count} Mitglieder)',
    'group.info.members': '{count} Mitglieder',
    'group.fanoutWarning': 'Jede Nachricht wird einzeln für jedes Mitglied verschlüsselt ({count} Umschläge pro Nachricht). Große Gruppen senden möglicherweise langsam.',
    'group.privacyNote': 'Entfernte Mitglieder erhalten keine neuen Nachrichten. Vergangene Nachrichten bleiben auf ihrem Gerät.',

    // Settings
    'settings.title': 'Einstellungen',
    'settings.identity': 'Identität',
    'settings.identity.desc': 'Dein Nostr-Schlüssel ist deine Identität. Niemand kann ihn dir nehmen.',
    'settings.identity.loggedOut': 'Du bist nicht angemeldet. Tippe oben auf „Beitreten", um eine Identität zu erstellen.',
    'settings.appearance': 'Darstellung',
    'settings.appearance.desc': 'Wähle dein bevorzugtes Design.',
    'settings.theme.light': 'Hell',
    'settings.theme.dark': 'Dunkel',
    'settings.theme.system': 'System',
    'settings.relays': 'Relays',
    'settings.relays.desc': 'Relays übertragen deine verschlüsselten Nachrichten. Sie können den Inhalt nicht lesen.',
    'settings.privacy': 'Datenschutz',
    'settings.privacy.p1': 'Jede Nachricht wird mit NIP-44 verschlüsselt, bevor sie dein Gerät verlässt. Nachrichten werden dann versiegelt und eingewickelt (NIP-59), sodass Relays weder den Inhalt noch sehen können, wer mit wem spricht.',
    'settings.privacy.p2': 'Dein privater Schlüssel verlässt dieses Gerät nie.',
    'settings.privacy.p3': 'Es gibt keine Möglichkeit, die Verschlüsselung zu deaktivieren. Jeder Chat, jede Nachricht, immer.',
    'settings.language': 'Sprache',
    'settings.logout': 'Abmelden',

    // Relay inspector
    'relay.inspector.title': 'Was Relays sehen können',
    'relay.inspector.sees': 'Das Relay sieht:',
    'relay.inspector.seesList': 'Einen opaken verschlüsselten Umschlag (Kind 1059), den öffentlichen Schlüssel des Empfängers, einen zufälligen Zeitstempel, einen zufälligen Einmal-Absenderschlüssel.',
    'relay.inspector.cannotSee': 'Das Relay kann nicht sehen:',
    'relay.inspector.cannotSeeList': 'Deine Identität, den Nachrichteninhalt, den echten Zeitstempel oder dass du die Nachricht gesendet hast.',

    // Share
    'share.title': 'OursulaChat teilen',
    'share.body': 'Verschlüsselte Nachrichten, die einfach dir gehören. Keine Telefonnummer, kein Unternehmen.',
    'share.link': 'Link teilen',
    'share.copied': 'Link kopiert!',

    // Landing
    'landing.hero.title': 'Sie stimmen immer wieder dafür, deine Nachrichten zu lesen.',
    'landing.hero.highlight': 'Also haben wir eine gebaut, die sie nicht lesen können.',
    'landing.hero.sub': 'OursulaChat ist standardmäßig Ende-zu-Ende verschlüsselt, hat kein Unternehmen, das vorgeladen werden kann, und läuft auf einem Netzwerk ohne Zentrum.',
    'landing.cta': 'Jetzt chatten',
    'landing.timeline': 'Zeitleiste lesen',
  },
} as const;

export type TranslationKey = keyof typeof translations['en'];

/** Get a translation string, with simple {variable} interpolation. */
export function t(
  locale: Locale,
  key: TranslationKey,
  vars?: Record<string, string | number>,
): string {
  const str = translations[locale]?.[key] ?? translations.en[key] ?? key;
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
}

export const I18nContext = createContext<Locale>('en');

export function useLocale(): Locale {
  return useContext(I18nContext);
}

export function useT() {
  const locale = useLocale();
  return (key: TranslationKey, vars?: Record<string, string | number>) => t(locale, key, vars);
}

/** Detect browser language, default to English. */
export function detectLocale(): Locale {
  const lang = navigator.language?.slice(0, 2)?.toLowerCase();
  if (lang === 'de') return 'de';
  return 'en';
}
