import { ACCURACY_NOTES } from "./content";

export type ArchLayer = "channels" | "infra" | "aws" | "ai" | "zendesk" | "integration" | "analytics" | "security" | "conceptual";

export const ARCH_LAYERS: { id: ArchLayer; label: string; color: string }[] = [
  { id: "channels", label: "Customer channels", color: "#1F73B7" },
  { id: "infra", label: "Contact center infra", color: "#03363D" },
  { id: "aws", label: "AWS services", color: "#E8890C" },
  { id: "ai", label: "AI services", color: "#C2357A" },
  { id: "zendesk", label: "Zendesk apps", color: "#17A07A" },
  { id: "integration", label: "Integrations", color: "#6B4FBB" },
  { id: "analytics", label: "Reporting", color: "#5E7A82" },
  { id: "security", label: "Security boundary", color: "#9FB3B0" },
  { id: "conceptual", label: "Conceptual", color: "#D1F470" },
];

export type ArchNode = { id: string; layer: ArchLayer; t: string; sub: string; short: string; d: string; tech: string[]; status?: string; x: number; y: number; w: number; h: number };
const N = (o: Omit<ArchNode, "w" | "h"> & { w?: number }): ArchNode => ({ w: 230, h: 54, ...o });

export const ARCH_NODES: ArchNode[] = [
  N({ id: "phone", layer: "channels", t: "Voice callers", sub: "PSTN · inbound and outbound", x: 30, y: 120, short: "Customers reach the service line by phone.", d: "Voice contacts arrive at numbers claimed in the customer's Amazon Connect instance and enter a configured contact flow.", tech: ["Numbers are claimed or ported in Amazon Connect", "Outbound calls are placed from the agent experience using configured outbound queues"] }),
  N({ id: "digital", layer: "channels", t: "Digital channels", sub: "Messaging · email · web", x: 30, y: 260, short: "Messaging and email handled natively in Zendesk.", d: "Digital conversations are handled by Zendesk channels and land in the same ticketing system that voice calls write to.", tech: ["Zendesk messaging, email, and web form channels", "Shared ticket history gives agents cross-channel context"] }),
  N({ id: "selfservice", layer: "channels", t: "Self-service", sub: "Help center · AI agents", x: 30, y: 400, short: "Help center content and AI agents resolve simpler requests.", d: "Help center content feeds both customer self-service and in-call knowledge suggestions for agents.", tech: ["Knowledge quality drives suggestion quality", "AI agent availability depends on plan and configuration"] }),
  N({ id: "a2a", layer: "conceptual", t: "Specialist AI collaborator", sub: "A2A pattern · conceptual", x: 30, y: 530, status: "Conceptual", short: "Illustrates an agent-to-agent delegation pattern. Not a current ZCC integration.", d: "A conceptual pattern in which an orchestrating AI agent delegates a focused task to a specialist agent and receives a result. Shown only to frame architecture discussions; it is not a promised or available Zendesk Contact Center integration.", tech: ["Requires product and technical validation", "Open questions: orchestration ownership, context transfer, reporting, cost visibility"] }),

  N({ id: "connect", layer: "infra", t: "Amazon Connect", sub: "Telephony · queues", x: 330, y: 110, short: "Telephony and routing in the deployment's AWS account.", d: `One Contact Center environment links to one Connect instance. ${ACCURACY_NOTES.awsOwnership}`, tech: ["Confirm the account ownership and operating model", "Region choice affects data residency and latency", "Routing profiles map agents to queues"], status: "Documented" }),
  N({ id: "flows", layer: "infra", t: "Contact flows", sub: "IVR · routing logic", x: 330, y: 200, short: "Orchestrate IVR, attributes, and queue selection.", d: "Contact flows run IVR menus, set contact attributes, invoke Lambda functions, and transfer to queues. Attributes set here can be mapped to Zendesk ticket fields.", tech: ["Contact attributes can populate ticket data", "Workflow recipe: record an IVR selection on a ticket", "Routing profile changes are made in Amazon Connect"] }),
  N({ id: "lex", layer: "ai", t: "Amazon Lex V2", sub: "Conversational IVR", x: 330, y: 290, short: "Optional natural-language IVR in contact flows.", d: "Amazon Lex V2 bots can be invoked from contact flows for speech or DTMF-based self-service and intent capture. Configuration-dependent; do not build new integrations on retired Lex V1.", tech: ["Configured in the deployment's AWS account", "Intent results can be stored as contact attributes"], status: "Config-dependent" }),
  N({ id: "lens", layer: "ai", t: "Contact Lens", sub: "Transcripts · analytics", x: 330, y: 380, short: "Amazon Connect conversation analytics, when enabled.", d: "Contact Lens provides real-time and post-call transcription and analytics in Amazon Connect. Real-time events can be forwarded to Zendesk; redaction is available when configured.", tech: ["ContactLensEventsLambda forwards real-time events", "Redaction of transcripts and recordings when configured"], status: "Config-dependent" }),
  N({ id: "cfn", layer: "aws", t: "CloudFormation stack", sub: "Deployment template", x: 330, y: 500, short: "Deploys the AWS resources that connect the app to Connect.", d: "A CloudFormation template automates deployment of Cognito, IAM roles, Lambda functions, and streaming connections in the customer's AWS account.", tech: ["Requires permissions to create IAM roles and Lambda functions", "Plan stack updates with the customer's change process"], status: "Documented" }),

  N({ id: "cognito", layer: "security", t: "Amazon Cognito", sub: "User pool · SAML 2.0", x: 600, y: 110, short: "Holds Contact Center user accounts.", d: "Cognito stores agent, supervisor, and admin accounts. Zendesk acts as a SAML 2.0 identity provider after users authenticate through their corporate identity provider.", tech: ["Corporate MFA policies apply at the upstream IdP", "Deployed by the CloudFormation template"], status: "Documented" }),
  N({ id: "lambda", layer: "integration", t: "API Gateway + Lambda", sub: "Integration functions", x: 600, y: 200, short: "Carries agent actions, lookups, and call data.", d: "Lambda functions behind API Gateway proxy agent actions to Connect, search for caller records during a live call, and send post-call data to the Zendesk Voice API.", tech: ["MainHandler serves agent UI requests", "ZendeskVoiceSearch looks up the caller", "ZendeskVoicePostCall sends call data after the call"], status: "Documented" }),
  N({ id: "records", layer: "aws", t: "S3 · Kinesis · EventBridge", sub: "Recordings · CTRs · streams", x: 600, y: 290, short: "Configured recording, transcript and analytics paths.", d: "Recording/transcript writeback uses dedicated ingest functions from stack 20260428. CTR analytics has a separate ingest path. Enabled data can leave AWS and attach to Zendesk tickets.", tech: ["RecordingIngestLambda and TranscriptIngestLambda", "CTRIngestLambda is a separate analytics path", "Confirm bucket, KMS and retention controls for the account model"] }),
  N({ id: "profiles", layer: "aws", t: "Customer Profiles", sub: "Amazon Connect", x: 600, y: 380, short: "Customer data the agent experience can read.", d: "The agent experience can read Amazon Connect Customer Profiles and custom contact attributes using the logged-in agent's permissions.", tech: ["Domain discovered at deployment", "Access scoped to agent permissions"], status: "Config-dependent" }),
  N({ id: "internal", layer: "integration", t: "Customer systems", sub: "CRM · data lake · APIs", x: 600, y: 500, short: "Lookups and data distribution, by configuration.", d: "Customer-owned systems that contact flows and Lambda helpers can reach for lookups or data distribution, depending on configuration.", tech: ["Owned and secured by the customer", "Integration effort varies"] }),

  N({ id: "zcc", layer: "zendesk", t: "Agent Workspace", sub: "Contact Center app", x: 910, y: 110, w: 250, short: "Agents handle calls and tickets together.", d: "Call controls, ticket, and customer context sit together in Zendesk Agent Workspace through the Contact Center app.", tech: ["Agent status sync", "Ticket search and caller lookup", "Configurable call console access"], status: "Documented" }),
  N({ id: "tickets", layer: "zendesk", t: "Tickets", sub: "Voice + digital record", x: 910, y: 200, w: 250, short: "Calls become tickets with mapped attributes.", d: "Calls create or update tickets. Mapped attributes, and transcripts and recordings when enabled, can be written to the ticket.", tech: ["Writeback depends on enabled features", "Shared ticket timeline across channels"], status: "Documented" }),
  N({ id: "zai", layer: "ai", t: "Zendesk AI", sub: "Copilot · verify Voice AI", x: 910, y: 290, w: 250, short: "Configured Copilot suggestions; native Voice AI availability unconfirmed for ZCC.", d: `Real-time knowledge suggestions require live transcripts and Copilot. ${ACCURACY_NOTES.voiceAi}`, tech: ["Requires live transcripts and Copilot for suggestions", "Voice AI GA announcement lists ZCC support as planned"], status: "Plan-dependent" }),
  N({ id: "qa", layer: "analytics", t: "Zendesk QA", sub: "Optional · post-call review", x: 910, y: 380, w: 250, short: "Optional quality review, distinct from Contact Lens.", d: "Zendesk QA can review call transcripts in Contact Center. Post-call transcript redaction requires the Advanced Data Privacy and Protection add-on; it does not redact attached call audio.", tech: ["Separate product from Contact Lens", "Licensing applies"], status: "Optional" }),
  N({ id: "dash", layer: "analytics", t: "Dashboards", sub: "Contact Center dashboards app", x: 910, y: 500, w: 250, short: "Operational reporting from call data.", d: "The Contact Center dashboards app surfaces operational metrics, including data forwarded from Contact Trace Records.", tech: ["Marketplace dashboards app", "Resolution Code dashboard uses CTR data"], status: "Documented" }),
];

