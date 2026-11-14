import type { DialMode } from "@/lib/outbound-dialer";
import { INDUSTRY_CASES } from "@/data/outbound-industry-cases";
export const REVIEW_DATE = "2026-11-13";
export const OUTBOUND_ROOM_IDS = ["outbound-predictive", "outbound-progressive", "outbound-preview", "outbound-agentless", "outbound-campaigns", "outbound-compliance", "outbound-multichannel", "outbound-analytics"] as const;
export type OutboundRoomId = (typeof OUTBOUND_ROOM_IDS)[number];
const A = "https://docs.aws.amazon.com/connect/latest/adminguide/";
export const DOCS = {
  enable: { label: "Enable outbound campaigns", url: `${A}enable-outbound-campaigns.html` },
  best: { label: "Outbound campaign best practices", url: `${A}outbound-campaign-best-practices.html` },
  create: { label: "Create an outbound campaign", url: `${A}create-outbound-campaign.html` },
  guided: { label: "Guided campaign builder", url: `${A}guided-campaign-builder.html` },
  journey: { label: "Multi-step and multichannel journeys", url: `${A}create-a-multi-step-and-multi-channel-journey.html` },
  dashboard: { label: "Outbound campaigns performance dashboard", url: `${A}outbound-campaigns-performance-dashboard.html` },
  metrics: { label: "Outbound campaign metrics", url: `${A}outbound-campaign-metrics.html` },
  editing: { label: "Editing outbound campaigns", url: `${A}editing-outbound-campaign.html` },
  history: { label: "Administrator Guide document history", url: `${A}doc-history.html` },
  send: { label: "Send communication flow block", url: `${A}journey-flow-block-send-communication.html` },
  ccp: { label: "Check call progress flow block", url: `${A}check-call-progress.html` },
  regions: { label: "Region availability", url: `${A}regions.html#campaigns_region` },
  legacy: { label: "Legacy Pinpoint-based campaigns (historical)", url: `${A}campaign-best-practices.html` },
  pinpoint: { label: "Amazon Pinpoint end of support", url: "https://docs.aws.amazon.com/pinpoint/latest/userguide/welcome.html" },
  preview: { label: "Preview dialing · AWS feature announcement", url: "https://aws.amazon.com/about-aws/whats-new/2025/10/amazon-connect-outbound-campaigns-preview-dialing/" },
  lake: { label: "Outbound campaign data in the analytics data lake", url: `${A}data-lake-outbound-campaigns-data.html` },
  ftc: { label: "FTC · Complying with the Telemarketing Sales Rule", url: "https://www.ftc.gov/business-guidance/resources/complying-telemarketing-sales-rule" },
  fcc: { label: "FCC · Unwanted communications", url: "https://www.fcc.gov/enforcement/areas/unwanted-communications" },
} as const;
export type DocKey = keyof typeof DOCS;

