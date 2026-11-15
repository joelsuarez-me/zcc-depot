# Demo readiness report

Date: 2026-11-15. Scope: development preview and local automated tests, not production parity.

This is not customer-demo certification. Prior public-browser checks and mocked/component authorization checks are not signed-in functional verification.

## Automated results
| Command / check | Result |
|---|---|
| `pnpm run typecheck` | Passed workspace libraries, API, site, sandbox and scripts |
| Frontend production build (`BASE_PATH=/ PORT=25058 pnpm --filter @workspace/zcc-depot run build`) | Passed; existing large-chunk warning remains |
| API production build (`pnpm --filter @workspace/api-server run build`) | Passed |
| `check-demo-readiness.mjs` | 1,036 evidence/access/search/storyboard/keyboard-target checks passed, including rendered storyboard interactions |
| `check-home-features.mjs` | 1,623 checks passed: 33 stable IDs, feature UI/deep links, safe public bundle and playback/reset behavior |
| `check-site-map.mjs` | 474 route/search/access-label/UI assertions passed |
| `check-unified-navigation.mjs` | 70 navigation/mobile/collapsed/visibility assertions passed |
| `check-content-accuracy.mjs` | 83 structural checks passed; inventory of 122 official URLs, not a live reachability crawl |
| `check-feature-presenter.mjs` | 18 local HTTP checks passed |
| `run-presenter-tests.mjs` | Five test results including parent suite passed; real local HTTP, isolated identity fixtures |
| `run-readiness-tests.mjs` | Three tests passed: anonymous route denial, intended shared-workspace access, private/public object-cache policy |
| `run-saved-research-tests.mjs` | Seven passed: shared save/idempotency, read-only draft conversion, edited agenda preservation, invalid/expired/oversize failures |
| API `run-shortlist-tests.mjs` | Seven passed: public scenario identities, access denial, shared records, revision conflict and delete/missing behavior |
| `check-section-briefs.mjs` | 46 capture/privacy/PDF/control assertions passed |
| `run-narration-tests.mjs` | 14 passed: account settings, explicit consent, late responses, navigation/unmount, exclusive playback, localization and seeking; no paid audio generation |
| Frontend `run-shortlist-tests.mjs` | Three passed, including canceled route/mode/sign-out, pending/failed save and unsaved draft retention through the shared guard |
| `run-research-export-tests.mjs` | 23 passed, including save-first PDF controls, dirty-state export blocking, print/download naming, popup/error fallback and executive report layout |
| Routing engine/UI | 114 / 384 assertions passed; all 12 routing flows retained |
| Callback engine/UI | 42 / 362 assertions passed |
| Outbound engine/UI | 23 / 169 assertions passed |
| Supervisor engine/UI | 7,912 / 173 assertions passed |
| `check-architecture-overviews.mjs` | 47 assertions passed |

Commands without a prefix above are in `artifacts/zcc-depot/scripts/`; API commands are in `artifacts/api-server/scripts/`. Assertion totals are not unique user journeys or coverage percentages.

## Server authorization and confidentiality
- Real development HTTP requests with no session and a spoofed Presenter header returned **401** for `/api/presenter/content`, `/api/pricing-guide`, `/api/sell-sheet`, `/api/sell-sheet/pdf`, `/api/pitch-deck`, `/api/pitch-deck/pdf`, `/api/pitch-deck/slides/1`, `/api/agendas`, `/api/demo-research/saved`. Each restricted response carried `private, no-store`. `/api/healthz` returned 200.
- Isolated HTTP identity fixtures verified anonymous 401, signed-in Customer 403, signed-in Presenter 200 and cross-site 403 for Presenter guidance/middleware. Fixtures exist only in test processes, not application authentication.
- The root router still applies Presenter middleware to pricing, sell-sheet and pitch-deck routes. Their inner handlers are not the full authorization boundary.
- Shared agendas/research intentionally allow all signed-in users through their APIs, including signed-in Customer-mode sessions. This preserves the existing shared-workspace policy; it is **not** individual record privacy.
- Private object bytes now use no-store; public object cache behavior is unchanged.
- Public search filters protected destinations out and contains no protected pricing summaries. Search is not an authorization boundary: protected APIs still enforce access.
- Storyboard private notes do not enter the customer-safe preview, copied/downloaded text, or composed agenda. Manually entered audience, talking points and caveats can still contain sensitive text; export therefore requires preview and explicit human review.

