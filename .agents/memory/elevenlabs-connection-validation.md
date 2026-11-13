---
name: ElevenLabs connection validation
description: A ready connector can still hold an API key ID instead of a usable secret key.
---
Validate ElevenLabs against its API before claiming narration works. A managed connection marked ready does not prove that ElevenLabs accepts its credential. An API key ID identifies a key but cannot replace the full secret API key.

**Why:** The connection repeatedly reported ready while ElevenLabs rejected its saved value as an API key ID, including after connection updates.

**How to apply:** Use the existing connector to check the voice list. If it rejects the credential, direct the owner to replace the value securely in the existing Integrations connection with the secret shown on key creation or rotation. Never request that secret in chat. Keep actual provider-audio verification explicitly blocked until a real request succeeds; do not substitute browser speech and call it ElevenLabs.