export type ArchEdge = { from: string; to: string; conceptual?: boolean };
export const ARCH_EDGES: ArchEdge[] = [
  { from: "phone", to: "connect" },
  { from: "connect", to: "flows" },
  { from: "flows", to: "lex" },
  { from: "flows", to: "lambda" },
  { from: "zcc", to: "connect" },
  { from: "zcc", to: "cognito" },
  { from: "lambda", to: "zcc" },
  { from: "zcc", to: "tickets" },
  { from: "connect", to: "lens" },
  { from: "lens", to: "records" },
  { from: "records", to: "lambda" },
  { from: "lambda", to: "tickets" },
  { from: "profiles", to: "zcc" },
  { from: "internal", to: "lambda" },
  { from: "cfn", to: "lambda" },
  { from: "digital", to: "tickets" },
  { from: "selfservice", to: "zai" },
  { from: "zai", to: "zcc" },
  { from: "tickets", to: "qa" },
  { from: "records", to: "dash" },
  { from: "a2a", to: "flows", conceptual: true },
];

export const ARCH_TOUR: { t: string; d: string; nodes: string[]; zoom?: number; label?: string }[] = [
  { t: "A call arrives", d: "The customer dials a number claimed in Amazon Connect. The contact flow starts, sets attributes, and may invoke a Lex bot for self-service.", nodes: ["phone", "connect", "flows", "lex"], zoom: 1.35 },
  { t: "Context reaches the agent", d: "Lambda helpers search for the caller's ticket or contact, and mapped attributes travel to Agent Workspace while the phone rings.", nodes: ["flows", "lambda", "zcc", "profiles"], zoom: 1.25 },
  { t: "Sign-in and access", d: "Agents sign in through their corporate IdP; Zendesk acts as SAML identity provider to Cognito and Connect. MFA policy lives with the corporate IdP.", nodes: ["cognito", "zcc", "connect"], zoom: 1.3 },
  { t: "AI assist during the call", d: "With live transcripts and Copilot enabled, help center content becomes in-call knowledge suggestions. Availability depends on plan and configuration.", nodes: ["lens", "zai", "zcc", "selfservice"], zoom: 1.1, label: "Config-dependent" },
  { t: "After the call", d: "Contact Trace Records, recordings, and transcripts are processed in the customer account and written to the ticket where configured.", nodes: ["records", "lambda", "tickets", "lens"], zoom: 1.25 },
  { t: "Quality and reporting", d: "Dashboards use CTR-derived data. Zendesk QA is an optional, separately licensed path for transcript review, distinct from Contact Lens.", nodes: ["tickets", "qa", "dash", "records"], zoom: 1.15 },
  { t: "Security boundary", d: "AWS ownership and IAM/KMS controls depend on the managed or BYOA model. Enabled recording/transcript writeback can also place data in Zendesk tickets. Review each service, retention rule and integration rather than assuming all data stays in one account.", nodes: ["cfn", "lambda", "records", "cognito", "connect"], zoom: 1 },
  { t: "Looking ahead: agent collaboration", d: "A conceptual pattern for discussion only: an orchestrating AI agent delegating a task to a specialist agent. Not a current or promised ZCC integration.", nodes: ["a2a", "flows", "zai"], zoom: 1.2, label: "Conceptual" },
];
