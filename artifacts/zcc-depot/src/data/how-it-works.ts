export type Chapter = { id: string; label: string; slides: string[] };
export type Slide = { n: number; id: string; title: string; short: string };

export const SLIDES: Slide[] = [
  { n: 1, id: "overview", title: "How Zendesk Contact Center works", short: "Overview" },
  { n: 2, id: "contents", title: "Guide contents", short: "Contents" },
  { n: 3, id: "technology-evolution", title: "Contact center technology has evolved into the CX stack", short: "Technology evolution" },
  { n: 4, id: "platform-and-aws", title: "Resolution Platform products and AWS services, layer by layer", short: "Platform and AWS" },
  { n: 5, id: "anatomy-of-a-call", title: "Anatomy of a call", short: "Anatomy of a call" },
  { n: 6, id: "system-data-flow", title: "Detailed system overview and data flow", short: "System data flow" },
  { n: 7, id: "basic-voice-call", title: "The architecture of a basic voice call", short: "Basic voice call" },
  { n: 8, id: "aws-chapter", title: "What Amazon technology it uses", short: "Chapter: Amazon" },
  { n: 9, id: "amazon-connect", title: "What Amazon Connect brings", short: "Amazon Connect" },
  { n: 10, id: "routing-and-flows", title: "Amazon Connect routing and flows", short: "Routing and flows" },
  { n: 11, id: "routing-comparison", title: "Zendesk omnichannel routing and Connect contact flows", short: "Routing comparison" },
  { n: 12, id: "queue-comparison", title: "Zendesk queues and Amazon Connect queues", short: "Queue comparison" },
  { n: 13, id: "contact-lens", title: "Contact Lens for Amazon Connect", short: "Contact Lens" },
  { n: 14, id: "amazon-lex", title: "Amazon Lex for self-service", short: "Amazon Lex" },
  { n: 15, id: "resolution-chapter", title: "How it integrates with the Resolution Platform", short: "Chapter: Resolution" },
  { n: 16, id: "resolution-platform", title: "Built on the Zendesk Resolution Platform", short: "Resolution Platform" },
  { n: 17, id: "agent-workspace", title: "Agent Workspace", short: "Agent Workspace" },
  { n: 18, id: "zendesk-knowledge", title: "Zendesk Knowledge", short: "Knowledge" },
  { n: 19, id: "voice-copilot", title: "Voice Copilot", short: "Voice Copilot" },
  { n: 20, id: "zendesk-ticketing", title: "Zendesk Ticketing", short: "Ticketing" },
  { n: 21, id: "voice-qa", title: "Voice QA", short: "Voice QA" },
  { n: 22, id: "app-builder", title: "App Builder", short: "App Builder" },
];

export const CHAPTERS: Chapter[] = [
  { id: "c1", label: "How it works", slides: ["overview", "contents", "technology-evolution", "platform-and-aws", "anatomy-of-a-call", "system-data-flow", "basic-voice-call"] },
  { id: "c2", label: "Amazon technology", slides: ["aws-chapter", "amazon-connect", "routing-and-flows", "routing-comparison", "queue-comparison", "contact-lens", "amazon-lex"] },
  { id: "c3", label: "Resolution Platform", slides: ["resolution-chapter", "resolution-platform", "agent-workspace", "zendesk-knowledge", "voice-copilot", "zendesk-ticketing", "voice-qa", "app-builder"] },
];

export const EVOLUTION = [
  { k: "Fundamental CCaaS capabilities", sub: "Traditional CCaaS", tone: "ink", items: ["Telephony", "Intelligent omnichannel routing", "Routing profiles", "IVR/IVA phone trees", "Live calls dashboard", "Queued callbacks", "Voicemail", "Call transfers", "Real-time and historical reporting"] },
  { k: "New CX capabilities", sub: "Modern CRM/CEC features", tone: "green", items: ["Self-service automation", "Customer relationship management", "Customer screen pops", "Knowledge management", "Help Center", "Post-call transcription", "Post-call summarization", "Sentiment analysis", "WEM: WFM, QA, and reporting", "Workflow automation"] },
  { k: "AI-powered resolution", sub: "New voice AI technology", tone: "lime", items: ["AI agents", "Knowledge Builder", "Knowledge suggestions", "App Builder", "Action Builder", "Intelligent triage", "Voice QA", "Custom QA", "Diarized transcriptions"] },
];

