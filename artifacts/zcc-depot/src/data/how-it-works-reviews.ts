import type { SlideId } from "./how-it-works";

// Source checks and editorial approval are separate events. An accessible page is
// evidence only for the specific capability cited, never approval of the whole deck.
export const SOURCE_CHECKED_ON = "2026-11-13";
export const SOURCE_ERA = "November 2025";

type OfficialSource = {
  title: string;
  url: string;
  checkedOn: string;
};
const zd = (id: string, title: string): OfficialSource => ({
  title, url: `https://support.zendesk.com/hc/en-us/articles/${id}`, checkedOn: SOURCE_CHECKED_ON,
});
const aws = (path: string, title: string): OfficialSource => ({
  title, url: `https://docs.aws.amazon.com/connect/latest/adminguide/${path}.html`, checkedOn: SOURCE_CHECKED_ON,
});

// Each document was fetched and its relevant text inspected on checkedOn.
// Numeric Zendesk article links survive article-title changes.
export const REVIEW_SOURCES = {
  about: zd("9459059241626", "About Zendesk Contact Center"),
  components: zd("9829206009242", "Understanding Contact Center components"),
  aws: zd("10342463822746", "About AWS services in Contact Center"),
  concepts: zd("9459103231770", "Understanding Contact Center concepts"),
  managed: zd("11183955900442", "Setting up Contact Center on a Zendesk-managed AWS account"),
  byo: zd("11141761467802", "Setting up Contact Center on a customer-managed AWS account"),
  tickets: zd("10912570849050", "Understanding how Contact Center calls become tickets"),
  recording: zd("9459045766170", "Configuring call recording and transcription in Contact Center"),
  writeback: zd("9696142065306", "Setting up AWS to send call recordings to Zendesk Contact Center (writeback)"),
  attributes: zd("10880620037914", "Adding call information to Zendesk using Amazon Connect attributes"),
  status: zd("10880709161242", "Configuring agent statuses for Contact Center"),
  dashboards: zd("9459010766362", "Understanding Contact Center dashboards"),
  transcripts: zd("9696174623770", "Setting up Contact Center for live voice call transcription (app)"),
  suggestions: zd("10143999626394", "Using real-time AI suggestions in Contact Center"),
  qa: zd("9475134529050", "Using Zendesk QA for call transcriptions in Contact Center"),
  voiceqa: zd("8536308081178", "Analyzing phone calls and transcripts in Voice QA"),
  triage: zd("4550640560538", "Automatically classifying tickets with intelligent triage"),
  voice: zd("11183058023450", "Announcing the general availability of voice AI agents"),
  queues: zd("6712096584090", "Understanding how omnichannel routing uses queues to route work to agents"),
  customqueues: zd("6716530152858", "Creating custom omnichannel routing queues"),
  ivr: zd("4408885628698", "Routing incoming calls with IVR"),
  macros: zd("4408844187034", "Creating macros for repetitive ticket responses and actions"),
  app: zd("9034700691866", "Using App Builder"),
  actions: zd("8855601898266", "Creating action flows to automate processes across Zendesk and external systems"),
  builder: zd("9409324793498", "Creating help center content using ticket data and generative AI"),
  graph: zd("11202100209946", "Announcing the Universal Connector as an external content source for use across knowledge experiences"),
  masking: zd("7713908123674", "About data masking (ADPP add-on)"),
  objects: zd("5392409465370", "Creating custom objects to integrate with custom data"),
  wfm: zd("6443407875354", "Setting up WFM forecasting"),
  overview: aws("connect-feature-overview", "Connect Customer feature overview"),
  routing: aws("about-routing", "How routing works in Connect Customer"),
  flows: aws("create-contact-flow", "Use the flow designer in Connect Customer to create flows"),
  blocks: aws("contact-block-definitions", "Flow block definitions in the flow designer"),
  attrs: aws("what-is-a-contact-attribute", "How contact attributes work in Connect Customer"),
  capacity: aws("set-maximum-queue-limit", "Set the limit of maximum contacts in a queue"),
  lens: aws("contact-lens", "Connect Customer conversational analytics"),
  redaction: aws("sensitive-data-redaction", "Use sensitive data redaction to protect customer privacy"),
  evaluations: aws("generative-ai-performance-evaluations", "Evaluate agent performance using generative AI"),
  lex: aws("amazon-lex", "Add an Amazon Lex bot to Connect Customer"),
  ecosystem: {
    title: "AWS overview: Machine Learning and Artificial Intelligence",
    url: "https://docs.aws.amazon.com/whitepapers/latest/aws-overview/machine-learning.html",
    checkedOn: SOURCE_CHECKED_ON,
  },
  forecast: {
    title: "What Is Amazon Forecast? (new-customer availability notice)",
    url: "https://docs.aws.amazon.com/forecast/latest/dg/what-is-forecast.html",
    checkedOn: SOURCE_CHECKED_ON,
  },
} as const satisfies Record<string, OfficialSource>;

