import { LINKS } from "./content";

export type SoGroup = "zendesk" | "identity" | "aws" | "ai" | "data" | "records";
export type SoNode = { id: string; t: string; sub: string; group: SoGroup; x: number; y: number; w: number; optional?: boolean; d: string; doc: keyof typeof SO_DOCS };
export type SoEdge = { id: string; from: string; to: string; label: string; mode?: "h" | "v"; ox?: number; sy?: number; optional?: boolean };

export const SO_DOCS = { components: LINKS.components, awsServices: LINKS.awsServices, install: LINKS.install } as const;
export const SO_DOC_LABEL: Record<keyof typeof SO_DOCS, string> = { components: "Understanding Contact Center components", awsServices: "About AWS services in Contact Center", install: "Implementing Zendesk Contact Center" };

export const SO_W = 1200, SO_H = 770, SO_NH = 76;

export const SO_GROUPS: Record<SoGroup, { tab: string; pale: string; tag: string }> = {
  zendesk: { tab: "#3E9B57", pale: "#E2F2E6", tag: "Zendesk" },
  identity: { tab: "#3B7DD8", pale: "#E3EEFB", tag: "Identity" },
  aws: { tab: "#E8862A", pale: "#FCEBD9", tag: "AWS" },
  ai: { tab: "#8457C9", pale: "#EEE6F8", tag: "Optional" },
  data: { tab: "#2A9192", pale: "#DDF0EF", tag: "Data" },
  records: { tab: "#6B7280", pale: "#EEF0F2", tag: "Records" },
};

export const SO_NODES: SoNode[] = [
  { id: "idp", t: "Corporate IdP", sub: "Upstream identity", group: "identity", x: 24, y: 70, w: 196, doc: "components", d: "The customer's corporate identity provider authenticates the agent first. MFA and password policy live here, not in Cognito." },
  { id: "zcc", t: "Contact Center", sub: "In Agent Workspace", group: "zendesk", x: 470, y: 60, w: 240, doc: "components", d: "Call controls run inside Zendesk Agent Workspace. Profiles and custom contact attributes are read with the signed-in agent's credentials and permission scope." },
  { id: "search", t: "Ticket search", sub: "Caller to ticket", group: "zendesk", x: 790, y: 44, w: 180, doc: "components", d: "Matches the caller to existing tickets and users so context opens alongside the call." },
  { id: "status", t: "Status sync", sub: "Agent availability", group: "zendesk", x: 984, y: 44, w: 180, doc: "components", d: "Keeps agent availability aligned between Agent Workspace and Amazon Connect." },
  { id: "analytics", t: "Call analytics", sub: "Call insights", group: "zendesk", x: 790, y: 140, w: 180, doc: "awsServices", d: "Call-level insights surfaced in Zendesk where the related features are enabled." },
  { id: "reporting", t: "Reporting", sub: "Usage metering", group: "zendesk", x: 984, y: 140, w: 180, doc: "awsServices", d: "Reporting and usage monitoring fed by post-call records delivered through Lambda." },
  { id: "cognito", t: "Amazon Cognito", sub: "Federated session", group: "identity", x: 266, y: 300, w: 174, doc: "components", d: "Receives the Zendesk SAML assertion and brokers the agent's Amazon Connect session. Cognito is not the source of identity on its own." },
  { id: "apigw", t: "API Gateway + Lambda", sub: "Integration layer", group: "aws", x: 520, y: 300, w: 220, doc: "awsServices", d: "The authorized bridge between Agent Workspace and the customer's AWS resources: call controls, profile reads, and configured actions." },
  { id: "connect", t: "Amazon Connect", sub: "Telephony and routing", group: "aws", x: 40, y: 420, w: 220, doc: "awsServices", d: "The customer-owned contact center instance: numbers, contact flows, queues, and routing." },
  { id: "profiles", t: "Customer Profiles", sub: "Contact context", group: "data", x: 520, y: 490, w: 220, doc: "awsServices", d: "Unified caller profile and custom attributes. What an agent sees is scoped by their credentials and permissions." },
  { id: "external", t: "CRM / data lake", sub: "Via authorized Lambda", group: "data", x: 800, y: 400, w: 200, optional: true, doc: "install", d: "External systems are read or written only through Lambda integrations the customer configures and authorizes. Nothing connects by default." },
  { id: "lex", t: "Amazon Lex", sub: "Conversational IVR", group: "ai", x: 40, y: 650, w: 160, optional: true, doc: "awsServices", d: "Optional conversational IVR invoked from contact flows when configured." },
  { id: "polly", t: "Amazon Polly", sub: "Text to speech", group: "ai", x: 212, y: 650, w: 160, optional: true, doc: "awsServices", d: "Optional text-to-speech voices for prompts, when configured." },
  { id: "bedrock", t: "Amazon Bedrock", sub: "GenAI integration", group: "ai", x: 384, y: 650, w: 170, optional: true, doc: "awsServices", d: "Optional generative AI integration that the customer builds and governs. Not bundled by default." },
  { id: "records", t: "Post-call records", sub: "Logs, transcripts, CTRs", group: "records", x: 600, y: 650, w: 220, doc: "awsServices", d: "Logs, transcript metadata, and contact trace records. With Contact Lens enabled and configured, PII redaction can be applied; detection is not perfect and is not a compliance guarantee." },
  { id: "lambdar", t: "Records Lambda", sub: "Delivery to Zendesk", group: "aws", x: 984, y: 560, w: 180, doc: "awsServices", d: "Processes post-call records and sends them to Zendesk for reporting and usage monitoring." },
];

