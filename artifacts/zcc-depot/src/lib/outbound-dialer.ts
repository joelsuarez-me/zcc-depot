/**
 * Outbound dialer teaching engine. Deterministic, fictional and ILLUSTRATIVE.
 * The predictive pacing below is a teaching heuristic, NOT the service-managed
 * Amazon Connect predictive algorithm.
 */
export type DialMode = "predictive" | "progressive" | "preview" | "agentless";
export const DIAL_MODES: DialMode[] = ["predictive", "progressive", "preview", "agentless"];
export type AgentStatus = "available" | "talk" | "acw" | "offline" | "reserved";
export interface AgentSnap { id: string; name: string; status: AgentStatus; customer?: string; handled: number }
export interface DialCounters { dialed: number; answered: number; human: number; connected: number; abandoned: number; noAnswer: number; voicemail: number; completed: number; transferred: number; retries: number; collisions: number }
export type Tone = "go" | "warn" | "stop" | "info";
export interface DialEvent { t: number; node: number; label: string; detail: string; life: string; agents: AgentSnap[]; c: DialCounters; lines: number; tone: Tone; custom?: boolean }
export interface DialerConfig {
  agents: number; availability: number; aht: number; acw: number; answerRate: number; capacity: number; volume: number;
  voicemailRate: number; noAnswerRate: number; sharedCampaign: boolean; messageSec: number; allocation: number;
  response: "confirm" | "reschedule" | "agent" | "none"; retries: number;
}
export const DEFAULT_DIALER: DialerConfig = { agents: 5, availability: 80, aht: 240, acw: 45, answerRate: 32, capacity: 80, volume: 2400, voicemailRate: 25, noAnswerRate: 40, sharedCampaign: false, messageSec: 35, allocation: 100, response: "confirm", retries: 1 };
export const MODE_DEFAULTS: Record<DialMode, Partial<DialerConfig>> = {
  predictive: { agents: 5, availability: 80, answerRate: 32, capacity: 80, volume: 2400 },
  progressive: { agents: 4, availability: 100, answerRate: 45, capacity: 100, volume: 800, aht: 300 },
  preview: { agents: 1, availability: 100 },
  agentless: { capacity: 60, volume: 12000, answerRate: 48, messageSec: 35 },
};
export const AGENT_NAMES = ["Maya Reyes", "Theo Lindqvist", "Priya Raman", "Kofi Mensah", "Ana Duarte"];
const CUSTOMERS = ["L. Okafor", "J. Brennan", "S. Takahashi", "R. Alvarez", "M. Haddad", "C. Novak", "D. Mbeki", "A. Fontaine", "K. Ostrowski", "E. Varga", "H. Castellano", "I. Nwosu", "P. Leclerc", "G. Sato", "N. Abara", "T. Whitcombe", "O. Esposito", "V. Kaur", "B. Lindahl", "F. Moreau"];

