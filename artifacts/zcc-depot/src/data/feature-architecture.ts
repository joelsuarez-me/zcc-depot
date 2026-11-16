import type { FeatureArchitecture } from "./feature-types";

type Node = FeatureArchitecture["nodes"][number];
export const ARCHITECTURE_NODES = {
  customer: { id: "customer", label: "Customer", detail: "Fictional caller or supported digital-channel participant. Caller ID is a recognition signal, not proof of identity.", boundary: "Customer" },
  connect: { id: "connect", label: "Amazon Connect", detail: "Configured voice entry, contact flows, queues and routing. AWS service capabilities do not automatically establish Zendesk product entitlement.", boundary: "AWS" },
  lex: { id: "lex", label: "Amazon Lex", detail: "Separately configured AWS conversational intent and slot collection. This is not a claim of native Zendesk Voice AI availability.", boundary: "AWS" },
  queue: { id: "queue", label: "Queue & routing", detail: "Eligibility follows configured queues, routing profiles, capacity and skill rules. No rule guarantees a particular wait time.", boundary: "AWS" },
  lambda: { id: "lambda", label: "AWS Lambda", detail: "A scoped integration function validates inputs, applies timeouts and invokes approved APIs. Custom credentials remain server-side in a real deployment.", boundary: "AWS" },
  external: { id: "external", label: "External API / CRM", detail: "Customer-owned or third-party system. API rights, authentication, consent, data contracts and rate limits require separate implementation.", boundary: "External" },
  verify: { id: "verify", label: "Verification service", detail: "An illustrative customer-controlled identity check. ANI recognition and agent Cognito sign-in do not authenticate the caller.", boundary: "External" },
  zcc: { id: "zcc", label: "Zendesk Contact Center", detail: "Documented integration and call controls. Confirm the chosen account-ownership model, enabled features and permission scope.", boundary: "Zendesk" },
  workspace: { id: "workspace", label: "Agent Workspace", detail: "The Zendesk agent's ticket and supported call context. Custom fields and third-party screen pops depend on configured mappings.", boundary: "Zendesk" },
  cognito: { id: "cognito", label: "Cognito / SSO", detail: "Agent identity and access control in the integration. This is distinct from customer verification during an inbound call.", boundary: "AWS" },
  agentIdentity: { id: "agentIdentity", label: "Agent identity", detail: "An authorized agent signs in through the approved identity provider. This access path is separate from the caller's contact flow.", boundary: "Customer" },
  lens: { id: "lens", label: "Contact Lens", detail: "AWS conversation analytics, transcription and configured redaction. Language, region, permissions and recording setup matter.", boundary: "AWS" },
  record: { id: "record", label: "Recordings / events", detail: "Configured S3, Kinesis and event processing. Recording notice, access, retention and writeback must be explicitly designed.", boundary: "AWS" },
  copilot: { id: "copilot", label: "Zendesk Copilot", detail: "Licensed Zendesk assistance using configured live transcripts and help-center content. An agent reviews suggestions; no autonomous external action is implied.", boundary: "Zendesk" },
  wfm: { id: "wfm", label: "Zendesk WFM", detail: "Separately entitled workforce product. Data ingestion and activity coverage must be confirmed for the selected Contact Center deployment.", boundary: "Zendesk" },
  qa: { id: "qa", label: "Zendesk QA", detail: "Separately entitled quality product. Configured post-call review is not the same as Contact Lens real-time analytics.", boundary: "Zendesk" },
  fallback: { id: "fallback", label: "Configured fallback", detail: "An application-level alternate route, queue or message. Regional disaster recovery requires a separately supported, tested architecture.", boundary: "AWS" },
  observe: { id: "observe", label: "Reporting & audit", detail: "Configured telemetry and permitted data mappings. Sample metrics are illustrative, not an SLA or promised business result.", boundary: "Zendesk" },
  phone: { id: "phone", label: "Phone number", detail: "A claimed or ported number associated with the correct Connect flow; country requirements and outbound permissions apply.", boundary: "AWS" },
  carrier: { id: "carrier", label: "Carrier network", detail: "Intermediate and receiving carriers determine how they use and preserve STIR/SHAKEN information.", boundary: "External" },
  recipient: { id: "recipient", label: "Recipient", detail: "The destination carrier applies its own call handling and filtering decisions.", boundary: "External" },
  interface: { id: "interface", label: "Connect interface / API", detail: "Browser, CCP, supervisor tools, configured APIs and customer-facing chat entry points.", boundary: "AWS" },
  contactFlow: { id: "contactFlow", label: "Flow / IVR", detail: "A configured flow collects input, invokes integrations and routes the contact.", boundary: "AWS" },
  workstation: { id: "workstation", label: "Agent workstation", detail: "Customer-managed endpoint, headset, operating system, browser, network and workspace conditions.", boundary: "Customer" },
  metrics: { id: "metrics", label: "Metrics & reporting", detail: "Configured collection, storage, monitoring, alerting and visualization for real-time and historical data.", boundary: "AWS" },
  input: { id: "input", label: "Protected DTMF input", detail: "Configured collection and encryption. Handle the literal Timeout value explicitly; encryption alone is not PCI compliance.", boundary: "AWS" },
} satisfies Record<string, Node>;
export type ArchitectureNodeId = keyof typeof ARCHITECTURE_NODES;
export function buildFeatureArchitecture(path: ArchitectureNodeId[], extraNotes: string[] = []): FeatureArchitecture {
  const hasIdentity = path.includes("cognito");
  const hasWorkforceAndQa = path.includes("wfm") && path.includes("qa");
  // Authentication and the two workforce products are separate branches,
  // not serial stages traversed by the caller or dependencies on each other.
  const flow = path.filter((id) => id !== "cognito" && !(hasWorkforceAndQa && id === "qa"));
  const ids = [...new Set<ArchitectureNodeId>([
    ...path, ...(hasIdentity ? ["agentIdentity" as const] : []),
    ...(hasWorkforceAndQa ? ["workspace" as const] : []),
  ])];
  const edges: FeatureArchitecture["edges"] = flow.slice(1).map((id, i) => ({
    from: flow[i], to: id,
    label: id === "lambda" ? "Scoped invocation" : id === "external" || id === "verify" ? "Authenticated API" : id === "workspace" ? "Permitted context" : "Configured flow",
    conditional: ["external", "verify", "fallback", "wfm", "qa", "copilot"].includes(id),
  }));
  if (hasIdentity) edges.push(
    { from: "agentIdentity", to: "cognito", label: "Agent sign-in" },
    { from: "cognito", to: path.includes("workspace") ? "workspace" : path.includes("zcc") ? "zcc" : "connect", label: "Permitted agent access" },
  );
  if (hasWorkforceAndQa) edges.push(
    { from: "record", to: "workspace", label: "Configured recording writeback", conditional: true },
    { from: "workspace", to: "qa", label: "QA help desk connection", conditional: true },
    { from: "qa", to: "observe", label: "Quality insights", conditional: true },
  );
  return {
    nodes: ids.map((id) => ({ ...ARCHITECTURE_NODES[id] })),
    edges,
    notes: [
      "Conceptual data / event sequence, not a network topology. Dashed connections require additional integration or configuration.",
      "The Customer, AWS, Zendesk and External labels identify responsibility boundaries, not a guarantee of data location. Managed and customer-managed AWS deployments differ.",
      ...extraNotes,
    ],
  };
}