export const SO_EDGES: SoEdge[] = [
  { id: "idp-zcc", from: "idp", to: "zcc", label: "Zendesk SAML sign-in" },
  { id: "zcc-search", from: "zcc", to: "search", label: "Ticket lookup" },
  { id: "zcc-status", from: "zcc", to: "status", label: "Agent availability synchronization" },
  { id: "zcc-analytics", from: "zcc", to: "analytics", label: "Call insights" },
  { id: "zcc-cognito", from: "zcc", to: "cognito", label: "SAML federation", mode: "v", ox: -70 },
  { id: "cognito-connect", from: "cognito", to: "connect", label: "Agent session", mode: "v", ox: 0 },
  { id: "zcc-apigw", from: "zcc", to: "apigw", label: "Controls and reads", mode: "v", ox: 20 },
  { id: "apigw-connect", from: "apigw", to: "connect", label: "Call control", sy: 30 },
  { id: "apigw-profiles", from: "apigw", to: "profiles", label: "Scoped profile read", mode: "v" },
  { id: "apigw-external", from: "apigw", to: "external", label: "Authorized integration", optional: true },
  { id: "connect-profiles", from: "connect", to: "profiles", label: "Contact context" },
  { id: "connect-lex", from: "connect", to: "lex", label: "Conversational IVR", mode: "v", ox: -60, optional: true },
  { id: "connect-polly", from: "connect", to: "polly", label: "Prompts", mode: "v", ox: 0, optional: true },
  { id: "connect-bedrock", from: "connect", to: "bedrock", label: "GenAI", mode: "v", ox: 60, optional: true },
  { id: "connect-records", from: "connect", to: "records", label: "Post-call output" },
  { id: "records-lambdar", from: "records", to: "lambdar", label: "Process" },
  { id: "lambdar-reporting", from: "lambdar", to: "reporting", label: "Reporting and usage", mode: "v" },
];

export const SO_JOURNEYS = [
  { id: "agent", t: "Agent actions", nodes: ["idp", "zcc", "cognito", "connect", "apigw", "search", "status", "analytics"], d: "Corporate identity signs the agent in through Zendesk SAML, Cognito brokers the Connect session, and controls flow from Agent Workspace through API Gateway and Lambda." },
  { id: "context", t: "Customer context", nodes: ["connect", "profiles", "apigw", "zcc", "external"], d: "Caller context comes from Customer Profiles and custom attributes, read under the agent's own permissions. External CRM or data lake reads require a configured, authorized Lambda." },
  { id: "post", t: "Post-call records", nodes: ["connect", "records", "lambdar", "reporting"], d: "Logs, transcript metadata, and contact trace records travel through Lambda to Zendesk reporting and usage metering." },
] as const;

export const SO_SECTIONS = [
  { id: "agent-workspace", t: "Agent workspace", doc: "components" as const, points: ["Call controls live inside Zendesk Agent Workspace alongside ticket search, status sync, call analytics, and reporting.", "Sign-in chain: corporate IdP, then Zendesk SAML, then Cognito and Connect. Cognito alone is not the identity source.", "Profiles, custom attributes, and actions are scoped by the agent's credentials and permissions."] },
  { id: "aws-foundation", t: "AWS foundation", doc: "awsServices" as const, points: ["Amazon Connect, API Gateway, Lambda, Cognito, and Customer Profiles run in the customer's AWS account.", "Lex (conversational IVR), Polly (TTS), and Bedrock (GenAI) are optional and configuration-dependent.", "Not every AWS service is bundled by default; scope what the customer enables."] },
  { id: "external-data", t: "External data", doc: "install" as const, points: ["CRM and data lake access happens only through Lambda integrations the customer configures and authorizes.", "Reads and writes follow the same permission model as the rest of the integration.", "No external system is connected out of the box."] },
  { id: "post-call-privacy", t: "Post-call records & privacy", doc: "awsServices" as const, points: ["Logs, transcript metadata, and contact trace records flow through Lambda to Zendesk reporting and usage.", "When Contact Lens is enabled and configured, PII redaction can be applied. Detection is not perfect and is not a compliance guarantee; do not assume all audio is redacted.", "Contact Lens is an AWS feature and is distinct from optional Zendesk QA."] },
];