export const LAYERS = [
  { id: "workflow", k: "Workflow", c: "#3E9B57", groups: [{ t: "Zendesk Ticketing", items: ["Call recording", "Call transcripts", "Triggers", "Automation", "Call summaries", "Macros"] }, { t: "Builders", items: ["App Builder", "Action Builder"] }, { t: "Scope", items: ["Segments", "Private groups", "Brands"] }] },
  { id: "voice-ai", k: "Voice AI", c: "#8457C9", groups: [{ t: "AI agents", items: ["Zero training agents", "Personas", "Generative replies", "Intents and suggestions"] }, { t: "Agent Copilot", items: ["Intelligent triage", "Knowledge suggestions", "Intent detection", "Call summarization"] }] },
  { id: "data", k: "Data", c: "#2F6FB0", groups: [{ t: "Standard and custom objects", items: ["Organizations", "Tickets", "Users", "Custom objects", "Data masking"] }, { t: "Knowledge base", items: ["Knowledge Graph", "Knowledge connectors", "Knowledge Builder", "Help Center"] }] },
  { id: "analytics", k: "Analytics", c: "#D9822B", groups: [{ t: "Voice QA", items: ["AutoQA", "Custom QA", "Spotlight", "Agent coaching"] }, { t: "Reporting", items: ["Real-time performance dashboard", "Historical performance", "Resolution codes", "BI reporting"] }] },
  { id: "aws", k: "Amazon Web Services", c: "#11110D", groups: [{ t: "Amazon Connect", items: ["Global telephony", "Outbound campaigns", "Advanced routing", "Queues", "Routing profiles", "Conversational IVR", "Contact attributes"] }, { t: "Contact Lens", items: ["Call transcription", "Call recording"] }, { t: "Custom AWS services", items: ["Serverless compute", "Storage", "NLU", "NLP", "AWS monitoring", "Data streaming"] }, { t: "Integrations", items: ["Webhooks", "Integration services"] }] },
];

export const AWS_SERVICES = ["Comprehend", "Lex", "Translate", "Forecast", "Polly", "Transcribe", "Personalize", "SageMaker"];

export const ANATOMY = [
  { id: "voice", t: "Voice call", d: "An inbound or outbound call reaches the customer's Amazon Connect instance over its telephony.", side: "Caller" },
  { id: "connect", t: "Amazon Connect + contact flows", d: "Contact flows run the IVR, call AWS services such as Lex, and set contact attributes. Lambda functions can dip into internal systems, data lakes or CRMs.", side: "Customer AWS" },
  { id: "zcc", t: "Zendesk Contact Center", d: "The agent controls the call from Agent Workspace. Contact attributes, and where enabled, recordings and transcripts, are associated with the ticket.", side: "Zendesk" },
];

export const SYSFLOW = [
  { id: "controls", t: "Call controls", d: "Zendesk Contact Center provides call controls inside Agent Workspace: agent status sync, ticket search and call analysis." },
  { id: "identity", t: "Agent-scoped reads", d: "Customer Profiles and custom contact attributes are read using the logged-in agent's credentials and permission level, brokered through AWS Cognito." },
  { id: "lambda", t: "API Gateway + Lambda", d: "Integration helpers in the customer's AWS environment broker configured API operations and scoped data exchange with Zendesk." },
  { id: "records", t: "Post-call records and reporting", d: "A reporting Lambda sends configured logs, transcript metadata and contact trace records from the customer's AWS environment to Zendesk for reporting and usage metering. Processing happens asynchronously." },
  { id: "external", t: "External systems", d: "Contact flows can read or update internal systems, data lakes and CRMs through customer-owned Lambda functions. Those integrations carry their own retention and permission model." },
  { id: "redaction", t: "Redaction", d: "With Contact Lens PII redaction configured, supported entities are redacted from transcripts. Redaction must be enabled and is not perfect; review residual risk." },
];

