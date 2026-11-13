# Prepared demo script languages

Supported script locales are English (US), Spanish (Spain) and French (France).
Selection changes the fixed narration, voice audition sample and dialogue captions
together. It does not translate the surrounding interface, simulated screenshots,
stage labels, source material or provider catalog metadata.

Language selection applies to the current visit and resets to English on a new
visit or account change. It is not embedded in shared playlist links. Selecting a
language, restoring settings, loading the catalog or applying a voice never
starts generation; the presenter must explicitly press Play or Preview.

## Translation review

The Spanish and French editorial translations were reviewed against all 21
English lines for completeness, role/stage alignment, meaning and product-claim
boundaries during implementation. This is an AI-assisted editorial review, not a
claim of native-speaker or vendor certification. These are fixed translations,
not text translated by the speech provider.

The review specifically retained:

- **Copilot:** a prepared example and illustrative article, availability dependent
  on configuration, human review of guidance and its source, and no actual return
  or account change.
- **Quality:** illustrative spotlights rather than real assessments, no recording
  upload or analysis, and the need for the relevant product and configuration.
  No translation introduces a claim that Contact Lens and Zendesk QA are the same
  product or that either is included by default.
- **AI agents:** a prepared replacement flow that changes no order and creates no
  real replacement, collection or notification.
- **Video:** voluntary joining, camera/microphone preview, sharing only a selected
  window, keeping private information out of view, and preserving ticket context.
- Terry's name and the sample order number (15,023) retain their meaning.

When editing an English line, review the corresponding Spanish and French lines
before release. New translations must cover every stage with the same role;
missing entries fail server initialization rather than silently speaking English.
Automated tests enforce coverage, locale validation, caption/speech identity,
account and cache separation, and no generation on language selection.

Generated audio is ephemeral. Server cache identity includes the authenticated
presenter, locale, stage, voice, model and exact script text, so editorial changes
cannot serve an older recording. Browser caches likewise separate presenters,
locales and text. No customer-supplied dialogue is accepted.
