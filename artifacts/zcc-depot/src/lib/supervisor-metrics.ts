import { QUEUES, type Snapshot, type Filter, type Metrics, type Queue, type SimConfig, type Channel, type Agent } from "./supervisor-types";

export type ReportRow = {
  id: string; contactId: string; queue: Queue; channel: Channel; enqueue: number;
  exit: number; disconnect: number; wait: number;
  reason: "Answered" | "Abandoned" | "Callback" | "Overflow";
  agent?: string; team?: string; profile?: string; talk: number; hold: number; acw: number;
};
const inRange = (t: number, f: Filter) => t >= (f.from ?? -Infinity) && t <= (f.to ?? Infinity);
const avg = (xs: number[]) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
export function reportRows(s: Snapshot, f: Filter = {}): ReportRow[] {
  const rows: ReportRow[] = [];
  for (const c of s.contacts) c.legs.forEach((l, i) => {
    if (l.exit === undefined || !l.reason) return;
    // A formed answered record is available after ACW; still attributed to disconnect.
    if (l.reason === "Answered" && l.completed === undefined) return;
    const disconnect = l.reason === "Answered" ? l.disconnect! : l.exit;
    if (!inRange(disconnect, f) || (f.queue && l.queue !== f.queue) ||
        (f.channel && c.channel !== f.channel) || (f.agent && l.agent !== f.agent) ||
        (f.team && l.team !== f.team) || (f.profile && l.profile !== f.profile)) return;
    rows.push({
      id: `${c.id}:${i}`, contactId: c.id, queue: l.queue, channel: c.channel, enqueue: l.enqueue,
      exit: l.exit, disconnect, wait: Math.max(0, l.exit - l.enqueue), reason: l.reason,
      agent: l.agent, team: l.team, profile: l.profile,
      talk: l.reason === "Answered" ? l.talk ?? 0 : 0,
      hold: l.reason === "Answered" ? l.hold ?? 0 : 0,
      acw: l.reason === "Answered" ? l.acw ?? 0 : 0,
    });
  });
  return rows;
}
export function serviceLevel(rows: ReportRow[], threshold: number, answeredOnly = false) {
  // Both measures use the entire queued-record denominator. Answered-only is CUSTOM.
  const numerator = rows.filter(r => r.wait <= threshold && (answeredOnly ? r.reason === "Answered" : ["Answered", "Abandoned", "Callback"].includes(r.reason))).length;
  return { numerator, denominator: rows.length, percentage: rows.length ? numerator / rows.length * 100 : null };
}
export function metrics(s: Snapshot, f: Filter = {}): Metrics {
  const rows = reportRows(s, f);
  const answered = rows.filter(r => r.reason === "Answered");
  const agents = s.agents.filter(a => (!f.queue || a.queues.includes(f.queue)) && (!f.agent || a.id === f.agent) &&
    (!f.team || a.team === f.team) && (!f.profile || a.profile === f.profile) && (!f.channel || a.channel === f.channel));
  const waiting = s.contacts.filter(c => c.status === "Waiting" && (!f.queue || c.queue === f.queue) && (!f.channel || c.channel === f.channel) &&
    (!f.agent && !f.team && !f.profile));
  let occupied = 0, idle = 0;
  // Piecewise-constant agent activity, clipped to the requested time interval.
  for (let i = 0; i < s.frames.length; i++) {
    const frame = s.frames[i], end = s.frames[i + 1]?.at ?? s.clock;
    const dt = Math.max(0, Math.min(end, f.to ?? s.clock) - Math.max(frame.at, f.from ?? 0));
    if (!dt) continue;
    for (const [id, a] of Object.entries(frame.agents)) {
      if ((f.agent && id !== f.agent) || (f.queue && !(a.queues ?? [a.queue]).includes(f.queue)) || (f.channel && a.channel !== f.channel) ||
          (f.team && a.team !== f.team) || (f.profile && a.profile !== f.profile)) continue;
      if (a.contact) occupied += dt; else if (a.available) idle += dt;
    }
  }
  const native = serviceLevel(rows, s.config.slThreshold), custom = serviceLevel(rows, s.config.slThreshold, true);
  const abandoned = rows.filter(r => r.reason === "Abandoned").length;
  const selectedContacts = s.contacts.filter(c => inRange(c.arrived, f) && (!f.channel || c.channel === f.channel) &&
    (!f.queue || c.legs[0]?.queue === f.queue || (!c.legs.length && c.queue === f.queue)) &&
    (!f.agent || c.agent === f.agent) && (!f.team || c.team === f.team) && (!f.profile || c.profile === f.profile));
  return {
    offered: selectedContacts.length, handled: answered.length, abandoned, waiting: waiting.length,
    serviceLevel: native.percentage, answeredServiceLevel: custom.percentage,
    asa: avg(answered.map(r => r.wait)), aht: avg(answered.map(r => r.talk + r.hold + r.acw)),
    oldest: waiting.length ? Math.max(...waiting.map(c => s.clock - c.legs[c.legs.length - 1].enqueue)) : 0,
    available: agents.filter(a => a.enabled && a.state === "Available").length,
    busy: agents.filter(a => a.state === "On Contact").length,
    acw: agents.filter(a => a.state === "After Contact Work").length,
    occupancy: occupied + idle > 0 ? occupied / (occupied + idle) * 100 : null,
    abandonment: rows.length ? abandoned / rows.length * 100 : null,
    queued: rows.length, within: native.numerator, over: rows.length - native.numerator,
    callbacks: rows.filter(r => r.reason === "Callback").length,
    active: s.contacts.filter(c => ["Incoming", "IVR", "Waiting", "Connected", "After Contact Work"].includes(c.status) &&
      (!f.queue || c.queue === f.queue) && (!f.channel || c.channel === f.channel) &&
      (!f.agent || c.agent === f.agent) && (!f.team || c.team === f.team) && (!f.profile || c.profile === f.profile)).length,
  };
}
export function queueMetrics(s: Snapshot, queue: Queue, f: Filter = {}) { return metrics(s, { ...f, queue }); }
export function capacityModel(c: SimConfig, roster?: Agent[]) {
  // A clearly labelled planning approximation, not Erlang C or Connect's router.
  const productive = Math.max(0, 1 - c.breakSeconds / 3600);
  const cycle = Math.max(1, c.talk + c.acw);
  const eligible = roster?.filter(a => a.enabled && !a.retiring && a.state !== "Offline");
  // Only digital/chat agents gain parallel slots; voice and tasks stay at one.
  const count = eligible?.length ?? c.agents;
  const totalSlots = eligible ? eligible.reduce((sum, a) => sum + (a.channel === "Chat" ? c.concurrency : 1), 0) : c.agents * (1 + 0.25 * (Math.max(1, c.concurrency) - 1));
  const slots = count > 0 ? totalSlots / count : 1;
  const capacityPerMinute = totalSlots * productive * 60 / cycle;
  const load = capacityPerMinute > 0 ? c.arrivalRate / capacityPerMinute : c.arrivalRate > 0 ? Infinity : 0;
  return {
    capacityPerMinute, load,
    requiredAgents: Math.ceil(c.arrivalRate * cycle / (60 * slots * Math.max(0.01, productive) * 0.85)),
    occupancy: Math.min(100, load * 100),
    waitSeconds: load >= 1 ? null : Math.max(0, load * cycle / Math.max(1, totalSlots) / Math.max(0.01, 1 - load)),
    throughput: Math.min(c.arrivalRate, capacityPerMinute),
  };
}
export function queueSummary(s: Snapshot, f: Filter = {}) { return QUEUES.map(queue => ({ queue, ...queueMetrics(s, queue, f) })); }
export function reportCsv(s: Snapshot, f: Filter = {}) {
  const quote = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const headers = ["record_id", "contact_id", "queue", "channel", "disconnect_sim_seconds", "queue_wait_seconds", "outcome", "agent_id", "talk_seconds", "hold_seconds", "acw_seconds"];
  return [headers.join(","), ...reportRows(s, f).map(r => [r.id, r.contactId, r.queue, r.channel, r.disconnect, r.wait, r.reason, r.agent, r.talk, r.hold, r.acw].map(quote).join(","))].join("\r\n");
}
