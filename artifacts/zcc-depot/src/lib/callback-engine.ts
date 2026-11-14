/**
 * Deterministic Amazon Connect callback teaching engine.
 * No network, no clocks, no randomness: every result is a pure function of (scenario, config).
 * Timestamps are simulated seconds since Tue 24 Nov 2026 00:00 in the contact center time zone (US Eastern, UTC-5).
 */

export type ScenarioId = "queued" | "agent-first" | "customer-first" | "web" | "courtesy" | "chat" | "external" | "availability" | "vip" | "ai" | "after-hours" | "recovery";
export const SCENARIO_IDS: ScenarioId[] = ["queued", "agent-first", "customer-first", "web", "courtesy", "chat", "external", "availability", "vip", "ai", "after-hours", "recovery"];

export type Life = "Inbound" | "Requested" | "Validated" | "Scheduled" | "Pending" | "Eligible" | "Queued" | "Dialing" | "Connected" | "Completed" | "Failed" | "Retrying" | "Canceled" | "Expired" | "Rescheduled" | "Blocked";
export const LIFE_MAIN: Life[] = ["Requested", "Validated", "Scheduled", "Pending", "Eligible", "Queued", "Dialing", "Connected", "Completed"];
export const LIFE_SIDE: Life[] = ["Retrying", "Rescheduled", "Failed", "Canceled", "Expired", "Blocked"];
/** Orchestration = application-level (custom or flow logic). Connect = real Amazon Connect contact activity. */
export type Layer = "Customer" | "Orchestration" | "Connect" | "Agent";
export type Failure = "none" | "no-answer" | "busy" | "invalid" | "voicemail" | "reject" | "api" | "expiry" | "max-retries";
export type ExtStatus = "available" | "degraded" | "unavailable" | "maintenance" | "recovering";
export type Mode = "agent-first" | "customer-first" | "outbound-api";
export type TzId = "ET" | "CT" | "MT" | "PT" | "GMT" | "CET";

export type CbConfig = {
  name: string; phone: string; reason: string; dept: string; consent: boolean;
  wait: number; threshold: number; queue: string; agents: "available" | "busy" | "none";
  initialDelay: number; maxRetries: number; minInterval: number;
  failure: Failure; failAttempts: number; customRecovery: boolean;
  eligibleInstance: boolean; mode: Mode;
  webTiming: "immediate" | "scheduled";
  date: string; slot: number; tz: TzId; schedAction: "confirm" | "reschedule" | "cancel";
  ext: ExtStatus; system: string; trigger: "polling" | "event"; poll: number; extLimit: number; extTimeout: number;
  minProf: number; freeAgent: string;
  tier: "Standard" | "Gold" | "VIP"; severity: "Low" | "High" | "Critical"; team: string; preferredAgent: string; priority: number; reach: "now" | "later" | "unreachable";
  aiConfirm: boolean; zendesk: boolean;
};

export const DEFAULT_CONFIG: CbConfig = {
  name: "Lena Hoffmann", phone: "+13125550147", reason: "Duplicate charge on November invoice", dept: "Billing", consent: true,
  wait: 840, threshold: 300, queue: "Billing", agents: "available",
  initialDelay: 30, maxRetries: 2, minInterval: 120,
  failure: "none", failAttempts: 1, customRecovery: false,
  eligibleInstance: true, mode: "agent-first",
  webTiming: "immediate",
  date: "2026-11-24", slot: 900, tz: "ET", schedAction: "confirm",
  ext: "unavailable", system: "core-banking", trigger: "polling", poll: 180, extLimit: 5, extTimeout: 30,
  minProf: 4, freeAgent: "amaya",
  tier: "VIP", severity: "Critical", team: "Private Client Desk", preferredAgent: "sunita", priority: 1, reach: "now",
  aiConfirm: true, zendesk: true,
};

export type CbEvent = { t: number; node: string; life: Life; layer: Layer; label: string; detail: string; customer: string; agent: string; attempt?: number; contact?: string; json?: unknown; custom?: boolean };
export type Attempt = { n: number; at: number; result: string };
export type Final = "Completed" | "Connected to voicemail" | "Failed" | "Expired" | "Canceled" | "Blocked" | "Served live";
export type Outcome = { final: Final; summary: string; requested: string; executed: string; queue: string; agent: string; attempts: number; dependency: string; experience: string };
export type CbResult = { events: CbEvent[]; outcome: Outcome; attempts: Attempt[]; attributes: Record<string, string> };

/* ---------- Time and scheduling ---------- */
const DAY = 86400;
const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MO = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const BASE_DATE = "2026-11-24";
const BASE_MS = Date.UTC(2026, 10, 24);
const p2 = (n: number) => String(n).padStart(2, "0");
export const dayIndex = (iso: string) => Math.round((Date.parse(iso + "T00:00:00Z") - BASE_MS) / 864e5);
export const isoAt = (i: number) => new Date(BASE_MS + i * 864e5).toISOString().slice(0, 10);
export const weekday = (iso: string) => new Date(iso + "T00:00:00Z").getUTCDay();
export const dayLabel = (iso: string) => { const d = new Date(iso + "T00:00:00Z"); return `${WD[d.getUTCDay()]} ${d.getUTCDate()} ${MO[d.getUTCMonth()]}`; };
export const monthLabel = (iso: string) => { const d = new Date(iso + "T00:00:00Z"); return `${["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][d.getUTCMonth()]} ${d.getUTCFullYear()}`; };
export function fmtClock(t: number) {
  const d = Math.floor(t / DAY); const s = t - d * DAY;
  const hms = `${p2(Math.floor(s / 3600))}:${p2(Math.floor((s % 3600) / 60))}:${p2(s % 60)}`;
  return d ? `${dayLabel(isoAt(d))} ${hms}` : hms;
}
export const fmt12 = (m: number) => { const mm = ((m % 1440) + 1440) % 1440; const h = Math.floor(mm / 60); return `${((h + 11) % 12) + 1}:${p2(mm % 60)} ${h < 12 ? "AM" : "PM"}`; };

export const TZS: Record<TzId, { label: string; off: number }> = {
  ET: { label: "Eastern (UTC-5)", off: -300 }, CT: { label: "Central (UTC-6)", off: -360 }, MT: { label: "Mountain (UTC-7)", off: -420 },
  PT: { label: "Pacific (UTC-8)", off: -480 }, GMT: { label: "London (UTC+0)", off: 0 }, CET: { label: "Berlin (UTC+1)", off: 60 },
};
/** Converts a center-time slot to the customer's local wall clock. */
export function localSlot(iso: string, slot: number, tz: TzId) {
  const m = slot + (TZS[tz].off - TZS.ET.off); const shift = Math.floor(m / 1440);
  return { iso: isoAt(dayIndex(iso) + shift), min: m - shift * 1440, label: `${shift ? dayLabel(isoAt(dayIndex(iso) + shift)) + " " : ""}${fmt12(m)}` };
}

export const HOLIDAYS: Record<string, string> = { "2026-11-26": "Thanksgiving Day", "2026-11-27": "Day after Thanksgiving", "2026-12-24": "Christmas Eve", "2026-12-25": "Christmas Day", "2027-01-01": "New Year's Day" };
export const BLACKOUTS: Record<string, [number, number, string][]> = {
  "2026-11-24": [[960, 1020, "Billing team training"]],
  "2026-11-25": [[720, 810, "Telephony carrier maintenance"]],
  "2026-11-30": [[480, 510, "Morning huddle"]],
  "2026-12-01": [[480, 540, "Quarterly CRM release freeze"]],
};
export const OPEN = 480, CLOSE = 1080; // 08:00 to 18:00 center time, Monday to Friday
export type SlotStatus = "open" | "past" | "closed" | "weekend" | "holiday" | "blackout" | "full";
const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
export type Now = { iso: string; min: number };
export function dayStatus(iso: string): { status: "open" | "weekend" | "holiday"; note: string } {
  if (HOLIDAYS[iso]) return { status: "holiday", note: HOLIDAYS[iso] };
  const w = weekday(iso);
  if (w === 0 || w === 6) return { status: "weekend", note: "Weekend: closed" };
  return { status: "open", note: "Open 8:00 AM to 6:00 PM ET" };
}
export function slotStatus(iso: string, slot: number, now: Now): { status: SlotStatus; reason: string } {
  const d = dayStatus(iso);
  if (d.status !== "open") return { status: d.status, reason: d.note };
  if (dayIndex(iso) < dayIndex(now.iso) || (iso === now.iso && slot < now.min + 30)) return { status: "past", reason: "Too soon or in the past (30 minute lead time)" };
  if (slot < OPEN || slot >= CLOSE) return { status: "closed", reason: "Outside business hours (8:00 AM to 6:00 PM ET)" };
  const b = (BLACKOUTS[iso] ?? []).find(([a, z]) => slot >= a && slot < z);
  if (b) return { status: "blackout", reason: `Blackout: ${b[2]}` };
  if (hash(iso + slot) % 6 === 0) return { status: "full", reason: "Fully booked: no agent capacity in this window" };
  return { status: "open", reason: "Available" };
}
export const daySlots = (iso: string, now: Now) => Array.from({ length: (CLOSE - OPEN) / 30 }, (_, i) => OPEN + i * 30).map((slot) => ({ slot, ...slotStatus(iso, slot, now) }));
export function nextOpen(from: Now): { iso: string; slot: number } | null {
  for (let d = 0; d < 45; d++) {
    const iso = isoAt(dayIndex(from.iso) + d);
    const s = daySlots(iso, from).find((x) => x.status === "open" && (d > 0 || x.slot >= from.min));
    if (s) return { iso, slot: s.slot };
  }
  return null;
}
export const isE164 = (p: string) => /^\+[1-9]\d{7,14}$/.test(p);
export const maskPhone = (p: string) => (p.length > 6 ? `${p.slice(0, 3)} ••• ••${p.slice(-4)}` : p);

