# Section navigation geometry regression suite

Run against the existing frontend workflow and API workflow, not a second server:

```sh
SECTION_NAV_BASE_URL="https://<development-preview-host>/" \
  pnpm --filter @workspace/zcc-depot test:section-geometry
```

`SECTION_NAV_BASE_URL` is required. Include the artifact's path and trailing slash
if it is not mounted at `/`. Routes are resolved relative to that path.
For a local routed proxy, `http://localhost:80/` also works.

Install Chromium once with `pnpm --filter @workspace/zcc-depot exec playwright install chromium`,
or use an existing compatible browser:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/repl/tools/bin/chromium \
SECTION_NAV_BASE_URL="https://<development-preview-host>/" \
  pnpm --filter @workspace/zcc-depot test:section-geometry
```

The suite runs 18 cases: five public routes and the synthetic Research report,
each at 320×844, 390×844 and 1440×844. It measures real rendered bounds, checks
44px arrow targets, overlap with logo/search/menu, horizontal phone placement,
viewport containment, hit testing, top/middle/bottom scroll states, open phone
menu and populated search dialog, arrow scroll behavior and disabled end states.
Every phone case resizes to desktop and verifies the vertical left rail and
restored fragment link. Desktop links are followed and reloaded; the target,
route and query must survive. Existing source-level section tests remain useful
but do not replace this suite.

## Research report fixture is NOT authentication testing

When test OIDC is unavailable, `research-layout-fixture.ts` intercepts browser
requests for `/api/auth/user`, the saved-report list and a single saved report.
The real page loads the synthetic complete report through its normal saved-report
URL and renders all six report sections. The fixture works only inside Playwright's
isolated browser context: no production switches, auth bypasses, server sessions,
database writes, provider calls or fabricated cookies are added to the app.
Unexpected API requests fail and are asserted at the end of the case.

Test titles and report annotations explicitly identify fixture cases. These
prove signed-in **layout** behavior only, not OIDC login, session handling,
server authorization, research generation, saving, conversion or PDF export.
Public cases explicitly intercept the user response as signed out. Real
authentication needs a separate test with a supported test identity.

## Failure evidence

HTML report, screenshots and retained failure traces are written under
`generated-artifacts/section-navigation/` at the workspace root (ignored by Git
and deployment). Assertion messages include the conflicting rectangles.
Use `pnpm --filter @workspace/zcc-depot exec playwright show-report ../../generated-artifacts/section-navigation/report`
to inspect the report. Exit status is nonzero on failure; no automatic retries
hide intermittent regressions. Select one case with standard Playwright flags,
for example `--project=chromium-320 --grep=Overview`.
The development-only preview notice is dismissed using its own Close banner
button before measurements; application nodes and CSS are never hidden or
rewritten by the suite.
