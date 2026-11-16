import { FEATURES } from "./content";
import { buildFeatureArchitecture, type ArchitectureNodeId } from "./feature-architecture";
import { FEATURE_SOURCES, type FeatureSourceId } from "./feature-sources";
import { FEATURE_CATEGORIES, type EnterpriseFeature, type FeatureCategoryId, type FeatureClassification, type FeatureDemoKind } from "./feature-types";

const N: FeatureClassification = "Native Zendesk Contact Center";
const C: FeatureClassification = "Amazon Connect Configuration";
const Z: FeatureClassification = "Zendesk Product / Add-On";
const A: FeatureClassification = "AWS Service Integration";
const T: FeatureClassification = "Third-Party Integration";
const D: FeatureClassification = "Custom Development";
const V: FeatureClassification = "Availability Requires Verification";

interface Seed {
  id: string; title: string; categories: FeatureCategoryId[]; icon: string;
  description: string; problem: string; outcome: string; value: [string, string];
  example: string; industries?: string[]; keywords: string[];
  classes: FeatureClassification[]; availability: string;
  docs: FeatureSourceId[]; path: ArchitectureNodeId[]; setup: [string, string, string];
  demo: FeatureDemoKind; href?: string; legacyIndex?: number; aliases?: string[];
}

const seeds: Seed[] = [
  {
    id: "intelligent-routing", title: "Advanced Intelligent Routing", categories: ["voice", "agent"], icon: "Route",
    description: "Match callers to eligible agents using configured skills, queues, priority and capacity.",
    problem: "Repeated transfers and mismatched work make customers repeat their needs.",
    outcome: "Faster resolution", value: ["Use context to select an appropriate team.", "Make eligibility and fallback decisions explainable."],
    example: "Route a fictional billing call to an eligible specialist, then expand the queue when that specialist is unavailable.",
    keywords: ["omnichannel routing", "availability", "capacity", "skills", "queue", "priority", "bullseye", "routing profiles"],
    classes: [C], availability: "Connect voice routing and Zendesk digital omnichannel routing are configured separately. Channel coverage, capacity rules and plans must be confirmed; one workspace is not one universal routing engine.",
    docs: ["routing", "components"], path: ["customer", "connect", "queue", "zcc", "workspace"],
    setup: ["Define supported channels, agent skills and service priorities.", "Configure Connect queues and routing profiles; configure Zendesk digital routing separately.", "Test eligibility, capacity, overflow and no-agent paths with permitted sample contacts."],
    demo: "journey", href: "/resources/routing", legacyIndex: 9,
  },
  {
    id: "ivr", title: "Interactive Voice Response (IVR)", categories: ["voice", "ai"], icon: "ListTree",
    description: "Guide callers through menus, recorded answers and configured team-selection paths.",
    problem: "Callers reach the wrong team or wait for information that could be provided earlier.",
    outcome: "Customer effort", value: ["Make common entry choices clear.", "Pass collected intent into the next configured routing step."],
    example: "A caller chooses Sales, Support or Billing; the selected option follows the contact into the queue.",
    keywords: ["phone menu", "dtmf", "contact flow", "recorded answers", "switch to text"],
    classes: [C], availability: "Menus and recorded answers require contact-flow configuration. A switch to text needs a supported, enabled channel and integration; it is not a default option on every plan.",
    docs: ["ivr", "flows"], path: ["customer", "connect", "input", "queue", "workspace"],
    setup: ["Agree the phone menu and accessible escape route.", "Configure prompts, input capture, retries and queues in the Connect flow.", "Test invalid input, silence, after-hours handling and any separately integrated SMS handoff."],
    demo: "journey", href: "/resources/routing", legacyIndex: 10,
  },
  {
    id: "callbacks", title: "Callback Management", categories: ["voice", "operations"], icon: "PhoneForwarded",
    description: "Offer configured queued callbacks so customers can leave the hold line.",
    problem: "Long hold times require customers to remain on the phone.",
    outcome: "Customer effort", value: ["Offer an alternative to remaining on hold.", "Preserve intended queue order through correctly configured priorities."],
    example: "A caller requests a callback; the queue retains the original contact priority under the configured routing rules.",
    keywords: ["customer callbacks", "queued callback", "retry", "queue position", "agent first", "customer first"],
    classes: [C], availability: "Queue priorities, outbound caller ID, agent capacity and retry settings affect behavior. Customer-first dialing has additional instance requirements. A callback time is not guaranteed.",
    docs: ["callbacks", "services"], path: ["customer", "connect", "queue", "phone", "workspace"],
    setup: ["Choose callback eligibility, dialing mode, consent and supported numbers.", "Configure callback flows, caller ID, queues, routing profiles and retries.", "Test queue order, no answer, voicemail, duplicate requests and exhausted retries."],
    demo: "journey", href: "/resources/callback", legacyIndex: 11,
  },
  {
    id: "outbound-dialing", title: "Outbound Dialing", categories: ["voice", "operations"], icon: "PhoneOutgoing",
    description: "Explore agent-initiated calls and separately configured campaign workflows.",
    problem: "Teams need a controlled way to follow up with customers outside an inbound conversation.",
    outcome: "Connected context", value: ["Keep follow-up tied to a service purpose.", "Make campaign dependencies and consent controls visible."],
    example: "Compare a single agent follow-up with an illustrative, consent-checked appointment-reminder campaign.",
    keywords: ["proactive outbound calling", "predictive", "progressive", "preview", "campaign", "suppression", "consent"],
    classes: [C, A], availability: "Manual calling is distinct from Amazon Connect Outbound Campaigns. Campaigns are optional and need supported regions, permissions, capacity, contact data and legal consent/suppression controls.",
    docs: ["outbound", "services"], path: ["external", "lambda", "connect", "phone", "customer"],
    setup: ["Separate one-to-one follow-up from campaign requirements.", "Review supported campaign services, caller ID, quotas and suppression rules.", "Validate opt-outs, dialing windows, answering-machine outcomes and agent availability without placing real calls."],
    demo: "journey", href: "/resources/outbound-dialers", legacyIndex: 6,
  },
  {
    id: "transfers-conferencing", title: "Warm Transfers & Conferencing", categories: ["voice", "agent"], icon: "Users",
    description: "Explore consult-before-transfer and supported multi-party call controls.",
    problem: "A blind handoff can lose context and leave customers explaining the issue again.",
    outcome: "Customer effort", value: ["Introduce the next participant with relevant context.", "Clarify supported consult and conference behavior before rollout."],
    example: "A service agent consults a billing specialist before completing a fictional handoff.",
    keywords: ["warm transfer", "conference", "quick connects", "consult", "handoff"],
    classes: [N, C], availability: "Zendesk documents warm transfers and conference controls in the call console. Options depend on configured targets and current call state. Verify participant limits and permissions; real-time translation EAP excludes transferred and multi-party calls.",
    docs: ["calls", "translation"], path: ["customer", "connect", "workspace", "queue"],
    setup: ["Confirm supported transfer targets, conference limits and agent permissions.", "Configure approved quick connects and transfer flows.", "Validate consultation, completion, disconnect and unsupported translation combinations."],
    demo: "journey",
  },
  {
    id: "phone-management", title: "Phone Number & Telephony Management", categories: ["voice", "architecture"], icon: "Phone",
    description: "Understand number claiming, porting and association with the right contact flow.",
    problem: "A disconnected number, wrong flow or missing outbound permission interrupts service.",
    outcome: "Risk & resilience", value: ["Make number ownership and routing dependencies explicit.", "Plan changes around country requirements and service continuity."],
    example: "Trace a fictional support number from an inbound entry point to its published service flow.",
    keywords: ["did", "toll free", "porting", "caller id", "pstn", "country", "numbers"],
    classes: [C], availability: "Number types, country documentation, portability, outbound destinations, quotas and charges vary. Claiming or porting a real number is outside this simulation.",
    docs: ["telephony", "services"], path: ["customer", "phone", "connect", "queue"],
    setup: ["Identify countries, number ownership, porting requirements and allowed calling destinations.", "Associate approved numbers with the correct inbound flow and outbound caller ID.", "Test inbound/outbound reachability and rollback before any real number migration."],
    demo: "journey",
  },
  {
    id: "secure-dtmf", title: "DTMF & Secure Data Collection", categories: ["voice", "security"], icon: "KeyRound",
    description: "Explore configured keypad collection and encryption without displaying sensitive digits.",
    problem: "Collecting confidential information through ordinary notes or recordings creates exposure.",
    outcome: "Risk & resilience", value: ["Minimize visible sensitive input.", "Handle invalid input and timeouts explicitly."],
    example: "A fictional caller supplies a masked reference; the flow validates the result without revealing entered digits.",
    keywords: ["dtmf", "keypad", "encrypt", "pci", "payment", "timeout", "masked"],
    classes: [C, A, D], availability: "The Store customer input block supports optional encryption. This does not by itself establish PCI compliance or a payment-provider integration. Its Success branch can contain the literal value Timeout, which must be checked.",
    docs: ["dtmf", "security"], path: ["customer", "connect", "input", "lambda", "external"],
    setup: ["Define the minimum required fields, lawful purpose and approved provider.", "Configure input encryption, scoped key permissions and explicit Timeout checks.", "Verify logs, recordings, error paths and downstream storage do not expose sensitive input."],
    demo: "journey",
  },
  {
    id: "conversational-ivr", title: "AI-Powered IVR & Conversational Self-Service", categories: ["ai", "voice"], icon: "Bot",
    description: "Explore a configured Lex conversation that resolves a sample order query or hands off.",
    problem: "Simple requests consume agent time, while failed self-service loses useful context.",
    outcome: "Faster resolution", value: ["Offer self-service for a defined, testable task.", "Preserve intent and lookup results for a supported human handoff."],
    example: "A fictional order-status conversation uses Amazon Lex and a simulated order API, with success, escalation and API-error paths.",
    keywords: ["lex", "conversational ai", "nlp", "nlu", "intent", "self service", "order status", "bot"],
    classes: [C, A, D], availability: "This model uses Amazon Lex and a custom Lambda/API lookup. It is not Zendesk Voice AI or Forethought Voice, and does not establish native Contact Center Voice AI entitlement.",
    docs: ["ivr", "flows", "voiceAi"], path: ["customer", "connect", "lex", "lambda", "external", "workspace"],
    setup: ["Choose the exact AI provider, supported languages, intents and escalation policy.", "Configure a Lex bot, contact-flow integration and scoped backend lookup.", "Test misunderstood intent, no match, lookup failure and a context-preserving agent handoff."],
    demo: "ivr", href: "/rooms/ai-automation",
  },
  {
    id: "agent-assist", title: "Real-Time Agent Assist", categories: ["ai", "agent"], icon: "Sparkles",
    description: "Show how an agent requests knowledge suggestions from an evolving call transcript.",
    problem: "Agents search across disconnected content while trying to stay focused on the caller.",
    outcome: "Agent productivity", value: ["Bring relevant knowledge closer to the conversation.", "Keep an agent responsible for reviewing generated guidance."],
    example: "Switch between fictional delivery and billing conversations, then review intent, suggested knowledge and a draft response.",
    keywords: ["voice copilot", "copilots", "knowledge suggestions", "live transcript", "intent", "generative ai"],
    classes: [N, Z], availability: "Documented real-time AI suggestions require the Copilot add-on and live voice transcripts. Help-center coverage affects usefulness. External actions, form filling and autonomous execution are not implied.",
    docs: ["assist", "qa"], path: ["customer", "connect", "lens", "copilot", "workspace"],
    setup: ["Confirm Copilot entitlement and suitable help-center content.", "Enable supported live transcripts and the documented knowledge-suggestion workflow.", "Have agents review accuracy, permissions, relevance and escalation rather than automatically execute suggestions."],
    demo: "assist", href: "/demos/nuggets#voice-copilot", legacyIndex: 1,
  },
  {
    id: "agent-collaboration", title: "AI Agent-to-Agent Collaboration", categories: ["ai", "architecture"], icon: "Network",
    description: "Explore AWS-documented delegation between specialized AI agents as an integration concept.",
    problem: "A single automated assistant may lack the tools or specialization needed to complete a request.",
    outcome: "Connected context", value: ["Separate specialist responsibilities.", "Make handoff constraints and implementation ownership explicit."],
    example: "A fictional service assistant requests a specialist result and returns it to the conversation under a controlled contract.",
    keywords: ["a2a", "agentic", "delegation", "specialist", "protocol", "orchestration"],
    classes: [A, D, V], availability: "AWS documents A2A on the Connect Customer tier, with Lex V2, API-only configuration and collaboration-depth restrictions. This is not confirmation of supported native Zendesk Contact Center integration; verify the deployment and commercial scope.",
    docs: ["a2a", "services"], path: ["customer", "connect", "lex", "lambda", "external", "workspace"],
    setup: ["Confirm the required AWS tier and Zendesk-supported integration path.", "Design least-privilege tool contracts, approved collaborators and explicit escalation.", "Validate handoff depth, tracing, failure handling, audio constraints and customer disclosure."],
    demo: "journey",
  },
  {
    id: "proactive-notifications", title: "Proactive Customer Notifications", categories: ["ai", "voice"], icon: "BellRing",
    description: "Explore consent-aware service notifications triggered by an approved business event.",
    problem: "Customers contact support because they do not know an appointment or order has changed.",
    outcome: "Customer effort", value: ["Communicate a relevant service update earlier.", "Keep channel choice, consent and opt-outs part of the design."],
    example: "A simulated order event prepares an approved notification; no SMS, email or call is actually sent.",
    keywords: ["proactive", "notifications", "sms", "email", "appointment reminder", "eventbridge", "consent"],
    classes: [A, T, D], availability: "Event triggers, optional outbound campaign or messaging services, templates and consent checks require configuration. This is not an included, automatically enabled omnichannel notification engine.",
    docs: ["outbound", "services", "flows"], path: ["external", "lambda", "connect", "customer"],
    setup: ["Choose the business event, permissible channel and consent source.", "Configure the supported event/API integration and approved templates.", "Test opt-outs, duplicate events, quiet hours, delivery failures and audit retention."],
    demo: "journey",
  },
  {
    id: "customer-segmentation", title: "Dynamic Customer Segmentation", categories: ["ai", "architecture"], icon: "UsersRound",
    description: "Apply approved customer attributes to a sample routing or service decision.",
    problem: "A one-size-fits-all service path ignores relevant customer needs and entitlements.",
    outcome: "Connected context", value: ["Use permitted profile context in service decisions.", "Keep business rules visible and reviewable."],
    example: "A fictional support entitlement selects an eligible queue; unknown profile data falls back safely.",
    keywords: ["vip", "segmentation", "customer profiles", "attributes", "personalization", "crm"],
    classes: [C, A, D], availability: "Customer Profiles and external records can inform configured rules. Real-time segmentation logic, source freshness and business-policy enforcement are implementation work, not an assumed native AI decision engine.",
    docs: ["profiles", "routing", "flows"], path: ["customer", "connect", "lambda", "external", "queue", "workspace"],
    setup: ["Define approved attributes, data freshness and fair-treatment rules.", "Map profile/API outputs into validated contact attributes and routing conditions.", "Test absent or stale data, invalid entitlements and a safe default service path."],
    demo: "journey",
  },
  {
    id: "unified-workspace", title: "Unified Agent Workspace & Screen Pop", categories: ["agent"], icon: "PanelsTopLeft",
    description: "Bring supported call controls, customer context and tickets into the agent workflow.",
    problem: "Agents switch tools and re-enter information before they can help.",
    outcome: "Agent productivity", value: ["Reduce unnecessary context switching.", "Keep a reviewed ticket association and disposition visible."],
    example: "Answer a fictional call, inspect history, create or associate a sample ticket, then complete after-call work.",
    keywords: ["screen pop", "ticket", "history", "call console", "single pane", "workspace"],
    classes: [N], availability: "Call controls and supported ticket context are documented. Custom CRM panels, automatic field population and third-party screen pops depend on configured integrations and permissions.",
    docs: ["components", "calls", "writeback"], path: ["customer", "connect", "zcc", "workspace"],
    setup: ["Confirm agent roles, call-console access and supported workspace setup.", "Configure supported customer search and ticket associations; separately define any custom screen pop.", "Test unknown callers, ambiguous matches, manual correction, wrap-up and permission restrictions."],
    demo: "workspace", href: "/rooms/agent-experience#workspace-sim",
  },
  {
    id: "omnichannel-journey", title: "Omnichannel Customer Journey", categories: ["agent", "voice"], icon: "MessagesSquare",
    description: "Follow supported channel interactions while keeping relevant service context connected.",
    problem: "Customers repeat their story when moving between supported service channels.",
    outcome: "Connected context", value: ["Make prior context easier to review.", "Explain which channel handoffs need additional setup."],
    example: "Review a fictional customer's earlier message before continuing a voice conversation in the agent workflow.",
    keywords: ["digital", "voice", "visual", "video", "screen sharing", "chat", "email", "messaging"],
    classes: [N, Z, A], availability: "Supported channels depend on products, entitlements and integrations. Video/screen sharing are optional, and unified presentation does not imply automatic channel transfer or a single routing engine.",
    docs: ["components", "services"], path: ["customer", "connect", "zcc", "workspace"],
    setup: ["Inventory supported channels and the systems responsible for each.", "Design permitted identity/context association and any explicit handoff integration.", "Validate continuity, attachments, unknown identities and channel-specific routing or retention rules."],
    demo: "journey", href: "/demos/nuggets#video-screen-sharing", legacyIndex: 8,
  },
  {
    id: "agent-presence", title: "Agent Status & Presence Management", categories: ["agent", "operations"], icon: "CircleUserRound",
    description: "Understand how agent availability and configured routing eligibility work together.",
    problem: "A visible presence indicator is mistaken for guaranteed capacity to take a call.",
    outcome: "Operational visibility", value: ["Explain status and routing eligibility separately.", "Make after-call and unavailable states part of the workflow."],
    example: "A fictional agent moves through available, handling and after-call states before accepting more work.",
    keywords: ["presence", "status sync", "available", "acw", "capacity", "routing profile"],
    classes: [N, C], availability: "Zendesk agent status and Connect availability are distinct. The call-control documentation notes that an agent can still appear online while on a call. A UI status alone does not prove eligibility or capacity for every channel.",
    docs: ["calls", "routing"], path: ["cognito", "connect", "queue", "zcc", "workspace"],
    setup: ["Define supported agent states and the authoritative status source.", "Map permitted synchronization behavior and Connect routing-profile capacity.", "Test sign-out, lost connectivity, concurrent work, after-call work and recovery."],
    demo: "journey", href: "/resources/supervisor-command-center",
  },
  {
    id: "call-lifecycle", title: "Call Lifecycle & Ticket Mapping", categories: ["agent", "architecture"], icon: "GitBranch",
    description: "Trace a call from entry through configured ticket context, wrap-up and reporting.",
    problem: "Teams cannot explain when call data appears on a ticket or who owns each mapping.",
    outcome: "Connected context", value: ["Connect operational events with a reviewed ticket record.", "Distinguish call-state events from custom field writeback."],
    example: "Follow a fictional call's attributes and timestamps through flow, queue, agent, ticket, after-call work and reporting.",
    keywords: ["ticket mapping", "ctr", "contact record", "writeback", "eventbridge", "after call work", "timestamps"],
    classes: [N, C, A, D], availability: "Documented writeback requires enabled Lambda/event triggers and compatible setup. Arbitrary field mappings and external events are separately configured, not automatically written for every call.",
    docs: ["writeback", "components"], path: ["customer", "connect", "queue", "workspace", "record", "lambda", "observe"],
    setup: ["Agree source-of-truth IDs, contact/ticket association and permitted fields.", "Enable the supported writeback functions and explicitly implement custom mappings.", "Test event ordering, duplicate delivery, recording access, missing transcripts and mapping failures."],
    demo: "lifecycle",
  },
  {
    id: "supervisor", title: "Supervisor Command Center", categories: ["operations", "agent"], icon: "Gauge",
    description: "Explore queue health, permitted monitoring and guided supervisor intervention.",
    problem: "Supervisors notice service pressure too late or lack enough context to help an agent.",
    outcome: "Operational visibility", value: ["Review queue and team signals in context.", "Tie interventions to permissions and defined operating policy."],
    example: "Inspect fictional queue pressure and an eligible call before selecting a simulated coaching or monitoring action.",
    keywords: ["real-time call monitoring", "barge", "coach", "queues", "service level", "dashboard", "supervisor"],
    classes: [N, C], availability: "Monitoring and intervention require supported call types, agent/supervisor permissions and configured features. Sentiment is an indicator for review, not a certain assessment of emotion.",
    docs: ["reports", "analytics", "services"], path: ["connect", "queue", "record", "observe", "workspace"],
    setup: ["Define supervisor roles, recording/monitoring notice and approved interventions.", "Configure metric visibility, security profiles and supported monitoring controls.", "Test access denial, eligible calls, monitoring audit and any recording or translation restrictions."],
    demo: "journey", href: "/resources/supervisor-command-center", legacyIndex: 7,
  },
  {
    id: "quality-management", title: "Call Recording & Quality Management", categories: ["operations", "security"], icon: "ClipboardCheck",
    description: "Connect configured recordings with an authorized post-call quality review.",
    problem: "Important coaching opportunities are hard to find across fragmented call records.",
    outcome: "Operational visibility", value: ["Review permitted evidence with a consistent scorecard.", "Turn a reviewed finding into targeted coaching."],
    example: "Review a fictional post-call interaction, score the relevant quality criteria and prepare a coaching action.",
    keywords: ["qa", "wem", "call recording", "scorecard", "coaching", "quality assurance", "contact lens"],
    classes: [C, Z, A], availability: "Zendesk QA is separately licensed and configured. It can create post-call transcripts from attached recordings without Contact Lens; real-time analytics, audio redaction and QA are different responsibilities.",
    docs: ["qa", "quality", "writeback"], path: ["connect", "record", "lambda", "workspace", "qa"],
    setup: ["Confirm recording notices, retention, QA entitlement and help-desk connection.", "Enable permitted recording/writeback and configure QA access and scorecards.", "Test attachment permissions, post-call timing, transcript handling and unredacted audio exposure."],
    demo: "workforce", href: "/demos/nuggets#voice-qa",
  },
  {
    id: "workforce-management", title: "Workforce Management & Forecasting", categories: ["operations", "ai"], icon: "CalendarClock",
    description: "Explore how historical demand informs staffing, schedules and adherence review.",
    problem: "Staffing decisions rely on disconnected spreadsheets or incomplete demand signals.",
    outcome: "Operational visibility", value: ["Compare forecast demand with planned staffing.", "Make schedule exceptions and coaching needs easier to inspect."],
    example: "Review a fictional forecast, staffing gap, schedule and adherence exception with separate WFM and QA responsibilities.",
    keywords: ["ai-powered wem", "wfm", "forecast", "staffing", "scheduling", "adherence", "capacity planning"],
    classes: [Z, V], availability: "Zendesk WFM, Zendesk QA and Amazon Connect workforce capabilities are distinct products/configurations. Confirm WFM licensing, supported Contact Center data ingestion, forecasting inputs and activity coverage for the deployment.",
    docs: ["wfm", "qa", "quality"], path: ["connect", "record", "lambda", "wfm", "qa", "observe"],
    setup: ["Confirm which workforce product is licensed and which Contact Center data it supports.", "Configure the supported ingestion, historical demand, staffing rules and schedule inputs.", "Validate forecast assumptions, event coverage, adherence definitions and human review of exceptions."],
    demo: "workforce", legacyIndex: 3,
  },
  {
    id: "conversation-intelligence", title: "Advanced Analytics & Conversation Intelligence", categories: ["operations", "ai"], icon: "ChartNoAxesCombined",
    description: "Review configured conversation signals alongside operational metrics and call context.",
    problem: "Queue totals alone do not explain why customers call or where conversations become difficult.",
    outcome: "Operational visibility", value: ["Combine operational evidence with reviewed conversation signals.", "Use explicit definitions before comparing results."],
    example: "Inspect a fictional contact theme and sentiment signal, then review the associated queue and call record.",
    keywords: ["analytics", "conversation intelligence", "sentiment", "themes", "metrics", "reporting", "contact lens"],
    classes: [A, Z], availability: "Contact Lens analytics, Zendesk dashboards and Zendesk QA have different data sources, timing and entitlements. Confirm languages, regions, permissions and enabled ingestion. No performance improvement is guaranteed.",
    docs: ["analytics", "reports", "qa"], path: ["customer", "connect", "lens", "record", "lambda", "observe"],
    setup: ["Agree metrics, product ownership, supported languages and data permissions.", "Configure the selected analytics service and permitted event/record ingestion.", "Validate metric definitions, delayed/missing data, model limitations and access to source evidence."],
    demo: "journey", href: "/resources/supervisor-command-center",
  },
  {
    id: "crm-integration", title: "CRM & External Data Integrations", categories: ["architecture", "agent"], icon: "Database",
    description: "Trace a scoped Lambda/API lookup into relevant customer context.",
    problem: "Agents need approved business data that lives outside the contact-center workflow.",
    outcome: "Connected context", value: ["Bring permitted data into the right service moment.", "Make authentication, mapping and error ownership visible."],
    example: "Compare simulated Salesforce, ServiceNow, REST, customer-database and order-system request/response contracts.",
    keywords: ["salesforce", "servicenow", "crm", "rest", "api", "database", "order management", "lambda", "screen pop"],
    classes: [A, T, D], availability: "Specific connectors, API rights, authentication, network access and field mappings require supported integration or custom development. This example is not a connected Salesforce or ServiceNow session.",
    docs: ["profiles", "flows", "components"], path: ["customer", "connect", "lambda", "external", "zcc", "workspace"],
    setup: ["Define permitted data, provider API rights and the read/write scope.", "Implement scoped server-side authentication, validation, mapping, timeouts and audit.", "Test no match, multiple matches, rate limiting, timeout, authorization failure and safe UI fallback."],
    demo: "integration",
  },
  {
    id: "architecture-explorer", title: "Amazon Connect Architecture Explorer", categories: ["architecture"], icon: "Workflow",
    description: "Inspect the boundaries and configured services behind the contact-center workflow.",
    problem: "A flat diagram hides which platform owns each responsibility and integration.",
    outcome: "Connected context", value: ["Explain the system in understandable responsibility layers.", "Expose optional services and custom integration points."],
    example: "Follow a fictional contact through Connect, integration services and the Zendesk workspace.",
    keywords: ["architecture", "aws", "data flow", "system overview", "components", "cognito", "saml", "deployment"],
    classes: [N, C, A], availability: "Architecture varies by deployment and AWS ownership model. Optional services, data movement and IAM permissions must be confirmed; a diagram is not proof of configuration or residency.",
    docs: ["components", "services", "architecture"], path: ["customer", "connect", "cognito", "lambda", "zcc", "workspace"],
    setup: ["Identify the supported account-ownership model and approved data boundaries.", "Map required services, identity flow, least-privilege roles and optional integrations.", "Validate configuration against the actual deployment, event path, retention and recovery procedures."],
    demo: "journey", href: "/rooms/architecture-integrations#explorer",
  },
  {
    id: "flow-designer", title: "Contact Flow Designer", categories: ["architecture", "voice"], icon: "GitFork",
    description: "Explore how prompts, attributes, conditions and integrations form a contact flow.",
    problem: "Service intent is not translated into clear routing, error and escalation behavior.",
    outcome: "Faster resolution", value: ["Make flow decisions and dependencies visible.", "Design the exception paths as carefully as the happy path."],
    example: "Step through a fictional menu, lookup and queue branch while inspecting each decision.",
    keywords: ["contact flows", "flow blocks", "lambda", "conditions", "prompts", "designer", "ivr"],
    classes: [C, A], availability: "Flows are configured in Amazon Connect. A custom flow, Lambda function or API integration still requires deployment, permissions, testing and change control; this explorer does not publish flows.",
    docs: ["flows", "architecture"], path: ["customer", "connect", "input", "lambda", "queue", "workspace"],
    setup: ["Define customer intent, prompts, business rules and escape paths.", "Configure supported flow blocks and scoped Lambda/API dependencies.", "Test silence, invalid input, downstream errors, queue overflow and version rollback."],
    demo: "journey", href: "/resources/routing",
  },
  {
    id: "deployment-explorer", title: "Implementation & Deployment Explorer", categories: ["architecture", "security"], icon: "Boxes",
    description: "Understand the identity, infrastructure and validation work behind deployment.",
    problem: "Teams treat an install step as proof that a production service is ready.",
    outcome: "Risk & resilience", value: ["Make required infrastructure and permissions explicit.", "Include operational validation and rollback in the rollout plan."],
    example: "Trace a conceptual identity-to-infrastructure setup sequence without creating resources.",
    keywords: ["cloudformation", "deployment", "dual stack", "iam", "sso", "cognito", "implementation", "rollback"],
    classes: [N, A], availability: "Follow the implementation path documented for the selected managed or customer-managed model. CloudFormation, identity, IAM and optional service setup are not interchangeable across all deployments.",
    docs: ["components", "services", "architecture"], path: ["cognito", "lambda", "connect", "zcc", "workspace"],
    setup: ["Confirm ownership, supported implementation model, identity provider and entitlement.", "Use the approved infrastructure process and least-privilege permissions for that model.", "Validate sign-in, call paths, writeback, monitoring and a tested rollback before release."],
    demo: "journey", href: "/architecture/components",
  },
  {
    id: "customer-verification", title: "Customer Authentication & Verification", categories: ["security", "voice"], icon: "Fingerprint",
    description: "Distinguish caller recognition from a policy-approved identity verification check.",
    problem: "A recognized phone number is wrongly treated as proof of the caller's identity.",
    outcome: "Risk & resilience", value: ["Keep sensitive context behind a separate verification decision.", "Route failed, unknown and timed-out checks to a safe human-assisted path."],
    example: "Run verified, failed, VIP, unknown-caller and API-timeout paths using a simulated verification service.",
    industries: ["Financial services", "Retail", "Telecommunications"],
    keywords: ["authentication", "verification", "ani", "otp", "fraud", "identity", "vip", "timeout"],
    classes: [C, A, T, D], availability: "ANI is a recognition signal, not authentication. The example verification API and policy are custom. Cognito/SSO authenticates agents, not inbound callers; no biometric or native caller-authentication entitlement is implied.",
    docs: ["flows", "profiles", "security", "dtmf"], path: ["customer", "connect", "lambda", "verify", "queue", "zcc", "workspace"],
    setup: ["Define assurance requirements, permitted verification methods, consent and failure policy.", "Implement a scoped verification API contract, protected inputs and explicit timeout handling.", "Test failed, unknown, spoofed-ANI, VIP-unverified and unavailable-provider paths without disclosing private customer data."],
    demo: "verification",
  },
  {
    id: "business-continuity", title: "Business Continuity & Disaster Recovery", categories: ["security", "architecture"], icon: "ShieldAlert",
    description: "Compare application fallback with a separately designed regional recovery strategy.",
    problem: "A queue fallback is mistaken for complete telephony or regional disaster recovery.",
    outcome: "Risk & resilience", value: ["Design safe behavior when a dependency or agent is unavailable.", "Set realistic recovery responsibilities and test procedures."],
    example: "Simulate routing failure, API timeout, agent unavailability, unexpected volume and recovery without claiming automatic regional failover.",
    keywords: ["business continuity", "disaster recovery", "dr", "failover", "global resiliency", "rto", "rpo", "timeout", "fallback"],
    classes: [C, A, V], availability: "Application-level fallback is not multi-region DR. AWS Global Resiliency requires access, supported region pairs and a supported deployment architecture; Zendesk integration compatibility and recovery objectives need explicit validation.",
    docs: ["resiliency", "architecture"], path: ["customer", "connect", "lambda", "fallback", "queue", "workspace"],
    setup: ["Identify failure domains, owner-approved recovery objectives and supported regional options.", "Configure safe application fallbacks; separately design any supported Global Resiliency deployment.", "Exercise dependency failures, traffic distribution, identity, data consistency, telephony and recovery procedures."],
    demo: "continuity",
  },
  {
    id: "security-governance", title: "Security, Compliance & Governance", categories: ["security", "architecture"], icon: "ShieldCheck",
    description: "Review identity, permissions, recording policy and shared responsibility together.",
    problem: "A feature checklist is mistaken for proof that a particular deployment is compliant.",
    outcome: "Risk & resilience", value: ["Tie controls to an accountable owner.", "Make data handling and compliance review explicit."],
    example: "Inspect a conceptual access and audit path, separating agent sign-in from customer verification.",
    keywords: ["security", "governance", "compliance", "iam", "saml", "mfa", "kms", "retention", "residency", "audit"],
    classes: [N, C, A], availability: "Security is shared responsibility. Certifications, residency, contractual coverage and regulatory compliance must be assessed for the actual services and configuration; no diagram or feature establishes compliance.",
    docs: ["security", "services", "components"], path: ["cognito", "connect", "lambda", "zcc", "workspace", "observe"],
    setup: ["Define legal obligations, data classification, roles and responsibility boundaries.", "Apply least privilege, approved identity policies, key management, retention and audit controls.", "Review contractual scope, evidence, recording/redaction behavior and incident response with security/legal teams."],
    demo: "journey",
  },
  // Six retained concepts not represented as independent capabilities in the 27-item request.
  {
    id: "voice-ai-agents", title: "Voice AI Agents", categories: ["ai", "voice"], icon: "AudioLines",
    description: "Explore automated voice conversations while keeping product availability explicit.",
    problem: "A broad marketing description is mistaken for deployable native functionality.",
    outcome: "Customer effort", value: ["Explore a defined automation use case safely.", "Keep the product, release and integration path visible."],
    example: "Review an illustrative automated conversation and human handoff in the existing feature demo.",
    keywords: ["voice ai", "voice agents", "zendesk voice", "talk", "forethought", "availability", "self service"],
    classes: [Z, V], availability: "Zendesk's September 2026 Voice AI GA announcement explicitly says Contact Center support is planned for a future release and excludes Talk Partner Edition. Broader Contact Center marketing is not confirmation of native availability. Forethought Voice and AWS AI are separate offerings.",
    docs: ["voiceAi", "ivr"], path: ["customer", "connect", "lex", "lambda", "workspace"],
    setup: ["Confirm the exact voice AI product and current Contact Center support in writing.", "Only design a supported provider-specific integration after entitlement and release confirmation.", "Validate escalation, disclosure, knowledge scope, privacy and failure handling before a real deployment."],
    demo: "ivr", href: "/demos/nuggets#voice-ai-agents", legacyIndex: 0,
  },
  {
    id: "voice-translation", title: "Real-Time Voice Translation", categories: ["ai", "agent"], icon: "Languages",
    description: "Review the early-access translation experience and its documented restrictions.",
    problem: "Language differences make a supported service conversation harder to complete.",
    outcome: "Customer effort", value: ["Explore translated conversations within the documented EAP scope.", "Make quality, recording and call-type limitations visible."],
    example: "Trace a conceptual translated call and review the EAP prerequisites before proposing it.",
    keywords: ["translation", "multilingual", "language", "eap", "interpreting"],
    classes: [N, V], availability: "Early access, native Contact Center accounts only, supported languages and EAP limits apply. Transferred/multi-party, monitor/barge and video calls are excluded during translation. Recordings are not a separate bilingual transcript; quality and latency vary.",
    docs: ["translation"], path: ["customer", "connect", "zcc", "workspace", "record"],
    setup: ["Confirm EAP eligibility, supported languages, permissions and required caller disclosure.", "Configure language selection and the supported translation workflow.", "Test network quality, names/numbers, recording content and prohibited call-type combinations."],
    demo: "journey", legacyIndex: 2,
  },
  {
    id: "transcription-redaction", title: "Transcription with Redaction", categories: ["security", "ai"], icon: "FileLock2",
    description: "Compare configured Contact Lens redaction with Zendesk QA transcript protections.",
    problem: "Teams assume a redacted transcript also removes sensitive speech from every recording.",
    outcome: "Risk & resilience", value: ["Separate transcript and audio handling.", "Design access and retention around the remaining exposure."],
    example: "Follow a conceptual call recording into configured post-call processing and permitted review.",
    keywords: ["transcription", "redaction", "pii", "adpp", "audio", "contact lens", "qa"],
    classes: [A, Z], availability: "Contact Lens supports configured transcript and recording redaction. Zendesk QA transcription redaction requires Advanced Data Privacy and Protection and does not redact attached audio. Detection is imperfect; these controls are not a compliance guarantee.",
    docs: ["qa", "writeback", "analytics"], path: ["customer", "connect", "lens", "record", "workspace", "qa"],
    setup: ["Choose the responsible transcription/redaction product and supported data types.", "Configure recording, permitted writeback, redaction options and entitled privacy controls.", "Review false negatives, original audio access, retention and deletion with privacy specialists."],
    demo: "journey", legacyIndex: 4,
  },
  {
    id: "compliance-phi", title: "PHI and HIPAA Considerations", categories: ["security"], icon: "HeartPulse",
    description: "Review contractual coverage, eligible services and configured controls before handling PHI.",
    problem: "A security feature is treated as sufficient authorization to process regulated health data.",
    outcome: "Risk & resilience", value: ["Make contract and service eligibility a prerequisite.", "Keep legal and security approval separate from a product demo."],
    example: "Inspect a conceptual responsibility map; this simulation contains no patient data.",
    industries: ["Healthcare"],
    keywords: ["phi", "hipaa", "baa", "advanced compliance", "healthcare", "regulated"],
    classes: [Z, A, V], availability: "Zendesk documents Advanced Compliance and a Zendesk BAA for Contact Center; applicable AWS services require AWS BAA coverage too. Eligible-service selection, deployment model and customer responsibilities still require legal/security review.",
    docs: ["services", "security"], path: ["customer", "connect", "record", "zcc", "workspace", "observe"],
    setup: ["Obtain legal review of the required Zendesk/AWS agreements and eligible service scope.", "Apply the approved configuration, identity, retention and access policies.", "Validate evidence, data handling and incident procedures without using PHI in a demonstration."],
    demo: "journey", legacyIndex: 5,
  },
  {
    id: "after-call-work", title: "AI-Powered After-Call Work", categories: ["ai", "agent"], icon: "FileCheck2",
    description: "Review a generated summary before using it in post-call documentation.",
    problem: "Agents repeatedly reconstruct the same conversation details after a call.",
    outcome: "Agent productivity", value: ["Provide a draft for the agent to review.", "Keep disposition and documentation accountable to a person."],
    example: "Complete a fictional call, inspect a draft summary and confirm the ticket disposition before after-call completion.",
    keywords: ["acw", "after-call", "wrap up", "summary", "summarization", "documentation"],
    classes: [Z, A], availability: "Summarization depends on the chosen provider, recording/transcript availability, entitlement and integration. Zendesk QA summaries are post-call. Generated text can be inaccurate and requires review; automatic ticket updates are not implied.",
    docs: ["calls", "qa", "assist", "writeback"], path: ["connect", "record", "lambda", "workspace", "qa"],
    setup: ["Select the supported summary provider and confirm required licensing and transcripts.", "Configure permitted recording/transcript ingestion and the agent review workflow.", "Test missing data, incorrect names/details, correction, disposition and explicit completion."],
    demo: "lifecycle", legacyIndex: 12,
  },
  {
    id: "sentiment", title: "Real-Time Sentiment Analysis", categories: ["ai", "operations"], icon: "Activity",
    description: "Treat configured sentiment signals as context for human review during a call.",
    problem: "Agents and supervisors may miss a conversation that needs additional attention.",
    outcome: "Operational visibility", value: ["Surface a signal alongside actual conversation evidence.", "Encourage an appropriate human response rather than an automated judgment."],
    example: "Inspect a fictional sentiment indicator together with the transcript and supervisor context.",
    keywords: ["sentiment", "real time", "emotion", "conversation analytics", "contact lens", "signals"],
    classes: [A], availability: "Real-time sentiment depends on supported analytics, languages, region and configured event ingestion. Zendesk QA post-call sentiment is not real-time Contact Lens. A model signal is not a certain assessment of emotion.",
    docs: ["analytics", "qa", "components"], path: ["customer", "connect", "lens", "lambda", "observe", "workspace"],
    setup: ["Confirm the real-time analytics provider, supported language and intended use.", "Enable the required flow analytics, events and permitted workspace/supervisor display.", "Test lag, absent signals, misleading scores and human review before any intervention."],
    demo: "journey", href: "/resources/supervisor-command-center", legacyIndex: 13,
  },
  {
    id: "amazon-connect-workload-layers", title: "Amazon Connect Workload Layers", categories: ["architecture"], icon: "Workflow",
    description: "Map Amazon Connect responsibilities across telephony, interface and API, flows and IVR, the agent workstation, and metrics and reporting.",
    problem: "Architecture discussions can blur service ownership, integration boundaries and operational responsibilities.",
    outcome: "Clearer ownership and troubleshooting",
    value: ["Locate the service or team responsible for each layer.", "Trace dependencies without implying every deployment uses the same components."],
    example: "Walk through six original architecture diagrams that cover the five workload layers and a resilient telephony view.",
    keywords: ["workload layers", "telephony", "PSTN", "API", "contact flow", "IVR", "agent workstation", "metrics", "reporting", "architecture"],
    classes: [C, A], availability: "AWS documents these layers as a way to group Connect Customer workloads. The exact AWS services, customer-managed components, network paths and integrations depend on configuration.",
    docs: ["workloadLayers", "components"], path: ["connect", "interface", "contactFlow", "workstation", "metrics"],
    setup: ["Identify the deployment model and owners for each layer.", "Map the call or contact path, APIs, endpoints and reporting dependencies.", "Validate boundaries, regional availability and operational ownership for the actual deployment."],
    demo: "journey", href: "/architecture/workload-layers",
  },
  {
    id: "stir-shaken", title: "STIR/SHAKEN Caller Identity", categories: ["voice", "security"], icon: "ShieldCheck",
    description: "Explore eligible outbound-call signing, A/B/C attestation, number qualification and the limits of carrier handling.",
    problem: "Teams may confuse caller identity attestation with delivery, caller-name display or spam reputation.",
    outcome: "A clearer caller identity signal",
    value: ["Explain what each attestation level represents.", "Separate number eligibility and registration steps from carrier call treatment."],
    example: "Trace an eligible fictional outbound call through Amazon Connect, carrier networks and a recipient while comparing attestation levels.",
    keywords: ["STIR", "SHAKEN", "caller ID", "attestation", "spoofing", "carrier", "NANP", "DID", "toll-free"],
    classes: [C], availability: "AWS documents signing for eligible outbound calls from US DIDs and toll-free numbers to NANP destinations (+1). Number eligibility and requested attestation depend on AWS validation and configuration.",
    docs: ["stirShaken"], path: ["connect", "phone", "carrier", "recipient"],
    setup: ["Confirm eligible numbers, destinations and the Amazon Connect deployment.", "Prepare the business and number details requested through Zendesk Support.", "Treat attestation as one carrier signal; verify caller-name and reputation programs separately."],
    demo: "journey", href: "/resources/stir-shaken",
  },
];

