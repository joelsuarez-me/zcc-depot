/** Customer-facing synthesis. Restricted source PDFs, promotions and roadmap claims stay out of the client. */
export const COMPARISON_PATH = "/sales/contact-center-vs-voice";
export const COMPARISON_TITLE = "Zendesk Contact Center versus Zendesk Voice";

export const COMPARISON_SOURCES = [
  { id: "voice", title: "Zendesk Voice", url: "https://www.zendesk.com/service/voice/", note: "Phone support, IVR, callbacks, AI and the agent experience." },
  { id: "contact-center", title: "Zendesk Contact Center", url: "https://www.zendesk.com/service/contact-center/", note: "Product positioning, advanced workflows and the Amazon Connect foundation." },
  { id: "routing", title: "About omnichannel routing", url: "https://support.zendesk.com/hc/en-us/articles/4409149119514-About-omnichannel-routing", note: "Channel support, eligibility, capacity and plan-dependent routing rules." },
  { id: "setup", title: "Setting up Contact Center", url: "https://support.zendesk.com/hc/en-us/sections/9641975750554-Setting-up-Contact-Center", note: "Configuration, Amazon Connect flows and integration setup." },
  { id: "pricing", title: "Contact Center pricing", url: "https://www.zendesk.com/pricing/contact-center/", note: "License, Minutes Blocks, prerequisites and usage-based charges." },
  { id: "suite-pricing", title: "Zendesk pricing", url: "https://www.zendesk.com/pricing/", note: "Current Suite plans and available add-ons. Confirm the final quote." },
  { id: "trust", title: "Zendesk Trust Center", url: "https://www.zendesk.com/trust-center/", note: "Security, privacy and compliance information for your review." },
  { id: "qa", title: "Zendesk Quality Assurance", url: "https://www.zendesk.com/service/quality-assurance/", note: "Zendesk QA is a separate product; verify licensing and integration." },
  { id: "voice-ai-availability", title: "Voice AI GA: availability and exclusions", url: "https://support.zendesk.com/hc/en-us/articles/11183058023450", note: "The announcement currently lists Contact Center support as planned; do not infer availability from general marketing." },
] as const;
export type ComparisonSourceId = (typeof COMPARISON_SOURCES)[number]["id"];
export type ComparisonCategory = "Experience" | "Operations" | "Architecture" | "Commercial";
export const COMPARISON_CATEGORIES: ComparisonCategory[] = ["Experience", "Operations", "Architecture", "Commercial"];
export const COMPARISON_ROWS: {
  id: string; category: ComparisonCategory; topic: string; voice: string; contactCenter: string; confirm: string; sources: ComparisonSourceId[];
}[] = [
  { id: "fit", category: "Experience", topic: "Best-fit conversation", voice: "A direct way to bring phone support into Zendesk, with familiar administration and an integrated agent experience.", contactCenter: "A CCaaS foundation for organizations that need more configurable voice operations, advanced automation and deeper integrations.", confirm: "Operational complexity matters more than a fixed agent-count threshold. Both solutions can support growing teams.", sources: ["voice", "contact-center"] },
  { id: "workspace", category: "Experience", topic: "Agent workspace", voice: "Agents manage calls alongside customer records and tickets in Zendesk.", contactCenter: "Amazon Connect-powered call controls and configured customer context are brought into Zendesk Agent Workspace.", confirm: "The shared workspace does not make both products' routing engines or configuration models identical.", sources: ["voice", "contact-center", "setup"] },
  { id: "ai", category: "Experience", topic: "AI, summaries and quality", voice: "Zendesk Voice (Talk) supports eligible native voice AI agents, plus separately licensed and configured Copilot and quality workflows.", contactCenter: "Live-transcript knowledge suggestions require Copilot. Amazon Connect analytics and optional Zendesk QA are separate paths. The native Zendesk Voice AI GA announcement currently lists Contact Center support as planned.", confirm: "Do not infer identical AI availability from a shared workspace or general marketing. Check the actual product, release, language, licensing and configuration. Contact Lens and Zendesk QA remain distinct.", sources: ["voice-ai-availability", "contact-center", "qa"] },
  { id: "routing", category: "Operations", topic: "IVR and routing", voice: "Supports IVR, group, priority, overflow and business-hours routing, plus eligible Zendesk omnichannel routing configurations.", contactCenter: "Uses Amazon Connect contact flows, queues and routing configuration for advanced orchestration and integrations.", confirm: "Advanced behavior must be designed and configured. Zendesk digital routing and Amazon Connect voice routing remain separate.", sources: ["voice", "routing", "setup"] },
  { id: "outbound", category: "Operations", topic: "Outbound and callbacks", voice: "Supports outbound calling and callback options; confirm the supported workflow and plan.", contactCenter: "Supports inbound and outbound operations, including configured campaign and predictive-dialing use cases where available.", confirm: "A manual outbound call is not an automated campaign. Validate dialer mode, regional availability, consent and telephony requirements.", sources: ["voice", "contact-center", "pricing"] },
  { id: "reporting", category: "Operations", topic: "Reporting and supervision", voice: "Voice dashboards, monitoring and cross-channel reporting help teams manage service performance.", contactCenter: "Amazon Connect and Contact Center reporting support queue, agent and call-performance workflows, alongside configured analytics.", confirm: "Validate metric definitions, permissions, latency and the systems supplying each report. A real-time dashboard is not a guarantee that post-call AI is immediately available.", sources: ["voice", "contact-center"] },
  { id: "integrations", category: "Architecture", topic: "External data and automation", voice: "Extend the experience through supported Zendesk apps, APIs and applicable AI workflows.", contactCenter: "Use Amazon Connect contact flows and configured integrations, including Lambda, to read or update approved external systems.", confirm: "Data lookups and caller authentication require approved APIs, permissions and security design; recognizing a phone number does not authenticate a caller.", sources: ["voice", "setup"] },
  { id: "deployment", category: "Architecture", topic: "Deployment and administration", voice: "Suited to teams prioritizing a relatively straightforward rollout and Zendesk-centered administration.", contactCenter: "Requires planning for Amazon Connect, identity, contact flows, telephony and integration ownership.", confirm: "Neither a fixed rollout time nor a no-effort migration is promised. Scope testing, porting and implementation resources.", sources: ["voice", "setup"] },
  { id: "security", category: "Architecture", topic: "Security and data location", voice: "Review available Zendesk privacy, recording and regional controls against your requirements.", contactCenter: "Assess Amazon Connect and Zendesk boundaries, recording controls, service regions and configured data paths.", confirm: "Confirm each data type and service. Separate audio tracks do not make a deployment HIPAA- or PCI-compliant by themselves. Contractual terms and configuration matter.", sources: ["trust", "setup", "contact-center"] },
  { id: "cost", category: "Commercial", topic: "Commercial model", voice: "Evaluate the applicable Zendesk plan, calling usage, numbers and any selected AI or other add-ons.", contactCenter: "Evaluate Suite prerequisites, Contact Center licenses, Minutes Blocks, telephony, added AWS services, support and implementation as applicable.", confirm: "Compare the full operating cost, not just per-seat or per-minute prices. Current official pricing and the signed agreement govern.", sources: ["suite-pricing", "pricing"] },
];

