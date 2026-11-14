// Conceptual ZCC system + data flow graph. Pure data + stepping utilities (no DOM).

export type Cloud = "zendesk" | "customer";
export type EdgeKind = "auth" | "controls" | "context" | "records";

export type SysNode = {
  id: string; cloud: Cloud; t: string; sub: string; d: string; chips: string[];
  tl?: string[]; x: number; y: number; w: number; h: number; tier: "primary" | "secondary";
};
export type SysEdge = { id: string; from: string; to: string; kind: EdgeKind; label: string; optional?: boolean; d: string };
export type SysFlow = { id: string; t: string; kind: EdgeKind; d: string; stages: string[][]; optional?: boolean };

export const VIEW = { w: 1200, h: 760 };
export const CLOUDS = [
  { id: "zendesk" as Cloud, t: "Zendesk AWS Cloud", note: "Zendesk-operated", x: 16, y: 16, w: 1168, h: 196 },
  { id: "customer" as Cloud, t: "Customer AWS Cloud", note: "BYOA example · other account models exist", x: 16, y: 244, w: 1168, h: 500 },
];

export const KIND_META: Record<EdgeKind, { t: string; d: string }> = {
  auth: { t: "Authentication", d: "Sign-in and session handling" },
  controls: { t: "Controls", d: "Agent actions toward Connect" },
  context: { t: "Context", d: "Caller and profile data to the agent" },
  records: { t: "Post-call data", d: "Logs, transcripts and CTRs after the call" },
};

export const SYS_NODES: SysNode[] = [
  { id: "zcc", cloud: "zendesk", tier: "primary", x: 350, y: 60, w: 260, h: 120, t: "Zendesk Contact Center", tl: ["Zendesk", "Contact Center"], sub: "Agent Workspace", d: "Call controls run inside Zendesk Agent Workspace. The experience can read Amazon Connect Customer Profiles and custom contact attributes using the logged-in agent's credentials and permission levels.", chips: ["Call controls", "Agent permissions"] },
  { id: "ticket", cloud: "zendesk", tier: "secondary", x: 780, y: 56, w: 180, h: 56, t: "Ticket search", sub: "Caller lookup", d: "Matches the caller to a Zendesk ticket or contact using data returned by the search helper during a live call.", chips: ["Live call"] },
  { id: "status", cloud: "zendesk", tier: "secondary", x: 980, y: 56, w: 180, h: 56, t: "Agent status sync", sub: "Synced state", d: "Keeps the agent's availability aligned between Agent Workspace and Amazon Connect through the controls path.", chips: ["Availability"] },
  { id: "analysis", cloud: "zendesk", tier: "secondary", x: 780, y: 128, w: 180, h: 56, t: "Call analysis", sub: "Insight events", d: "Where configured, receives conversation-analysis events (for example Contact Lens, when enabled) forwarded by Lambda event processing.", chips: ["Contact Lens, when enabled"] },
  { id: "reporting", cloud: "zendesk", tier: "secondary", x: 980, y: 128, w: 180, h: 56, t: "Reporting", sub: "Configured analytics", d: "CTRIngestLambda forwards contact analytics. Recording/transcript writeback and usage billing are separate concerns; this conceptual view does not define billing payloads.", chips: ["Dashboards", "Verify enabled paths"] },
  { id: "lambda", cloud: "customer", tier: "primary", x: 360, y: 300, w: 240, h: 70, t: "API Gateway + Lambda", tl: ["API Gateway", "+ Lambda"], sub: "Integration helpers", d: "API Gateway and Lambda proxy agent UI requests to Connect and Customer Profiles, run caller search, and manage Cognito sessions.", chips: ["API proxy", "Caller search", "Session handling"] },
  { id: "cognito", cloud: "customer", tier: "secondary", x: 640, y: 300, w: 160, h: 70, t: "AWS Cognito", sub: "User pool", d: "Template user pool for Contact Center agent, supervisor and admin accounts, deployed by the CloudFormation template. SAML 2.0 sign-in is supported; the exact identity setup depends on the deployment.", chips: ["User pool", "SAML 2.0 capable", "Configuration-dependent"] },
  { id: "connect", cloud: "customer", tier: "primary", x: 80, y: 430, w: 220, h: 90, t: "Amazon Connect", sub: "Voice + contact flows", d: "Hosts the voice experience, contact flows and routing. One Contact Center environment links to one Connect instance.", chips: ["Voice", "Contact flows", "Routing"] },
  { id: "profiles", cloud: "customer", tier: "primary", x: 380, y: 440, w: 200, h: 90, t: "Customer Profiles", tl: ["Customer", "Profiles"], sub: "Amazon Connect", d: "Profiles and custom contact attributes are read on behalf of the logged-in agent, within that agent's permissions.", chips: ["Profiles", "Custom attributes"] },
  { id: "internal", cloud: "customer", tier: "secondary", x: 700, y: 430, w: 200, h: 80, t: "Internal systems", sub: "Data lake · CRM", d: "Data from customer systems can be accessed or updated via Lambda functions, depending on configuration.", chips: ["Optional", "Configuration-dependent"] },
  { id: "events", cloud: "customer", tier: "secondary", x: 990, y: 430, w: 160, h: 80, t: "Lambda event processing", tl: ["Lambda event", "processing"], sub: "Event ingest", d: "Ingest functions process Contact Trace Records, transcripts and recording events, then forward them to Zendesk where configured.", chips: ["CTR ingest", "Transcript ingest"] },
  { id: "direct", cloud: "customer", tier: "secondary", x: 60, y: 600, w: 260, h: 100, t: "Direct AWS services", sub: "Configured in contact flows", d: "Services such as Lex, Contact Lens or other AWS capabilities that a customer configures directly in Amazon Connect. Availability varies by configuration and region.", chips: ["Optional", "Customer-configured"] },
  { id: "logs", cloud: "customer", tier: "secondary", x: 660, y: 620, w: 140, h: 70, t: "Contact flow logs", tl: ["Contact", "flow logs"], sub: "Connect logs", d: "Contact flow logs produced by Amazon Connect in the customer's AWS account.", chips: ["Logs"] },
  { id: "transcripts", cloud: "customer", tier: "secondary", x: 820, y: 620, w: 140, h: 70, t: "Transcripts", sub: "When enabled", d: "Call and chat transcripts stored in the customer's account when transcription is enabled. With Contact Lens, PII can be redacted when configured.", chips: ["When enabled", "Redaction, if configured"] },
  { id: "ctr", cloud: "customer", tier: "secondary", x: 980, y: 620, w: 180, h: 70, t: "Contact Trace Records", tl: ["Contact Trace", "Records"], sub: "CTRs", d: "Per-contact records produced by Amazon Connect after each contact.", chips: ["CTR"] },
];