/* ---------- Agents ---------- */
export type AgentDef = { id: string; name: string; initials: string; profile: string; queues: string[]; prof: Record<string, number>; status: "Available" | "On contact" | "After contact work" | "Offline" | "Break" };
export const AGENTS: AgentDef[] = [
  { id: "mara", name: "Mara Okafor", initials: "MO", profile: "Billing and Disputes", queues: ["Billing", "Support"], prof: { Billing: 5, Support: 3 }, status: "On contact" },
  { id: "theo", name: "Theo Lindqvist", initials: "TL", profile: "General Support", queues: ["Support", "Billing"], prof: { Support: 4, Billing: 2 }, status: "Available" },
  { id: "amaya", name: "Amaya Reyes", initials: "AR", profile: "Billing and Disputes", queues: ["Billing", "Claims"], prof: { Billing: 4, Claims: 3 }, status: "After contact work" },
  { id: "jonah", name: "Jonah Feld", initials: "JF", profile: "Claims Specialists", queues: ["Claims"], prof: { Claims: 5 }, status: "Offline" },
  { id: "sunita", name: "Sunita Rao", initials: "SR", profile: "Private Client Desk", queues: ["VIP Care", "Billing"], prof: { "VIP Care": 5, Billing: 3 }, status: "Available" },
];
export const agentName = (id: string) => AGENTS.find((a) => a.id === id)?.name ?? id;
export function eligibility(c: CbConfig) {
  return AGENTS.map((a) => {
    const inProfile = a.queues.includes(c.queue); const p = a.prof[c.queue] ?? 0;
    const eligible = inProfile && p >= c.minProf;
    const reason = !inProfile ? `Routing profile ${a.profile} does not include ${c.queue}` : p < c.minProf ? `${c.queue} proficiency ${p} below required ${c.minProf}` : `${c.queue} proficiency ${p} meets ${c.minProf}`;
    return { ...a, inProfile, level: p, eligible, reason };
  });
}

export const SYSTEMS: Record<string, string> = { "core-banking": "Core banking platform", claims: "Insurance claims system", health: "Healthcare scheduling", payments: "Payment processor", airline: "Airline reservations", orders: "Order management (ERP)" };

/* ---------- Playback ---------- */
export type Playback = { index: number; running: boolean };
export type PlaybackAction = "start" | "pause" | "resume" | "next" | "previous" | "replay" | "reset" | "tick";
export function advancePlayback(p: Playback, a: PlaybackAction, len: number): Playback {
  const last = Math.max(0, len - 1);
  switch (a) {
    case "start": return { index: p.index >= last ? 0 : p.index, running: true };
    case "pause": return { ...p, running: false };
    case "resume": return p.index >= last ? p : { ...p, running: true };
    case "next": return { index: Math.min(last, p.index + 1), running: false };
    case "previous": return { index: Math.max(0, p.index - 1), running: false };
    case "replay": return { index: 0, running: true };
    case "reset": return { index: 0, running: false };
    case "tick": { const i = Math.min(last, p.index + 1); return { index: i, running: i < last }; }
  }
}

/* ---------- Simulation builder ---------- */
type X = { ev: CbEvent[]; t: number; c: CbConfig; attempts: Attempt[]; agent: string; queue: string };
type M = { q: string; agent: string; reroute?: string; aw?: string; dial: string; redial?: string; detect?: string; retry: string; wait?: string; cust: string; ow?: string; fail: string; recovery?: string; ccp?: string; xfer?: string; c4?: string; api?: string };
type Fin = { final: Final; note: string };

function add(x: X, dt: number, node: string, life: Life, layer: Layer, label: string, detail: string, customer: string, agent: string, extra: Partial<CbEvent> = {}) {
  x.t += dt; x.ev.push({ t: x.t, node, life, layer, label, detail, customer, agent, ...extra });
}
function phoneOk(x: X, node: string, failNode: string): boolean {
  add(x, 1, node, "Validated", "Orchestration", "Callback number validated", isE164(x.c.phone) ? `${maskPhone(x.c.phone)} is valid E.164.` : `"${x.c.phone}" is not E.164 (expected + country code + number, for example +13125550147).`, isE164(x.c.phone) ? "Number confirmed." : "Sorry, that number could not be used.", "Not involved");
  if (isE164(x.c.phone)) return true;
  add(x, 1, failNode, "Failed", "Orchestration", "Request rejected: invalid number format", "The flow takes the error branch; no callback contact is created and no dial is attempted.", "Asked to re-enter a valid number.", "Not involved");
  return false;
}
/** First qualified (routing profile + proficiency) agent who is not offline, preferring Available. */
export function pickAgent(c: CbConfig, queue: string, exclude: string[] = []): string {
  const el = eligibility({ ...c, queue }).filter((a) => a.eligible && a.status !== "Offline" && !exclude.includes(a.id));
  return (el.find((a) => a.status === "Available") ?? el[0])?.id ?? "";
}
/** Returns a terminal Fin when no qualified agent can ever be reached in this run. */
function agentWait(x: X, m: M, onLine: boolean): Fin | null {
  const c = x.c;
  if (!x.agent) x.agent = pickAgent(c, x.queue);
  if (c.agents === "none" || !x.agent) {
    x.agent = "";
    add(x, 900, m.q, "Expired", "Orchestration", c.agents === "none" ? "No agents staffed: demo window ends" : "No qualified agent: demo window ends", onLine ? "Custom demonstration cutoff after 15 minutes: the customer is already on the line but no qualified agent can join. The contact ends under the configured queue-flow policy, not a universal native callback timeout." : "Custom demonstration cutoff after 15 minutes, not a native expiry rule. Native queued callbacks may remain for up to seven days unless explicitly removed (for example with StopContact). No eligible staffed agent means no agent reservation and no call.", onLine ? "Waiting in queue, then hangs up" : "Still waiting; no call received", "No agents signed in", { custom: true });
    return { final: "Expired", note: "No qualified agent was staffed; nothing connected." };
  }
  if (c.agents === "busy") {
    add(x, 240, m.q, "Queued", "Connect", "All agents busy: callback waits", "Callbacks compete with other contacts by queue priority, then age. A callback inherits the original inbound start time when queue priorities are equal.", onLine ? "Hold music" : "Customer is free; no hold.", "All agents on contacts");
    add(x, 60, m.q, "Eligible", "Agent", `${agentName(x.agent)} becomes Available`, "A qualified agent finishes their contact and is now Available for routing.", onLine ? "Hold music" : "Customer is free; no hold.", "Available");
  }
  return null;
}
function offer(x: X, m: M, phase: string): Fin | null {
  if (x.c.failure === "reject") {
    const first = x.agent;
    add(x, 4, m.agent, "Eligible", "Agent", `Offered to ${agentName(first)}: rejected`, `Agent rejection is not a failed dial attempt. Retry counters are untouched and the contact is rerouted to the next available agent. ${phase}`, "Nothing yet.", "Rejected the offer");
    x.agent = pickAgent(x.c, x.queue, [first]);
    if (!x.agent) { add(x, 600, m.recovery ?? m.fail, "Expired", "Connect", "No other qualified agent", "Nobody else in a routing profile serving this queue meets the requirements; the contact keeps waiting until it ends.", "No connection", "No agent"); return { final: "Expired", note: "Only qualified agent rejected; nobody else eligible." }; }
    add(x, 6, m.reroute ?? m.agent, "Eligible", "Agent", `Rerouted to ${agentName(x.agent)}`, "Routing picks the next qualified agent in a routing profile serving the queue.", "Nothing yet.", "Offered");
  }
  return null;
}
function expire(x: X, m: M): Fin | null {
  if (x.c.failure !== "expiry") return null;
  add(x, 1800, m.recovery ?? m.fail, "Expired", "Orchestration", "Callback window expired (custom rule)", "A business rule allowed 30 minutes. A custom Lambda calls StopContact to remove the queued callback. Native queued callbacks have no business-window timer of their own.", "Customer was not called inside the promised window.", "Never offered", { custom: true });
  return { final: "Expired", note: "Window elapsed before an agent and customer connected." };
}

