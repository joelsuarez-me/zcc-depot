---
name: Voice catalog interpretation
description: Why catalog filters must not imply translated demos or exhaustive language support.
---
Treat ElevenLabs catalog labels as provider descriptions, not an exhaustive list of languages a multilingual voice can speak. Do not infer missing language metadata from voice names, accents or model capabilities.

**Why:** The live catalog supplies both descriptive labels and model-specific verified language/accent pairs. Verification for one model or language does not establish the same accent in another, and choosing a voice does not translate fixed demo dialogue.

**How to apply:** Preserve paired language/accent semantics, distinguish missing labels from unsupported languages, and explicitly scope any future script-localization work separately from voice discovery.