export const FIT_SIGNALS = [
  { id: "fast-launch", title: "Launch phone support quickly", detail: "A straightforward rollout and familiar administration are priorities.", kind: "voice" },
  { id: "standard-routing", title: "Keep call handling straightforward", detail: "Standard inbound menus, transfers and callbacks meet the core need.", kind: "voice" },
  { id: "data-integration", title: "Use business data inside call flows", detail: "External-system lookups or custom actions must influence the caller journey.", kind: "contact-center" },
  { id: "outbound-campaigns", title: "Orchestrate proactive campaigns", detail: "The requirement goes beyond individual outbound calls.", kind: "contact-center" },
  { id: "custom-routing", title: "Design advanced routing", detail: "Customer context, complex branching or multiple operating teams drive the journey.", kind: "contact-center" },
  { id: "residency-review", title: "Review complex data requirements", detail: "Specific recording, residency or regulatory controls need an architecture review.", kind: "contact-center" },
  { id: "limited-it", title: "Keep implementation support lean", detail: "Technical ownership and delivery resources need to be confirmed.", kind: "readiness" },
] as const;
export type FitSignalId = (typeof FIT_SIGNALS)[number]["id"];
export function getFitGuidance(selected: readonly FitSignalId[]) {
  const needs = FIT_SIGNALS.filter(s => selected.includes(s.id));
  const advanced = needs.filter(s => s.kind === "contact-center");
  const straightforward = needs.filter(s => s.kind === "voice");
  if (!needs.length) return { kind: "discovery", title: "Start with the customer’s needs", summary: "Select the requirements that matter. This is a discussion aid, not a product eligibility test.", reasons: [] as string[] };
  if (advanced.length) return {
    kind: "contact-center", title: "Explore Zendesk Contact Center",
    summary: selected.includes("limited-it")
      ? "These needs merit a Contact Center discovery. Confirm technical ownership and scope an implementation partner or services support before recommending a solution."
      : "Your selected needs merit a deeper Contact Center discovery. Validate the specific workflows, regional availability, licensing and implementation plan.",
    reasons: advanced.map(s => s.title),
  };
  if (straightforward.length) return {
    kind: "voice", title: "Explore Zendesk Voice",
    summary: "Voice may fit a simpler rollout and straightforward call handling. Validate the full feature set, plan, regions and future needs before deciding.",
    reasons: straightforward.map(s => s.title),
  };
  return { kind: "discovery", title: "Clarify the operating requirements", summary: "A lean technical team is a delivery constraint, not a product decision. Establish the call flows and required capabilities first.", reasons: needs.map(s => s.title) };
}

