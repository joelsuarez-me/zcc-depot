# Platform Architect Depot modernization

## Rollback point

The pre-change source is preserved by Git tag
`depot-before-modernization-20261113`, created before implementation.
No database schema, production configuration or publishing settings are changed
by this modernization.

To inspect the saved version without changing the working tree:

```sh
git show depot-before-modernization-20261113:artifacts/zcc-depot/src/App.tsx
git diff depot-before-modernization-20261113 --stat
```

For a rollback, use Replit's checkpoint interface or create a separate branch
at the tag and review the differences first. Do not blindly reset or clean a
workspace containing subsequent work. The tag restores source only, not
production data, provider state or account settings.

## Existing content and behavior inventory

Original routes retained:

- `/` — Overview, solution pillars, call journey and feature exploration.
- `/architecture` — animated system/data flow and existing technical material.
- `/architecture/components` — component map, identity and ownership boundaries.
- `/sales` — use cases and preserved enablement.
- `/pricing` — internal packaging guide and its three section deep links.
- `/sell-sheet` — protected sales guide and original PDF.
- `/resources` — searchable documents, bookmarks, FAQs, knowledge, pitch deck,
  internal briefing and historical roadmap.
- `/demos` — Demo Blueprint and embedded click-through.
- `/demos/instance-details` — configured instance destinations and phone details.
- `/demos/nuggets` — feature simulations, playlists, role voices, voice previews,
  prepared multilingual dialogue, captions and narration preferences.
- `/demos/brief` — Gemini research, saved reports, PDF export and conversion.
- `/agenda` — shared saved agendas, logo handling, edit/presentation and PDF.

Existing external resource destinations, diagrams, documents, imagery and
integration code remain in the project. Restricted roadmap/GTM/briefing material
is relocated to server-only data; it is not discarded.

Generate the machine-readable inventory and preservation comparison:

```sh
pnpm --filter @workspace/zcc-depot exec node scripts/audit-depot.mjs
```

Reports are written to ignored `generated-artifacts/depot-audit/`. The report
includes original routes, source-file hashes, literal section IDs, links,
interactive-control counts, assets and claim candidates. Dynamic IDs and
generated controls are identified through source/code tests, not inferred from
the literal-only counts.

The claim-candidate report marks unreviewed descriptive claims **Needs
Verification**. It is not a claim that all sentences were fact-checked. The
curated review is in [the technical claim registry](depot-technical-claims.md).

## Security model

- Customer mode is the default presentation mode.
- All signed-in portal users can enter Presenter mode. This preserves the
  portal's shared signed-in access model; it is not a new employee/domain or
  administrator role assertion.
- Presenter mode alone grants no access: the API also requires a valid
  authenticated session.
- Presenter content is served with private/no-store headers and excluded from
  public frontend imports. Customer-mode requests are denied even with a
  signed-in session.
- Restricted guides, raw PDFs and deck slide images have the same server-side
  guard. Cross-site browser requests are refused.
- Non-sensitive room preferences may be local. Customer research, agendas,
  internal notes and secrets must not be persisted as general room preferences.

## Stack and running

React, TypeScript, Vite, Wouter, Tailwind, Framer Motion and the existing Express
API remain. The registered frontend and API workflows supply their ports and
base paths; do not start a competing server.

```sh
pnpm run typecheck
PORT=25058 BASE_PATH=/ pnpm --filter @workspace/zcc-depot run build
pnpm --filter @workspace/api-server run build
node artifacts/api-server/scripts/run-presenter-tests.mjs
pnpm --filter @workspace/zcc-depot run test:components
pnpm --filter @workspace/zcc-depot run test:narration
pnpm --filter @workspace/api-server run test:narration
```

The explicit build environment values above are for a local one-off check.
Publishing uses the managed artifact configuration, which is not changed here.

## Delivered structure

- `src/components/depot-shell.tsx`, `kit.tsx`, `lib/depot-mode.tsx`: shared
  sidebar/top bar, mobile drawer, breadcrumbs, mode control and preferences.