export interface ModeInfo { id: DialMode; name: string; room: OutboundRoomId; scenario: string; company: string; nodes: string[]; tech: string; outcome: string; accent: string; doc: DocKey }
export const MODES: ModeInfo[] = [
  { id: "predictive", name: "Predictive", room: "outbound-predictive", company: "Harborline Financial", scenario: "Thousands of account-servicing calls with a fully staffed team.", nodes: ["Customer segment", "Campaign engine", "Predictive pacing", "Outbound calls", "Answer detection", "Agent queue", "Abandon risk", "Connected"], tech: "Anticipates agent availability and dials ahead of it using a service-managed algorithm. Capacity 1–100% of the campaign's concurrent-call share. Pair with Check call progress, and keep the path from classification to Transfer to queue short.", outcome: "Potential goal: more talk time per agent hour on large lists, balanced against answered-and-waiting risk.", accent: "#D1F470", doc: "best" },
  { id: "progressive", name: "Progressive", room: "outbound-progressive", company: "Meridian Mutual Insurance", scenario: "Policy renewals: one dial when an agent is ready.", nodes: ["Available agent", "Select contact", "Initiate call", "Detect answer", "Connect agent", "Complete call", "Next contact"], tech: "Dials after an agent is available and prior work completes. Agent allocation (1–200%) is a relative weight; this lab maps it to illustrative lines per agent. Campaigns sharing agents can collide; a strict 1:1 needs an exclusive voice-only routing profile and queue with no inbound traffic.", outcome: "Potential goal: lower over-dial risk and predictable pacing; idle time is the trade-off.", accent: "#8EC5C9", doc: "best" },
  { id: "preview", name: "Preview", room: "outbound-preview", company: "Clearwater Health Network", scenario: "Care coordinators review a patient before dialing.", nodes: ["Campaign contact", "Preview workspace", "Profile review", "Agent decision", "Dial customer", "Conversation", "Disposition"], tech: "The agent receives the contact first, reviews within a timer, then dials or removes it where supported. Disable call classification; Check call progress is not supported. Requires Transfer to queue; agent whisper is not supported (outbound whisper can play to the intended agent).", outcome: "Potential goal: personal, context-rich conversations at lower throughput.", accent: "#F3C98B", doc: "guided" },
  { id: "agentless", name: "Agentless", room: "outbound-agentless", company: "Northgate Power & Water", scenario: "Scheduled maintenance notifications to every affected household.", nodes: ["Customer segment", "Agentless campaign", "Automated dialing", "Answer detection", "Message / IVR", "Customer response", "Completed"], tech: "No agent is needed for the automated interaction: the flow plays prompts, collects input and can optionally Transfer to queue, which then needs a staffed queue.", outcome: "Potential goal: broad reach without agent load for the automated part; self-service captures responses.", accent: "#E9A6A0", doc: "best" },
];
export const COMPARE_DIMS = ["How dialing begins", "Agent involvement", "Customer preview", "Pacing behavior", "Typical use cases", "Operational considerations", "Compliance considerations", "Customer experience", "Technical prerequisites", "Reporting considerations"] as const;
export const COMPARE: Record<DialMode, string[]> = {
  predictive: ["Ahead of forecast agent availability", "Agent connected after a human answer", "None", "Service-managed forecast; capacity 1–100%", "Account servicing, high-volume collections, sales", "Watch abandonment and post-answer latency", "Abandonment and automated-dialing consent review", "Fast connection when tuned; waiting if over-dialed", "Concurrent-call quota, queue, routing profile, flow, caller ID, CCP", "Abandonment, wait after connection, dials per minute"],
  progressive: ["When an agent becomes available", "Dial reserved to available capacity", "None", "Allocation 1–200% per available agent", "Renewals, callbacks, retention", "Shared agent pools can collide", "Consent and calling windows still apply", "Agent ready when customer answers", "Queue, routing profile, flow, caller ID", "Connected and human answered rates"],
  preview: ["Agent reviews then dials", "Agent drives every dial", "Full profile and history", "Agent-paced with review timer", "Healthcare, high-value, sensitive", "Lower throughput; timer tuning", "Context reduces wrong-party contact; still validate consent", "Most personal", "Classification disabled; Transfer to queue; no agent whisper", "Review-to-dial time, dispositions"],
  agentless: ["Campaign dials automatically", "None unless flow transfers", "None", "Capacity of concurrent quota", "Notifications, reminders, surveys", "Message length drives line occupancy", "Prerecorded voice rules; consent review", "Instant, self-service", "Flow with prompts/input; optional staffed queue", "Automated completions, not agent connections"],
};

export interface Industry { id: string; name: string; uses: string[]; objective: string; mode: DialMode; segment: string; compliance: string; journey: string[]; outcome: string; config: string[] }
export const INDUSTRIES: Industry[] = [
  ["fin", "Financial Services"], ["hc", "Healthcare"], ["ins", "Insurance"], ["travel", "Travel"],
  ["util", "Utilities"], ["tel", "Telecommunications"], ["retail", "Retail"],
].map(([id, name]) => ({ ...INDUSTRY_CASES[id][0], id, name, uses: INDUSTRY_CASES[id].map((c) => c.name) }));

export interface Svc { id: string; name: string; role: string; kind: "connect" | "messaging" | "data" | "retired" }
export const SERVICES: Svc[] = [
  { id: "connect", name: "Amazon Connect Customer", role: "Contact center instance: flows, queues, agents, caller ID and campaign execution.", kind: "connect" },
  { id: "profiles", name: "Customer Profiles", role: "Unified profiles and segments that feed campaigns; time zone inference uses profile phones and addresses.", kind: "connect" },
  { id: "campaigns", name: "Outbound Campaigns", role: "Orchestration: guided builder for single channel, journey builder for multi-step multichannel with branches and fallback.", kind: "connect" },
  { id: "eum", name: "AWS End User Messaging", role: "SMS and voice messaging delivery: origination identities, registrations, opt-out lists.", kind: "messaging" },
  { id: "social", name: "AWS End User Messaging Social", role: "WhatsApp Business delivery used by campaign WhatsApp sends.", kind: "messaging" },
  { id: "email", name: "Email delivery", role: "Instance email enabled in Amazon Connect with verified domains and templates.", kind: "messaging" },
  { id: "templates", name: "Message templates", role: "Per-channel templates with personalization attributes.", kind: "messaging" },
  { id: "events", name: "Delivery events", role: "Send, delivery and failure outcomes used for branching and reporting.", kind: "data" },
  { id: "reporting", name: "Campaign reporting", role: "Performance dashboard, campaign metrics and GetMetricDataV2 where supported.", kind: "data" },
  { id: "pinpoint", name: "Amazon Pinpoint campaigns & journeys", role: "Support ended October 30, 2026. Not a recommended architecture. SMS, voice, push, OTP and phone-validation APIs continue under AWS End User Messaging.", kind: "retired" },
];