export function rng(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export function hashOf(v: unknown): number { const s = JSON.stringify(v); let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

const zero = (): DialCounters => ({ dialed: 0, answered: 0, human: 0, connected: 0, abandoned: 0, noAnswer: 0, voicemail: 0, completed: 0, transferred: 0, retries: 0, collisions: 0 });
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Illustrative pacing ratio used ONLY for the teaching animation. */
export function illustrativeLines(anticipatedAgents: number, answerRatePct: number, capacityPct: number, remaining: number): number {
  if (anticipatedAgents <= 0 || remaining <= 0) return 0;
  const ar = clamp(answerRatePct, 1, 100) / 100;
  return Math.min(remaining, Math.max(1, Math.ceil((anticipatedAgents / ar) * (clamp(capacityPct, 1, 100) / 100))));
}

export interface DialResult { mode: DialMode; events: DialEvent[]; final: DialCounters; summary: string }
interface Ag extends AgentSnap { until: number }

function snap(ags: Ag[]): AgentSnap[] { return ags.map(({ until: _u, ...a }) => ({ ...a })); }

function makeAgents(cfg: DialerConfig): Ag[] {
  const n = clamp(Math.round(cfg.agents), 1, 5);
  const avail = Math.round(n * clamp(cfg.availability, 0, 100) / 100);
  return AGENT_NAMES.slice(0, n).map((name, i) => ({ id: `a${i}`, name, status: i < avail ? "available" : "offline", handled: 0, until: 0 }));
}
interface Done { t: number; name: string; customer?: string; kind: "acw" | "free" }
/** Advance agent work to time t; returns completions with their ACTUAL timestamps. */
function release(ags: Ag[], t: number, acw: number, c: DialCounters): Done[] {
  const out: Done[] = [];
  for (;;) {
    const due = ags.filter((a) => (a.status === "talk" || a.status === "acw" || a.status === "reserved") && a.until <= t);
    if (!due.length) return out.sort((x, y) => x.t - y.t);
    for (const a of due) {
      if (a.status === "talk") { out.push({ t: a.until, name: a.name, customer: a.customer, kind: "acw" }); a.status = "acw"; a.until = a.until + acw; c.completed++; a.handled++; }
      else { if (a.status === "acw") out.push({ t: a.until, name: a.name, kind: "free" }); a.status = "available"; a.customer = undefined; }
    }
  }
}
function finalT(ags: Ag[], acw: number) { return ags.reduce((m, a) => Math.max(m, a.status === "talk" ? a.until + acw : a.status === "acw" || a.status === "reserved" ? a.until : 0), 0); }

function simPredictive(cfg: DialerConfig): DialEvent[] {
  const r = rng(hashOf(["p", cfg])); const ags = makeAgents(cfg); const c = zero(); const ev: DialEvent[] = [];
  let remaining = cfg.volume; let ci = 0;
  let clock = 0;
  const push = (t: number, node: number, label: string, detail: string, life: string, tone: Tone, lines = 0) => { clock = Math.max(clock, t); ev.push({ t: clock, node, label, detail, life, agents: snap(ags), c: { ...c }, lines, tone }); };
  const flush = (t: number) => { for (const d of release(ags, t, cfg.acw, c)) push(d.t, d.kind === "acw" ? 7 : 5, d.kind === "acw" ? `${d.name} wraps up with ${d.customer}` : `${d.name} available again`, d.kind === "acw" ? `Talk complete; ${cfg.acw}s after contact work.` : "ACW complete; agent re-enters the pacing forecast.", d.kind === "acw" ? "ACW" : "Running", "info"); };
  push(0, 0, `Segment loaded · ${cfg.volume.toLocaleString()} fictional account-servicing contacts`, "Customer Profiles segment hydrated for the campaign; suppression and communication limits evaluated before dialing.", "Ready", "info");
  push(0, 1, "Campaign engine starts the predictive run", `Capacity allocation ${cfg.capacity}% of this campaign's share of the instance concurrent-call quota.`, "Running", "info");
  for (let k = 0; k < 6; k++) {
    const t = Math.max(k * 30, clock); flush(t);
    const avail = ags.filter((a) => a.status === "available").length;
    const soon = ags.filter((a) => (a.status === "acw" || a.status === "talk") && a.until - t <= 30).length;
    const lines = illustrativeLines(avail + soon, cfg.answerRate, cfg.capacity, remaining);
    remaining -= lines; c.dialed += lines;
    push(t, 2, `Pacing forecast · ${avail} free now + ${soon} finishing soon`, `Illustrative ratio places ${lines} line${lines === 1 ? "" : "s"} ahead of capacity. The real algorithm is service-managed and not reproduced here.`, "Running", "info", lines);
    let hum = 0, vm = 0, na = 0;
    for (let i = 0; i < lines; i++) { const x = r(); if (x < cfg.answerRate / 100) { if (r() < cfg.voicemailRate / 100) vm++; else hum++; } else na++; }
    c.answered += hum + vm; c.human += hum; c.voicemail += vm; c.noAnswer += na;
    push(t + 8, 3, `${lines} outbound calls ringing`, `${na} no answer or busy before media; ${hum + vm} answered.`, "Dialing", na > hum ? "warn" : "info", lines);
    push(t + 12, 4, `Answer detection · ${hum} human, ${vm} voicemail`, "Check call progress classifies after answer. Not detected can still be a person; classification is never perfect.", "Classifying", vm > 0 ? "warn" : "info", lines);
    let connected = 0;
    for (let i = 0; i < hum; i++) {
      const a = ags.find((g) => g.status === "available");
      if (!a) break;
      a.status = "talk"; a.until = t + 20 + cfg.aht; a.customer = CUSTOMERS[ci++ % CUSTOMERS.length]; connected++;
    }
    const ab = hum - connected; c.connected += connected; c.abandoned += ab;
    push(t + 16, 5, `Transfer to queue · ${hum} human answer${hum === 1 ? "" : "s"}`, "Latency between Check call progress and Transfer to queue is where customers wait; whispers and queue flows add to it.", "Queued", "info", lines);
    if (connected) push(t + 20, 7, `${connected} customer${connected === 1 ? "" : "s"} connected to agents`, ags.filter((a) => a.status === "talk").map((a) => `${a.name} with ${a.customer}`).join(" · "), "Connected", "go", lines);
    if (ab) push(t + 22, 6, `${ab} answered customer${ab === 1 ? "" : "s"} found no free agent`, "Over-dialing risk: a person answered and waited. Abandonment is both a CX and a regulatory consideration.", "Abandoned", "stop", lines);
  }
  const endP = finalT(ags, cfg.acw); flush(endP);
  push(endP, 7, "Illustrative window complete", `${c.connected} connected, ${c.abandoned} abandoned, ${c.noAnswer} unanswered across ${c.dialed} dials.`, "Completed", c.abandoned ? "warn" : "go");
  return ev;
}

function simProgressive(cfg: DialerConfig): DialEvent[] {
  const r = rng(hashOf(["g", cfg])); const ags = makeAgents(cfg); const c = zero(); const ev: DialEvent[] = [];
  let remaining = cfg.volume; let ci = 0; let clock = 0;
  const push = (t: number, node: number, label: string, detail: string, life: string, tone: Tone, lines = 0) => { clock = Math.max(clock, t); ev.push({ t: clock, node, label, detail, life, agents: snap(ags), c: { ...c }, lines, tone }); };
  const flush = (t: number) => { for (const d of release(ags, t, cfg.acw, c)) push(d.t, d.kind === "acw" ? 5 : 6, d.kind === "acw" ? `${d.name} completes call with ${d.customer}` : `${d.name} finishes ACW · ready for next contact`, d.kind === "acw" ? `AHT reached; ${cfg.acw}s after contact work before the next dial.` : "Prior work complete; progressive may dial again.", d.kind === "acw" ? "ACW" : "Running", "info"); };
  const alloc = clamp(cfg.allocation ?? 100, 1, 200);
  push(0, 0, `Renewal campaign · ${cfg.volume.toLocaleString()} policies`, `Capacity ${cfg.capacity}% limits how much of the available pool this campaign uses; agent allocation ${alloc}% is a relative weight (lines per agent here are illustrative).`, "Running", "info");
  for (let k = 0; k < 6 && remaining > 0; k++) {
    const t = Math.max(k * 60, clock); flush(t);
    if (cfg.sharedCampaign && k % 2 === 1) {
      const a = ags.find((g) => g.status === "available");
      if (a) { a.status = "reserved"; a.until = t + 60; c.collisions++; push(t, 0, `${a.name} claimed by another campaign`, "Shared routing profile: Claims-Followup also dials for this agent. Allocation at or under 100% reduces collisions; it does not eliminate them.", "Running", "warn"); }
    }
    const free = ags.filter((a) => a.status === "available");
    if (!free.length) { push(t, 0, "No available agent · dialer waits", "Nothing is dialed ahead of capacity; idle time is the trade-off for lower over-dial risk.", "Waiting", "info"); continue; }
    const usable = free.slice(0, Math.max(1, Math.ceil(free.length * cfg.capacity / 100)));
    if (usable.length < free.length) push(t, 0, `Capacity ${cfg.capacity}% · ${usable.length} of ${free.length} free agents used this cycle`, "Illustrative duty cycle: the remaining capacity is left for other campaigns or inbound.", "Running", "info");
    for (const a of usable) {
      const per = Math.floor(alloc / 100) + (r() < (alloc % 100) / 100 ? 1 : 0);
      for (let j = 0; j < Math.max(1, per) && remaining > 0; j++) {
        remaining--; c.dialed++; const who = CUSTOMERS[ci++ % CUSTOMERS.length];
        const t0 = clock + 2;
        push(t0, 1, `Select eligible contact · ${who}`, `${a.name} is free; the next eligible profile is selected.`, "Selected", "info", 1);
        push(t0 + 2, 2, `Initiate call to ${who}`, `Line ${j + 1} of ${Math.max(1, per)} for ${a.name} (allocation ${alloc}%).`, "Dialing", "info", 1);
        const x = r();
        if (x < cfg.noAnswerRate / 100) { c.noAnswer++; push(t0 + 22, 3, `${who} did not answer`, "A dial outcome before media; no classifier branch. Agent stays available for the next contact.", "No answer", "warn", 1); continue; }
        c.answered++;
        if (r() < cfg.voicemailRate / 100) { c.voicemail++; push(t0 + 12, 3, `Voicemail detected for ${who}`, "Check call progress voicemail branch; flow can leave a message or end. Agent not engaged.", "Voicemail", "warn", 1); continue; }
        c.human++;
        if (a.status !== "available") { c.abandoned++; push(t0 + 10, 3, `${who} answered but ${a.name} is busy`, "Illustrative: an allocation weight above 100% let two lines race for one agent.", "Abandoned", "stop", 1); continue; }
        a.status = "talk"; a.until = t0 + 12 + cfg.aht; a.customer = who; c.connected++;
        push(t0 + 12, 4, `Connect ${a.name} with ${who}`, "Human detected; Transfer to queue routes to the agent who triggered the dial.", "Connected", "go", 1);
      }
    }
  }
  const endP = finalT(ags, cfg.acw); flush(endP);
  push(endP, 6, "Next contact loop", `${c.connected} connected · ${c.noAnswer} unanswered · ${c.voicemail} voicemail · ${c.collisions} shared-pool collisions.`, "Completed", "go");
  return ev;
}

function simAgentless(cfg: DialerConfig): DialEvent[] {
  const r = rng(hashOf(["a", cfg])); const c = zero(); const ev: DialEvent[] = [];
  const quota = 20; const lines = Math.max(1, Math.round(quota * clamp(cfg.capacity, 1, 100) / 100));
  let clock = 0;
  const push = (t: number, node: number, label: string, detail: string, life: string, tone: Tone, custom?: boolean) => { clock = Math.max(clock, t); ev.push({ t: clock, node, label, detail, life, agents: [], c: { ...c }, lines, tone, custom }); };
  push(0, 0, `Maintenance segment · ${cfg.volume.toLocaleString()} fictional households`, "Utility outage-window notification. No agent is required for the automated interaction.", "Ready", "info");
  push(0, 1, "Agentless campaign running", `${lines} of an illustrative ${quota}-call concurrent quota (${cfg.capacity}% capacity).`, "Running", "info");
  let retryPool = 0;
  for (let k = 0; k < 4; k++) {
    const t = k * (75 + cfg.messageSec); const batch = lines; c.dialed += batch;
    let hum = 0, vm = 0, na = 0;
    for (let i = 0; i < batch; i++) { const x = r(); if (x < cfg.answerRate / 100) { if (r() < cfg.voicemailRate / 100) vm++; else hum++; } else na++; }
    c.answered += hum + vm; c.human += hum; c.voicemail += vm; c.noAnswer += na;
    push(t + 2, 2, `Automated dialing · ${batch} lines`, k > 0 && retryPool ? `Includes retries; initial attempts take precedence over retries.` : "Calls placed by the campaign without agent reservation.", "Dialing", "info");
    push(t + 10, 3, `Answer detection · ${hum} human · ${vm} voicemail · ${na} no answer`, "No-answer and busy are dial outcomes; human and voicemail are Check call progress branches.", "Classifying", "info");
    push(t + 14, 4, `Recorded message · ${cfg.messageSec}s maintenance notice`, `${vm} voicemail branch${vm === 1 ? "" : "es"} leave a shorter message after the beep.`, "Messaging", "info");
    if (cfg.response === "confirm") { c.completed += hum + vm; push(t + 14 + cfg.messageSec, 5, `${hum} customers pressed 1 to confirm`, "IVR self-service captures the acknowledgement as a contact attribute.", "Responded", "go"); }
    else if (cfg.response === "reschedule") { c.completed += hum + vm; push(t + 14 + cfg.messageSec, 5, `${hum} customers chose a new service slot`, "Self-service reschedule via flow + Lambda lookup (custom integration).", "Responded", "go", true); }
    else if (cfg.response === "agent") { const tr = Math.ceil(hum / 3); c.transferred += tr; c.completed += hum + vm - tr; c.connected += tr; push(t + 14 + cfg.messageSec, 5, `${tr} customers pressed 0 for an agent`, "Optional Transfer to queue configured in the flow; a staffed queue is then required.", "Transferred", "warn"); }
    else { c.completed += hum + vm; push(t + 14 + cfg.messageSec, 5, "Message played; no input requested", "Notification-only flow ends after the prompt.", "Responded", "info"); }
    retryPool = cfg.retries > k ? na : 0; if (retryPool) { c.retries += retryPool; push(t + 20 + cfg.messageSec, 2, `${retryPool} unanswered queued for retry ${k + 1} of ${cfg.retries}`, "Retry behavior configured on the campaign; spacing illustrative.", "Retry", "warn"); }
  }
  push(clock + 5, 6, "Notification wave complete", `${c.completed} automated interactions completed (not agent-connected calls) · ${c.transferred} transferred.`, "Completed", "go");
  return ev;
}

/** Shared suppression feeds final dial eligibility: suppressed contacts in the list are removed before dialing. */
export function eligibleVolume(volume: number, suppressed: number): { eligible: number; removed: number } {
  const removed = Math.max(0, Math.min(volume, Math.round(suppressed)));
  return { eligible: volume - removed, removed };
}
export function simulateDialer(mode: Exclude<DialMode, "preview">, cfg: DialerConfig, suppressed = 0): DialResult {
  const { eligible, removed } = eligibleVolume(cfg.volume, suppressed);
  const c2 = { ...cfg, volume: eligible };
  const events = mode === "predictive" ? simPredictive(c2) : mode === "progressive" ? simProgressive(c2) : simAgentless(c2);
  if (removed > 0) events.splice(1, 0, { ...events[0], label: `${removed.toLocaleString()} of ${cfg.volume.toLocaleString()} contacts removed by shared suppression`, detail: "DNC, opt-out and consent revocation entries in the shared store make these profiles ineligible to dial.", tone: "stop", custom: true });
  if (eligible === 0) return { mode, events: events.slice(0, 2), final: events[0].c, summary: "No eligible contacts after suppression; nothing dialed." };
  const final = events[events.length - 1].c;
  return { mode, events, final, summary: events[events.length - 1].detail };
}

export type PlaybackAction = "play" | "pause" | "next" | "prev" | "reset" | "tick" | "end";
export interface Playback { index: number; running: boolean }
export function advance(p: Playback, a: PlaybackAction, len: number): Playback {
  const last = Math.max(0, len - 1);
  switch (a) {
    case "play": return { index: p.index >= last ? 0 : p.index, running: true };
    case "pause": return { ...p, running: false };
    case "next": return { index: Math.min(last, p.index + 1), running: false };
    case "prev": return { index: Math.max(0, p.index - 1), running: false };
    case "reset": return { index: 0, running: false };
    case "end": return { index: last, running: false };
    case "tick": return p.index >= last ? { index: last, running: false } : { index: p.index + 1, running: true };
  }
}

/* ---------------- Preview dialing state machine ---------------- */
export type PreviewPhase = "queued" | "reviewing" | "ringing" | "talk" | "wrap" | "done" | "removed" | "noanswer";
export interface PreviewLog { t: number; text: string; tone: Tone }
export interface PreviewState { idx: number; phase: PreviewPhase; countdown: number; reviewSec: number; reviewed: boolean; t: number; log: PreviewLog[]; tally: { completed: number; removed: number; noAnswer: number; skipped: number }; disposition?: string }
export type PreviewAction = { type: "review" } | { type: "tick" } | { type: "dial" } | { type: "answer" } | { type: "noanswer" } | { type: "complete"; disposition?: string } | { type: "remove" } | { type: "next"; isSuppressed?: (idx: number) => boolean; total: number } | { type: "setReview"; sec: number } | { type: "reset" };

export const initialPreview = (reviewSec = 30): PreviewState => ({ idx: 0, phase: "queued", countdown: reviewSec, reviewSec, reviewed: false, t: 0, log: [{ t: 0, text: "Campaign contact delivered to agent preview workspace", tone: "info" }], tally: { completed: 0, removed: 0, noAnswer: 0, skipped: 0 } });

export function previewReduce(s: PreviewState, a: PreviewAction): PreviewState {
  const log = (text: string, tone: Tone = "info", dt = 0): PreviewState => ({ ...s, t: s.t + dt, log: [...s.log, { t: s.t + dt, text, tone }] });
  switch (a.type) {
    case "reset": return initialPreview(s.reviewSec);
    case "setReview": { const sec = clamp(Math.round(a.sec), 5, 120); return { ...s, reviewSec: sec, countdown: s.phase === "reviewing" ? Math.min(s.countdown, sec) : sec }; }
    case "review": if (s.phase !== "queued" && s.phase !== "reviewing") return s; return { ...log("Agent opens customer profile and history", "info"), phase: "reviewing", reviewed: true };
    case "tick": {
      if (s.phase === "queued") return { ...s, phase: "reviewing", t: s.t + 1 };
      if (s.phase !== "reviewing") return s;
      if (s.countdown <= 1) return { ...log("Preview timer elapsed · this simulation places the call automatically", "warn", 1), phase: "ringing", countdown: 0 };
      return { ...s, countdown: s.countdown - 1, t: s.t + 1 };
    }
    case "dial": if (s.phase !== "reviewing" && s.phase !== "queued") return s; return { ...log("Agent selects Dial · campaign places the outbound call", "go"), phase: "ringing" };
    case "answer": if (s.phase !== "ringing") return s; return { ...log("Customer answered · conversation in progress", "go", 6), phase: "talk" };
    case "noanswer": if (s.phase !== "ringing") return s; return { ...log("No answer · dial outcome recorded, retry per campaign rules", "warn", 30), phase: "noanswer", tally: { ...s.tally, noAnswer: s.tally.noAnswer + 1 } };
    case "complete": if (s.phase !== "talk") return s; return { ...log(`Contact completed · disposition ${a.disposition ?? "Appointment confirmed"}`, "go", 180), phase: "done", disposition: a.disposition ?? "Appointment confirmed", tally: { ...s.tally, completed: s.tally.completed + 1 } };
    case "remove": if (s.phase !== "reviewing" && s.phase !== "queued") return s; return { ...log("Agent removes contact from campaign (where supported)", "stop"), phase: "removed", tally: { ...s.tally, removed: s.tally.removed + 1 } };
    case "next": {
      if (s.phase === "ringing" || s.phase === "talk") return s;
      let idx = s.idx; let skipped = 0;
      for (let n = 0; n < a.total; n++) { idx = (idx + 1) % a.total; if (!a.isSuppressed?.(idx)) break; skipped++; }
      const base = { ...s, idx, phase: "queued" as PreviewPhase, countdown: s.reviewSec, reviewed: false, disposition: undefined, tally: { ...s.tally, skipped: s.tally.skipped + skipped } };
      return { ...base, log: [...s.log, ...(skipped ? [{ t: s.t, text: `${skipped} suppressed contact${skipped > 1 ? "s" : ""} skipped by shared suppression list`, tone: "stop" as Tone }] : []), { t: s.t, text: "Next contact delivered to preview", tone: "info" }] };
    }
  }
}
export function previewNode(s: PreviewState): number {
  switch (s.phase) { case "queued": return 0; case "reviewing": return s.reviewed ? 2 : 1; case "ringing": return 4; case "talk": return 5; case "noanswer": case "removed": return 3; default: return 6; }
}

/* ---------------- Decision assistant ---------------- */
export interface DecisionInput { objective: "sales" | "service" | "notification" | "collections" | "care"; size: "small" | "medium" | "large"; staffing: "none" | "limited" | "ample"; personalization: "low" | "medium" | "high"; sensitivity: "low" | "medium" | "high"; automation: "none" | "partial" | "full" }
export const DEFAULT_DECISION: DecisionInput = { objective: "service", size: "large", staffing: "ample", personalization: "low", sensitivity: "low", automation: "none" };
export function recommendDialer(i: DecisionInput): { mode: DialMode; scores: Record<DialMode, number>; reasons: string[] } {
  const s: Record<DialMode, number> = { predictive: 0, progressive: 0, preview: 0, agentless: 0 }; const why: string[] = [];
  if (i.staffing === "none") { s.agentless += 6; s.predictive -= 6; s.progressive -= 6; s.preview -= 6; why.push("No staffed agents: only agentless avoids needing a person on the line."); }
  if (i.automation === "full") { s.agentless += 5; why.push("Full automation favours an agentless flow with optional transfer."); }
  if (i.automation === "partial") { s.agentless += 1; s.progressive += 1; }
  if (i.personalization === "high") { s.preview += 5; s.predictive -= 2; why.push("High personalization: agents need review time before dialing."); }
  if (i.personalization === "medium") { s.progressive += 2; s.preview += 1; }
  if (i.sensitivity === "high") { s.preview += 3; s.predictive -= 4; s.progressive += 1; why.push("High sensitivity: avoid any risk of answered-and-waiting customers."); }
  if (i.sensitivity === "medium") { s.progressive += 2; s.predictive -= 1; }
  if (i.size === "large") { s.predictive += 3; s.agentless += 2; why.push("Large lists reward pacing ahead of capacity or automation."); }
  if (i.size === "medium") s.progressive += 2;
  if (i.size === "small") { s.preview += 2; s.progressive += 1; }
  if (i.staffing === "ample") { s.predictive += 3; s.progressive += 1; } else if (i.staffing === "limited") { s.progressive += 3; s.preview += 1; why.push("Limited staffing: dial only when an agent is free."); }
  const obj: Record<DecisionInput["objective"], Partial<Record<DialMode, number>>> = { sales: { predictive: 2, progressive: 1 }, service: { progressive: 2, predictive: 1 }, notification: { agentless: 4 }, collections: { progressive: 2, preview: 1 }, care: { preview: 3 } };
  for (const [m, v] of Object.entries(obj[i.objective])) s[m as DialMode] += v as number;
  const mode = DIAL_MODES.reduce((b, m) => (s[m] > s[b] ? m : b), "predictive" as DialMode);
  return { mode, scores: s, reasons: why.length ? why : ["Balanced inputs; the highest weighted fit is shown."] };
}

/* ---------------- Answering machine detection ---------------- */
export type AmdOutcome = "human" | "machine-beep" | "voicemail-no-beep" | "no-answer" | "busy" | "failure" | "uncertain";
export const AMD_OUTCOMES: { id: AmdOutcome; label: string }[] = [
  { id: "human", label: "Human answered" }, { id: "machine-beep", label: "Answering machine detected" }, { id: "voicemail-no-beep", label: "Voicemail (no beep)" },
  { id: "no-answer", label: "No answer" }, { id: "busy", label: "Busy" }, { id: "failure", label: "Call failure" }, { id: "uncertain", label: "Classification uncertain" },
];
export interface AmdOptions { mode: DialMode; classification: boolean; agentWhisper: boolean; customerWhisper: boolean; queueFlowSec: number; uncertainAs: "not-detected" | "error" }
export interface AmdResult { phase: "dial-outcome" | "classifier" | "unsupported" | "disabled"; branch: string | null; path: string[]; final: string; latency: { label: string; ms: number }[]; totalMs: number; notes: string[]; tone: Tone }
export function evaluateCallProgress(o: AmdOutcome, opt: AmdOptions): AmdResult {
  const notes: string[] = [];
  if (o === "no-answer" || o === "busy" || o === "failure") {
    const f = o === "no-answer" ? "No answer · ring time elapsed" : o === "busy" ? "Busy signal" : "Call failure before media";
    return { phase: "dial-outcome", branch: null, path: ["dial", "dial-outcome"], final: `${f}. Recorded as a dial outcome; eligible for campaign retry.`, latency: [], totalMs: 0, notes: ["Not a Check call progress branch: no media was established to classify."], tone: "warn" };
  }
  if (opt.mode === "preview") return { phase: "unsupported", branch: null, path: ["dial", "answered", "direct"], final: "Preview: Check call progress is not supported. Disable call classification; the agent hears the answer directly.", latency: [{ label: "Answer to agent audio", ms: 300 }], totalMs: 300, notes: ["AWS guidance: disable call classification for preview dialing."], tone: "info" };
  if (!opt.classification) return { phase: "disabled", branch: null, path: ["dial", "answered", "direct"], final: "Classification disabled: every answer, including machines, follows the flow as answered.", latency: [{ label: "Answer to flow", ms: 300 }], totalMs: 300, notes: ["Agents may hear voicemail greetings."], tone: "warn" };
  const lat: { label: string; ms: number }[] = [{ label: "Check call progress analysis", ms: 1800 }];
  let branch = "", final = "", tone: Tone = "go";
  if (o === "human") {
    branch = "Call answered";
    if (opt.mode === "agentless") { final = "Plays recorded message / IVR; optional transfer per flow."; }
    else {
      lat.push({ label: "Transfer to queue", ms: 400 });
      if (opt.customerWhisper) lat.push({ label: "Customer whisper", ms: 2500 });
      if (opt.queueFlowSec) lat.push({ label: "Customer queue flow", ms: opt.queueFlowSec * 1000 });
      if (opt.agentWhisper) lat.push({ label: "Agent whisper", ms: 3000 });
      final = "Connected to an agent.";
    }
  } else if (o === "machine-beep") { branch = "Voicemail beep"; final = "Leave message after beep, then disconnect."; tone = "warn"; }
  else if (o === "voicemail-no-beep") { branch = "Voicemail no beep"; final = "Play short message or end; timing is best effort."; tone = "warn"; }
  else { branch = opt.uncertainAs === "error" ? "Error" : "Not detected"; final = opt.uncertainAs === "error" ? "Error branch: end or retry per flow design." : "Not detected: may still be a human. Many designs route to the queue anyway."; tone = "warn"; notes.push("Classification is not perfectly accurate."); }
  const totalMs = lat.reduce((a, b) => a + b.ms, 0);
  if (totalMs > 4000) notes.push("Long post-answer delay increases hang-ups and abandonment risk.");
  return { phase: "classifier", branch, path: ["dial", "answered", "ccp", branch], final, latency: lat, totalMs, notes, tone };
}