export const SYS_EDGES: SysEdge[] = [
  { id: "cognito-zcc", from: "cognito", to: "zcc", kind: "auth", label: "Agent sign-in (conceptual, configuration-dependent)", optional: true, d: "M720 300 V150 H610" },
  { id: "lambda-cognito", from: "lambda", to: "cognito", kind: "auth", label: "Session handling (conceptual)", optional: true, d: "M600 335 H640" },
  { id: "zcc-lambda", from: "zcc", to: "lambda", kind: "controls", label: "Agent requests via API Gateway", d: "M460 180 V300" },
  { id: "lambda-connect", from: "lambda", to: "connect", kind: "controls", label: "Proxied call controls", d: "M360 355 H330 V460 H300" },
  { id: "zcc-status", from: "zcc", to: "status", kind: "controls", label: "Status reflected in Workspace", d: "M610 70 H700 V36 H1070 V56" },
  { id: "connect-lambda", from: "connect", to: "lambda", kind: "context", label: "Caller search from contact flow", d: "M190 430 V320 H360" },
  { id: "lambda-internal", from: "lambda", to: "internal", kind: "context", label: "Lookup or update", optional: true, d: "M590 370 V400 H800 V430" },
  { id: "lambda-zcc", from: "lambda", to: "zcc", kind: "context", label: "Mapped attributes to agent", d: "M500 300 V180" },
  { id: "zcc-ticket", from: "zcc", to: "ticket", kind: "context", label: "Ticket or contact match", d: "M610 98 H780" },
  { id: "connect-profiles", from: "connect", to: "profiles", kind: "context", label: "Profile and attributes", d: "M300 500 H380" },
  { id: "lambda-profiles", from: "lambda", to: "profiles", kind: "context", label: "Read with agent permissions", d: "M460 370 V440" },
  { id: "profiles-lambda", from: "profiles", to: "lambda", kind: "context", label: "Permitted profile data", d: "M520 440 V370" },
  { id: "connect-direct", from: "connect", to: "direct", kind: "context", label: "Configured AWS services", optional: true, d: "M190 520 V600" },
  { id: "connect-logs", from: "connect", to: "logs", kind: "records", label: "Flow logs", d: "M250 520 V565 H730 V620" },
  { id: "connect-transcripts", from: "connect", to: "transcripts", kind: "records", label: "Transcripts, when enabled", optional: true, d: "M250 520 V565 H890 V620" },
  { id: "connect-ctr", from: "connect", to: "ctr", kind: "records", label: "Contact Trace Records", d: "M250 520 V565 H1040 V620" },
  { id: "logs-events", from: "logs", to: "events", kind: "records", label: "Log events", d: "M730 690 V720 H1170 V470 H1150" },
  { id: "transcripts-events", from: "transcripts", to: "events", kind: "records", label: "New transcript file", optional: true, d: "M900 620 V590 H1060 V510" },
  { id: "ctr-events", from: "ctr", to: "events", kind: "records", label: "CTR stream", d: "M1100 620 V510" },
  { id: "events-reporting", from: "events", to: "reporting", kind: "records", label: "Reporting + usage data, where configured", d: "M1070 430 V184" },
  { id: "events-analysis", from: "events", to: "analysis", kind: "records", label: "Analysis events, when enabled", optional: true, d: "M1030 430 V400 H870 V184" },
];

