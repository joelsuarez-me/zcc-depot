import type { Row, SimDef, SimScenario, SimStep, Tone } from "./types";

type V = { id: string; label: string; summary: string; ani: string; match: string; matchTone: Tone; account: Row[]; prompt: string; api: [string, Tone]; apiLatency: string; queue: string; queueWhy: string; agent: string; context: Row[]; outcome: [string, Tone] };

const CASES: V[] = [
  { id: "verified", label: "Verified caller", summary: "ANI matches a profile and the caller passes the simulated verification check.",
    ani: "+1 (555) 010-4471", match: "1 unverified profile candidate", matchTone: "info",
    account: [["Candidate", "Withheld until verified"], ["Verification method", "Configured one-time code (simulated)"]],
    prompt: "Complete the one-time verification check through your approved channel.", api: ["Verified", "ok"], apiLatency: "412 ms",
    queue: "Orders - Verified", queueWhy: "Verification attribute = verified", agent: "Priya N. (Orders)",
    context: [["Identity", "Verified by simulated API", "ok"], ["Customer", "Mara Okafor"], ["Account", "HP-20418"], ["Open tickets", "#48211 Return label"]], outcome: ["Verified context shown", "ok"] },
  { id: "failed", label: "Failed verification", summary: "ANI suggests a profile but the caller fails verification. No account details are exposed.",
    ani: "+1 (555) 010-4471", match: "1 profile candidate (not confirmed)", matchTone: "warn",
    account: [["Candidate", "Withheld until verified", "muted"], ["Account", "Withheld", "muted"]],
    prompt: "Complete the one-time verification check through your approved channel.", api: ["Not verified (2 attempts)", "bad"], apiLatency: "388 ms",
    queue: "Identity Assistance", queueWhy: "Verification attribute = failed", agent: "Dev R. (Identity team)",
    context: [["Identity", "Not verified", "bad"], ["Customer", "Hidden - no PII exposed", "muted"], ["Guidance", "Follow manual verification policy"]], outcome: ["Restricted context", "bad"] },
  { id: "vip", label: "VIP customer", summary: "Verified caller whose account carries a priority segment, changing queue priority.",
    ani: "+1 (555) 010-9932", match: "1 unverified profile candidate", matchTone: "info",
    account: [["Candidate", "Withheld until verified"], ["Priority policy", "Apply only after verification", "info"]],
    prompt: "Complete the one-time verification check through your approved channel.", api: ["Verified", "ok"], apiLatency: "455 ms",
    queue: "Priority Care", queueWhy: "verified + segment = priority; queue priority raised in flow", agent: "Ana M. (Priority Care)",
    context: [["Identity", "Verified by simulated API", "ok"], ["Customer", "Theo Lindqvist"], ["Segment", "Priority (sample tag)", "info"], ["Handling note", "Named-team routing configured in Connect"]], outcome: ["Priority route", "ok"] },
  { id: "unknown", label: "Unknown caller", summary: "No ANI match. The flow offers an alternative identifier and routes as unverified.",
    ani: "+1 (555) 017-2208", match: "No profile match", matchTone: "warn",
    account: [["Candidate", "None"], ["Fallback", "Ask for order number"]],
    prompt: "Please say or enter your order number.", api: ["No matching record", "warn"], apiLatency: "301 ms",
    queue: "General Support - Unverified", queueWhy: "No identity established", agent: "Sam K. (General)",
    context: [["Identity", "Unknown caller", "warn"], ["Customer", "New requester created on ticket"], ["Guidance", "Collect details; no account data available"]], outcome: ["Unverified context", "warn"] },
  { id: "timeout", label: "API timeout", summary: "The verification service does not answer in time. The flow never assumes success.",
    ani: "+1 (555) 010-4471", match: "1 profile candidate (not confirmed)", matchTone: "info",
    account: [["Candidate", "Withheld until verified", "muted"], ["Account", "Withheld", "muted"]],
    prompt: "Complete the one-time verification check through your approved channel.", api: ["Timed out - treated as unverified", "bad"], apiLatency: "3,000 ms timeout",
    queue: "Identity Assistance", queueWhy: "Error branch: verification status = unavailable", agent: "Dev R. (Identity team)",
    context: [["Identity", "Unavailable (service timeout)", "bad"], ["Customer", "Hidden - no PII exposed", "muted"], ["Guidance", "Verify manually; incident flag sent to ops"]], outcome: ["Fail-safe route", "bad"] },
];

