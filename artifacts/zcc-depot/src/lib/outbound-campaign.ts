/** Campaign wizard validation + DEMONSTRATION lifecycle (not the literal AWS state enum). */
export type WChannel = "voice" | "sms" | "email" | "whatsapp";
export type WMode = "predictive" | "progressive" | "preview" | "agentless";
export interface CampaignDraft {
  name: string; description: string; objective: string; channel: WChannel; start: string; end: string; type: "agent-assisted" | "automated" | "digital";
  segment: string; mode: WMode | null;
  capacity: number; allocation: number; ringSec: number; reviewSec: number; allowRemove: boolean; classification: boolean;
  queue: string; routingProfile: string; agentGroup: string; flow: string; callerId: string; senderId: string; template: string;
  windowStart: string; windowEnd: string; tzStrategy: "primary" | "all"; dailyLimit: number; weeklyLimit: number; suppression: string[]; consent: "express" | "express-written"; retries: number; retryMinutes: number;
}
export const DEFAULT_DRAFT: CampaignDraft = {
  name: "Policy Renewal Wave · Q4", description: "Renewal outreach to policies expiring in 120 days.", objective: "Retain renewing customers", channel: "voice", start: "2026-11-16", end: "2026-12-18", type: "agent-assisted",
  segment: "renewal-120", mode: "progressive", capacity: 80, allocation: 100, ringSec: 25, reviewSec: 30, allowRemove: true, classification: true,
  queue: "Renewals", routingProfile: "Outbound-Renewals-VoiceOnly", agentGroup: "Renewals Pod B", flow: "Renewal Outbound Flow", callerId: "+1 (617) 555-0100 · claimed", senderId: "", template: "",
  windowStart: "09:00", windowEnd: "20:00", tzStrategy: "all", dailyLimit: 1, weeklyLimit: 3, suppression: ["internal-dnc", "registry", "opt-out"], consent: "express", retries: 2, retryMinutes: 240,
};
export const STEPS = ["Campaign identity", "Audience", "Dialing mode", "Agent & queue", "Communication rules", "Review", "Simulated launch"] as const;
export const needsAgents = (d: CampaignDraft) => d.channel === "voice" && d.mode !== "agentless" && d.type === "agent-assisted";
/** Settings shown for a mode; only supported ones. */
export function modeSettings(mode: WMode | null, channel: WChannel): ("capacity" | "allocation" | "ringSec" | "reviewSec" | "allowRemove" | "classification")[] {
  if (channel !== "voice" || !mode) return [];
  if (mode === "predictive") return ["capacity", "ringSec", "classification"];
  if (mode === "progressive") return ["allocation", "ringSec", "classification"];
  if (mode === "preview") return ["reviewSec", "allowRemove", "ringSec"];
  return ["capacity", "ringSec", "classification"];
}
export function validateStep(step: number, d: CampaignDraft): Record<string, string> {
  const e: Record<string, string> = {};
  if (step === 0) {
    if (d.name.trim().length < 3) e.name = "Name needs at least 3 characters.";
    if (!/^[\w .·\-]+$/.test(d.name.trim())) e.name = e.name ?? "Use letters, numbers, spaces, dots or dashes.";
    if (!d.objective.trim()) e.objective = "Business objective is required.";
    if (!d.start) e.start = "Start date required."; if (!d.end) e.end = "End date required.";
    if (d.start && d.end && d.end < d.start) e.end = "End date must be on or after start date.";
    if (d.channel !== "voice" && d.type !== "digital") e.type = "Digital channels use the digital campaign type.";
    if (d.channel === "voice" && d.type === "digital") e.type = "Voice campaigns are agent-assisted or automated.";
  }
  if (step === 1 && !d.segment) e.segment = "Select a customer segment.";
  if (step === 2 && d.channel === "voice") {
    if (!d.mode) e.mode = "Choose a dialing mode.";
    if (d.type === "automated" && d.mode && d.mode !== "agentless") e.mode = "Automated voice uses agentless mode.";
    if (d.type === "agent-assisted" && d.mode === "agentless") e.mode = "Agent-assisted voice needs predictive, progressive or preview.";
    if ((d.mode === "predictive" || d.mode === "agentless") && (d.capacity < 1 || d.capacity > 100)) e.capacity = "Capacity must be 1–100%.";
    if (d.mode === "progressive" && (d.allocation < 1 || d.allocation > 200)) e.allocation = "Agent allocation must be 1–200%.";
    if (d.ringSec < 15 || d.ringSec > 60) e.ringSec = "Ring time must be 15–60 seconds.";
    if (d.mode === "preview" && d.classification) e.classification = "Disable call classification for preview.";
  }
  if (step === 3) {
    if (d.channel === "voice") {
      if (needsAgents(d) && !d.queue) e.queue = "Campaign queue required for agent-assisted voice.";
      if (needsAgents(d) && !d.routingProfile) e.routingProfile = "Routing profile required.";
      if (!d.flow) e.flow = "Published contact flow required.";
      if (!d.callerId) e.callerId = "Claimed or ported caller ID required.";
    } else {
      if (!d.senderId) e.senderId = d.channel === "email" ? "Verified email address required." : "Originating identity required.";
      if (!d.template) e.template = "Message template required.";
    }
  }
  if (step === 4) {
    if (d.windowStart >= d.windowEnd) e.window = "Window end must be after start.";
    if (d.dailyLimit < 1) e.dailyLimit = "Daily limit at least 1.";
    if (d.weeklyLimit < d.dailyLimit) e.weeklyLimit = "Weekly limit must be ≥ daily limit.";
    if (d.retries < 0 || d.retries > 5) e.retries = "Retries 0–5 in this simulation.";
  }
  return e;
}
export const validateAll = (d: CampaignDraft) => [0, 1, 2, 3, 4].reduce((a, s) => ({ ...a, ...validateStep(s, d) }), {} as Record<string, string>);
export type DemoLife = "Draft" | "Validated" | "Ready" | "Running" | "Paused" | "Completed";
export const DEMO_LIFE: DemoLife[] = ["Draft", "Validated", "Ready", "Running", "Paused", "Completed"];
export type LifeAction = "validate" | "ready" | "launch" | "pause" | "resume" | "complete" | "reset";
export function lifeNext(s: DemoLife, a: LifeAction, valid: boolean): DemoLife {
  if (a === "reset") return "Draft";
  if (a === "validate" && s === "Draft") return valid ? "Validated" : "Draft";
  if (a === "ready" && s === "Validated") return "Ready";
  if (a === "launch" && s === "Ready") return "Running";
  if (a === "pause" && s === "Running") return "Paused";
  if (a === "resume" && s === "Paused") return "Running";
  if (a === "complete" && (s === "Running" || s === "Paused")) return "Completed";
  return s;
}
/** Which edits AWS documents as possible while running/paused (illustrative mapping). */
export function editableWhile(s: DemoLife): string { return s === "Running" || s === "Paused" ? "Journey-type edits only; flow updates apply on next repeat, segment changes on next refresh, limits/windows within minutes." : s === "Completed" ? "Read only." : "All settings editable."; }