export const ZD_STEPS = [
  { t: "Customer enters an eligible campaign segment", k: "native" },
  { t: "Amazon Connect selects the contact for preview dialing", k: "native" },
  { t: "The agent receives customer context", k: "configured" },
  { t: "The agent reviews the customer profile", k: "conceptual" },
  { t: "The agent initiates the outbound call", k: "configured" },
  { t: "The customer answers", k: "native" },
  { t: "The agent completes the conversation", k: "configured" },
  { t: "The outcome is recorded", k: "custom" },
  { t: "Zendesk context or ticket updated where configured", k: "custom" },
] as const;
export const ZD_KIND: Record<string, string> = { native: "Amazon Connect native behavior", configured: "Configuration-dependent conceptual pattern", custom: "Custom API or app extension", conceptual: "Conceptual demonstration" };

export interface RNode { id: string; label: string; col: number; row: number; native: boolean; detail: string; doc?: DocKey }
export const REPORT_NODES: RNode[] = [
  { id: "camp", label: "Outbound campaigns", col: 0, row: 1, native: true, detail: "Voice, SMS, email, WhatsApp and web notification campaigns emit events and contact records.", doc: "create" },
  { id: "events", label: "Campaign events", col: 1, row: 0, native: true, detail: "Send attempts, exclusions, delivery outcomes per channel.", doc: "metrics" },
  { id: "ctr", label: "Contact records", col: 1, row: 2, native: true, detail: "Voice contacts with campaign attributes and outcomes.", doc: "metrics" },
  { id: "dash", label: "Performance dashboard", col: 2, row: 0, native: true, detail: "Overview, progress over time, campaign comparison, classification, recipients, exclusions, metrics table.", doc: "dashboard" },
  { id: "api", label: "GetMetricDataV2", col: 2, row: 1, native: true, detail: "Programmatic campaign metrics where the metric is listed as supported.", doc: "metrics" },
  { id: "lake", label: "Data lake (where supported)", col: 2, row: 2, native: true, detail: "Analytics data lake sharing where enabled in your Region.", doc: "lake" },
  { id: "etl", label: "Custom ETL / Athena", col: 3, row: 2, native: false, detail: "Custom: Glue/Athena or your warehouse joins with CRM outcomes." },
  { id: "bi", label: "BI dashboards", col: 3, row: 1, native: false, detail: "Custom: QuickSight or third-party BI over exported data." },
  { id: "zd", label: "Zendesk Explore context", col: 3, row: 0, native: false, detail: "Custom: only if your integration writes campaign fields to tickets." },
];
export const REPORT_EDGES: [string, string][] = [["camp", "events"], ["camp", "ctr"], ["events", "dash"], ["events", "api"], ["ctr", "api"], ["ctr", "lake"], ["lake", "etl"], ["etl", "bi"], ["api", "bi"], ["dash", "zd"]];

export interface PreviewContact { name: string; phone: string; age: number; plan: string; reason: string; history: string[]; interactions: string[]; account: string; notes: string; language: string }
export const PREVIEW_CONTACTS: PreviewContact[] = [
  { name: "Harriet Osei", phone: "+1 (617) 555-0142", age: 68, plan: "Medicare Advantage · Silver", reason: "Post-discharge follow-up (cardiology)", history: ["Discharged Nov 9", "Missed pharmacy pickup Nov 11"], interactions: ["Portal message Nov 10 · read", "IVR reminder Nov 12 · confirmed"], account: "MRN 44-1082 · PCP Dr. Lund", notes: "Prefers mornings; daughter is care proxy.", language: "English" },
  { name: "Tomás Echeverría", phone: "+1 (305) 555-0119", age: 54, plan: "PPO · Gold", reason: "Preventive screening overdue", history: ["Last screening 2023", "Annual visit Mar 2026"], interactions: ["Email Oct 30 · opened"], account: "MRN 51-7730", notes: "Spanish-speaking coordinator preferred.", language: "Spanish" },
  { name: "Grace Whitlock", phone: "+1 (503) 555-0165", age: 71, plan: "Medicare Supplement", reason: "Care plan coordination after fall", history: ["ED visit Nov 3", "PT referral pending"], interactions: ["Callback request Nov 6"], account: "MRN 38-2214", notes: "Hard of hearing; speak slowly.", language: "English" },
  { name: "Idris Haddad", phone: "+1 (312) 555-0164", age: 46, plan: "HMO · Bronze", reason: "Medication adherence check", history: ["Refill gap 12 days"], interactions: ["SMS Nov 1 · replied STOP"], account: "MRN 60-0931", notes: "Check consent status before dialing.", language: "English" },
];