- `src/pages/rooms/`: six lazy-loaded, interactive room pages.
- `src/components/home-hero.tsx`, `arch-explorer.tsx`,
  `src/data/arch-model.ts`: selectable SVG overview and detailed architecture
  with layers, pan/zoom, full screen and guided tour.
- `src/components/room-kit.tsx`, `presenter.tsx`,
  `src/hooks/use-presenter-content.ts`: section links/favorites, room progression,
  timer, keyboard shortcuts and protected notes.
- API `presenter.ts`, `presenterAccess.ts`, `presenter-rooms.ts`,
  `depot-private-content.ts`: authenticated server-only Presenter delivery.
- `lib/api-spec/openapi.yaml`: Presenter contract, with regenerated client hooks
  and response validators.
- Existing agenda/research/narration/storage implementations and routes remain.

## Verification results

Recorded on 2026-11-13:

| Check | Result |
| --- | --- |
| Full workspace TypeScript check | Passed |
| Frontend production build | Passed |
| API production build and managed workflows | Passed; both services running |
| Component regression suite | 46 passed |
| Frontend narration checks | 11 passed |
| API narration/privacy/preferences checks | 22 passed; provider calls mocked, no paid speech generated |
| Public resource-checker unit suite | 14 passed; not a fresh HTTP audit of every destination |
| Saved research and agenda-conversion tests | 6 passed; isolated test records cleaned up |
| New route preservation/bundle-source/guard checks | 3 passed |
| Presenter access tests | 5 passed; fixture identities in an isolated test server |
| API health | HTTP 200 |
| Actual anonymous Presenter/guide/PDF requests | HTTP 401, including requests spoofing Presenter mode |
| Final built JS confidential-content marker scan | No restricted markers found |
| Original roadmap, GTM and resource URL preservation | All four comparisons passed |
| Browser: six room destinations | All rendered meaningful content |
| Browser: architecture selection/layers/zoom/tour | Passed; tour advanced to its second step |
| Browser: section favorite, reload and command search | Passed |
| Browser: anonymous Presenter gate / Customer resource view | No private notes, roadmap, GTM or briefing content displayed |
| Browser at 390px: component and architecture routes | Arrow strip at y=60–116, no content/header overlap or horizontal overflow |
| Browser: mobile drawer | Initial defect fixed; scoped follow-up confirmed left=0, full 320px panel, focus containment, Escape restoring focus to opener |
| Significant browser console errors | None observed in the public browsing journey |

**107 automated checks passed** across the suites listed above. Builds retain
non-fatal UI sourcemap and large-main-chunk warnings. No Lighthouse score was
measured or claimed.

### Signed-in browser limitation

The browser test's temporary OIDC provider failed discovery before a session
could be established. Consequently, authenticated Presenter console/timer
interaction and authenticated Customer-mode HTTP 403 behavior were **not
verified in the browser**. Do not interpret the anonymous checks as a substitute.
The isolated API tests did verify authenticated Presenter 200 and authenticated
Customer 403 behavior, without adding a production authentication bypass.

The temporary test override was cleared. The standard `/api/login` endpoint was
then confirmed to return HTTP 302 to the normal Replit OIDC service. The existing
authentication implementation was not replaced or weakened.

### Product accuracy

The curated registry records 22 reviewed propositions, including configuration
qualifiers, customer-managed versus Zendesk-provisioned AWS, one-to-one instance
pairing, identity versus caller recognition, optional QA, and conceptual A2A.
The original-content audit also identifies 90 descriptive candidates needing
further review; these are explicitly unverified rather than silently certified.

## Dependencies and verification boundaries

- Real company research still depends on the managed Gemini service and current
  sources. Prepared demos are not live customer research.
- Paid narration depends on an accepted ElevenLabs connection and available
  voices. Do not generate speech automatically when entering Customer mode.
- Full-screen capability depends on browser support and a user gesture.
- Internal source currency, roadmap approval, commercial quotes and customer
  integration readiness require the appropriate owners.
- Lighthouse targets of Performance 90+ and Accessibility 95+ are goals, not
  measured scores unless a recorded audit explicitly establishes them.
- No automatic publishing or production/access-setting changes are authorized.
