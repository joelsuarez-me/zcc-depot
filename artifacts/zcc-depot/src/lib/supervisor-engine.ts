import { QUEUES, STATES, ACTIONS, type Snapshot, type Agent, type AgentState, type Contact, type Scenario, type SimConfig, type Queue, type ActionId, type ActionOptions, type AlertRule, type AlertMetric, type Metrics } from "./supervisor-types";
import { metrics } from "./supervisor-metrics";

const NAMES = ["Avery Chen", "Jordan Rivera", "Morgan Brooks", "Riley Patel", "Samira Ali", "Casey Nguyen", "Taylor Okafor", "Alex Kim", "Noor Hassan", "Drew Martinez", "Jamie Wilson", "Quinn Davis", "Charlie Park", "Emery Scott", "Sage Thomas", "Cameron Lee", "Robin Garcia", "Harper Singh", "Blair Evans", "Reese Young", "Skyler Brown", "Rowan Hughes", "Finley Reed", "Dakota Bell"];
export const DEFAULT_CONFIG: SimConfig = { arrivalRate: 4.8, agents: 24, talk: 120, acw: 30, breakSeconds: 180, concurrency: 2, slThreshold: 20, slTarget: 80 };
export const DEFAULT_RULES: AlertRule[] = [
  ["waiting", "High queue depth", 20], ["serviceLevel", "Service level below target", 70],
  ["oldest", "Longest wait exceeded", 120], ["available", "Agent availability low", 3],
  ["abandonment", "High abandonment rate", 15], ["acw", "Extended after contact work", 100],
  ["volume", "Unusual contact volume", 12], ["overflow", "Queue overflow activated", 0],
  ["integration", "Integration failure", 0], ["incident", "Operational incident", 0],
].map(([metric, name, threshold], i) => ({ id: `rule-${metric}`, metric: metric as AlertMetric, name: String(name), threshold: Number(threshold), interval: 20, severity: i % 3 === 1 ? "Critical" : "Warning", notification: "Inline", destination: "Supervisor desk", enabled: true }));