export type ReviewSourceId = keyof typeof REVIEW_SOURCES;
export type Assessment = "supported" | "qualified" | "difference" | "historical";
export const ASSESSMENT_LABELS: Record<Assessment, string> = {
  supported: "Supported in documentation",
  qualified: "Configuration or scope caveat",
  difference: "Difference to review",
  historical: "Historical illustration only",
};
export type CapabilityReview = {
  capability: string;
  assessment: Assessment;
  note: string;
  sources: readonly ReviewSourceId[];
};
export type HumanReview =
  | { status: "pending"; reviewedOn: null; reviewer: null }
  | { status: "approved"; reviewedOn: string; reviewer: string };
export type SectionReview = {
  sourcesCheckedOn: string;
  humanReview: HumanReview;
  difference: string;
  capabilities: readonly CapabilityReview[];
};
const claim = (capability: string, assessment: Assessment, note: string, ...sources: ReviewSourceId[]): CapabilityReview =>
  ({ capability, assessment, note, sources });
const section = (difference: string, ...capabilities: CapabilityReview[]): SectionReview => ({
  sourcesCheckedOn: SOURCE_CHECKED_ON,
  humanReview: { status: "pending", reviewedOn: null, reviewer: null },
  difference, capabilities,
});

// Explicit keys make missing/new sections a type error. Do not generate positive
// assessments from slide text or change ROUTING_CMP / QUEUE_CMP from this register.
const SECTION_REVIEW_DRAFTS = {
  overview: section(
    "The two-platform model remains useful. Current setup documentation also distinguishes Zendesk-managed AWS from customer-managed AWS; the deck's customer-AWS diagram is not the only deployment model.",
    claim("Amazon Connect + Zendesk workspace", "supported", "Zendesk documents Connect-powered telephony integrated with the Resolution Platform. A unified UI does not imply one routing engine or that all add-ons are included.", "about", "components", "routing"),
    claim("AWS ownership and data boundaries", "difference", "Both managed and Bring Your Own Account setup guides now exist. Identify the actual deployment and contract before using the November 2025 ownership labels.", "managed", "byo", "aws"),
    claim("Copilot and QA", "qualified", "Live suggestions require Copilot and live transcription. Zendesk QA is separately licensed and can transcribe recorded audio after the call without Contact Lens.", "suggestions", "qa"),
  ),
  contents: section(
    "This is the original 22-section navigation, not a statement that all illustrated capabilities are available today.",
    claim("Three chapter groupings", "historical", "The chapter order is editorial structure from the deck. Use the capability-level sources in each section for current product behavior.", "about", "aws"),
  ),
  "technology-evolution": section(
    "The three-generation taxonomy is historical positioning, not a release chronology or an entitlement checklist.",
    claim("Telephony, IVR, queues, profiles, callbacks, transfers, voicemail and reporting", "qualified", "AWS documents these contact-center primitives; Zendesk documents voice dashboards and ticket creation, including voicemail. Their availability in a customer solution still requires configuration.", "overview", "routing", "flows", "dashboards", "tickets"),
    claim("CRM context, self-service, knowledge, summaries, sentiment and workflow automation", "qualified", "Contact attributes and tickets carry context. Copilot suggestions, post-call QA, macros and action flows have different prerequisites and should not be presented as a single included feature.", "attributes", "tickets", "suggestions", "qa", "macros", "actions"),
    claim("WEM, workforce planning, QA and speaker-separated transcripts", "qualified", "WFM forecasting and Voice QA are separately entitled products. Voice QA documents speaker-separated playback and transcripts, with limitations on identifying additional participants.", "wfm", "voiceqa"),
    claim("Voice AI, Knowledge Builder, App Builder, Action Builder and triage", "difference", "Current docs support these product families but not universal ZCC availability. Voice AI's GA announcement explicitly excludes Contact Center pending a future release; verify that boundary rather than treating the deck's AI layer as shipped.", "voice", "builder", "app", "actions", "triage"),
  ),
  "platform-and-aws": section(
    "The layer diagram is a source-era product map, not a current bundle. Voice AI availability, knowledge sources, masking and workflow builders need separate qualification.",
    claim("Ticket workflows, fields, notes, summaries and macros", "qualified", "Ticket artifacts depend on recording/transcript settings and Copilot. Macros apply predefined ticket responses/actions; action flows run configured sequences against Zendesk or connected systems.", "tickets", "recording", "macros", "actions"),
    claim("Users, organizations, custom objects and data masking", "qualified", "Custom objects extend standard Zendesk data with permissions and relationships. ADPP data masking hides supported PII at the presentation layer; it does not remove the stored data or redact call audio. Segments, private groups and brands remain source taxonomy, not a promise of unrestricted cross-product access.", "objects", "masking"),
    claim("AI agents, personas, generative replies and zero-training language", "difference", "Do not interpret 'zero training agents' as no setup, no testing or native ZCC Voice AI availability. The Voice AI announcement describes Zendesk voice (Talk) and explicitly says Contact Center support is planned; newer component docs mention a Voice AI broker, so obtain deployment-specific confirmation.", "voice", "components"),
    claim("Knowledge, Copilot and QA layer", "qualified", "Knowledge Graph can connect external REST/JSON sources; the Contact Center live-suggestions article specifically describes help-center articles. QA supports scoring, spotlight insights and reviews, separately from AWS analytics.", "graph", "builder", "suggestions", "triage", "voiceqa"),
    claim("AWS routing, storage, compute, monitoring, streaming and integration services", "qualified", "The current base-service list identifies Connect, S3, Lambda, API Gateway, CloudWatch, Kinesis, Cognito and other infrastructure. Outbound Campaigns is optional. 'Custom AWS services' and 'webhooks' indicate extension points, not preconfigured integrations or access to every AWS service.", "aws", "components", "blocks"),
    claim("Historical, real-time and resolution-code reporting", "qualified", "Current dashboard and concepts docs describe performance and resolution-code reporting. BI outputs depend on the reporting implementation and permissions; do not imply any external BI tool is bundled.", "dashboards", "concepts"),
  ),
  "anatomy-of-a-call": section(
    "AWS integrations are configured paths, not automatic direct access to all listed services. Amazon Forecast is no longer available to new customers. Recordings and transcripts can cross into Zendesk.",
    claim("Inbound/outbound calls, contact flows, Lex and Lambda data dips", "supported", "Flows can invoke Lambda and use returned values or bot input as contact attributes. External CRM/data-lake access requires the customer integration, its credentials and permissions.", "blocks", "attrs", "lex", "attributes"),
    claim("Call controls and artifacts in Zendesk", "qualified", "The workspace and ticket integration are documented; audio, transcripts and summaries depend on settings, licensing and asynchronous delivery.", "about", "tickets", "recording", "writeback"),
    claim("Comprehend, Lex, Translate, Polly, Transcribe, Personalize and SageMaker list", "historical", "AWS describes these service families in its ecosystem overview. Their existence is not verification of native ZCC connectors or current customer entitlements. The current Zendesk base/optional list does not establish direct access to every service; confirm each proposed integration before design or sale.", "ecosystem", "aws", "blocks", "lex"),
    claim("Amazon Forecast", "difference", "The current Forecast developer guide says it is no longer available to new customers; existing customers may continue using it. Retain the historical diagram label but do not recommend Forecast as a generally available new ZCC integration.", "forecast"),
    claim("PII stays only in two accounts", "difference", "Current docs describe interaction and operational data processing and sharing, while component docs describe S3 reads and uploads to Zendesk. The deck's boundary is not an exhaustive residency, retention or compliance guarantee, particularly for external integrations.", "aws", "components"),
  ),
  "system-data-flow": section(
    "Current component and writeback docs describe dedicated event-driven functions, not just the source diagram's single reporting Lambda. Preserve the diagram as a historical simplification.",
    claim("API Gateway, Lambda, Cognito and scoped reads", "qualified", "Component docs describe MainHandler proxying Connect, Customer Profiles and Wisdom requests, managing Cognito sessions and generating presigned S3 URLs. Actual permissions come from the deployed IAM and federation setup, not the picture alone.", "components", "aws"),
    claim("Status sync and ticket search", "supported", "Zendesk documents status mapping to Connect and a live-call ticket/contact search Lambda. Online/Offline mappings and voice access are configured separately.", "status", "components"),
    claim("Post-call logs, usage metering, recordings and transcripts", "difference", "Writeback docs identify dedicated recording/transcript ingest functions as of stack 20260428, with Kinesis/EventBridge triggers. CTR analytics is separate. The old diagram does not establish the exact current metering payload or which transcript path your stack uses.", "writeback", "components", "aws"),
    claim("PII redaction and external-system boundaries", "qualified", "AWS redaction must be enabled; voice redaction is post-disconnect and may miss sensitive data. Raw files and external-system copies need their own access and retention controls.", "redaction", "attributes", "aws"),
  ),
  "basic-voice-call": section(
    "The call path is illustrative. Native recording belongs to Connect; Contact Lens adds analytics/transcription. Zendesk Voice AI in this diagram is not confirmed as available for Contact Center.",
    claim("Telephony, call controls and ticket association", "supported", "Connect powers voice and routing; Zendesk associates answered calls, voicemails and most outbound calls with tickets under documented rules.", "about", "tickets"),
    claim("Recording versus transcription providers", "difference", "Native Connect records calls. Contact Lens can transcribe/analyze them; Zendesk QA can separately create post-call transcripts/summaries from recordings without Contact Lens. Do not require both for QA-only post-call analysis.", "recording", "qa"),
    claim("Voice AI agents", "difference", "The September 2026 GA announcement explicitly says Contact Center support is planned. October component docs mention a broker function but do not prove customer availability. Treat the deck node as historical architecture intent pending confirmation.", "voice", "components"),
    claim("Copilot suggestions, summaries and triage", "qualified", "Live suggestions require Copilot and live transcripts. Ticket summaries require Copilot. Current general triage docs classify ticket public text and do not by themselves verify every transcript-to-tag workflow shown in the deck.", "suggestions", "tickets", "triage"),
  ),
  "aws-chapter": section(
    "This chapter divider adds no independent capability claim; current sources for each AWS topic follow in its own section.",
    claim("AWS technology chapter", "historical", "Connect routing, conversational analytics and Lex are documented separately. AWS now uses 'Connect Customer' in these docs; historical Amazon Connect and Contact Lens labels remain in the deck.", "routing", "lens", "lex"),
  ),
  "amazon-connect": section(
    "Do not reuse the deck's provider/country/service counts as current figures or treat predictive dialing and every AWS integration as included.",
    claim("Telephony, IVR, routing and dashboards", "supported", "AWS describes cloud telephony, conversational IVR, routing and performance reporting. Zendesk has its own Contact Center dashboards; the reporting surfaces are not interchangeable.", "overview", "routing", "dashboards"),
    claim("Outbound campaigns and predictive dialing", "qualified", "Zendesk explicitly lists Outbound Campaigns, including predictive or progressive dialing, as an optional AWS add-on. Confirm account configuration and local calling rules.", "aws", "overview"),
    claim("External database access and AWS ecosystem", "qualified", "Lambda and contact attributes support configured external lookups. This is an extensibility mechanism, not universal out-of-box access or inclusion of 200 services.", "blocks", "attributes", "aws"),
    claim("40+ providers, 158 inbound countries, 230+ outbound countries, 200 AWS features", "historical", "Keep these as November 2025 figures only. The current sources establish telephony and optional services, not those exact counts or availability in a particular region. Obtain a country/number-specific quote before making a coverage commitment.", "overview", "aws", "managed", "byo"),
    claim("PII location", "qualified", "Use the actual deployment model and data-processing terms. Zendesk documents processing and sharing interaction/operational data, and integrations can create additional copies.", "aws", "managed", "byo"),
  ),
  "routing-and-flows": section(
    "The four primitives still apply. A contact attribute does not automatically become a Zendesk ticket field; mapping is required.",
    claim("Flow designer and IVR", "supported", "The drag-and-drop designer links action blocks; flow type controls which blocks are available. Lex, Lambda and post-call/transfer paths require the appropriate flow and configuration.", "flows", "blocks", "lex"),
    claim("Contact attributes", "qualified", "AWS defines key-value interaction data, including user-defined, external and system values. Zendesk mappings control which attributes appear on tickets or notifications.", "attrs", "attributes"),
    claim("Queues, capacity, hours and routing profiles", "qualified", "Queues, profiles and flows determine assignment; queue capacity counts contacts, not Zendesk tickets. Check-hours blocks implement operating-hours branches. Routing profiles determine the queues and priorities available to each agent.", "routing", "capacity", "blocks"),
  ),
  "routing-comparison": section(
    "All November 2025 marks stay unchanged. Zendesk's IVR cell refers to Talk functionality, not the omnichannel router becoming an Amazon Connect-style flow builder.",
    claim("Data dip and drag-and-drop flow builder", "supported", "Connect flows have a drag-and-drop canvas and Lambda invocation. Blank Zendesk cells are historical omissions, not proof Zendesk lacks integrations or workflow builders today.", "flows", "blocks", "actions"),
    claim("IVR and ticket tags", "qualified", "Zendesk Talk documents IVR menus and ticket tagging from keypresses. ZCC voice routing uses Connect; mapped contact attributes can populate Zendesk fields/tags. Connect contact tags and Zendesk ticket tags are different objects.", "ivr", "attributes", "blocks"),
    claim("End-to-end contact flow versus work assignment", "qualified", "Connect defines call flow behavior; Zendesk omnichannel queues assign eligible work. Current Zendesk action flows automate cross-system steps but do not make the historical comparison a current feature matrix.", "flows", "queues", "actions"),
  ),
  "queue-comparison": section(
    "Marks remain exactly as in November 2025. Capacity means Connect contacts; current Zendesk percentage subqueues are Enterprise-only. Timer-based ticket rules are not live-call timers.",
    claim("Operating hours and outbound whispers", "supported", "Connect provides check-hours and whisper flow types. A queue's settings and associated flows, not the queue alone, determine the caller's experience.", "blocks", "flows"),
    claim("Maximum queue size and call-limit behavior", "difference", "Connect caps contacts across configured channels, not Zendesk tickets. Incoming calls and queued callbacks count; full-queue contingency/error handling must be designed, and enforcement has documented exceptions.", "capacity", "blocks"),
    claim("Percentage routing", "qualified", "Connect has a Distribute by percentage flow block. Zendesk documents percentage-based subqueues on Enterprise plans; this is not proof of the same mechanism or an entitlement on every plan.", "blocks", "customqueues"),
    claim("No-code timed actions", "qualified", "Zendesk action flows support waits and workflow steps. This does not establish a generic per-call queue timer. Treat the source row as a high-level workflow comparison, not live-call behavior.", "actions", "queues"),
    claim("SLA-based ticket ordering", "qualified", "Zendesk can order eligible queued tickets by SLA breach, priority or routing eligibility depending on plan/configuration. Connect live-contact priority is a separate routing model.", "queues", "routing"),
  ),
  "contact-lens": section(
    "Native Connect recording, Contact Lens analytics and Zendesk QA must be distinguished. None of the deck's 'by default' language proves that a customer's analytics or redaction is enabled.",
    claim("Recording, S3 storage and ticket delivery", "difference", "Zendesk identifies native Amazon Connect recording separately from Contact Lens redaction/transcription. Writeback requires configured event triggers; S3 storage does not mean copies never reach Zendesk.", "recording", "components", "writeback"),
    claim("Live transcripts and Copilot knowledge suggestions", "qualified", "Contact Lens real-time/post-call analytics and the app workflow must be enabled for live transcripts. Copilot and live transcription are prerequisites for live knowledge suggestions.", "transcripts", "suggestions"),
    claim("Evaluations, scoring and supervisor monitoring", "qualified", "AWS documents evaluations, generative AI form answers, live/recorded monitoring and quality management as configured AWS capabilities. These are separate from Zendesk QA and do not guarantee accurate scoring or regulatory compliance.", "lens", "evaluations", "qa"),
    claim("Redaction and QA-only alternative", "qualified", "Voice redaction occurs after disconnect and may miss sensitive data. Zendesk QA can transcribe recorded calls post-call without Contact Lens, but does not provide equivalent live transcription or audio redaction.", "redaction", "qa"),
  ),
  "amazon-lex": section(
    "Use Lex V2. AWS documents Lex V1 end of support as September 15, 2025; the deck's generic Lex label is not a recommendation for V1.",
    claim("Natural-language IVR, utterances and intents", "supported", "The AWS walkthrough configures a bot with intents, sample utterances and slots, adds it to Connect and invokes it through a flow. The payment-method example remains illustrative, not a delivered bot.", "lex"),
    claim("Self-service and human handoff", "qualified", "Flow blocks and bot outputs can branch to self-service or queues. Persist the intended context through configured contact attributes; do not assume the example resolves a real payment update or authenticates a caller.", "lex", "blocks", "attrs"),
  ),
  "resolution-chapter": section(
    "This chapter divider is historical organization. The product-specific reviews below distinguish the workspace from separate entitlements.",
    claim("Resolution Platform integration", "qualified", "Zendesk documents a unified workspace, but Copilot, QA, WFM and optional AWS services retain their own setup and licensing requirements.", "about", "suggestions", "qa", "wfm", "aws"),
  ),
  "resolution-platform": section(
    "The tiles represent source-era product positioning, not an included bundle or a single routing engine. The Voice AI tile needs availability confirmation.",
    claim("Ticketing, customer context, workspace and digital engagement", "supported", "Zendesk documents voice and digital channels in one UI, contextual attributes and ticket association. Live Connect routing is distinct from Zendesk's ticket routing.", "about", "attributes", "tickets", "routing", "queues"),
    claim("Knowledge, Copilot and Voice QA", "qualified", "Live help-center suggestions need Copilot and live transcripts. QA is separately entitled and can analyze post-call recordings without Contact Lens.", "suggestions", "qa", "voiceqa"),
    claim("Voice AI tile", "difference", "The Voice AI GA announcement excludes Contact Center pending future support. The tile preserves the historical vision, not a claim of currently enabled native integration.", "voice", "components"),
  ),
  "agent-workspace": section(
    "The workspace is unified, but context, transcripts and suggestions depend on explicit mapping, access and feature configuration.",
    claim("Live call handling and status", "supported", "Zendesk documents handling Connect-powered voice in its UI and mapping unified status to Amazon Connect. A shared workspace does not override agent voice access or routing profile permissions.", "about", "status", "components"),
    claim("Customer context and ticket record", "qualified", "Contact attributes can populate tickets and call notifications. Tickets are created or reused under documented call rules; the diagram is not evidence that every caller is authenticated or every interaction automatically shares one ticket.", "attributes", "tickets"),
    claim("Copilot suggestions, summaries and intent", "qualified", "Live suggestions use live transcripts and help-center articles; summaries require Copilot. General intelligent triage now describes Topic (formerly Intent) and public ticket text; verify any call-transcript classification workflow separately.", "suggestions", "tickets", "triage"),
  ),
  "zendesk-knowledge": section(
    "Current Contact Center suggestions documentation specifically names help-center articles. Knowledge Graph's broader connectors do not establish that every connected document/API is used in live ZCC suggestions.",
    claim("Knowledge Graph and external connectors", "supported", "The Universal Connector announcement documents REST/JSON content mapping into Knowledge Graph. Permissions, source configuration and the consuming product determine where that content is available.", "graph"),
    claim("Knowledge Builder", "difference", "Current documentation describes generating a new help-center hierarchy and draft articles from eligible solved/closed tickets. It is not a blanket promise to continuously improve existing articles; drafts require review before publishing.", "builder"),
    claim("In-call knowledge suggestions", "qualified", "Copilot analyzes enabled live transcripts and searches the help center. Agents request suggestions in the Knowledge panel and can give feedback or regenerate. Treat the deck's documents/APIs/websites pipeline as conceptual, not a verified live-call source list.", "suggestions", "graph"),
  ),
  "voice-copilot": section(
    "Live suggestions remain documented. General triage naming and fields changed, and current general ticket-triage documentation does not verify the deck's automatic transcript-to-intent/sentiment tags for every call.",
    claim("During-call suggestions", "qualified", "Requires Copilot, live voice transcripts and suitable help-center content. Agents request or regenerate suggestions; do not imply an always-on answer is guaranteed to be correct.", "suggestions", "transcripts"),
    claim("Post-call recording and summary", "qualified", "Ticket recording/transcript options, Copilot entitlement and writeback configuration control delivery. Dedicated event-driven functions handle artifacts; no immediate completion time is guaranteed.", "recording", "tickets", "writeback"),
    claim("Intelligent triage tags", "difference", "Current docs describe Topic (Intent), Sentiment and Language fields. Older Copilot purchases retain Intent/custom-field tags during migration. Classification uses public ticket text; validate your transcript workflow rather than promising every call writes tags automatically.", "triage", "tickets"),
  ),
  "zendesk-ticketing": section(
    "A centralized ticket is not guaranteed to be one ticket per issue: call origin, existing-ticket attributes and merge workflows determine association.",
    claim("Ticket creation, reuse, recordings, transcripts and summaries", "difference", "Answered inbound calls, voicemails and most outbound calls create tickets; a valid open-ticket ID can attach the interaction to an existing ticket. A closed/invalid ID creates a new ticket. Artifacts depend on settings; summaries require Copilot.", "tickets", "recording"),
    claim("Customer context and intent/sentiment", "qualified", "Mapped attributes provide context, not identity verification. Current intelligent triage fields and channel/input requirements apply; the illustrative list is not proof all calls generate transcript-based tags.", "attributes", "triage"),
    claim("Macros, callbacks, emails and back-office tasks", "qualified", "Macros apply configured responses and ticket actions. Scheduling an actual callback or updating a back-office system requires the appropriate Connect flow or connected workflow; the sample macro is not a shipped integration.", "macros", "actions", "blocks"),
    claim("Up to 20% after-call-work estimate", "historical", "This is the deck's dated estimate, not a verified current benchmark or customer savings guarantee. Current docs establish automation mechanisms, not this outcome.", "macros", "actions"),
  ),
  "voice-qa": section(
    "QA can produce its own post-call transcription. Neither 100% scoring coverage nor accurate/compliant outcomes should be inferred from the historical slide.",
    claim("Supported recordings, transcripts and summaries", "qualified", "Requires QA/WEM entitlement, recording enabled and a help-desk connection. QA processes recorded audio post-call without Contact Lens; it does not supply equivalent real-time transcription or audio redaction.", "qa", "voiceqa"),
    claim("AutoQA, custom criteria, spotlight insights and coaching review", "qualified", "Voice QA documents automatic scoring, custom categories, insight tags, disputes and manual reviews. These aid human quality review; sample scores are illustrative and coverage depends on eligible imported conversations.", "voiceqa"),
    claim("PII, PCI and recording access", "difference", "The QA integration guide warns that agents can access unredacted recordings before QA transcription. Transcript masking/redaction is not audio redaction; permissions, retention and recording deletion must be reviewed separately.", "qa", "masking", "redaction"),
  ),
  "app-builder": section(
    "App Builder remains documented, with plan/interface limits and explicit testing needs. The three example apps are proposals, not prebuilt integrations.",
    claim("Natural-language app creation", "supported", "App Builder generates Zendesk app code and UI with preview, iteration, code editing and publishing. It requires an eligible Professional-or-higher plan and is unavailable in the legacy Support interface.", "app"),
    claim("Refund, shipment, customer and organization lookups", "qualified", "App Builder supports integrations, but these examples require approved APIs, data mappings and permissions. A natural-language prompt does not establish that a carrier/commerce integration or refund approval already exists.", "app", "objects", "actions"),
    claim("Review, testing and deployment", "qualified", "Zendesk recommends thorough testing before publishing and notes that test actions can affect actual account data. Review generated code and authorization, use safe test data and require human approval for financial actions.", "app"),
  ),
} satisfies Record<SlideId, SectionReview>;