export const DISCOVERY_TOPICS = [
  { title: "Service strategy", question: "How important is voice to your customer experience, and what must change?", prompts: ["Channels used today and why customers call", "Business impact of missed calls or unresolved issues", "Outcomes to measure: resolution, wait time, quality and effort"] },
  { title: "Workflow complexity", question: "What should happen before, during and after each call?", prompts: ["IVR choices, customer intent and routing rules", "External data, approved actions and escalation", "Post-call notes, reporting and follow-up ownership"] },
  { title: "Operating footprint", question: "Which teams, regions and languages must the solution serve?", prompts: ["Concurrent agents, seasonality and growth", "Telephony coverage, number ownership and porting", "Business hours, overflow and resilience requirements"] },
  { title: "Delivery readiness", question: "Who can own the rollout and validate the result?", prompts: ["Contact-flow, identity and integration owners", "Security, legal and data-location review", "Budget, implementation support and acceptance criteria"] },
];

export const MIGRATION_STEPS = [
  { title: "Discover and baseline", detail: "Inventory numbers, current flows, recordings, integrations and service KPIs. Confirm the problem before choosing a replacement." },
  { title: "Design the target", detail: "Agree contact flows, identity, data boundaries, regional controls and who owns the Zendesk and Amazon Connect configuration." },
  { title: "Scope cost and delivery", detail: "Validate licenses, usage, AWS services, support, implementation and training. Confirm number portability and any historical-data requirements." },
  { title: "Pilot real scenarios", detail: "Test inbound, outbound, callbacks, transfers, reporting and failure paths with an agreed pilot cohort and measurable acceptance criteria." },
  { title: "Cut over deliberately", detail: "Coordinate number moves, agent readiness and monitoring. Establish a fallback plan, then review outcomes before wider rollout." },
];

export const COMPARISON_FAQ = [
  { q: "Is Contact Center always better than Voice?", a: "No. Voice can be the better fit when straightforward call handling, speed to launch and simpler administration meet the need. Contact Center merits evaluation when the operating requirements demand deeper orchestration, integrations or scale." },
  { q: "Is 50 agents a product limit?", a: "No. Team-size bands in qualification material are directional sales guidance, not product eligibility rules. Consider complexity, risk, growth and the specific workflow requirements rather than a rigid seat threshold." },
  { q: "Does Voice lack AI, IVR, outbound calls or callbacks?", a: "No. Zendesk publicly describes these capabilities for Voice. The comparison is about the required depth of orchestration and operational control, not blanket feature exclusions. Confirm the plan, feature and regional availability." },
  { q: "Are AI, QA and WFM included automatically?", a: "Do not assume so. Confirm the selected plan, add-ons, supported languages, configuration and rollout status. Amazon Connect Contact Lens and Zendesk QA are different services with separate setup and commercial considerations." },
  { q: "Does moving to Contact Center guarantee compliance?", a: "No. Review service scope, contracts, data flows, permissions, recording settings, retention and regional requirements with the appropriate teams. A product feature or recording format alone is not a compliance determination." },
  { q: "Can we assume the migration is instant or free?", a: "No. Number porting, configuration, integrations, historical data and agent training require a scoped plan. Confirm costs and timelines with Zendesk and the implementation team; do not rely on historical offers." },
];