function execAgentFirst(x: X, m: M): Fin {
  const c = x.c;
  add(x, c.initialDelay, m.q, "Queued", "Connect", "Callback contact queued", `Initial delay of ${c.initialDelay}s elapsed. Initial delay is a minimum wait, not an appointment time.`, "Line is free. No hold music.", "Not offered yet", { contact: "C2 callback · in queue" });
  const ex = expire(x, m); if (ex) return ex;
  const aw = agentWait(x, m, false); if (aw) return aw;
  const of = offer(x, m, "Agent-first: the agent is reserved before anyone dials the customer."); if (of) return of;
  const firstAgent = x.agent;
  const fails = c.failure === "max-retries" ? c.maxRetries + 1 : c.failure === "no-answer" ? c.failAttempts : 0;
  for (let n = 1; ; n++) {
    add(x, 5, x.agent !== firstAgent || c.failure === "reject" ? (m.reroute ?? m.agent) : m.agent, "Eligible", "Agent", `${agentName(x.agent)} accepts${n > 1 ? ` (attempt ${n})` : ""}`, "Agent-first: an Available agent accepts the callback before the customer is dialed.", "Not called yet.", "Accepted · preparing", { attempt: n });
    if (n === 1 && m.aw) add(x, 4, m.aw, "Eligible", "Agent", "Agent whisper plays", "The agent whisper flow tells the agent this is a callback and reads key attributes.", "Not called yet.", "Hearing agent whisper");
    add(x, 3, n === 1 ? m.dial : (m.redial ?? m.dial), "Dialing", "Connect", `Dial attempt ${n} of ${c.maxRetries + 1}`, `Amazon Connect dials ${maskPhone(c.phone)} from the queue outbound number. The agent hears ringing.`, "Phone ringing", "Waiting while customer is dialed", { attempt: n, contact: "C2 callback · connecting" });
    if (n === 1 && (c.failure === "busy" || c.failure === "invalid")) {
      const what = c.failure === "busy" ? "Busy signal" : "Invalid or unreachable number";
      add(x, 6, m.detect ?? m.dial, "Failed", "Connect", `${what}: attempt failed`, `${what} is not a ringing no-answer. This lab does not treat it as a native no-answer retry; the attempt is recorded as failed.`, c.failure === "busy" ? "Line busy" : "Number not reachable", "Call did not connect", { attempt: n });
      x.attempts.push({ n, at: x.t, result: what });
      if (c.customRecovery && c.failure === "busy") {
        add(x, 2, m.recovery ?? m.retry, "Rescheduled", "Orchestration", "Custom recovery scheduled", "Custom: a contact event triggers Lambda, which records the failure and schedules a later StartOutboundVoiceContact. This is not native callback retry.", "Will be tried again later.", "Moved on to next contact", { custom: true });
        return { final: "Failed", note: "Native callback failed; a custom follow-up is scheduled." };
      }
      add(x, 2, m.fail, "Failed", "Connect", "Callback ended as failed", c.failure === "invalid" ? "No redial is useful; the number should be corrected first." : "Enable the custom recovery toggle to see an explicitly labeled follow-up pattern.", "No callback received.", "Moved on");
      return { final: "Failed", note: what };
    }
    if (n <= fails) {
      add(x, 25, m.detect ?? m.dial, "Retrying", "Connect", `No answer on attempt ${n}`, "Ringing no-answer is a failed attempt in agent-first mode.", "Missed call", "No answer", { attempt: n });
      x.attempts.push({ n, at: x.t, result: "Ringing, no answer" });
      if (n <= c.maxRetries) {
        add(x, 1, m.retry, "Retrying", "Connect", `Retry ${n} of ${c.maxRetries} scheduled`, `Native retry: Max retries ${c.maxRetries}, Minimum time between attempts ${c.minInterval}s. Total attempts allowed = 1 initial + ${c.maxRetries} retries.`, "Will be called again.", "Released to next contact");
        add(x, c.minInterval, m.wait ?? m.retry, "Queued", "Connect", "Back in queue after minimum interval", "The callback re-enters routing once the minimum interval has passed.", "Waiting for the next call.", "Not offered");
        continue;
      }
      add(x, 1, m.fail, "Failed", "Connect", "Maximum retries reached", `All ${c.maxRetries + 1} attempts rang out. The callback ends as failed.`, "No callback received.", "Moved on");
      if (c.customRecovery) add(x, 2, m.recovery ?? m.fail, "Rescheduled", "Orchestration", "Escalated to follow-up (custom)", `Custom: an event rule creates a follow-up task${c.zendesk ? " and a Zendesk ticket through the configured integration" : ""}. Not native.`, "Follow-up planned.", "Task queued", { custom: true });
      return { final: "Failed", note: "Maximum retries reached." };
    }
    if (c.failure === "voicemail") {
      add(x, 12, m.detect ?? m.cust, "Connected", "Connect", "Answered by voicemail", "Agent-first: a voicemail answer counts as CONNECTED. There is no automatic retry. The agent decides whether to leave a message.", "Voicemail greeting played", "Hearing voicemail greeting", { attempt: n });
      x.attempts.push({ n, at: x.t, result: "Voicemail (counts as connected)" });
      add(x, 40, m.cust, "Completed", "Agent", "Agent leaves message and ends", "The callback is complete from Amazon Connect's view.", "Voicemail left", "Wrapping up");
      return { final: "Connected to voicemail", note: "Counts as connected; no native retry." };
    }
    add(x, 8, m.cust, "Connected", "Connect", "Customer answers", "Human answer. The customer is joined to the waiting agent.", "Answered: hears outbound whisper", "Customer answered", { attempt: n, contact: "C2 callback · connected" });
    x.attempts.push({ n, at: x.t, result: "Answered" });
    if (m.ow) add(x, 3, m.ow, "Connected", "Connect", "Outbound whisper plays to customer", "The outbound whisper flow tells the customer this is the callback they requested.", "\"This is Northwind Billing returning your call.\"", "Waiting for whisper");
    add(x, 2, m.ow ?? m.cust, "Connected", "Agent", `Connected to ${agentName(x.agent)}`, "Customer and agent are talking.", `Speaking with ${agentName(x.agent).split(" ")[0]}`, "On call");
    add(x, 380, m.ow ?? m.cust, "Completed", "Agent", "Callback completed", "The callback contact ends normally.", "Issue resolved without holding", "After contact work");
    return { final: "Completed", note: n > 1 ? `Connected on attempt ${n}.` : "Connected on the first attempt." };
  }
}