/** Stable semantic IDs, independent of grid position or category membership. */
export const REQUESTED_FEATURE_IDS = seeds.slice(0, 27).map((feature) => feature.id);
export const LEGACY_FEATURE_IDS = [
  "voice-ai-agents", "agent-assist", "voice-translation", "workforce-management",
  "transcription-redaction", "compliance-phi", "outbound-dialing", "supervisor",
  "omnichannel-journey", "intelligent-routing", "ivr", "callbacks", "after-call-work", "sentiment",
];

export const FEATURE_REGISTRY: EnterpriseFeature[] = seeds.map((seed) => {
  const legacy = seed.legacyIndex === undefined ? undefined : FEATURES[seed.legacyIndex];
  const sources = seed.docs.map((id) => FEATURE_SOURCES[id]);
  const architecture = buildFeatureArchitecture(seed.path, [seed.availability]);
  return {
    id: seed.id, title: seed.title,
    aliases: [...(seed.aliases ?? []), ...(legacy ? [legacy.t, legacy.tag] : [])],
    categories: seed.categories, icon: seed.icon,
    description: seed.description,
    overview: `${seed.description} ${seed.example}`,
    customerProblem: seed.problem, outcome: seed.outcome, benefits: seed.value,
    useCases: [{ title: "Illustrative service scenario", description: seed.example }],
    industries: seed.industries ?? ["Retail", "Financial services", "Telecommunications", "Technology"],
    keywords: seed.keywords, classifications: seed.classes, availability: seed.availability,
    lastVerified: sources.every((item) => item.lastVerified) ? "2026-11-15" : null,
    sources,
    evidence: {
      owner: null,
      status: sources.length === 0 ? "missing-evidence" : seed.classes.includes(V) ? "requires-verification" : "documentation-reviewed",
      reviewedAt: sources.every((item) => item.lastVerified) ? "2026-11-15" : null,
      productBoundary: [...seed.classes],
      dependencies: architecture.nodes.filter(node => !["customer", "workspace"].includes(node.id)).map(node => `${node.label} — ${node.boundary} responsibility; confirm configuration and entitlement`),
      availabilityQualification: seed.availability,
      humanApproval: null,
    },
    configuration: seed.setup.map((detail, i) => ({ title: ["Plan & eligibility", "Configure & connect", "Validate before rollout"][i], detail })),
    architecture,
    demo: { kind: seed.demo, href: seed.href, label: seed.href ? "Open existing demo" : "Play illustrative demo", reused: !!seed.href },
    ...(legacy ? { legacy: { index: seed.legacyIndex!, title: legacy.t, description: legacy.d, sources: legacy.sources ?? [] } } : {}),
  };
});

