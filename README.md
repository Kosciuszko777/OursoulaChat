# OursulaChat

**Encrypted, censorship-resistant messaging on Nostr. No phone number, no company, no server to seize — just conversations that are yours.**

> Encrypted, censorship-resistant chat on Nostr — E2E by default (NIP-44), metadata-hidden (NIP-59), no phone number, no server to seize. A calm answer to Chat Control.

---

OursulaChat is a simple, beautiful messenger built on the [Nostr](https://nostr.com) protocol. It feels like the chat apps you already know — your conversations front and center, tap, type, sent — but underneath it works nothing like them: there is no phone number to give up, no company that owns your account, and no central server that can be subpoenaed or switched off. Every message is end-to-end encrypted by default, and the encryption cannot be turned off.

We built it as a calm, practical answer to Europe's recurring attempts to mandate message scanning ("Chat Control") and to the broader drift toward surveillance-by-default. Privacy law can be repealed in an afternoon; mathematics cannot. OursulaChat doesn't ask a provider to *promise* not to read your messages — it removes the provider.

## What it does

- **Direct messages**, end-to-end encrypted by default.
- **Group chats**, chat-first, with the same encryption.
- **Reach anyone by their key** — start a conversation with any npub, or message your followers, with no onboarding gate.
- **Feels like a real messenger** — installable as a mobile app (PWA), light/dark themes, no crypto jargon in the way of a conversation.

## How the privacy works

- **NIP-44** encrypts message content, so only you and your recipient can read it — not relays, not us, not anyone in between.
- **NIP-59 gift wrapping** (with **NIP-17** private DMs) hides the metadata — relays can't see who is talking to whom, only an opaque wrapper.
- **Public relays with no center** mean there is no single server to seize, censor, or shut down. Your identity is a cryptographic key you control, not an account someone can freeze.

A built-in relay inspector shows you, on screen, exactly what the relays can and cannot see — the privacy claim is demonstrated, not just asserted.

## An honest word on the threat model

OursulaChat protects the **content** of your messages (NIP-44) and hides **who is talking to whom** from relays (NIP-59). It does **not**, by itself, hide your IP address from the relays you connect to; against a well-resourced network-level adversary, route your traffic over Tor or a trusted VPN. This is a strong, everyday-private messenger for ordinary people who don't want their conversations read, scanned, or sold — it is not a magic cloak, and we would rather tell you the boundary than let you over-trust it. No hand-rolled cryptography is used; all encryption relies on audited implementations of the Nostr NIPs.

## Status

Early and open. Contributions, review, and honest criticism are welcome — especially on the cryptography and the threat-model boundaries. If you find a security issue, please [describe your responsible-disclosure contact/process].

## Built with

Nostr (NIP-44 / NIP-59 / NIP-17), a client-only architecture (no backend, no database, no custody), and keys that never leave your device. Free and open source under [LICENSE].

---

*Ours-ula — chats that are ours.*