## Accessibility and interaction review
Targeted assessment against relevant WCAG 2.2 AA concerns, **not a full conformance claim**:
- Native buttons/inputs, labelled grouped controls, visible selected states and readable path lists remain available.
- Fullscreen is user-initiated. Both native and fallback presentation isolate surrounding UI, trap Tab, restore focus and exit with Escape outside editable controls.
- Arrow/N/P/R shortcuts are ignored for editable fields, contenteditable/textbox roles and modified keystrokes. Tab still supports the fallback focus boundary.
- Diagram motion respects reduced-motion preferences where the shared motion model is used. Core diagrams retain their existing reduced-motion/Play-Pause behavior.
- Text views preserve the visual diagram's state while providing a non-animated reading option; Technical view retains configuration/boundary detail.
- New evidence labels/hints were darkened for readability. Phone storyboard inputs use 16px text and shared phone control targets are at least 44px high.
- A 390×844 fresh-visitor screenshot of the direct feature URL rendered a contained dialog with readable title/content and internal scrolling; no obvious page failure. Evidence: `generated-artifacts/readiness/feature-phone.jpg`.
- Full screen-reader software testing, every contrast combination, platform-native iOS fullscreen, and Safari/Firefox behavior remain unverified unless specifically listed in the browser results below.

## Consolidated browser results
One consolidated pass, followed only by focused checks of discovered presentation/scroll/label defects. The initial pass failed on a real native-fullscreen focus leak; it was not called a pass. The following results describe the final verified behavior.

| Check | Actual result |
|---|---|
| All 28 registered routes + unknown-route catch-all | Loaded once each; zero uncaught window errors or unhandled rejections. Gated routes showed gate content, not private data. |
| Feature direct URL | Opened stable `customer-verification`, position 25 of 33, all six tabs; related links present; evidence owner/approval honestly unassigned/not recorded. |
| Feature simulation | Play advanced; Next paused at the next step; Reset restored step 1/9; native fullscreen ArrowRight advanced; Escape retained the feature dialog and restored launcher focus. |
| Responsive widths | 390×844, 768×1024, 1280×800, 1920×1080: no horizontal page overflow; dialogs contained; feature cards non-overlapping at checked tablet/desktop grid widths. |
| Fullscreen dimensions | Native presentation matched viewport at phone/tablet/wide desktop. Final forced-reject fallback matched **[0, 0, 1280, 800]**, with visible controls and no clipping. |
| Native keyboard containment after fix | 24 Tab + 24 Shift+Tab presses: zero outside stops; 12 background elements inert. Exit restored focus and inert count to zero. |
| Fallback keyboard containment after fix | 24 forward/reverse Tab stops stayed inside; Escape retained the parent dialog, restored launcher focus, removed inert/presentation lock. |
| Typing suppression | A **browser-only synthetic input**, not an existing UI field, accepted “r” and ArrowRight without driving playback; the same keys outside input advanced/reset correctly. Synthetic input was removed. |
| Validate after fix | `/#evidence-review` opened the queue; summary at y=209 inside the 800px viewport, with visible rows and evidence links. Existing `/#features` remains valid. |
| Technical diagram after fix at 768px | Six numbered badges inside the canvas, no node overlap, six-item text legend without horizontal overflow. |
| Diagram controls | Executive/Technical/Text/Motion controls rendered meaningful alternatives; core architecture text view exposed the 21-step flow. |
| Navigation | Core architecture section/anchor and Back/Forward worked; routing presentation advanced and exited without losing the route. |
| Search | Public scope excluded pricing/agenda/private entries. Footer reflects the accessible index size, not query-match count. |
| Side effects | No records saved; no paid AI/voice/provider requests. Browser-only fullscreen override tabs were closed; no native fullscreen, synthetic input, inert state or presentation lock remained. |