/** Customer-first (native, eligible instances only) or custom outbound API execution. */
function execCustomerSide(x: X, m: M, kind: "cf" | "api"): Fin {
  const c = x.c; const cf = kind === "cf";
  if (!cf) { const ex = expire(x, m); if (ex) return ex; }
  if (cf) {
    add(x, c.initialDelay, m.q, "Queued", "Connect", "C2 CALLBACK_CUSTOMER_FIRST_QUEUED", "The customer-first callback contact waits in queue. Max retries and minimum interval from agent-first do not apply to C2.", "Line is free.", "No agent reserved", { contact: "C2 CUSTOMER_FIRST_QUEUED" });
  } else {
    if (c.failure === "api") {
      add(x, 1, m.api ?? m.dial, "Retrying", "Orchestration", "StartOutboundVoiceContact: LimitExceededException (429)", "Custom application retries with backoff (limit 2).", "Nothing yet.", "Not involved", { custom: true, json: { error: "LimitExceededException", status: 429, message: "The allowed limit for the resource has been exceeded." } });
      add(x, 8, m.api ?? m.dial, "Failed", "Orchestration", "API retry limit reached", "The application marks the request failed for manual follow-up. No call was placed.", "No callback received.", "Not involved", { custom: true, json: { error: "InternalServiceException", status: 500, attempts: 2 } });
      return { final: "Failed", note: "Outbound API request failed." };
    }
    add(x, 1, m.api ?? m.dial, "Queued", "Orchestration", "StartOutboundVoiceContact accepted", "Custom pattern: the API dials the customer first, then runs the configured outbound flow. It does not create a native queued callback.", "Nothing yet.", "Not involved", { custom: true, json: { request: { InstanceId: "inst-northwind-demo", ContactFlowId: "flow-outbound-callback", DestinationPhoneNumber: c.phone, QueueId: `queue-${c.queue.toLowerCase().replace(" ", "-")}`, Attributes: { callbackReason: c.reason, tier: c.tier }, ClientToken: "cb-48213-a1" }, response: { ContactId: "c7e1-demo-48213" } } });
  }
  if (cf) { const ex = expire(x, m); if (ex) return ex; }
  const fails = c.failure === "max-retries" ? c.maxRetries + 1 : c.failure === "no-answer" ? c.failAttempts : 0;
  for (let n = 1; ; n++) {
    add(x, 3, n === 1 ? m.dial : (m.redial ?? m.dial), "Dialing", "Connect", cf ? `C${2 + n} dials customer` : `Dial attempt ${n}`, cf ? "CALLBACK_CUSTOMER_FIRST_DIALED: the customer is dialed before any agent is reserved; the outbound callback flow runs." : "The outbound contact rings the customer. No agent is reserved yet.", "Phone ringing", "No agent reserved yet", { attempt: n, contact: cf ? `C${2 + n} ${n === 1 ? "CUSTOMER_FIRST_DIALED" : "recreated callback dialed"}` : "Outbound API contact" });
    const failKind = n === 1 && (c.failure === "busy" || c.failure === "invalid" || c.failure === "voicemail") ? c.failure : n <= fails ? "no-answer" : null;
    if (failKind) {
      const what = { busy: "Busy signal", invalid: "Invalid number", voicemail: "Voicemail detected", "no-answer": "No answer" }[failKind];
      if (failKind === "voicemail") add(x, 20, m.ccp ?? m.dial, "Retrying", "Connect", cf ? "Check call progress: voicemail" : "Answered, but no confirmation keypress", cf ? "The call was answered (media established), so the outbound callback flow ran. Check call progress classified a machine; only a confirmed human proceeds to Transfer to queue." : "Custom flow asks the customer to press 1; no keypress means not confirmed. Answering-machine detection is not used for ordinary outbound API calls here.", "Voicemail greeting", "No agent reserved", { attempt: n });
      else add(x, 20, m.detect ?? m.dial, "Retrying", "Connect", `Dial result: ${what}`, "The dial failed before media was established, so the outbound flow (and Check call progress) never ran. This is a telephony dial result, not a flow detection.", failKind === "busy" ? "Line busy" : failKind === "invalid" ? "Number not reachable" : "Missed call", "No agent reserved", { attempt: n });
      x.attempts.push({ n, at: x.t, result: what });
      if (c.customRecovery && failKind !== "invalid" && n <= c.maxRetries) {
        add(x, 2, m.c4 ?? m.retry, "Retrying", "Orchestration", cf ? `Custom retry: C${3 + n} recreated` : `Application retry ${n} of ${c.maxRetries} (custom)`, cf ? "Custom: the dialed contact flow sets a retry attribute and recreates the callback. The new callback's creation flow uses a Wait block before queueing. It rejoins the BACK of the queue unless priority or age is explicitly adjusted." : "Custom: the application waits, then calls StartOutboundVoiceContact again.", "Will be called again.", "Not involved", { custom: true });
        add(x, c.minInterval, m.wait ?? m.c4 ?? m.retry, "Queued", "Orchestration", "Waiting before the next attempt", `Custom wait of ${c.minInterval}s.`, "Waiting.", "Not involved", { custom: true });
        continue;
      }
      add(x, 1, m.fail, "Failed", cf ? "Connect" : "Orchestration", n > 1 ? "Retry budget exhausted" : `${what}: callback failed`, cf ? (c.customRecovery ? "Custom retry budget used." : "C2 has no native max-retries setting. Enable custom recovery to model a C4 recreation.") : "No native retry exists for this custom pattern.", "No callback received.", "Not involved");
      return { final: "Failed", note: `${what}${n > 1 ? " after retries" : ""}.` };
    }
    add(x, 8, m.ccp ?? m.dial, "Eligible", "Connect", cf ? "Human answer confirmed" : "Customer presses 1 to confirm", cf ? "Check call progress returned a human answer." : "Custom DTMF confirmation in the outbound flow.", "\"Please hold while we connect you.\"", "Not reserved yet", { attempt: n });
    x.attempts.push({ n, at: x.t, result: "Answered by customer" });
    add(x, 2, m.xfer ?? m.q, "Queued", "Connect", "Transfer to queue", `The customer, now on the line, waits in ${x.queue}.`, "Brief hold music", "Not offered yet");
    const aw = agentWait(x, { ...m, q: m.xfer ?? m.q }, true); if (aw) return aw;
    const of = offer(x, m, "The customer is already on the line while rerouting happens."); if (of) return of;
    add(x, 6, c.failure === "reject" && m.reroute ? m.reroute : m.agent, "Connected", "Agent", `Connected to ${agentName(x.agent)}`, "Agent accepts; customer was already waiting, so no agent time was spent ringing.", `Speaking with ${agentName(x.agent).split(" ")[0]}`, "On call");
    add(x, 360, m.cust, "Completed", "Agent", "Callback completed", "The contact ends normally.", "Issue handled", "After contact work");
    return { final: "Completed", note: n > 1 ? `Connected on attempt ${n}.` : "Connected on the first attempt." };
  }
}

function waitUntil(x: X, iso: string, slot: number, node: string, label: string) {
  const target = dayIndex(iso) * DAY + slot * 60;
  const lag = (hash(iso + slot) % 41) + 4;
  if (target - x.t > 300) {
    x.t = target - 300;
    add(x, 0, node, "Scheduled", "Orchestration", "Simulated reminder: callback window in five minutes", "Custom notification preview only. No SMS, email, push notification or external API request is sent by this lab.", "Reminder preview: your callback window starts in five minutes.", "Not reserved", { custom: true });
  }
  x.t = Math.max(x.t, target - 1);
  add(x, 1 + lag, node, "Eligible", "Orchestration", label, `The one-time schedule fired ${lag}s after ${fmt12(slot)}. EventBridge Scheduler has one-minute precision; a schedule is a target time, not a second-exact guarantee.`, "Phone about to ring", "Not reserved", { custom: true });
}
/** Validates the chosen slot and applies reschedule/cancel actions. Returns final slot or a Fin. */
function schedule(x: X, now: Now, nodes: { validate: string; reject: string; store: string; cancel: string }): { iso: string; slot: number } | Fin {
  const c = x.c;
  let iso = c.date, slot = c.slot;
  const s = slotStatus(iso, slot, now);
  const loc = localSlot(iso, slot, c.tz);
  add(x, 3, nodes.validate, "Requested", "Customer", `Customer picks ${dayLabel(loc.iso)} ${fmt12(loc.min)} (${c.tz})`, `Center time: ${dayLabel(iso)} ${fmt12(slot)} ET.`, `Selected ${dayLabel(loc.iso)} ${fmt12(loc.min)}`, "Not involved");
  if (s.status !== "open") {
    const from = dayIndex(iso) > dayIndex(now.iso) || (iso === now.iso && slot > now.min) ? { iso, min: slot } : now;
    const nx = nextOpen(from);
    add(x, 1, nodes.reject, "Rescheduled", "Orchestration", `Slot rejected: ${s.reason}`, `Validation against hours, holidays, blackouts and capacity failed. Next available offered: ${nx ? `${dayLabel(nx.iso)} ${fmt12(nx.slot)} ET` : "none"}.`, "\"That time is not available. The next opening is offered.\"", "Not involved", { custom: true });
    if (!nx) return { final: "Failed", note: "No available window." };
    iso = nx.iso; slot = nx.slot;
  } else add(x, 1, nodes.validate, "Validated", "Orchestration", "Slot validated", "Inside business hours, not a holiday, no blackout, capacity available.", "\"Great, that time works.\"", "Not involved", { custom: true });
  add(x, 2, nodes.store, "Scheduled", "Orchestration", `Scheduled for ${dayLabel(iso)} ${fmt12(slot)} ET`, "Custom: DynamoDB stores the booking and EventBridge Scheduler creates a one-time schedule.", `Confirmed: ${dayLabel(localSlot(iso, slot, c.tz).iso)} ${fmt12(localSlot(iso, slot, c.tz).min)} ${c.tz}`, "Not involved", { custom: true, json: { CreateSchedule: { Name: "cb-48213", ScheduleExpression: `at(${iso}T${p2(Math.floor((slot + 300) / 60))}:${p2(slot % 60)}:00)`, ScheduleExpressionTimezone: "UTC", FlexibleTimeWindow: { Mode: "OFF" }, Target: { Arn: "arn:aws:lambda:...:function:start-callback" } } } });
  if (c.schedAction === "cancel") {
    add(x, 600, nodes.cancel, "Canceled", "Customer", "Customer cancels", "Custom: DeleteSchedule removes the pending schedule and the booking is marked canceled. Nothing dials.", "Cancellation confirmed", "Not involved", { custom: true });
    return { final: "Canceled", note: "Canceled before execution." };
  }
  if (c.schedAction === "reschedule") {
    const nx = nextOpen({ iso, min: slot + 60 }) ?? { iso, slot };
    add(x, 600, nodes.cancel, "Rescheduled", "Customer", `Rescheduled to ${dayLabel(nx.iso)} ${fmt12(nx.slot)} ET`, "Custom: UpdateSchedule moves the one-time schedule; the old time is released.", "New time confirmed", "Not involved", { custom: true });
    iso = nx.iso; slot = nx.slot;
  }
  return { iso, slot };
}
const isFin = (v: unknown): v is Fin => !!v && typeof v === "object" && "final" in v;