export const SYS_FLOWS: SysFlow[] = [
  { id: "auth", t: "Agent sign-in", kind: "auth", optional: true, d: "Conceptual: the template deploys a Cognito user pool for Contact Center accounts and supports SAML 2.0 sign-in. The actual identity configuration varies by deployment and is not universal.", stages: [["cognito-zcc"], ["lambda-cognito"]] },
  { id: "controls", t: "Agent controls", kind: "controls", d: "Agent actions in Workspace are proxied through API Gateway and Lambda to Amazon Connect, and status stays in sync.", stages: [["zcc-lambda"], ["lambda-connect"], ["zcc-status"]] },
  { id: "context", t: "Customer context", kind: "context", d: "During the live call, the contact flow triggers caller search; Lambda may consult internal systems, then mapped attributes reach the agent.", stages: [["connect-lambda"], ["lambda-internal"], ["lambda-zcc"], ["zcc-ticket"]] },
  { id: "profiles", t: "Customer Profiles", kind: "context", d: "Profiles and custom attributes are read through the Lambda proxy using the logged-in agent's permissions.", stages: [["connect-profiles"], ["zcc-lambda"], ["lambda-profiles"], ["profiles-lambda"], ["lambda-zcc"]] },
  { id: "records", t: "Post-call records", kind: "records", d: "Conceptually groups configured post-call paths. Current stacks use separate recording/transcript ingest functions and CTR analytics. Flow logs are not automatically the same as Zendesk reporting or usage-billing data.", stages: [["connect-logs", "connect-transcripts", "connect-ctr"], ["logs-events", "transcripts-events", "ctr-events"], ["events-reporting", "events-analysis"]] },
  { id: "direct", t: "Direct AWS services", kind: "context", optional: true, d: "Contact flows can call AWS services the customer configures directly in Amazon Connect. Not a Zendesk integration.", stages: [["connect-direct"]] },
];

export const STAGE_MS = 1500;
export const nodeById = (id: string) => SYS_NODES.find((n) => n.id === id);
export const edgeById = (id: string) => SYS_EDGES.find((e) => e.id === id);
export const flowById = (id: string) => SYS_FLOWS.find((f) => f.id === id);
export const edgesForNode = (id: string) => SYS_EDGES.filter((e) => e.from === id || e.to === id);
export const flowsForNode = (id: string) => SYS_FLOWS.filter((f) => f.stages.flat().some((eid) => { const e = edgeById(eid)!; return e.from === id || e.to === id; }));
export const flowNodes = (f: SysFlow) => { const out: string[] = []; f.stages.flat().forEach((eid) => { const e = edgeById(eid)!; [e.from, e.to].forEach((n) => { if (!out.includes(n)) out.push(n); }); }); return out; };

/** Ordered list of stages for a mode: one flow, or all flows (overview tour). */
export function timeline(flowId: string | null) {
  const flows = flowId ? [flowById(flowId)!] : SYS_FLOWS;
  return flows.flatMap((f) => f.stages.map((edges, i) => ({ flow: f.id, stage: i, edges })));
}
export function timelineMs(flowId: string | null) { return timeline(flowId).length * STAGE_MS; }
/** Position at elapsed ms (wraps). progress is 0..1 within the stage. */
export function stepAt(flowId: string | null, ms: number) {
  const tl = timeline(flowId);
  const total = tl.length * STAGE_MS;
  const m = ((ms % total) + total) % total;
  const idx = Math.min(tl.length - 1, Math.floor(m / STAGE_MS));
  return { ...tl[idx], index: idx, count: tl.length, progress: (m - idx * STAGE_MS) / STAGE_MS };
}
/** Integrity checks for tests: every edge endpoint exists, every node and edge is used by a flow. */
export function validateGraph() {
  const errors: string[] = [];
  SYS_EDGES.forEach((e) => { if (!nodeById(e.from) || !nodeById(e.to)) errors.push(`edge ${e.id} has missing endpoint`); });
  const used = new Set(SYS_FLOWS.flatMap((f) => f.stages.flat()));
  used.forEach((id) => { if (!edgeById(id)) errors.push(`flow references unknown edge ${id}`); });
  SYS_EDGES.forEach((e) => { if (!used.has(e.id)) errors.push(`edge ${e.id} not in any flow`); });
  SYS_NODES.forEach((n) => { if (!SYS_EDGES.some((e) => used.has(e.id) && (e.from === n.id || e.to === n.id))) errors.push(`node ${n.id} not connected by an animated flow`); });
  return errors;
}

/** Elapsed ms for a given step index and in-stage progress (used by manual Step). */
export const elapsedFor = (index: number, progress: number) => (index + progress) * STAGE_MS;