export const ROUTE_STEPS = [
  { id: "flow", t: "Contact flow", d: "An advanced IVR builder that defines the customer experience from start to finish: greetings, menus, bot handoff, data dips, and post-call actions.", ex: "Greeting -> Lex intent -> Lambda lookup" },
  { id: "attrs", t: "Contact attributes", d: "Each interaction is a contact with interaction-specific data stored as key-value pairs.", ex: "intent = billing · tier = gold · account = 48211" },
  { id: "queue", t: "Queue", d: "Rules in the flow decide which queue the call enters, with hours of operation and capacity.", ex: "Set working queue: Billing-Priority" },
  { id: "profile", t: "Routing profile", d: "An agent's routing profile determines which queues, and therefore which calls, the agent can be assigned.", ex: "Profile: Billing Tier 2 -> Billing-Priority (P1)" },
];

export type Mark = "yes" | "blank";
export const ROUTING_CMP: { f: string; desc: string; connect: Mark; zendesk: Mark }[] = [
  { f: "Data dip", desc: "Access and retrieve information from a database or other system", connect: "yes", zendesk: "blank" },
  { f: "Drag-and-drop interface", desc: "Canvas builder for creating more complex flows", connect: "yes", zendesk: "blank" },
  { f: "IVR capabilities", desc: "Configure an IVR ('Press 1 for sales...')", connect: "yes", zendesk: "yes" },
  { f: "Add tags", desc: "Enrich the ticket with tags based on the customer's response", connect: "yes", zendesk: "yes" },
  { f: "Controls flows", desc: "Controls flows from receipt of call through post-call actions", connect: "yes", zendesk: "blank" },
];

export const QUEUE_CMP: { f: string; desc: string; connect: Mark; zendesk: Mark; note?: string }[] = [
  { f: "Queue operational hours", desc: "Amazon Connect queues can have hours of operation", connect: "yes", zendesk: "blank" },
  { f: "Outbound calling queues", desc: "With whisper flow: play a message before connecting an agent", connect: "yes", zendesk: "blank" },
  { f: "Max. amount of tickets in queues", desc: "Define a maximum amount that can be assigned to a queue", connect: "yes", zendesk: "blank", note: "Source label is misleading: Connect queue capacity limits contacts in a Connect queue. It says nothing about Zendesk ticket limits." },
  { f: "Percent-based routing", desc: "A certain % of calls go to one agent group vs. another", connect: "yes", zendesk: "yes" },
  { f: "No-code queue trigger actions", desc: "Ability to do actions based on a timer", connect: "blank", zendesk: "yes" },
  { f: "Ticket sorting", desc: "Order tickets in a queue by next SLA breach", connect: "blank", zendesk: "yes" },
  { f: "Call limit", desc: "Contact flow determines what happens if the call limit is exceeded", connect: "yes", zendesk: "blank" },
];

export const PLATFORM_TILES = [
  { id: "ticketing", t: "Zendesk Ticketing", href: "zendesk-ticketing" },
  { id: "knowledge", t: "Knowledge management", href: "zendesk-knowledge" },
  { id: "voice-ai", t: "Voice AI agents", href: "basic-voice-call" },
  { id: "context", t: "Customer context", href: "agent-workspace" },
  { id: "workspace", t: "Agent Workspace", href: "agent-workspace" },
  { id: "qa", t: "Voice QA", href: "voice-qa" },
  { id: "copilot", t: "Voice Copilot", href: "voice-copilot" },
  { id: "digital", t: "Digital engagements", href: "resolution-platform" },
];

export const APPS = [
  { id: "refund", t: "Refund processing", prompt: "Build an app that shows the caller's last order and lets the agent request a refund for approval.", steps: ["Read order via approved commerce integration", "Agent proposes refund amount", "Supervisor approval step", "Write internal note to ticket"] },
  { id: "shipment", t: "Shipment status tracking", prompt: "Show the shipment status for the order number collected in the IVR.", steps: ["Read order number from ticket field", "Query carrier via configured connection", "Display status and ETA in the sidebar"] },
  { id: "lookup", t: "Agent and organization lookup", prompt: "Show the caller's organization, plan and open tickets.", steps: ["Read requester and organization", "Fetch plan from internal CRM connection", "List related open tickets"] },
];