const BUILD: Record<ScenarioId, (x: X) => Fin> = {
  queued(x) {
    const c = x.c; x.t = 36000;
    add(x, 0, "caller", "Inbound", "Customer", `${c.name} calls ${c.queue}`, "Original inbound contact C1 begins.", "Calling the support line", "Not involved", { contact: "C1 inbound" });
    add(x, 4, "ivr", "Inbound", "Connect", "Entry flow: menu selects queue", `The caller chooses ${c.queue}. The flow sets the working queue.`, "\"For billing, press 2.\"", "Not involved");
    add(x, 3, "qin", "Inbound", "Connect", "Customer queue flow checks wait", `Get queue metrics: estimated wait ${Math.round(c.wait / 60)} min vs threshold ${Math.round(c.threshold / 60)} min.`, "Hold music", "Not involved");
    if (c.wait <= c.threshold && c.agents !== "none") {
      add(x, c.wait, "served", "Connected", "Agent", "Below threshold: no callback offered", "The wait is short enough; the caller stays on hold and is answered live.", "Answered after a short hold", "Answered inbound call");
      add(x, 300, "served", "Completed", "Agent", "Inbound call completed", "No callback contact exists.", "Done", "After contact work");
      return { final: "Served live", note: "Wait below the offer threshold." };
    }
    add(x, 20, "offer", "Inbound", "Connect", "Callback offered", "Get customer input in the customer queue flow.", "\"Rather than waiting on hold, would you like us to call you back?\"", "Not involved");
    add(x, 4, "offer", "Requested", "Customer", "Customer presses 1", "The customer accepts the callback.", "Pressed 1", "Not involved");
    if (!phoneOk(x, "setnum", "fail")) return { final: "Failed", note: "Invalid callback number." };
    add(x, 1, "setnum", "Validated", "Connect", "Set callback number", `Set callback number stores ${maskPhone(c.phone)}.`, "\"We will call you at the number ending " + c.phone.slice(-4) + ".\"", "Not involved");
    add(x, 2, "xfer", "Pending", "Connect", "Transfer to queue creates callback", `A NEW callback contact C2 is created in ${c.queue}, linked to C1. When queue priorities are equal, C2 uses C1's original start time.`, "\"Thanks, you can hang up now.\"", "Not involved", { contact: "C2 callback · created" });
    add(x, 2, "disc", "Pending", "Customer", "Original call disconnects", "C1 ends. The customer keeps their place without holding.", "Call ended. Free to go.", "Not involved", { contact: "C1 inbound · ended" });
    return execAgentFirst(x, { q: "cbq", agent: "agent", reroute: "agent", aw: "agent", dial: "dial", retry: "retry", cust: "conn", ow: "conn", fail: "fail", recovery: "retry" });
  },
  "agent-first"(x) {
    const c = x.c; x.t = 36000;
    add(x, 0, "cbq", "Pending", "Connect", "Callback C2 waiting", `Created at 09:58 from an inbound call. Queue: ${c.queue}.`, "Free; not on hold", "Not involved", { contact: "C2 callback" });
    if (!phoneOk(x, "cbq", "fail")) return { final: "Failed", note: "Invalid callback number." };
    add(x, 5, "prof", "Eligible", "Connect", "Routing profile match", `Agents whose routing profile includes ${c.queue} can receive it.`, "Free; not on hold", c.agents === "none" ? "No agents staffed" : "Checking agents");
    return execAgentFirst(x, { q: "cbq", agent: "agentA", reroute: "reroute", aw: "aw", dial: "dial", detect: "dial", retry: "retry", cust: "cust", ow: "ow", fail: "fail", recovery: "retry" });
  },
  "customer-first"(x) {
    const c = x.c; x.t = 36000;
    add(x, 0, "elig", "Inbound", "Orchestration", "Instance eligibility", c.eligibleInstance ? "Eligible next-generation Amazon Connect Customer instance with customer-first callbacks enabled." : "This instance is not eligible for customer-first callbacks.", "Calling", "Not involved");
    if (!c.eligibleInstance) {
      add(x, 1, "blocked", "Blocked", "Orchestration", "Customer-first not available", "Prerequisite not met. Use agent-first (the default) or upgrade the instance. Nothing is simulated beyond this point.", "Offered standard callback instead", "Not involved");
      return { final: "Blocked", note: "Instance prerequisite not met." };
    }
    add(x, 3, "c1", "Inbound", "Connect", "C1 inbound call accepts callback", "Customer queue flow offers the callback; C1 then ends.", "\"Press 1 for a callback.\"", "Not involved", { contact: "C1 inbound" });
    if (!phoneOk(x, "c1", "fail")) return { final: "Failed", note: "Invalid callback number." };
    return execCustomerSide(x, { q: "c2", dial: "c3", ccp: "ccp", xfer: "xfer", agent: "agent", reroute: "agent", cust: "agent", retry: "c4", c4: "c4", wait: "c4", fail: "fail" }, "cf");
  },
  web(x) {
    const c = x.c; x.t = 36000;
    add(x, 0, "site", "Inbound", "Customer", "Customer opens Contact us", "Northwind help center page.", "Browsing help center", "Not involved");
    add(x, 20, "form", "Requested", "Customer", "Callback form submitted", `Reason: ${c.reason}. Department: ${c.dept}. Timing: ${c.webTiming}.`, "Form submitted", "Not involved");
    if (!c.consent) { add(x, 1, "fail", "Failed", "Orchestration", "Consent missing", "The form will not submit without consent to be called.", "Please tick the consent box.", "Not involved", { custom: true }); return { final: "Failed", note: "Consent not given." }; }
    add(x, 1, "api", "Requested", "Orchestration", "POST /callbacks → 202 Accepted", "Custom API Gateway and Lambda receive the request.", "\"Request received.\"", "Not involved", { custom: true, json: { request: { name: c.name, phone: c.phone, reason: c.reason, department: c.dept, timing: c.webTiming, consent: true }, response: { status: 202, requestId: "wcb-20961" } } });
    if (!phoneOk(x, "val", "fail")) return { final: "Failed", note: "Invalid callback number." };
    if (c.webTiming === "scheduled") {
      const r = schedule(x, { iso: BASE_DATE, min: 600 }, { validate: "val", reject: "val", store: "sched", cancel: "sched" });
      if (isFin(r)) return r;
      waitUntil(x, r.iso, r.slot, "sched", "Schedule fires");
    }
    return execCustomerSide(x, { q: "sov", api: "sov", dial: "cust", ccp: "cust", xfer: "flow", agent: "agent", reroute: "agent", cust: "agent", retry: "retry", fail: "fail" }, "api");
  },
  courtesy(x) {
    const c = x.c; x.t = 14 * 3600 + 600;
    add(x, 0, "inbound", "Inbound", "Customer", `${c.name} calls during peak`, "Inbound C1. Estimated wait 23 minutes.", "Calling", "Not involved", { contact: "C1 inbound" });
    add(x, 15, "offer", "Inbound", "Connect", "Courtesy callback offered", "Customer queue flow offers a later time.", "\"We can call you back later today. What time works best for you?\"", "Not involved");
    if (!phoneOk(x, "pick", "fail")) return { final: "Failed", note: "Invalid callback number." };
    const r = schedule(x, { iso: BASE_DATE, min: 850 }, { validate: "validate", reject: "validate", store: "sched", cancel: "cancel" });
    if (isFin(r)) return r;
    add(x, 2, "inbound", "Pending", "Customer", "Original call ends", "C1 disconnects. Only the booking remains.", "Call ended. Free to go.", "Not involved", { contact: "C1 inbound · ended" });
    waitUntil(x, r.iso, r.slot, "fire", "Schedule fires at the booked time");
    return execCustomerSide(x, { q: "sov", api: "sov", dial: "cust", ccp: "cust", xfer: "agent", agent: "agent", reroute: "agent", cust: "agent", retry: "retry", fail: "fail" }, "api");
  },
  chat(x) {
    const c = x.c; x.t = 36000;
    add(x, 0, "chat", "Inbound", "Customer", "Customer starts web chat", "Chat contact begins.", "Chatting", "Not involved", { contact: "Chat contact" });
    add(x, 25, "bot", "Requested", "Connect", "Bot captures callback request", "Amazon Lex bot detects the request to talk by phone and collects the number.", "\"Can someone call me?\"", "Not involved");
    if (!phoneOk(x, "bot", "fail")) return { final: "Failed", note: "Invalid callback number." };
    add(x, 2, "ctx", "Validated", "Connect", "Context preserved", "Contact attributes store reason, order and transcript reference; RelatedContactId links chat and voice.", "\"We'll call you in a moment.\"", "Not involved", { json: { Attributes: { chatSummary: "Charged twice for order NW-55120", orderId: "NW-55120", sentiment: "frustrated" }, RelatedContactId: "chat-9f21-demo" } });
    add(x, 2, "lam", "Requested", "Orchestration", "Lambda invoked from chat flow", "Custom: Lambda calls StartOutboundVoiceContact with the chat context.", "Chat stays open", "Not involved", { custom: true });
    return execCustomerSide(x, { q: "lam", api: "lam", dial: "cust", ccp: "cust", xfer: "q", agent: "agent", reroute: "agent", cust: "agent", retry: "retry", fail: "fail" }, "api");
  },
  external(x) {
    const c = x.c; x.t = 36000; const sys = SYSTEMS[c.system] ?? c.system;
    add(x, 0, "cust", "Requested", "Customer", "Callback requested", `${c.name} asks for a callback about a ${sys} issue.`, "Requested a callback", "Not involved");
    add(x, 2, "connect", "Requested", "Connect", "Flow invokes Lambda", "Invoke AWS Lambda function block.", "\"We'll call you when we can complete this.\"", "Not involved");
    if (!phoneOk(x, "lam", "fail")) return { final: "Failed", note: "Invalid callback number." };
    const R: Record<ExtStatus, number> = { available: 0, degraded: 0, unavailable: 540, maintenance: 1200, recovering: 180 };
    const res = (st: string) => ({ request: `GET /health/${c.system}`, response: { status: st, checkedAt: fmtClock(x.t), dependency: sys } });
    add(x, 1, "ext", "Pending", "Orchestration", `Availability check: ${c.ext}`, `${sys} reports ${c.ext}.`, "Waiting for confirmation", "Not involved", { custom: true, json: res(c.ext) });
    if (c.ext === "degraded") add(x, 1, "decide", "Eligible", "Orchestration", "Degraded: proceed with warning", "Policy allows read operations in degraded mode; agent is warned.", "Call coming soon", "Will see degraded banner", { custom: true });
    else if (c.ext !== "available") {
      add(x, 1, "decide", "Pending", "Orchestration", "Decision: hold callback", "Business rule: do not call until the dependency can complete the request.", "Request recorded", "Not involved", { custom: true });
      add(x, 1, "pend", "Pending", "Orchestration", "Pending state recorded", "DynamoDB item status=PENDING_DEPENDENCY. Step Functions waits.", "Request recorded", "Not involved", { custom: true, json: { pk: "CB#48213", status: "PENDING_DEPENDENCY", dependency: c.system, ttl: c.extTimeout * 60 } });
      const start = x.t;
      if (c.trigger === "polling") {
        let ok = false;
        for (let i = 1; i <= c.extLimit; i++) {
          x.t = start + i * c.poll - 1;
          const elapsed = i * c.poll; const st = elapsed >= R[c.ext] ? "available" : elapsed >= R[c.ext] - 120 ? "recovering" : c.ext;
          if (elapsed > c.extTimeout * 60) { add(x, 1, "fail", "Expired", "Orchestration", "Dependency timeout", `No availability within ${c.extTimeout} min. Callback expired; customer would be contacted by another channel by policy.`, "Not called back", "Not involved", { custom: true }); return { final: "Expired", note: "Dependency timeout." }; }
          add(x, 1, "sfn", "Pending", "Orchestration", `Poll ${i} of ${c.extLimit}: ${st}`, `Step Functions Wait ${c.poll}s, then Lambda rechecks.`, "Waiting", "Not involved", { custom: true, json: res(st) });
          if (st === "available") { ok = true; break; }
        }
        if (!ok) { add(x, 1, "fail", "Failed", "Orchestration", "Retry limit reached", `${c.extLimit} checks did not find the system available.`, "Not called back", "Not involved", { custom: true }); return { final: "Failed", note: "Dependency retry limit reached." }; }
      } else {
        if (R[c.ext] > c.extTimeout * 60) { x.t = start + c.extTimeout * 60; add(x, 0, "fail", "Expired", "Orchestration", "No availability event before timeout", `Waited ${c.extTimeout} min for an event.`, "Not called back", "Not involved", { custom: true }); return { final: "Expired", note: "Dependency timeout." }; }
        x.t = start + R[c.ext];
        add(x, 0, "eb", "Pending", "Orchestration", "EventBridge event: system available", "Event-driven: the system publishes a status change; a rule resumes the waiting execution with a task token.", "Waiting", "Not involved", { custom: true, json: { "detail-type": "DependencyStatusChanged", detail: { system: c.system, status: "available" } } });
      }
      add(x, 1, "decide", "Eligible", "Orchestration", "Eligibility re-evaluated: proceed", "Dependency available. The callback is released.", "Call coming soon", "Not involved", { custom: true });
    } else add(x, 1, "decide", "Eligible", "Orchestration", "Decision: proceed now", "Dependency available.", "Call coming soon", "Not involved", { custom: true });
    return execCustomerSide(x, { q: "sov", api: "sov", dial: "phone", ccp: "phone", xfer: "q", agent: "agent", reroute: "agent", cust: "agent", retry: "sfn", fail: "fail" }, "api");
  },
  availability(x) {
    const c = x.c; x.t = 36000;
    const el = eligibility(c); const free = el.find((a) => a.id === c.freeAgent)!;
    add(x, 0, "cbq", "Queued", "Connect", `Callback waiting in ${c.queue}`, "No eligible agent is Available yet.", "Free; not on hold", "Not involved", { contact: "Callback contact" });
    if (!phoneOk(x, "cbq", "fail")) return { final: "Failed", note: "Invalid callback number." };
    if (c.agents === "none") { add(x, 900, "dash", "Expired", "Connect", "No agents staffed", "Nobody is signed in, so no agent becomes Available and nothing executes.", "No call received", "No agents signed in"); return { final: "Expired", note: "No agents staffed." }; }
    add(x, 2, "prof", "Pending", "Connect", "Routing profile check", `${el.filter((a) => a.inProfile).length} of 5 agents have ${c.queue} in their routing profile.`, "Free", "Not involved");
    add(x, 90, "dash", "Pending", "Agent", `${free.name} becomes Available`, `${free.name}: ${free.reason}.`, "Free", `${free.name} now Available`);
    add(x, 1, "profc", free.eligible ? "Eligible" : "Pending", "Connect", free.eligible ? "Proficiency met" : "Not eligible: keeps waiting", free.reason, "Free", free.eligible ? "Eligible" : "Ineligible");
    if (free.eligible) x.agent = free.id;
    else {
      add(x, 120, "fb", "Queued", "Connect", "Fallback: relaxed requirement", "Explicit flow/routing step: after 120s the requirement relaxes to the General Support queue. Availability does not guarantee an immediate callback.", "Free", "Theo Lindqvist eligible");
      x.queue = "Support"; x.agent = pickAgent({ ...c, minProf: 1 }, "Support");
    }
    return c.mode === "customer-first"
      ? (c.eligibleInstance ? execCustomerSide(x, { q: "agent", dial: "dial", ccp: "dial", xfer: "agent", agent: "agent", reroute: "agent", cust: "conn", retry: "retry", fail: "fail" }, "cf") : (add(x, 1, "fail", "Blocked", "Orchestration", "Customer-first not available", "Instance not eligible.", "Not called", "Not involved"), { final: "Blocked" as Final, note: "Instance prerequisite not met." }))
      : execAgentFirst(x, { q: "agent", agent: "agent", reroute: "agent", dial: "dial", retry: "retry", cust: "conn", fail: "fail" });
  },
  vip(x) {
    const c = x.c; x.t = 36000;
    add(x, 0, "crm", "Requested", "Orchestration", "CRM event: urgent case", `Case CS-70412 severity ${c.severity}.`, "Submitted urgent request online", "Not involved", { custom: true, json: { event: "case.created", caseId: "CS-70412", severity: c.severity, customerId: "CUS-11873" } });
    add(x, 1, "lookup", "Requested", "Orchestration", "Customer lookup", "Lambda reads the CRM profile.", "Waiting", "Not involved", { custom: true, json: { customerId: "CUS-11873", tier: c.tier, accountValue: "$1.84M", openCases: 2 } });
    if (!phoneOk(x, "lookup", "fail")) return { final: "Failed", note: "Invalid callback number." };
    const vip = c.tier === "VIP" || (c.tier === "Gold" && c.severity === "Critical");
    add(x, 1, "classify", "Validated", "Orchestration", vip ? "Classified: priority callback" : "Classified: standard callback", `Tier ${c.tier} + severity ${c.severity}${vip ? ` → VIP Care queue, priority ${c.priority}` : " → standard Billing queue"}.`, "Waiting", "Not involved", { custom: true });
    x.queue = vip ? (c.team === "Private Client Desk" ? "VIP Care" : "Billing") : "Billing";
    const pq = eligibility({ ...c, queue: x.queue, minProf: 1 }).find((a) => a.id === c.preferredAgent);
    const prefOk = vip && !!pq && pq.eligible && pq.status !== "Offline" && c.agents !== "none";
    x.agent = prefOk ? c.preferredAgent : c.agents === "none" ? "" : pickAgent({ ...c, minProf: 1 }, x.queue);
    add(x, 1, "classify", "Validated", "Orchestration", prefOk ? `Preferred agent ${agentName(c.preferredAgent)} targeted` : vip ? `Preferred agent not usable: routing to ${x.agent ? agentName(x.agent) : "no one"}` : "Standard routing", vip ? (prefOk ? `${agentName(c.preferredAgent)} serves ${x.queue} for team ${c.team}; agent queue targeted first.` : `${agentName(c.preferredAgent)} ${!pq?.inProfile ? `does not serve ${x.queue} (team ${c.team})` : "is offline"}. Falls back to the next qualified agent.`) : "No preferred-agent targeting for standard tier.", "Waiting", "Not involved", { custom: true });
    add(x, 1, "orch", "Scheduled", "Orchestration", "Step Functions orchestration", "Custom workflow sets contact attributes and the routing target.", "Waiting", "Not involved", { custom: true });
    if (c.reach === "later") add(x, 3600, "orch", "Pending", "Orchestration", "Waiting for customer availability window", "Customer said they are free after 11:00. Custom wait.", "Busy until 11:00", "Not involved", { custom: true });
    const cc = c.reach === "unreachable" ? { ...c, failure: "no-answer" as Failure, failAttempts: 9 } : c; x.c = cc;
    const tq = vip ? "prio" : "std";
    return execCustomerSide(x, { q: "sov", api: "sov", dial: "phone", ccp: "phone", xfer: tq, agent: vip && prefOk ? "pref" : "agent", reroute: "agent", cust: vip && prefOk ? "pref" : "agent", retry: "later", fail: "fail" }, "api");
  },
  ai(x) {
    const c = x.c; x.t = 36000;
    add(x, 0, "cust", "Inbound", "Customer", "Customer talks to AI agent", "Conversational AI agent answers.", "\"I was billed twice.\"", "Not involved");
    add(x, 8, "ai", "Inbound", "Orchestration", "AI conversation", "AI agent handles the dialog.", "\"I can help, or arrange a callback.\"", "Not involved", { custom: true });
    add(x, 6, "intent", "Requested", "Orchestration", "Intent: billing dispute, needs human", "Confidence 0.91. Policy: disputes over $500 go to a person.", "\"I'd like a person to call me.\"", "Not involved", { custom: true });
    add(x, 20, "collect", "Requested", "Orchestration", "Details collected", "Reason, number and callback window captured.", "Shared number and window", "Not involved", { custom: true });
    if (!phoneOk(x, "collect", "fail")) return { final: "Failed", note: "Invalid callback number." };
    if (!c.aiConfirm) { add(x, 4, "cancel", "Canceled", "Customer", "Customer declines confirmation", "No request created.", "\"Never mind.\"", "Not involved"); return { final: "Canceled", note: "Customer did not confirm." }; }
    add(x, 4, "confirm", "Validated", "Orchestration", "Customer confirms request", "Summary read back and confirmed.", "\"Yes, that's right.\"", "Not involved", { custom: true });
    add(x, 1, "payload", "Scheduled", "Orchestration", "Structured request created", "Custom payload; AI orchestration is not a native callback feature.", "Confirmation number CB-48213", "Not involved", { custom: true, json: { intent: "BillingDispute", confidence: 0.91, phone: c.phone, window: "today 11:00-13:00 ET", summary: "Charged twice ($612.40) for invoice NW-2211; wants refund of duplicate.", priority: 2 } });
    add(x, 2, "sched", "Scheduled", "Orchestration", "Queued for 11:00 window", "Scheduler holds the request until the window opens.", "Free until 11:00", "Not involved", { custom: true });
    waitUntil(x, BASE_DATE, 660, "sched", "Window opens");
    return execCustomerSide(x, { q: "sov", api: "sov", dial: "phone", ccp: "phone", xfer: "agent", agent: "agent", reroute: "agent", cust: "agent", retry: "retry", fail: "fail" }, "api");
  },
  "after-hours"(x) {
    const c = x.c; x.t = DAY + 19 * 3600 + 2400;
    add(x, 0, "inbound", "Inbound", "Customer", `${c.name} calls at 7:40 PM`, "Wednesday evening before Thanksgiving.", "Calling", "Not involved", { contact: "C1 inbound" });
    add(x, 3, "hours", "Inbound", "Connect", "Check hours of operation: closed", "Hours: Mon to Fri 8:00 AM to 6:00 PM ET, holiday overrides for 26 and 27 Nov.", "\"We're closed right now.\"", "Not involved");
    add(x, 2, "windows", "Inbound", "Orchestration", "Service windows offered", `Next available: ${(() => { const n = nextOpen({ iso: "2026-11-25", min: 1180 }); return n ? `${dayLabel(n.iso)} ${fmt12(n.slot)}` : "none"; })()} ET (holidays and weekend skipped).`, "\"The next opening is Monday at 8:30 AM.\"", "Not involved", { custom: true });
    if (!phoneOk(x, "select", "fail")) return { final: "Failed", note: "Invalid callback number." };
    const r = schedule(x, { iso: "2026-11-25", min: 1180 }, { validate: "select", reject: "reject", store: "sched", cancel: "reject" });
    if (isFin(r)) return r;
    add(x, 2, "inbound", "Pending", "Customer", "Call ends", "Only the booking remains.", "Free to go", "Not involved", { contact: "C1 inbound · ended" });
    waitUntil(x, r.iso, r.slot, "opens", "Business opens: schedule fires");
    return execCustomerSide(x, { q: "sov", api: "sov", dial: "cust", ccp: "cust", xfer: "agent", agent: "agent", reroute: "agent", cust: "agent", retry: "reject", fail: "fail" }, "api");
  },
  recovery(x) {
    const c = x.c; x.t = 36000;
    add(x, 0, "attempt", "Queued", "Connect", `Callback ready (${c.mode})`, c.mode === "agent-first" ? "Native agent-first retry settings apply." : c.mode === "customer-first" ? "Customer-first: agent-first retry settings do NOT apply." : "Custom outbound API: all retry logic is application-level.", "Free", "Not involved");
    if (!phoneOk(x, "attempt", "failed")) return { final: "Failed", note: "Invalid callback number." };
    const m: M = { q: "attempt", agent: "attempt", reroute: "attempt", dial: "attempt", redial: "newatt", detect: "detect", ccp: "detect", retry: "decide", wait: "wait", c4: "decide", cust: "done", xfer: "done", fail: "failed", recovery: "esc", api: "attempt" };
    if (c.mode === "customer-first" && !c.eligibleInstance) { add(x, 1, "failed", "Blocked", "Orchestration", "Customer-first not available", "Instance not eligible.", "Not called", "Not involved"); return { final: "Blocked", note: "Instance prerequisite not met." }; }
    const f = c.mode === "agent-first" ? execAgentFirst(x, m) : execCustomerSide(x, m, c.mode === "customer-first" ? "cf" : "api");
    if (f.final === "Failed" && c.customRecovery && !x.ev.some((e) => e.node === "esc")) add(x, 2, "esc", "Rescheduled", "Orchestration", "Escalated (custom)", `Custom escalation creates a follow-up${c.zendesk ? " and Zendesk ticket via the configured integration" : ""}.`, "Follow-up planned", "Task queued", { custom: true });
    return f;
  },
};

