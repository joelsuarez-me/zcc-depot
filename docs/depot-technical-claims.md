# Depot technical claim registry

Reviewed: **2026-11-13**. This is a scoped source review, not certification of a
customer environment. No model-generated claim, demo animation, or historical
roadmap establishes current availability or entitlement.

## Authoritative sources reviewed

| Ref | Source |
| --- | --- |
| Z1 | https://www.zendesk.com/service/contact-center/ |
| Z2 | https://support.zendesk.com/hc/en-us/articles/10879422998554 |
| Z3 | https://support.zendesk.com/hc/en-us/articles/10879182740506 |
| Z4 | https://support.zendesk.com/hc/en-us/articles/10880620037914 |
| Z5 | https://support.zendesk.com/hc/en-us/articles/10342463822746 |
| A1 | https://docs.aws.amazon.com/connect/latest/adminguide/what-is-amazon-connect.html |
| A2 | https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/Welcome.html |

The pages above were fetched and read on the review date. A documentation link
returning 200 alone is not fact verification.

## Claims and recommended wording

| Original claim or proposition | Status | Source | Verified/reviewed | Recommended wording / disposition |
| --- | --- | --- | --- | --- |
| Amazon Connect supplies the voice and contact-routing foundation. | Verified | Z2, Z5, A1 | 2026-11-13 | Amazon Connect Customer provides the configured telephony, IVR, queues and contact flows. This does not mean all Zendesk channels share one routing engine. |
| Every customer must supply their own AWS account. | Incorrect | Z2, Z5 | 2026-11-13 | A customer may have a Zendesk-provisioned AWS account or manage their own Connect instance, according to the purchasing arrangement. |
| One Contact Center environment links to one Connect instance. | Verified | Z2 | 2026-11-13 | Current setup guidance describes one-to-one pairing. Recheck this constraint before scoping a multi-instance design. |
| Zendesk acts as an identity provider for Contact Center's AWS services. | Verified | Z2, Z3 | 2026-11-13 | Users authenticate through their corporate identity provider to Zendesk; Zendesk-managed federation supports the specified Contact Center AWS services. Do not describe it as a general-purpose identity broker. |
| Recognizing a caller's number authenticates the customer. | Incorrect | Z4 | 2026-11-13 | Phone-number matching supplies context. Separately design and validate customer identity verification. |
| Contact attributes populate ticket fields and incoming-call context. | Verified | Z4 | 2026-11-13 | Configure attributes in the contact flow and map matching keys to appropriate fields. Test the mapping with a configured call. |
| Tickets always contain all call data automatically. | Incorrect | Z4 | 2026-11-13 | Which fields and call information appear depends on mapping, timing, supported attributes, permissions and configuration. |
| CloudFormation provisions AWS infrastructure from templates. | Verified | A2, Z5 | 2026-11-13 | CloudFormation models and manages stacks. Review IAM permissions, template changes, dependencies and deletion/retention effects before deployment. The portal never deploys a stack. |
| Lambda/API Gateway/CloudWatch and storage are part of the AWS architecture. | Verified | Z5 | 2026-11-13 | The AWS-service list distinguishes base and optional services. Diagrams are illustrative of relevant patterns, not an exhaustive deployment inventory. |
| Voice and digital share a single unified routing engine by default. | Needs Verification | Z1, Z2 | 2026-11-13 | Present a unified agent experience; validate channel-specific routing and context continuity in the actual environment. |
| Voice AI agents and Voice Copilot are publicly positioned Zendesk capabilities. | Verified | Z1 | 2026-11-13 | Public product positioning includes these capabilities. Availability, region, account setup and licensing still require validation. Prepared simulations do not prove entitlement. |
| All AI features are included in every Contact Center purchase. | Needs Verification | Z1, Z5 | 2026-11-13 | Validate the purchased package, enabled features, add-ons and usage charges. No universal entitlement is asserted. |
| Amazon Connect/Contact Lens and Zendesk QA are the same product. | Incorrect | Z1, Z5 | 2026-11-13 | Keep optional Zendesk QA and Amazon Connect/Contact Lens analytics distinct. Validate each product's configuration and commercial scope. |
| A2A specialist orchestration is an available, preconfigured Zendesk integration. | Conceptual | Z2, Z5 do not establish this integration | 2026-11-13 | Explain an illustrative orchestration concept only. Confirm tiers, APIs, security, integration ownership, context transfer and support before promising an implementation. |
| Post-call records, transcripts and evaluations are immediate. | Needs Verification | Z4, Z5 | 2026-11-13 | Processing time and artifact availability depend on enabled services and account configuration; do not promise synchronous results. |
| Zendesk Contact Center guarantees HIPAA compliance for the customer. | Incorrect | Z5 | 2026-11-13 | Review Advanced Compliance/BAA scope, the applicable AWS BAA, eligible services and customer configuration. Certification is not a substitute for implementation review. |
| In-app calling, video and outbound campaigns are universally included. | Needs Verification | Z5 | 2026-11-13 | The services page identifies optional services. Validate the customer's selected offer, region and configuration. |
| All customers receive a fixed percentage cost or productivity improvement. | Needs Verification | Z1 customer examples are not a universal guarantee | 2026-11-13 | Agree on baseline, pilot, measures and evaluation criteria. Any quoted published result must be attributed to its specific customer. |
| Historical roadmap dates are current delivery commitments. | Outdated | Existing internal source snapshot, February 2026 | 2026-11-13 | Preserve only in authenticated Presenter content, prominently dated and described as non-binding historical planning. Confirm current status with the product team. |
| Internal pricing/package examples are current universally applicable quotes. | Needs Verification | Internal pricing source; no new approved quote supplied | 2026-11-13 | Preserve behind Presenter authorization. Confirm current package, region, terms, usage and approval before quoting externally. |
| ElevenLabs narration is Zendesk production voice AI. | Incorrect | Portal implementation | 2026-11-13 | Prepared AI-generated dialogue illustrates a demo. It is not a live call, connected Zendesk account, or evidence of a production integration. |
| Amazon Connect is the current unqualified product name in AWS documentation. | Outdated | A1 | 2026-11-13 | Current AWS documentation calls the contact center product Amazon Connect Customer. Preserve familiar labels where needed for existing diagrams and use the current source's terminology in explanations. |

## Review boundaries

- Existing customer-supplied agendas, generated research snapshots and imported
  decks are not silently rewritten. Their provenance and source dates remain
  important; generated research remains an aid requiring validation.
- Historical internal material is preserved server-side, not republished as a
  current customer-facing product promise.
- The original portal contains additional descriptive and historical claims.
  The inventory script enumerates these as **Needs Verification** candidates;
  this registry does not pretend that every sentence has been independently
  verified.
- Revisit this registry when product scope, source documentation, licensing or
  deployment patterns change.