function build(v: V): SimScenario {
  const call: Row[] = [["Caller ANI", v.ani], ["Dialed", "+1 (555) 010-0100 Support"], ["Contact ID", "sim-7f3a-01"]];
  const s: SimStep[] = [
    { stage: 0, caption: "A fictional caller dials the support number.", panels: [{ title: "Inbound call", rows: call }], log: "00:00.0 Call arrives on claimed number", status: { label: "Ringing", tone: "info" } },
    { stage: 1, caption: "Amazon Connect answers and starts the configured contact flow.", panels: [{ title: "Inbound call", rows: call }, { title: "Contact flow", rows: [["Flow", "Inbound - Identify (sample)"], ["Language", "en-US"]] }], log: "00:00.4 Contact flow started", status: { label: "In flow", tone: "info" } },
    { stage: 2, caption: "ANI is used to look for a likely profile. Recognising a number is not authentication.", panels: [{ title: "ANI recognition", rows: [["Lookup key", v.ani], ["Result", v.match, v.matchTone], ["Authentication", "Not yet - number can be spoofed or shared", "warn"]] }], log: "00:01.1 ANI recognition: " + v.match },
    { stage: 3, caption: "A Lambda lookup returns only what the flow needs to choose a verification method.", panels: [{ title: "Account lookup", rows: v.account }], log: "00:01.6 Account lookup returned" },
    { stage: 4, caption: "The caller is asked to verify.", panels: [{ title: "Verification prompt", rows: [["Prompt", v.prompt], ["Input", "DTMF (masked)", "muted"]] }], say: { who: "IVR", text: v.prompt }, log: "00:04.2 Verification prompt played" },
    { stage: 5, caption: "A simulated verification API responds.", panels: [{ title: "Simulated API result", rows: [["Status", v.api[0], v.api[1]], ["Latency", v.apiLatency]] }], log: "00:07.9 Verification API: " + v.api[0], status: { label: v.api[0], tone: v.api[1] } },
    { stage: 6, caption: "The flow routes on the verification attribute.", panels: [{ title: "Routing decision", rows: [["Queue", v.queue], ["Reason", v.queueWhy]] }], log: "00:08.3 Routed to " + v.queue },
    { stage: 7, caption: "An available agent accepts the call.", panels: [{ title: "Agent", rows: [["Assigned", v.agent], ["Queue", v.queue]] }], log: "00:21.0 Agent accepted" },
    { stage: 8, caption: "The Zendesk workspace shows context appropriate to the verification result.", panels: [{ title: "Workspace context", rows: v.context, note: "Context fields are illustrative mappings configured per deployment." }], log: "00:21.4 Workspace context displayed", status: { label: v.outcome[0], tone: v.outcome[1] } },
  ];
  return { id: v.id, label: v.label, summary: v.summary, steps: s };
}

export const verificationSim: SimDef = {
  title: "Customer Authentication & Verification",
  stages: ["Inbound", "Connect", "ANI match", "Lookup", "Prompt", "Verify API", "Routing", "Agent", "Workspace"],
  scenarioLabel: "Caller scenario",
  scenarios: CASES.map(build),
  boundary: ["This illustrates a customer-managed AWS deployment. The verification service is a separate customer-controlled API, not a native OTP entitlement.", "Workspace context depends on configured attribute mapping into Zendesk.", "ANI recognition is a hint, never proof of identity. Priority status never bypasses verification."],
};