export function simulateCallback(id: ScenarioId, cfg: CbConfig): CbResult {
  const x: X = { ev: [], t: 0, c: cfg, attempts: [], agent: "", queue: cfg.queue };
  const fin = BUILD[id](x);
  const events = x.ev;
  const req = events.find((e) => e.life === "Requested") ?? events[0];
  const con = events.find((e) => e.life === "Connected");
  const extFor = id === "external" ? `${SYSTEMS[cfg.system]}: ${events.some(e => e.label === "Eligibility re-evaluated: proceed") ? "available" : cfg.ext}` : "None";
  const experience: Record<Final, string> = {
    Completed: "Received the requested return call and reached an agent. Any queue wait is shown in the timeline.",
    "Connected to voicemail": "Received a voicemail message; no human conversation took place.",
    Failed: "Did not get a successful callback. The failure is visible, not silent.",
    Expired: "The promised window passed without a call; follow-up depends on policy.",
    Canceled: "Canceled cleanly; no call was placed.",
    Blocked: "Customer-first is not offered on this instance; standard callback remains available.",
    "Served live": "Waited a short time and was answered live.",
  };
  const agentAssigned = x.agent && (con || events.some((e) => e.layer === "Agent" && e.label.includes(agentName(x.agent)))) ? agentName(x.agent) : "None";
  return {
    events,
    attempts: x.attempts,
    attributes: { callbackType: id, queue: x.queue, tier: x.c.tier, reason: cfg.reason, mode: id === "customer-first" ? "customer-first" : id === "recovery" || id === "availability" ? cfg.mode : ["queued", "agent-first"].includes(id) ? "agent-first" : "custom outbound", phone: maskPhone(cfg.phone) },
    outcome: {
      final: fin.final, summary: fin.note,
      requested: fmtClock(req.t), executed: con ? fmtClock(con.t) : "Not executed",
      queue: x.queue, agent: agentAssigned, attempts: x.attempts.length, dependency: extFor, experience: experience[fin.final],
    },
  };
}