Final fallback screenshot: **oakriz**. Restored normal dialog: **9llp8y**. First-pass phone/tablet/wide evidence: **tubo7b**, **w9rv3f**, **owxl9v**, **k0p5mr**, **8tgttc**. Screenshot IDs refer to the tester evidence accompanying this work; the separate persistent fresh-visitor phone capture is at `generated-artifacts/readiness/feature-phone.jpg`.

### Authenticated browser blocker
The testing identity issuer (`test-mock-oidc.replit.app`, including discovery) returned HTTP 404, “This app isn't live yet.” No claims or issuer override were applied, and the tester did not change production authentication. The normal `/api/login` still redirected to `https://replit.com/oidc/auth`; `/api/auth/user` returned `{"user":null}` anonymously.

Consequently **genuine signed-in Presenter 200/Customer 403 browser sessions, the Presenter agenda storyboard, Compose → Save → reload, canceled navigation with a real signed-in draft, and signed-in export were not browser-verified**. Isolated HTTP identity fixtures, rendered component tests and synthetic database integration tests passed, but they do not replace that missing real identity/browser journey.

Also not exercised in the browser: clicking the Overview related-feature link and its return path (link targets/data checks passed), full screen-reader software operation, and Safari/Firefox/real-iPhone fullscreen/audio. Existing Customer-mode navigation still lists protected destination names and their gates intentionally; no confidential content was exposed.

## Known failures during development
Fixture/alias issues and the browser-discovered focus, Validate scroll, connector-label and fallback-geometry defects are listed in IMPLEMENTATION-CHANGELOG.md. Focused rechecks resolved the application defects; the unavailable testing identity service remains a blocker. No failed run is being relabelled as passing.

## Release risks
1. All evidence owners remain unassigned, six availability-sensitive capabilities require confirmation, and no human product approval is recorded.
2. Local build/HTTP/UI tests do not prove published-site parity. Nothing was automatically deployed.
3. Storyboards are in-memory while editing. Explicit composition saves their human-readable sequence in the agenda; structured step metadata/private notes are not persisted for later re-editing.
4. Customer-safe exports depend on the presenter's review of manually entered text. They are not automatic confidentiality classification.
5. Existing build warnings include large frontend chunks and third-party sourcemap/deprecation notices; no performance budget or cross-browser certification was established.
6. The authenticated browser journey remains blocked as detailed above. This is not a customer-demo certification or an instruction to publish.

## P2 proposals, deliberately not activated
### Shared design tokens
Consolidate the existing Zendesk-inspired lime/forest/ivory colors, control targets, spacing, card surfaces and motion durations into reusable tokens. Migrate one component family at a time with visual regressions rather than restyling or rebuilding the site.

### Opt-in, privacy-conscious analytics
Before implementation, approve consent text, audience, retention and event access. Measure aggregate public feature opens, demo starts/completions, zero-result search counts and storyboard export/compose outcomes using stable public identifiers only. Never collect free-text queries, customer/company names, audience/challenges, research content, agenda text, private notes, auth identifiers, document URLs or exported report contents. No analytics collection was added or enabled.

### Source-grounded architect assistant
No approved authorization-aware retrieval infrastructure was established in this repository review, so no assistant was added. Proposed design: curated source registry → dated reviewed ingestion → separate public/Presenter indexes → server identity and mode enforcement before retrieval → cited answers with product-boundary/availability caveats. Reject unsupported questions, do not retrieve customer records by default, never use browser hiding as access control, and require explicit policy for logs/retention/model processing before implementation.
