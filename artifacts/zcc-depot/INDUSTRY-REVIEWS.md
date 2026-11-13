# Industry scenario and documentation reviews

The public Sales → Use Cases by Vertical page shows a **published snapshot** of
the review queue, not a live source monitor. No network checks run in a visitor's
browser. There are no public write/approval endpoints. Repository maintainers
record editorial reviews; normal deployment review controls still apply.

## Check sources

From the workspace root:

```sh
pnpm --filter @workspace/zcc-depot review:industry --check
pnpm --filter @workspace/zcc-depot review:industry --report
```

The first command checks the four actual references in `src/data/verticals/metadata.ts`
and atomically updates `src/data/verticals/review-ledger.json`. The second is
read-only, lists every current source and all 45 scenario IDs, and makes no
network requests. Both print JSON. Exit codes: **0** no attention required,
**1** review/check attention required (including first reviews), **2** command/setup error.
First checks intentionally do **not** approve any source or scenario.

Checks time out after 15 seconds per source, cap HTML at 8 MB, bound redirects,
and restrict destinations to approved Zendesk/AWS documentation hosts.
404/410 mean unavailable; 403, challenges, timeout, rate limiting and provider
errors are inconclusive, **not proof the public link is broken**.

Normalized article/main text is fingerprinted with SHA-256. Scripts/navigation
and whitespace changes are ignored where possible. Meaningful edits, or harmless
editorial changes, can trigger review; the tool cannot determine whether a
product capability changed. Unchanged text is not proof of correctness.

## Record a human review

1. Open each flagged public document and compare its scope to the affected claims.
2. Recheck capability ownership: native Zendesk vs configured AWS vs external
   integration vs conceptual example. Check licensing/configuration caveats.
3. Review industry qualifications and human escalation boundaries. Do not invent
   quantified outcomes, guarantee compliance, or treat a building-block source
   as validation of an entire customer-specific solution.
4. Edit data/references if needed, run `--check`, and explicitly record reviews:

```sh
pnpm --filter @workspace/zcc-depot review:industry --review-source zcc --confirm-reviewed
pnpm --filter @workspace/zcc-depot review:industry --review-scenario <scenario-id-from-report> --confirm-reviewed
```

A source acknowledgement requires a successful check of its current URL within
24 hours. It records the reviewed fingerprint/location and a UTC timestamp.
Scenario acknowledgements record a deterministic change signature covering the
scenario, its industry qualification and reference definitions, plus a timestamp.
A source acknowledgement does not approve dependent scenarios. A scenario
acknowledgement cannot clear outstanding source warnings.

Run source checks at least every **7 days**. Repeat editorial reviews at least
every **90 days**, or sooner after changes. Scenario edits invalidate the
recorded scenario review; changed source text remains flagged against the last
reviewed fingerprint (or first observed baseline before any review).

Review the ledger diff, run `test:industry-review`, `test:vertical-use-cases`,
typecheck and build, then use the normal publication process to update the
public snapshot. These commands neither publish nor rewrite scenario claims.
The ledger contains no reviewer identity or internal customer information.
