/** Fictional operational model. Times are seconds from BASE_TIME, never wall-clock timers. */
export const BASE_TIME = Date.UTC(2026, 10, 13, 14);
export const QUEUES = ["General Support", "Technical Support", "Billing", "VIP Support", "Sales", "Spanish Support"] as const;
export type Queue = typeof QUEUES[number];
export const SCENARIOS = [
  { id: "normal", name: "Normal operations", detail: "A reproducible staffed baseline." },
  { id: "spike", name: "Sudden call volume spike", detail: "A 300% increase: four times baseline arrivals." },
  { id: "shortage", name: "Agent staffing shortage", detail: "Six agents leave eligible capacity; active calls finish first." },
  { id: "vip", name: "VIP queue overload", detail: "Additional high-priority arrivals compete for eligible agents." },
  { id: "incident", name: "Technical support incident", detail: "A service disruption generates extra Technical Support demand." },
  { id: "acw", name: "Extended after contact work", detail: "ACW increases fourfold and reduces throughput." },
  { id: "overflow", name: "Queue overflow & recovery", detail: "General Support fills; only a configured overflow path can move contacts." },
] as const;
export type Scenario = typeof SCENARIOS[number]["id"];
export const STATES = ["Available", "On Contact", "After Contact Work", "Break", "Lunch", "Offline", "Custom Status"] as const;
export type AgentState = typeof STATES[number];
export type Channel = "Voice" | "Chat" | "Task";
export type ContactStatus = "Incoming" | "IVR" | "Waiting" | "Connected" | "After Contact Work" | "Completed" | "Abandoned" | "Callback";
export type TimelineEntry = { at: number; text: string };
export type Agent = {
  id: string; name: string; team: string; profile: string; queues: Queue[];
  state: AgentState; since: number; channel: Channel; contacts: string[];
  enabled: boolean; retiring: boolean; returnAt?: number; shortage?: boolean; skills: Queue[]; handoffAcwUntil?: number;
  availableSeconds: number; contactSeconds: number; acwSeconds: number;
  transitions: (TimelineEntry & { state: AgentState })[];
};
export type Leg = { queue: Queue; enqueue: number; exit?: number; reason?: "Answered" | "Abandoned" | "Callback" | "Overflow"; agent?: string; team?: string; profile?: string; disconnect?: number; completed?: number; talk?: number; hold?: number; acw?: number };
export type Contact = {
  id: string; channel: Channel; intent: string; queue: Queue; status: ContactStatus;
  arrived: number; since: number; legs: Leg[]; agent?: string;
  answer?: number; disconnect?: number; completed?: number; talk: number; acw: number; hold: number;
  handlingSeconds: number; acwSeconds: number; patience: number;
  disposition?: string; followUp?: string; ticket: string; team?: string; profile?: string;
  timeline: TimelineEntry[];
};
export type SimConfig = { arrivalRate: number; agents: number; talk: number; acw: number; breakSeconds: number; concurrency: number; slThreshold: number; slTarget: number };
export type AlertMetric = "waiting" | "serviceLevel" | "oldest" | "available" | "abandonment" | "acw" | "volume" | "overflow" | "integration" | "incident";
export type AlertRule = { id: string; name: string; metric: AlertMetric; threshold: number; interval: number; severity: "Warning" | "Critical"; notification: "Inline" | "Email concept" | "EventBridge concept"; destination: string; enabled: boolean };
export type Alert = { id: string; ruleId: string; name: string; metric: AlertMetric; value: number; threshold: number; severity: "Warning" | "Critical"; state: "Warning" | "Critical" | "Acknowledged" | "Resolved"; since: number; updated: number; destination: string; notification: string; history: TimelineEntry[] };
export type Metrics = {
  offered: number; handled: number; abandoned: number; waiting: number;
  serviceLevel: number | null; answeredServiceLevel: number | null; asa: number | null;
  aht: number | null; oldest: number; available: number; busy: number; acw: number;
  occupancy: number | null; abandonment: number | null; queued: number; within: number;
  over: number; callbacks: number; active: number;
};
export type Filter = { from?: number; to?: number; queue?: Queue; agent?: string; team?: string; profile?: string; channel?: Channel };
export const ACTIONS = [
  { id: "reassign", name: "Reassign agent capacity", boundary: "Simulated routing-profile administration; real actions require permissions." },
  { id: "overflow", name: "Activate overflow routing", boundary: "Enable a preconfigured path, not automatic native queue overflow." },
  { id: "available", name: "Adjust agent availability", boundary: "Simulated return to work, not an unrestricted supervisor status override." },
  { id: "escalate", name: "Escalate a contact", boundary: "A configured eligible destination is required." },
  { id: "announcement", name: "Emergency announcement", boundary: "A configured contact flow and published announcement are required." },
  { id: "callback", name: "Initiate callback strategy", boundary: "An illustrative opt-in; no callback is actually scheduled." },
  { id: "staffing", name: "Adjust staffing", boundary: "Add fictional shift capacity; not an actual workforce schedule change." },
  { id: "alert", name: "Trigger operational alert", boundary: "Inline demonstration only; no email, task or external event is sent." },
] as const;
export type ActionId = typeof ACTIONS[number]["id"] | "integration-failure" | "integration-recover" | "resolve-incident" | "disposition" | "follow-up" | "escalation-step" | "escalation-reset" | "agent-state";
export type ActionOptions = { queue?: Queue; targetQueue?: Queue; agentId?: string; contactId?: string; value?: string };
export type Impact = { id: number; at: number; action: ActionId; label: string; before: Metrics; after: Metrics; recoverySeconds: number | null; explanation: string };
export type Frame = { at: number; agents: Record<string, { state: AgentState; queue: Queue; queues?: Queue[]; contact: boolean; available: boolean; team: string; profile: string; channel: Channel }>; waiting: number; handled: number; offered: number; abandoned: number; serviceLevel: number | null; asa: number | null; aht: number | null; occupancy: number | null };
export type Snapshot = {
  clock: number; tick: number; scenario: Scenario; config: SimConfig;
  agents: Agent[]; contacts: Contact[]; rules: AlertRule[]; alerts: Alert[];
  overflow: boolean; overflowSource: Queue; overflowTarget: Queue; overflowThreshold: number;
  announcement: boolean; announcementQueue?: Queue; callback: boolean; callbackQueue?: Queue; integrationHealthy: boolean; incident: boolean;
  log: TimelineEntry[]; frames: Frame[]; impacts: Impact[]; arrivalRemainder: number;
  escalation: { step: number; contactId?: string };
};