/* ---------- Command center dataset ---------- */
export type CcStatus = "Pending" | "Scheduled" | "Queued" | "Dialing" | "Connected" | "Completed" | "Failed" | "Expired";
export type CcRecord = { id: string; type: ScenarioId; status: CcStatus; queue: string; date: string; tier: "Standard" | "Gold" | "VIP"; requested: number; delay: number; customer: string };
const FIRST = ["Lena", "Omar", "Priya", "Kofi", "Ines", "Ravi", "Hana", "Mateo", "Zoe", "Ilse", "Tariq", "June"];
const LAST = ["Hoffmann", "Haddad", "Natarajan", "Mensah", "Duarte", "Kapoor", "Sato", "Ruiz", "Adeyemi", "Berg", "Qureshi", "Park"];
export const CC_DATES = ["2026-11-23", "2026-11-24", "2026-11-25"];
export const CC_QUEUES = ["Billing", "Support", "Claims", "VIP Care"];
export const CC_DATA: CcRecord[] = (() => {
  let s = 48213; const r = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
  const st: CcStatus[] = ["Completed", "Completed", "Completed", "Completed", "Completed", "Failed", "Expired", "Pending", "Scheduled", "Scheduled", "Queued", "Dialing", "Connected"];
  return Array.from({ length: 64 }, (_, i) => {
    const date = CC_DATES[Math.floor(r() * 3)];
    const status = date === "2026-11-25" || r() > 0.55 ? st[Math.floor(r() * st.length)] : st[Math.floor(r() * 7)];
    const tier = r() > 0.82 ? "VIP" : r() > 0.6 ? "Gold" : "Standard";
    return { id: `CB-${48100 + i * 7}`, type: SCENARIO_IDS[Math.floor(r() * 12)], status, queue: tier === "VIP" && r() > 0.4 ? "VIP Care" : CC_QUEUES[Math.floor(r() * 3)], date, tier, requested: 480 + Math.floor(r() * 600), delay: 2 + Math.floor(r() * 58) + Math.round(r() * 9) / 10, customer: `${FIRST[i % 12]} ${LAST[(i * 5) % 12]}` };
  });
})();
export type CcFilter = { type: string; status: string; queue: string; date: string; tier: string };
export const CC_ALL: CcFilter = { type: "all", status: "all", queue: "all", date: "all", tier: "all" };
/** Advance one fictional request; every dashboard surface still derives from these same rows. */
export function advanceCc(data: CcRecord[]) {
  const stages: Partial<Record<CcStatus, CcStatus>> = { Pending: "Scheduled", Scheduled: "Queued", Queued: "Dialing", Dialing: "Connected", Connected: "Completed" };
  const next = [...data].filter(r => stages[r.status]).sort((a, b) => b.date.localeCompare(a.date) || b.requested - a.requested)[0];
  return next ? data.map(r => r.id === next.id ? { ...r, status: stages[r.status]! } : r) : data;
}
export function filterCc(f: CcFilter, data = CC_DATA) {
  return data.filter((d) => (f.type === "all" || d.type === f.type) && (f.status === "all" || d.status === f.status) && (f.queue === "all" || d.queue === f.queue) && (f.date === "all" || d.date === f.date) && (f.tier === "all" || d.tier === f.tier));
}
const REACHED: Record<CcStatus, number> = { Pending: 0, Scheduled: 1, Queued: 2, Dialing: 3, Failed: 3, Expired: 1, Connected: 4, Completed: 5 };
export function ccMetrics(rows: CcRecord[]) {
  const n = (s: CcStatus) => rows.filter((r) => r.status === s).length;
  const completed = n("Completed"), failed = n("Failed") + n("Expired");
  const done = rows.filter((r) => r.status === "Completed");
  return {
    total: rows.length, pending: n("Pending"), scheduled: n("Scheduled"), queued: n("Queued"), progress: n("Dialing") + n("Connected"), completed, failed,
    success: completed + failed ? Math.round((completed / (completed + failed)) * 1000) / 10 : 0,
    avgDelay: done.length ? Math.round((done.reduce((a, r) => a + r.delay, 0) / done.length) * 10) / 10 : 0,
    funnel: [["Requested", rows.length], ["Scheduled or queued", rows.filter((r) => REACHED[r.status] >= 1 && r.status !== "Expired").length], ["Dialed", rows.filter((r) => REACHED[r.status] >= 3).length], ["Connected", rows.filter((r) => REACHED[r.status] >= 4).length], ["Completed", completed]] as [string, number][],
    timeline: Array.from({ length: 10 }, (_, i) => { const h = 8 + i; const rs = rows.filter((r) => Math.floor(r.requested / 60) === h); return { h, scheduled: rs.filter((r) => r.status === "Scheduled" || r.status === "Pending").length, active: rs.filter((r) => ["Queued", "Dialing", "Connected"].includes(r.status)).length, done: rs.filter((r) => r.status === "Completed").length, failed: rs.filter((r) => r.status === "Failed" || r.status === "Expired").length }; }),
    feed: [...rows].sort((a, b) => b.date.localeCompare(a.date) || b.requested - a.requested).slice(0, 8),
  };
}

/* ---------- Value calculator (illustrative only) ---------- */
export type ValueIn = { calls: number; overThreshold: number; takeUp: number; holdMin: number; abandon: number };
export function valueCalc(v: ValueIn) {
  const offered = Math.round(v.calls * v.overThreshold / 100);
  const accepted = Math.round(offered * v.takeUp / 100);
  return { offered, accepted, holdHours: Math.round(accepted * v.holdMin / 6) / 10, abandonsAvoidedUpTo: Math.round(accepted * v.abandon / 100) };
}
