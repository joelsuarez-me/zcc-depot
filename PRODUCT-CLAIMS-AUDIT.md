# Product claims audit

Date: 2026-11-15. Documentation evidence is not human approval or deployment validation.

## Baseline
33 capabilities contain public documentation references, product classifications and deployment qualifications. Editorial owner/status and explicit dependency metadata are missing at baseline.

## Unresolved product areas
Native ZCC Voice AI availability, real-time translation availability, WFM ingestion support, AI agent collaboration interoperability, regional disaster recovery and regulated-data/compliance scope require deployment-specific confirmation.

No automated source check may set a human-approved state. Missing owners must be shown as unassigned rather than attributed to invented reviewers.

## Current evidence coverage
| Field | Result |
|---|---|
| Stable capabilities | 33, all retained |
| Source URLs and source review dates | Retained from existing documentation research; not silently re-dated |
| Editorial ownership | 33 unassigned; no invented people or teams |
| Status | 27 documentation-reviewed; six availability-sensitive items require verification |
| Human approval | Not recorded for all 33; automated checks cannot grant it |
| Product boundary | Native ZCC / Amazon Connect configuration / Zendesk add-on / AWS service / third party / custom development, as applicable |
| Dependencies | Actual modeled components and responsibility boundaries, plus configuration/entitlement reminder |
| Freshness policy | Missing/invalid/future review date or evidence older than 90 days is reviewable; unassigned ownership also remains in the queue |

“Documentation-reviewed” describes historical source research, not commercial approval, GA availability for every account, successful implementation, compliance or a live integration.

## Availability-sensitive items retained for confirmation
| Capability | Customer-safe qualification / required decision |
|---|---|
| AI agent collaboration | AWS A2A support is not proof of native ZCC interoperability; confirm tier, API path and supported integration. |
| Workforce management | Zendesk WFM, Zendesk QA and Amazon Connect workforce features are separate products/configurations; confirm licensed ingestion and activity coverage. |
| Business continuity | Application fallback is not multi-region DR. Confirm AWS access, supported regional pair, ZCC compatibility and actual recovery objectives. |
| Voice AI agents | Do not imply native ZCC availability from broader Voice AI marketing. Confirm the exact provider, release and entitlement in writing. |
| Voice translation | Preserve early-access/native-account/language and call-type limits; do not imply translation supports every transferred, monitored or video call. |
| Compliance / PHI | Product agreements and eligible-service scope require legal/security review. No “automatically compliant” claim or PHI in simulations. |

## Fresh official-source spot checks in this task
1. [Zendesk Voice AI GA announcement](https://support.zendesk.com/hc/en-us/articles/11183058023450): the article explicitly excludes Talk Partner Edition and says Contact Center support is planned for a future release. This supports retaining the existing unresolved ZCC availability warning.
2. [AWS: Set up Amazon Connect Global Resiliency](https://docs.aws.amazon.com/connect/latest/adminguide/setup-connect-global-resiliency.html): access approval and specific supported region pairs apply. AWS describes ACGR as the supported multi-region resiliency solution; do not replace it with an unverified custom DR promise.

These were live documentation reads, not an exhaustive fresh crawl of every reference. The content inventory check validated 122 official documentation URLs structurally; it did **not** prove every remote URL remains reachable or validate every claim anew.

## Boundaries that must remain in demos and exports
- AWS Contact Lens is not optional Zendesk QA; describe the selected, enabled service.
- ANI/caller recognition is not identity authentication. The verification demo remains a simulated policy-approved check.
- AI suggestions, quality signals and sentiment are not guarantees, regulated decisions or proof of intent.
- Native account and integration models may have different permissions and dependencies.
- Routing, callbacks, dialers, customer stories and transactions remain illustrative; no real campaigns, messages or customer records are changed by these demos.
- Historical internal job aids retain their original source era; do not imply a historical guide establishes current product availability.

## Human review still required
Assign real evidence owners; confirm the six availability-sensitive capabilities against the intended deployment; approve business/commercial/security language before customer use. Missing evidence is surfaced rather than hidden. No customer-demo certification is granted by this audit.