export interface FeatureFilters {
  query?: string;
  category?: FeatureCategoryId | "all";
  classification?: FeatureClassification | "all";
  outcome?: string;
  demoOnly?: boolean;
}
const searchable = (feature: EnterpriseFeature) => [
  feature.title, ...feature.aliases, feature.description, feature.overview, feature.customerProblem,
  feature.outcome, ...feature.benefits, ...feature.industries, ...feature.keywords,
  ...feature.useCases.flatMap((item) => [item.title, item.description]),
  ...feature.configuration.flatMap((item) => [item.title, item.detail]),
  ...feature.categories.map((id) => FEATURE_CATEGORIES.find((item) => item.id === id)?.label ?? id),
  ...feature.classifications, feature.legacy?.description ?? "",
].join(" ").toLocaleLowerCase();

/** Every query term must match; filters compose, rather than replacing each other. */
export function filterFeatures(features: EnterpriseFeature[], filters: FeatureFilters = {}): EnterpriseFeature[] {
  const terms = (filters.query ?? "").trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return features.filter((feature) =>
    (!filters.category || filters.category === "all" || feature.categories.includes(filters.category)) &&
    (!filters.classification || filters.classification === "all" || feature.classifications.includes(filters.classification)) &&
    (!filters.outcome || filters.outcome === "all" || feature.outcome === filters.outcome) &&
    (!filters.demoOnly || feature.demo.reused) &&
    terms.every((term) => searchable(feature).includes(term)),
  );
}
export function getFeatureById(id: string): EnterpriseFeature | undefined {
  return FEATURE_REGISTRY.find((feature) => feature.id === id);
}
export function getCategoryCounts(): Record<FeatureCategoryId, number> {
  return Object.fromEntries(FEATURE_CATEGORIES.map((category) => [
    category.id, FEATURE_REGISTRY.filter((feature) => feature.categories.includes(category.id)).length,
  ])) as Record<FeatureCategoryId, number>;
}
export function featureHref(id: string): string {
  return `${import.meta.env.BASE_URL}?feature=${encodeURIComponent(id)}#features`;
}