// The product owner explicitly approved these 22 notes on 2026-11-14.
// Approval accepts the assessments and caveats, not the unresolved vendor claims.
// When revising a section's assessment, remove its approval until re-reviewed.
// New sections remain pending unless explicitly listed here after human approval.
const approved: HumanReview = {
  status: "approved", reviewedOn: "2026-11-14", reviewer: "Product owner",
};
const HUMAN_APPROVALS: Partial<Record<SlideId, HumanReview>> = {
  overview: approved,
  contents: approved,
  "technology-evolution": approved,
  "platform-and-aws": approved,
  "anatomy-of-a-call": approved,
  "system-data-flow": approved,
  "basic-voice-call": approved,
  "aws-chapter": approved,
  "amazon-connect": approved,
  "routing-and-flows": approved,
  "routing-comparison": approved,
  "queue-comparison": approved,
  "contact-lens": approved,
  "amazon-lex": approved,
  "resolution-chapter": approved,
  "resolution-platform": approved,
  "agent-workspace": approved,
  "zendesk-knowledge": approved,
  "voice-copilot": approved,
  "zendesk-ticketing": approved,
  "voice-qa": approved,
  "app-builder": approved,
};

export const SECTION_REVIEWS = Object.fromEntries(
  Object.entries(SECTION_REVIEW_DRAFTS).map(([id, review]) => [
    id, { ...review, humanReview: HUMAN_APPROVALS[id as SlideId] ?? review.humanReview },
  ]),
) as Record<SlideId, SectionReview>;
