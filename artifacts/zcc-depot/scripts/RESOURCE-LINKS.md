# Public documentation preflight

Run from the workspace root before a customer demo:

```sh
pnpm --filter @workspace/zcc-depot check:resource-links
```

The checker reads the actual `LINKS`, `RESOURCES`, and `COMPONENT_DOCUMENTATION`
exports in `src/data/content.ts`, uses `src/lib/component-documentation.ts` to
validate chip mappings, and includes the guide constants from
`src/data/contact-center-components.ts`. Duplicate URLs and fragments are checked
once; every source entry is retained in the report. No portal links are edited.

Options:

- `--list`: show the inventory and exclusion reasons without any network requests.
- `--json`: print a structured report, including healthy results, source entries,
  exclusions and the time checked.
- `--help`: show usage.

For a saved report (the output folder is ignored by Git and deployment):

```sh
mkdir -p generated-artifacts
pnpm --silent --filter @workspace/zcc-depot check:resource-links --json > generated-artifacts/resource-links.json
```

## Reading the result

- **ok**: HTML documentation returned HTTP 200 without detected error/challenge markers.
- **moved**: redirected to another allowed public documentation URL. Review the
  destination before manually updating the source; a redirect is not itself a failure.
- **missing**: HTTP 404/410, or a missing-page title/primary heading in an HTTP 200 response.
- **failed**: other client errors, redirect loops or malformed/excessive redirects.
- **restricted**: sign-in/access restrictions or an anti-bot challenge, **not proof
  that the article is missing**.
- **temporary**: rate limits, server/network errors or timeouts. Retry later.
- **unverified**: unsafe/out-of-scope redirects, HTML refresh pages, incomplete or
  non-HTML responses. Inspect manually; the check does not follow them.

Exit codes: **0** means all checks were healthy or moved; **1** means at least
one missing/failed result; **2** means only inconclusive results (or a setup error).
Exit 1 can also contain inconclusive results—read the summary. A partial run must
not be treated as an all-clear. A successful check does not validate fragment
anchors or whether an article's content is still accurate.

## Request safety

Only HTTPS Zendesk Help Center article/section/category paths and AWS HTML
documentation paths are allowed. Internal resources, private attachments,
non-documentation sites, URL credentials, custom ports and query strings
(including signed file URLs) are excluded. An internal resource's URL is excluded
even if it also appears in a shared mapping.

Requests use no credentials, cookies, authorization headers, browser session or
environment secrets. Redirects are checked before requesting the destination;
redirect cookies are never replayed. Sign-in redirects are reported without
opening them. Excluded URLs and rejected redirect targets are omitted from reports.

At most two requests run concurrently, with 300 ms between requests per worker,
a 12-second timeout covering redirects and response bodies, a five-redirect limit,
and a 2 MB response limit. A rate limit or detected anti-bot challenge pauses that
host for the rest of the run (one already-running request may finish). There are
no automatic retries or attempts to bypass restrictions.

## Offline regression tests

```sh
pnpm --filter @workspace/zcc-depot test:resource-links
```

These use synthetic responses; they do not contact providers. They cover the live
source inventory, exclusion policy, redirects, HTTP and soft errors, anti-bot/sign-in
pages, timeouts, request limits, source reporting and exit codes. The live check is
separate because provider availability should not make offline tests flaky.
