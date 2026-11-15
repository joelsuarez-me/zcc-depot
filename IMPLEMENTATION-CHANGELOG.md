# Implementation changelog

Date: 2026-11-15. Work started from the development repository, not from a verified production snapshot.

## Implemented
1. Added typed feature evidence, honest unassigned owners, explicit product classifications, deployment dependencies and availability qualifications. Added missing/stale evidence review queue and Documentation-tab evidence panel. Human approval is never inferred.
2. Added one destination-access policy shared by search/site map. Search filters by actual identity plus Presenter intent; protected descriptions are generic, with prior destination-name aliases preserved.
3. Applied private/no-store and Cookie/Authorization cache variation to agenda/research responses; private object responses are no-store while deliberately public assets keep their public caching.
4. Added reusable presentation stages: explicit user-initiated native fullscreen or in-app fallback, Previous/Next/Reset/Exit, bounded controls, simulation labels, focus containment/restoration, background isolation and keyboard controls that do not consume editable-field shortcuts.
5. Connected presentation stages to feature demos, routing, callbacks, outbound, supervisor and all four demo nuggets without replacing their playback/narration engines.
6. Added Explore/Prepare/Present/Validate shortcuts without changing the six navigation groups or existing breadcrumbs. Validate opens/focuses the evidence queue; related feature links preserve query deep links.
7. Added executive/technical density, motion controls or preserved native Play/Pause, readable path alternatives and responsibility reminders to core diagrams. Existing node selection, topology, path outcomes and separate routing scenarios remain intact.
8. Added agenda storyboard with audience, challenges, duration, ordered feature/demo/industry-use-case steps, talking points, caveats and private notes. Covers 33 features, four nuggets and 45 actual industry scenarios. Composes explicitly into the existing editable conversation; Save remains a separate action.
9. Added reviewed customer-safe text previews/exports, optional customer context, stable step links and explicit instructions for the existing agenda PDF route. Private notes never enter the customer-safe text or composed conversation. User-entered audience/talking points still require human review.
10. Included unapplied storyboards in agenda navigation, mode-change, sign-out and browser-close warnings; guarded pending agenda saves.
11. Corrected browser-discovered fullscreen focus leakage in native mode as well as fallback; reset both CSS `transform` and independent `translate` for a viewport-sized fallback inside the existing feature dialog. Preserve dark nugget contrast during presentation.
12. Gave Validate a direct `/#evidence-review` anchor with header clearance, and replaced cramped technical connector labels with numbered badges plus a full readable connection legend.

## Modified/new application files
Paths below are relative to `artifacts/zcc-depot/src/` unless noted.

| Area | Files |
|---|---|
| Evidence/access metadata | `data/feature-types.ts`, `data/feature-registry.ts`, **new** `data/feature-evidence.ts`, **new** `data/access-policy.ts`, `data/search.ts`, `data/site-map.ts` |
| Shared UI | **new** `components/presentation-stage.tsx`, **new** `components/diagram-view-controls.tsx`, **new** `components/demo-readiness.css`, **new** `components/evidence-signal.ts`, `components/depot-shell.tsx`, `components/global-search.tsx` |
| Features | `components/features/feature-detail.tsx`, `feature-explorer.tsx`, `feature-simulation.tsx`, `feature-architecture.tsx` |
| Core diagrams | `components/arch-explorer.tsx`, `components/system-data-flow.tsx`, `components/system-overview-diagram.tsx` |
| Operational demos | `components/outbound/OutboundDialerLab.tsx`, `components/supervisor/Explorers.tsx`, `components/supervisor/Insights.tsx`, `components/demo-nuggets/demo-player.tsx`, `pages/resource-routing.tsx`, `pages/resource-callback.tsx`, `pages/resource-supervisor-command-center.tsx` |
| Agenda | **new** `components/agenda-storyboard.tsx`, `pages/agenda.tsx`, `lib/unsaved-shortlist.ts` |
| API | `artifacts/api-server/src/routes/agendas.ts`, `routes/saved-research.ts`, `lib/objectStorage.ts` |

## Test/support files
- New: `artifacts/zcc-depot/scripts/check-demo-readiness.mjs`; `artifacts/api-server/scripts/readiness-access.test.mjs`; `artifacts/api-server/scripts/run-readiness-tests.mjs`.
- Updated: `artifacts/zcc-depot/scripts/check-feature-experience.mjs`, `check-routing-ui.mjs`, `check-callback-ui.mjs`; `artifacts/api-server/scripts/presenter-access.test.mjs`.
- Added the five root assessment/audit/readiness/release documents requested.

## Verification failures found and resolved
- Presenter fixture still expected six rooms; the actual registry has 30. Updated the assertion to compare every registered identity, not merely weaken a fixed count.
- Feature test stub lacked the newly exported EvidenceChip; updated that stub.
- New storyboard integration check used the wrong state-variable name; corrected the check.
- The isolated private-object fixture streamed strings rather than byte chunks; corrected the fixture to match real object streams.
- Legacy routing/callback fake DOMs lacked document event listeners needed by presentation stages; extended those fixtures.
- Public-search sanitization initially removed a non-confidential old destination-name alias (“Demo Researcher”). Restored original **titles** as aliases without restoring protected descriptions.
- Browser verification found native fullscreen did not contain keyboard focus. Isolation and Tab/Shift+Tab containment now cover both native and fallback; focused recheck passed.
- Validate opened the queue below the viewport and long technical connector labels overlapped nodes. Direct queue anchoring/header clearance and numbered badges with a text legend passed the focused recheck.
- A forced-reject fullscreen check found the fallback offset by the dialog's independent CSS translate. Resetting that property, not just `transform`, produced the correct 1280×800 viewport bounds and preserved normal centering after Exit.

Executed checks and remaining blockers are listed in DEMO-READINESS-REPORT.md. No publishing, migrations, authentication-policy changes, external messages, real call actions or paid media generation were performed.