function makeAgent(i: number, at: number, queue?: Queue): Agent {
  const q = queue ?? QUEUES[Math.floor(i / 4) % QUEUES.length];
  const skills: Queue[] = q === "Spanish Support" ? ["Spanish Support", "General Support"] :
    q === "Technical Support" || q === "VIP Support" ? ["Technical Support", "VIP Support", "General Support"] : ["General Support", "Billing", "Sales"];
  return { id: `AG-${String(i + 1).padStart(3, "0")}`, name: NAMES[i] ?? `Demo specialist ${i + 1}`, team: q === "Technical Support" || q === "VIP Support" ? "Specialist Support" : q === "Spanish Support" ? "Bilingual Services" : "Service Operations",
    profile: `${q} · ${i % 4 === 2 ? "digital" : "voice"}`, queues: q === "VIP Support" && i % 4 === 0 ? [q, "General Support"] : q === "Technical Support" && i % 4 === 0 ? [q, "VIP Support"] : [q], channel: i === 7 ? "Task" : i % 4 === 2 ? "Chat" : "Voice",
    state: "Available", since: at, contacts: [], enabled: true, retiring: false, skills,
    availableSeconds: 0, contactSeconds: 0, acwSeconds: 0, transitions: [{ at, state: "Available", text: "Fictional shift started" }] };
}
function agentState(a: Agent, state: AgentState, at: number, text: string): Agent {
  if (a.state === state) return a;
  return { ...a, state, since: at, transitions: [...a.transitions, { at, state, text }].slice(-60) };
}
function log(s: Snapshot, text: string) { s.log = [...s.log, { at: s.clock, text }].slice(-120); }
function contactEvent(c: Contact, at: number, text: string): Contact { return { ...c, timeline: [...c.timeline, { at, text }] }; }
function baseContact(s: Snapshot, queue?: Queue): Contact {
  const n = s.contacts.length + 1;
  const channel = n % 23 === 0 ? "Task" : n % 10 === 0 ? "Chat" : "Voice";
  const q = queue ?? (channel === "Task" ? "Technical Support" : QUEUES[(n - 1) % 6]);
  return { id: `DEMO-${String(n).padStart(6, "0")}`, ticket: `#${48000 + n}`, channel, queue: q,
    intent: ["Order update", "Account access", "Invoice question", "Service disruption", "Product guidance", "Delivery follow-up"][n % 6],
    status: "Incoming", arrived: s.clock, since: s.clock, legs: [], talk: s.config.talk + (n % 5) * 10,
    acw: s.config.acw, hold: n % 7 === 0 ? 20 : 0, handlingSeconds: 0, acwSeconds: 0,
    patience: 160 + (n % 7) * 20, timeline: [{ at: s.clock, text: "Incoming fictional customer contact" }] };
}
function queued(c: Contact, at: number, queue = c.queue) {
  return contactEvent({ ...c, queue, status: "Waiting", since: at, legs: [...c.legs, { queue, enqueue: at }] }, at, `Entered ${queue}`);
}
function exitQueue(c: Contact, at: number, reason: "Answered" | "Abandoned" | "Callback" | "Overflow", agent?: string): Contact {
  return { ...c, legs: c.legs.map((l, i) => i === c.legs.length - 1 ? { ...l, exit: at, reason, agent } : l) };
}
function canTake(s: Snapshot, a: Agent, c: Contact) {
  return a.enabled && !a.retiring && a.queues.includes(c.queue) && a.channel === c.channel &&
    (a.state === "Available" || (c.channel === "Chat" && a.state === "On Contact" && a.contacts.length < s.config.concurrency));
}
function connect(s: Snapshot, c: Contact, a: Agent): Contact {
  const acwMultiplier = s.scenario === "acw" && s.tick <= 48 ? 4 : 1;
  const next = contactEvent({ ...exitQueue(c, s.clock, "Answered", a.id), agent: a.id, team: a.team, profile: a.profile, answer: s.clock,
    status: "Connected", since: s.clock, acw: s.config.acw * acwMultiplier }, s.clock, `Assigned to ${a.name}; channel and queue eligibility matched${c.queue === "VIP Support" ? "; configured illustrative VIP priority applied before ordinary FIFO" : ""}`);
  next.legs = next.legs.map((l, i) => i === next.legs.length - 1 ? { ...l, team: a.team, profile: a.profile } : l);
  s.agents = s.agents.map(x => x.id === a.id ? agentState({ ...x, contacts: [...x.contacts, c.id] }, "On Contact", s.clock, `Accepted ${c.id}`) : x);
  return next;
}
function transfer(s: Snapshot, c: Contact, to: Queue, label: string): Contact {
  if (c.status !== "Waiting") return c;
  const exited = exitQueue(c, s.clock, "Overflow");
  return contactEvent(queued(exited, s.clock, to), s.clock, label);
}
function refreshAgents(s: Snapshot) {
  s.agents = s.agents.map(a => {
    const active = s.contacts.filter(c => c.agent === a.id && ["Connected", "After Contact Work"].includes(c.status));
    const ids = active.map(c => c.id);
    const next = { ...a, contacts: ids };
    if (active.some(c => c.status === "Connected")) return agentState(next, "On Contact", s.clock, "Handling active customer contact");
    if (active.length) return agentState(next, "After Contact Work", s.clock, "Recording interaction outcome");
    if (a.handoffAcwUntil !== undefined && s.clock < a.handoffAcwUntil) return agentState(next, "After Contact Work", s.clock, "Recording transferred contact outcome");
    next.handoffAcwUntil = undefined;
    if (!a.enabled || a.retiring) return agentState(next, "Offline", s.clock, "Shift capacity removed after active work finished");
    if (a.state === "On Contact" || a.state === "After Contact Work") return agentState(next, "Available", s.clock, "Ready for the next eligible contact");
    if (a.returnAt !== undefined && s.clock >= a.returnAt) return agentState({ ...next, returnAt: undefined }, "Available", s.clock, "Returned from scheduled non-productive time");
    return next;
  });
}
export function scenarioArrivalRate(s: Snapshot) {
  const pressure = s.scenario === "normal" ? 0 : s.tick <= 36 ? 1 : Math.max(0, (60 - s.tick) / 24);
  const factor = s.scenario === "spike" ? 3 : ["vip", "incident", "overflow"].includes(s.scenario) ? 2.5 : 0;
  return s.config.arrivalRate * (1 + factor * pressure);
}
function alertValue(s: Snapshot, m: Metrics, metric: AlertMetric): number | null {
  switch (metric) {
    case "waiting": return m.waiting; case "serviceLevel": return m.serviceLevel; case "oldest": return m.oldest;
    case "available": return m.available; case "abandonment": return m.abandonment;
    case "acw": { const xs = s.contacts.filter(c => c.status === "After Contact Work"); return xs.length ? Math.max(...xs.map(c => c.acwSeconds)) : 0; }
    case "volume": return s.contacts.filter(c => c.arrived > s.clock - 60).length;
    case "overflow": return Number(s.overflow); case "integration": return Number(!s.integrationHealthy); case "incident": return Number(s.incident);
  }
}
function breaches(metric: AlertMetric, value: number | null, threshold: number) {
  return value !== null && (metric === "serviceLevel" || metric === "available" ? value < threshold : value > threshold);
}
function evaluateAlerts(s: Snapshot) {
  const m = metrics(s, { from: s.clock - 900, to: s.clock });
  for (const rule of s.rules) {
    if (s.clock % Math.max(10, Math.round(rule.interval / 10) * 10) !== 0) continue;
    const value = alertValue(s, m, rule.metric), active = rule.enabled && breaches(rule.metric, value, rule.threshold);
    const old = [...s.alerts].reverse().find(a => a.ruleId === rule.id && a.state !== "Resolved");
    if (!active && old) s.alerts = s.alerts.map(a => a.id === old.id ? { ...a, state: "Resolved", value: value ?? 0, updated: s.clock, history: [...a.history, { at: s.clock, text: "Condition returned to normal" }] } : a);
    else if (active && !old) {
      const episode = 1 + Math.max(0, ...s.alerts.filter(a => a.ruleId === rule.id).map(a => Number(a.id.split(":").at(-1)) || 0));
      s.alerts = [...s.alerts, { id: `${rule.id}-${s.clock}:${episode}`, ruleId: rule.id, name: rule.name, metric: rule.metric, value: value!, threshold: rule.threshold,
        severity: rule.severity, state: "Warning" as const, since: s.clock, updated: s.clock, notification: rule.notification, destination: rule.destination,
        history: [{ at: s.clock, text: "Normal → Warning: configured threshold breached; inline simulation only" }] }].slice(-120);
    } else if (active && old) {
      const status = old.state === "Acknowledged" ? "Acknowledged" : rule.severity === "Critical" && s.clock - old.since >= rule.interval * 2 ? "Critical" : "Warning";
      s.alerts = s.alerts.map(a => a.id === old.id ? { ...a, state: status, value: value!, updated: s.clock, history: status !== old.state ? [...a.history, { at: s.clock, text: `${old.state} → ${status}: condition persisted` }] : a.history } : a);
    }
  }
}
function frame(s: Snapshot): Snapshot {
  const agents = Object.fromEntries(s.agents.map(a => {
    const activeQueues = [...new Set(s.contacts.filter(c => a.contacts.includes(c.id)).map(c => c.queue))];
    const queues = activeQueues.length ? activeQueues : a.queues;
    return [a.id, { state: a.state, queue: queues[0], queues, contact: ["On Contact", "After Contact Work"].includes(a.state), available: a.state === "Available" && a.enabled, team: a.team, profile: a.profile, channel: a.channel }];
  }));
  const m = metrics(s, { from: s.clock - 900, to: s.clock });
  const record = { at: s.clock, agents, waiting: m.waiting, handled: m.handled, offered: m.offered, abandoned: m.abandoned, serviceLevel: m.serviceLevel, asa: m.asa, aht: m.aht, occupancy: m.occupancy };
  // Coalesce instantaneous edits at the same simulation time.
  s.frames = s.frames[s.frames.length - 1]?.at === s.clock ? [...s.frames.slice(0, -1), record] : [...s.frames, record];
  return s;
}
export function createSupervisor(scenario: Scenario = "normal"): Snapshot {
  let s: Snapshot = { clock: 0, tick: 0, scenario: "normal", config: { ...DEFAULT_CONFIG }, agents: Array.from({ length: 24 }, (_, i) => makeAgent(i, 0)),
    contacts: [], rules: DEFAULT_RULES.map(r => ({ ...r })), alerts: [], overflow: false, overflowSource: "General Support", overflowTarget: "Sales", overflowThreshold: 3,
    announcement: false, callback: false, integrationHealthy: true, incident: false, log: [], frames: [], impacts: [], arrivalRemainder: 0, escalation: { step: 0 } };
  s.agents = s.agents.map((a, i) => i === 3 ? agentState({ ...a, returnAt: 180 }, "Break", 0, "Scheduled break") :
    i === 11 ? agentState({ ...a, returnAt: 600 }, "Lunch", 0, "Scheduled lunch") :
    i === 15 ? agentState(a, "Offline", 0, "Off shift") :
    i === 19 ? agentState({ ...a, returnAt: 450 }, "Custom Status", 0, "Training") : a);
  s = frame(s);
  for (let i = 0; i < 120; i++) s = stepSupervisor(s);
  s = { ...s, scenario, tick: 0, alerts: [], impacts: [], log: [{ at: s.clock, text: "Twenty-minute deterministic baseline loaded. Press Start or Next Step; no real contacts or notifications." }] };
  return s;
}
export function stepSupervisor(previous: Snapshot): Snapshot {
  const s: Snapshot = { ...previous, clock: previous.clock + 10, tick: previous.tick + 1, agents: previous.agents.map(a => ({ ...a })), contacts: [...previous.contacts], alerts: [...previous.alerts] };
  s.agents = s.agents.map(a => ({ ...a, availableSeconds: a.availableSeconds + (a.state === "Available" ? 10 : 0), contactSeconds: a.contactSeconds + (a.state === "On Contact" ? 10 : 0), acwSeconds: a.acwSeconds + (a.state === "After Contact Work" ? 10 : 0) }));
  if (s.tick === 1) {
    log(s, `Scenario: ${s.scenario}. Synthetic arrivals and lifecycle drive every panel.`);
    if (s.scenario === "incident") { s.incident = true; log(s, "Technical support service incident declared"); }
    if (s.scenario === "shortage") {
      const candidates = [...s.agents].sort((a, b) => Number(a.state !== "Available") - Number(b.state !== "Available")).filter(a => a.enabled).slice(0, 6).map(a => a.id);
      s.agents = s.agents.map(a => candidates.includes(a.id) ? { ...a, enabled: false, retiring: true, shortage: true } : a);
      s.config = { ...s.config, agents: s.agents.filter(a => a.enabled).length };
      log(s, "Six agents removed from staffing; any in-progress contacts finish safely");
    }
  }
  if (s.tick === 48 && s.scenario === "shortage") {
    s.agents = s.agents.map(a => a.shortage ? agentState({ ...a, enabled: true, retiring: false, shortage: false }, a.contacts.length ? a.state : "Available", s.clock, "Relief staffing returned") : a);
    s.config = { ...s.config, agents: s.agents.filter(a => a.enabled).length };
    log(s, "Relief staffing restored; historical service-level recovery still takes time");
  }
  if (s.tick === 60 && s.scenario !== "normal") { log(s, "Scenario pressure subsided; remaining backlog recovers through configured capacity"); s.incident = false; }
  s.contacts = s.contacts.map(c => {
    // Preserve immutable terminal objects across playback history instead of cloning archives every tick.
    if (["Completed", "Abandoned", "Callback"].includes(c.status) && c.legs.every(l => l.reason !== "Answered" || l.completed !== undefined)) return c;
    c = { ...c, legs: c.legs.map(l => l.reason === "Answered" && l.disconnect !== undefined && l.completed === undefined && s.clock >= l.disconnect + (l.acw ?? 0) ? { ...l, completed: s.clock } : l) };
    if (c.status === "Incoming") return contactEvent({ ...c, status: "IVR", since: s.clock }, s.clock, s.announcement && (!s.announcementQueue || s.announcementQueue === c.queue) ? "Configured emergency announcement played" : "Contact flow performs IVR");
    if (c.status === "IVR") return queued(c, s.clock);
    if (c.status === "Connected") {
      const handlingSeconds = s.clock - c.answer!;
      if (c.id === s.escalation.contactId && s.escalation.step < 8) return { ...c, handlingSeconds, talk: Math.max(c.talk, handlingSeconds - c.hold) };
      if (handlingSeconds < c.talk + c.hold) return { ...c, handlingSeconds };
      return closeInteraction(c, s.clock, c.talk + c.hold);
    }
    if (c.status === "After Contact Work") {
      const acwSeconds = s.clock - c.disconnect!;
      return acwSeconds >= c.acw ? contactEvent({ ...c, acwSeconds: c.acw, status: "Completed", since: s.clock, completed: s.clock }, s.clock, "Interaction outcome recorded; ACW complete") : { ...c, acwSeconds };
    }
    return c;
  });
  refreshAgents(s);
  const total = s.arrivalRemainder + scenarioArrivalRate(s) / 6;
  const number = Math.floor(total + 1e-9);
  s.arrivalRemainder = total - number;
  for (let i = 0; i < number; i++) {
    const targeted = s.scenario === "vip" ? "VIP Support" : s.scenario === "incident" ? "Technical Support" : s.scenario === "overflow" ? "General Support" : undefined;
    // Extra arrivals target the crisis queue; normal background traffic continues.
    const c = baseContact(s, targeted && (s.contacts.length + i) % 3 !== 0 ? targeted : undefined);
    if (targeted && c.channel === "Task" && targeted !== "Technical Support") c.channel = "Voice";
    s.contacts.push(c);
  }
  if (s.overflow) applyOverflow(s);
  const routed = new Map<string, Contact>();
  // Demonstrates configured queue priority then oldest-first, not Connect's proprietary router.
  const waiting = s.contacts.filter(c => c.status === "Waiting").sort((a, b) => Number(b.queue === "VIP Support") - Number(a.queue === "VIP Support") || a.legs[a.legs.length - 1].enqueue - b.legs[b.legs.length - 1].enqueue || a.id.localeCompare(b.id));
  for (const c of waiting) {
    const wait = s.clock - c.legs[c.legs.length - 1].enqueue;
    const serial = Number(c.id.slice(-6));
    // Opt-in must vary within each queue, not reuse parity (queue IDs cycle in sixes).
    const optsIn = (serial + Math.floor(serial / 6)) % 3 !== 0;
    if (s.callback && (!s.callbackQueue || s.callbackQueue === c.queue) && c.channel === "Voice" && wait >= 40 && optsIn) {
      routed.set(c.id, contactEvent({ ...exitQueue(c, s.clock, "Callback"), status: "Callback", since: s.clock, disconnect: s.clock, completed: s.clock }, s.clock, "Customer selected illustrative callback; no outbound call scheduled")); continue;
    }
    const a = s.agents.find(a => canTake(s, a, c));
    if (a) { routed.set(c.id, connect(s, c, a)); continue; }
    if (wait >= c.patience && c.id !== s.escalation.contactId) routed.set(c.id, contactEvent({ ...exitQueue(c, s.clock, "Abandoned"), status: "Abandoned", since: s.clock, disconnect: s.clock, completed: s.clock }, s.clock, "Customer abandoned the queue"));
  }
  s.contacts = s.contacts.map(c => routed.get(c.id) ?? c);
  refreshAgents(s);
  if (s.clock % 600 === 0) {
    const a = s.agents.find(a => a.enabled && a.state === "Available" && a.channel === "Voice");
    if (a) s.agents = s.agents.map(x => x.id === a.id ? agentState({ ...x, returnAt: s.clock + s.config.breakSeconds }, "Break", s.clock, "Scheduled break began") : x);
  }
  evaluateAlerts(s);
  return frame(s);
}
function applyOverflow(s: Snapshot) {
  let remaining = s.contacts.filter(c => c.status === "Waiting" && c.queue === s.overflowSource).length;
  s.contacts = s.contacts.map(c => {
    if (c.status === "Waiting" && c.queue === s.overflowSource && remaining > s.overflowThreshold &&
      s.clock - c.legs[c.legs.length - 1].enqueue >= 30 && s.agents.some(a => a.enabled && a.queues.includes(s.overflowTarget) && a.channel === c.channel)) {
      remaining--;
      return transfer(s, c, s.overflowTarget, `Configured overflow path: ${s.overflowSource} → ${s.overflowTarget}`);
    }
    return c;
  });
}
export function configureSupervisor(previous: Snapshot, changes: Partial<SimConfig>): Snapshot {
  const bounds: Record<keyof SimConfig, [number, number]> = { arrivalRate: [0, 60], agents: [1, 60], talk: [20, 600], acw: [0, 300], breakSeconds: [0, 1800], concurrency: [1, 5], slThreshold: [1, 600], slTarget: [1, 100] };
  const config = { ...previous.config };
  for (const [key, value] of Object.entries(changes)) {
    if (!(key in bounds) || !Number.isFinite(value)) continue;
    const k = key as keyof SimConfig, [low, high] = bounds[k];
    config[k] = Math.max(low, Math.min(high, ["agents", "concurrency"].includes(k) ? Math.round(value) : value));
  }
  const s = { ...previous, config, agents: [...previous.agents], contacts: [...previous.contacts], alerts: [...previous.alerts] };
  if (changes.agents !== undefined) {
    while (s.agents.length < config.agents) s.agents.push(makeAgent(s.agents.length, s.clock));
    s.agents = s.agents.map((a, i) => i < config.agents ? (a.enabled ? a : agentState({ ...a, enabled: true, retiring: false }, a.contacts.length ? a.state : "Available", s.clock, "Configured staffing increased")) :
      { ...agentState(a, a.contacts.length ? a.state : "Offline", s.clock, "Configured staffing reduced; active work finishes"), enabled: false, retiring: !!a.contacts.length });
  }
  log(s, "Shared operating assumptions updated; active work finishes before reassignment or retirement.");
  evaluateAlerts(s);
  return frame(s);
}
export function setAlertRules(previous: Snapshot, rules: AlertRule[]): Snapshot {
  const ids = new Set<string>();
  const valid = rules.filter(r => r.id && !ids.has(r.id) && (ids.add(r.id), true) && Number.isFinite(r.threshold) && Number.isFinite(r.interval) &&
    DEFAULT_RULES.some(d => d.metric === r.metric)).map(r => ({ ...r, threshold: Math.max(0, r.threshold), interval: Math.max(10, Math.round(r.interval / 10) * 10), destination: r.destination.slice(0, 120) }));
  const alerts = previous.alerts.map(a => {
    if (a.state === "Resolved" || a.ruleId === "manual") return a;
    const before = previous.rules.find(r => r.id === a.ruleId), after = valid.find(r => r.id === a.ruleId);
    return JSON.stringify(before) === JSON.stringify(after) ? a : { ...a, state: "Resolved" as const, updated: previous.clock, history: [...a.history, { at: previous.clock, text: "Rule configuration changed; this episode closed. The new rule is evaluated on its interval." }] };
  });
  const s = { ...previous, rules: valid, alerts }; log(s, "Threshold rules saved locally; no real notification is sent."); return s;
}
export function acknowledgeAlert(s: Snapshot, id: string): Snapshot {
  return { ...s, alerts: s.alerts.map(a => a.id === id && a.state !== "Resolved" ? { ...a, state: "Acknowledged", updated: s.clock, history: [...a.history, { at: s.clock, text: "Supervisor acknowledged the illustrative alert" }] } : a) };
}
export function resolveAlert(s: Snapshot, id: string): Snapshot {
  const a = s.alerts.find(a => a.id === id), r = s.rules.find(r => r.id === a?.ruleId);
  if (a && r && r.enabled && breaches(r.metric, alertValue(s, metrics(s, { from: s.clock - 900 }), r.metric), r.threshold)) {
    const next = { ...s }; log(next, "Alert cannot resolve while the configured condition is still breached; acknowledge it or restore performance."); return next;
  }
  return { ...s, alerts: s.alerts.map(a => a.id === id ? { ...a, state: "Resolved", updated: s.clock, history: [...a.history, { at: s.clock, text: "Supervisor resolved the cleared condition" }] } : a) };
}
export function intervene(previous: Snapshot, action: ActionId, options: ActionOptions = {}): Snapshot {
  let s: Snapshot = { ...previous, agents: [...previous.agents], contacts: [...previous.contacts], alerts: [...previous.alerts] };
  const before = metrics(s, { from: s.clock - 900 }), queue = options.queue ?? "General Support", target = options.targetQueue ?? "VIP Support";
  let explanation = "";
  if (action === "agent-state") {
    const a = s.agents.find(a => a.id === options.agentId);
    const state = options.value as AgentState;
    if (!a || a.contacts.length || a.handoffAcwUntil && a.handoffAcwUntil > s.clock || !STATES.includes(state) || ["On Contact", "After Contact Work"].includes(state)) explanation = "Choose an idle agent and an administrative status. Active handling/ACW must finish; contact states come from actual simulation events.";
    else { s.agents = s.agents.map(x => x.id === a.id ? agentState({ ...x, enabled: state !== "Offline", retiring: false, returnAt: ["Break", "Lunch", "Custom Status"].includes(state) ? s.clock + s.config.breakSeconds : undefined }, state, s.clock, "Illustrative agent-requested/admin-permitted status transition") : x); explanation = `${a.name}: simulated ${state}. A real status change requires the applicable user action, permission and supported API/workflow.`; }
  } else if (action === "reassign") {
    const a = s.agents.find(a => (!options.agentId || a.id === options.agentId) && a.enabled && a.state === "Available" && a.skills.includes(target) && !a.queues.includes(target));
    if (a) { s.agents = s.agents.map(x => x.id === a.id ? { ...x, queues: [target], profile: `Flex · ${target}` } : x); explanation = `${a.name} reassigned to ${target} using an eligible simulated profile. Existing calls are not interrupted.`; }
    else explanation = "No idle agent with the required destination skills is eligible. Change the agent/destination or wait for active work to finish.";
  } else if (action === "overflow") {
    if (queue === target || !s.agents.some(a => a.enabled && a.queues.includes(target))) explanation = "Choose a different destination with eligible staffing before activating the configured path.";
    else { s.overflow = true; s.overflowSource = queue; s.overflowTarget = target; applyOverflow(s); explanation = `Configured ${queue} → ${target} overflow activated above ${s.overflowThreshold} waiting and 30 seconds. This is not implicit AWS behavior.`; }
  } else if (action === "available") {
    const a = s.agents.find(a => (!options.agentId || a.id === options.agentId) && !a.contacts.length && ["Break", "Lunch", "Offline", "Custom Status"].includes(a.state));
    if (a) { s.agents = s.agents.map(x => x.id === a.id ? agentState({ ...x, enabled: true, retiring: false, shortage: false, returnAt: undefined }, "Available", s.clock, "Simulated return to work") : x); explanation = `${a.name} returned to eligible capacity. This does not demonstrate a permissionless native supervisor status override.`; }
    else explanation = "No inactive agent is eligible to return. Active contacts cannot be cleared by this control.";
  } else if (action === "escalate") {
    const c = s.contacts.find(c => (!options.contactId || c.id === options.contactId) && c.status === "Waiting" && c.queue !== target);
    if (c && s.agents.some(a => a.enabled && a.queues.includes(target) && a.channel === c.channel)) {
      s.contacts = s.contacts.map(x => x.id === c.id ? transfer(s, x, target, `Supervisor used configured escalation path to ${target}`) : x);
      explanation = `${c.id} moved to configured ${target}; its original queue leg remains in the reporting audit.`;
    } else explanation = "No waiting contact and eligible destination match. Choose another contact/destination; nothing was transferred.";
  } else if (action === "announcement") {
    s.announcement = !(s.announcement && s.announcementQueue === queue);
    s.announcementQueue = queue;
    explanation = s.announcement ? `Configured announcement enabled for subsequent ${queue} IVR arrivals. It informs callers; it does not manufacture reduced demand.` : `Announcement disabled for ${queue}.`;
  } else if (action === "callback") {
    s.callback = !(s.callback && s.callbackQueue === queue);
    s.callbackQueue = queue;
    explanation = s.callback ? `Illustrative opt-in callback offer enabled for ${queue} voice callers waiting at least 40 seconds. Callback selections are not abandoned contacts; no actual callback is scheduled.` : `Callback offer disabled for ${queue}.`;
  } else if (action === "staffing") {
    const beforeCount = s.agents.length;
    for (let i = 0; i < 3 && s.agents.length < 60; i++) { const a = makeAgent(s.agents.length, s.clock, queue); a.channel = "Voice"; a.profile = `Relief · ${queue}`; s.agents.push(a); }
    explanation = s.agents.length > beforeCount ? `Added ${s.agents.length - beforeCount} fictional agents to ${queue}; actual queue recovery depends on continuing arrivals and handle times.` : "The simulation limit of 60 agents has been reached; no additional staffing was added.";
  } else if (action === "alert") {
    s.alerts = [...s.alerts, { id: `manual-${s.clock}-${s.impacts.length}`, ruleId: "manual", name: options.value || "Supervisor operational alert", metric: "incident", value: 1, threshold: 0, severity: "Warning", state: "Warning", since: s.clock, updated: s.clock, destination: "Supervisor desk", notification: "Inline", history: [{ at: s.clock, text: "Illustrative manual alert; no external notification" }] }];
    explanation = "Manual operational alert created inline. Configure the metric rules separately for automatic threshold evaluation.";
  } else if (action === "integration-failure" || action === "integration-recover") {
    s.integrationHealthy = action === "integration-recover";
    explanation = s.integrationHealthy ? "Illustrative external integration restored." : "Illustrative external integration failure; the main contact engine continues, but conceptual enrichment is unavailable.";
  } else if (action === "resolve-incident") {
    s.incident = false; s.scenario = "normal"; explanation = "Incident demand stopped; historical indicators recover only as new closed records enter the interval.";
  } else if (action === "disposition" || action === "follow-up") {
    const c = s.contacts.find(c => c.id === options.contactId);
    if (c) { s.contacts = s.contacts.map(x => x.id === c.id ? contactEvent({ ...x, [action === "disposition" ? "disposition" : "followUp"]: options.value?.slice(0, 240) || (action === "disposition" ? "Resolved in demo" : "Fictional follow-up task") }, s.clock, action === "disposition" ? "Conceptual ticket disposition saved locally" : "Conceptual follow-up saved locally") : x); explanation = "Fictional interaction updated locally; no Zendesk ticket or real task was changed."; }
    else explanation = "Select a fictional contact before recording an outcome.";
  } else if (action === "escalation-reset") {
    s.escalation = { step: 0 }; explanation = "Escalation walkthrough reset; existing contacts retain their actual lifecycle.";
  } else if (action === "escalation-step") {
    s = advanceEscalation(s); explanation = s.log[s.log.length - 1]?.text ?? "Escalation walkthrough advanced.";
  }
  s.config = { ...s.config, agents: s.agents.filter(a => a.enabled).length };
  refreshAgents(s); log(s, explanation); evaluateAlerts(s);
  const after = metrics(s, { from: s.clock - 900 });
  const label = ACTIONS.find(a => a.id === action)?.name ?? ({ "integration-failure": "Simulated integration outage", "integration-recover": "Integration recovery", "resolve-incident": "Incident recovery", "disposition": "Record interaction outcome", "follow-up": "Record follow-up", "escalation-step": "Zendesk escalation workflow", "escalation-reset": "Reset escalation walkthrough", "agent-state": "Simulated agent status change" } as Record<string, string>)[action] ?? action;
  s.impacts = [...s.impacts, { id: s.impacts.length + 1, at: s.clock, action, label, before, after,
    recoverySeconds: estimateRecovery(s), explanation }].slice(-100);
  return frame(s);
}
function estimateRecovery(s: Snapshot): number | null {
  let longest = 0;
  const cycle = s.config.talk + 20 + 3 + s.config.acw * (s.scenario === "acw" && s.tick <= 48 ? 4 : 1);
  for (const queue of QUEUES) for (const channel of ["Voice", "Chat", "Task"] as const) {
    const count = s.contacts.filter(c => c.status === "Waiting" && c.queue === queue && c.channel === channel).length;
    if (!count) continue;
    const capacity = s.agents.filter(a => a.enabled && !a.retiring && !["Offline", "Break", "Lunch", "Custom Status"].includes(a.state) && a.queues.includes(queue) && a.channel === channel)
      .reduce((sum, a) => sum + (channel === "Chat" ? s.config.concurrency : 1) / a.queues.length, 0) * 60 / Math.max(1, cycle);
    const arrivals = s.contacts.filter(c => c.arrived > s.clock - 60 && c.channel === channel && c.legs[0]?.queue === queue).length;
    // Conservative per-pool estimate, not pooled digital slots applied to voice backlog.
    const spare = capacity - arrivals;
    if (spare <= 0) return null;
    longest = Math.max(longest, count / spare * 60);
  }
  return Math.ceil(longest);
}
function advanceEscalation(previous: Snapshot): Snapshot {
  let s = stepSupervisor(previous);
  const step = s.escalation.step >= 9 ? 1 : s.escalation.step + 1;
  if (step === 1) {
    const c = baseContact(s, "Technical Support"); c.channel = "Voice"; c.intent = "Urgent service escalation"; c.patience = 1800;
    s.contacts = [...s.contacts, c]; s.escalation = { step, contactId: c.id }; log(s, `${c.id} enters Technical Support; fictional Zendesk ticket ${c.ticket}.`); return s;
  }
  let c = s.contacts.find(c => c.id === s.escalation.contactId);
  if (!c) { log(s, "Start the escalation walkthrough first."); return s; }
  if (step === 2 && (c.status === "Incoming" || c.status === "IVR")) c = queued(c, s.clock);
  if (step === 3 && c.status === "Waiting") {
    const a = s.agents.find(a => canTake(s, a, c!));
    if (!a) { log(s, "Waiting for an eligible Technical Support agent. Add relief staffing or return an eligible agent, then retry."); return s; }
    c = connect(s, c, a);
  }
  if (step === 7 && c.status === "Connected") {
    // A supervised handoff creates a distinct queue leg; the former agent enters ACW.
    const oldAgent = c.agent;
    c = closeInteraction(c, s.clock, Math.max(0, s.clock - c.answer!));
    s.agents = s.agents.map(a => a.id === oldAgent ? { ...a, handoffAcwUntil: s.clock + c!.acw } : a);
    c = contactEvent(queued({ ...c, agent: undefined, answer: undefined, disconnect: undefined, completed: undefined, handlingSeconds: 0, acwSeconds: 0 }, s.clock, "VIP Support"), s.clock, "Configured custom escalation workflow transferred context to specialist queue");
  }
  if (step === 8) {
    if (c.status === "Waiting") {
      const a = s.agents.find(a => canTake(s, a, c!));
      if (!a) { log(s, "The specialist queue has no eligible free agent. Add VIP staffing or restore availability, then retry resolution."); return s; }
      c = connect(s, c, a);
    }
    if (c.status === "Connected") c = { ...closeInteraction(c, s.clock, Math.max(0, s.clock - c.answer!)), disposition: "Issue resolved through conceptual escalation workflow" };
  }
  if (step === 9) {
    while (c.status === "After Contact Work" && s.clock - c.disconnect! < c.acw) { s = stepSupervisor(s); c = s.contacts.find(x => x.id === c!.id)!; }
    c = contactEvent({ ...c, status: "Completed", completed: s.clock, acwSeconds: Math.min(c.acw, Math.max(0, s.clock - (c.disconnect ?? s.clock))), followUp: "Illustrative confirmation; no message sent" }, s.clock, "Conceptual ticket association and interaction outcome recorded");
  }
  const descriptions = ["", "", "Contact waits in queue", "Agent accepts eligible contact", "Customer requests escalation", "Illustrative supervisor escalation notification", "Supervisor reviews contact and ticket context", "Configured escalation workflow runs", "Specialist resolves the issue", "Interaction outcome recorded locally"];
  c = contactEvent(c, s.clock, descriptions[step]);
  s.contacts = s.contacts.map(x => x.id === c!.id ? c! : x); s.escalation = { ...s.escalation, step };
  refreshAgents(s); log(s, descriptions[step]); return s;
}
function closeInteraction(c: Contact, at: number, duration: number): Contact {
  return contactEvent({ ...c, handlingSeconds: duration, status: "After Contact Work", since: at, disconnect: at,
    legs: c.legs.map((l, i) => i === c.legs.length - 1 ? { ...l, disconnect: at, talk: Math.min(c.talk, duration), hold: Math.min(c.hold, Math.max(0, duration - c.talk)), acw: c.acw, ...(c.acw === 0 ? { completed: at } : {}) } : l),
  }, at, "Customer disconnected; agent enters ACW");
}
