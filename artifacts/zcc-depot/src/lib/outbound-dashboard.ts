import { rng } from "./outbound-dialer";
/** ONE deterministic demonstration dataset. All metrics here are CUSTOM-DERIVED demonstration metrics, not live AWS data. */
export type DMode = "predictive" | "progressive" | "preview" | "agentless" | "digital";
export type DChannel = "voice" | "sms" | "email" | "whatsapp" | "web";
export type DOutcome = "connected" | "abandoned" | "voicemail" | "no-answer" | "busy" | "failed" | "automated-complete" | "delivered" | "delivery-failed" | "excluded";
export type ExclReason = "National DNC" | "Internal DNC" | "Opt-out" | "Consent revoked" | "No consent" | "Outside window" | "Frequency limit" | "No valid time zone";
export interface DRow { id: number; day: number; campaign: string; mode: DMode; channel: DChannel; queue: string; agent: string | null; segment: string; region: string; tz: string; outcome: DOutcome; attempts: number; waitSec: number; talkSec: number; acwSec: number; reason?: ExclReason }
export const CAMPAIGNS: { id: string; mode: DMode; channel: DChannel; queue: string; segment: string }[] = [
  { id: "Account Servicing Q4", mode: "predictive", channel: "voice", queue: "Servicing-Outbound", segment: "Active cardholders" },
  { id: "Policy Renewal Wave", mode: "progressive", channel: "voice", queue: "Renewals", segment: "Renewal 120d" },
  { id: "Care Coordination", mode: "preview", channel: "voice", queue: "Care-Team", segment: "Post-discharge" },
  { id: "Maintenance Notice", mode: "agentless", channel: "voice", queue: "None (agentless)", segment: "Grid zone 4" },
  { id: "Payment Reminder SMS", mode: "digital", channel: "sms", queue: "None (digital)", segment: "Due in 5d" },
  { id: "Renewal Email", mode: "digital", channel: "email", queue: "None (digital)", segment: "Renewal 120d" },
  { id: "Delivery WhatsApp", mode: "digital", channel: "whatsapp", queue: "None (digital)", segment: "Open orders" },
  { id: "Outage Web Notification", mode: "digital", channel: "web", queue: "None (digital)", segment: "Grid zone 4" },
];
export const AGENTS = ["Maya Reyes", "Theo Lindqvist", "Priya Raman", "Kofi Mensah", "Ana Duarte", "Jun Park", "Sofia Bianchi"];
export const REGIONS: { region: string; tz: string }[] = [{ region: "Northeast", tz: "Eastern" }, { region: "Southeast", tz: "Eastern" }, { region: "Midwest", tz: "Central" }, { region: "Southwest", tz: "Mountain" }, { region: "West", tz: "Pacific" }, { region: "Alaska", tz: "Alaska" }, { region: "Hawaii", tz: "Hawaii" }];
export const DAYS = 14;
export const DAY_LABEL = (d: number) => { const dt = new Date(Date.UTC(2026, 9, 31 + d)); return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }); };
const EXCL: ExclReason[] = ["National DNC", "Internal DNC", "Opt-out", "Consent revoked", "No consent", "Outside window", "Frequency limit", "No valid time zone"];
const EXCL_W = [22, 11, 14, 6, 13, 18, 12, 4];

let DATA: DRow[] | null = null;
export function dataset(): DRow[] {
  if (DATA) return DATA;
  const r = rng(4417); const rows: DRow[] = []; let id = 0;
  const w = (xs: number[]) => { const t = xs.reduce((a, b) => a + b, 0); let x = r() * t; for (let i = 0; i < xs.length; i++) { x -= xs[i]; if (x < 0) return i; } return xs.length - 1; };
  const sizes = [1400, 900, 260, 1600, 1100, 800, 600, 700];
  CAMPAIGNS.forEach((c, ci) => {
    for (let i = 0; i < sizes[ci]; i++) {
      const day = Math.floor(r() * DAYS); const reg = REGIONS[w([24, 20, 19, 12, 17, 4, 4])];
      const base = { id: ++id, day, campaign: c.id, mode: c.mode, channel: c.channel, queue: c.queue, segment: c.segment, region: reg.region, tz: reg.tz, attempts: 0, waitSec: 0, talkSec: 0, acwSec: 0, agent: null as string | null };
      if (r() < 0.11) { rows.push({ ...base, outcome: "excluded", reason: EXCL[w(EXCL_W)] }); continue; }
      if (c.channel !== "voice") { rows.push({ ...base, attempts: 1, outcome: r() < (c.channel === "email" ? 0.94 : c.channel === "web" ? 0.82 : 0.9) ? "delivered" : "delivery-failed" }); continue; }
      const attempts = 1 + (r() < 0.3 ? 1 : 0) + (r() < 0.1 ? 1 : 0);
      const ans = { predictive: 0.31, progressive: 0.44, preview: 0.58, agentless: 0.47, digital: 0 }[c.mode];
      const x = r(); let outcome: DOutcome;
      if (x < ans) {
        if (r() < 0.24) outcome = "voicemail";
        else if (c.mode === "agentless") outcome = "automated-complete";
        else outcome = c.mode === "predictive" && r() < 0.042 ? "abandoned" : c.mode === "progressive" && r() < 0.008 ? "abandoned" : "connected";
      } else outcome = r() < 0.78 ? "no-answer" : r() < 0.7 ? "busy" : "failed";
      const agent = (outcome === "connected" || outcome === "abandoned") && c.mode !== "agentless" ? AGENTS[(ci * 3 + Math.floor(r() * 5)) % AGENTS.length] : null;
      rows.push({ ...base, attempts, outcome, agent: outcome === "connected" ? agent : null, waitSec: outcome === "connected" ? +(0.6 + r() * (c.mode === "predictive" ? 3.4 : 1.4)).toFixed(1) : outcome === "abandoned" ? 6 + Math.floor(r() * 9) : 0, talkSec: outcome === "connected" ? 150 + Math.floor(r() * 330) : outcome === "automated-complete" ? 35 : 0, acwSec: outcome === "connected" ? 25 + Math.floor(r() * 70) : 0 });
    }
  });
  DATA = rows; return rows;
}
export interface DFilters { campaign: string; from: number; to: number; mode: string; channel: string; queue: string; agent: string; segment: string; region: string; outcome: string }
export const ALL = "all";
export const DEFAULT_DFILTERS: DFilters = { campaign: ALL, from: 0, to: DAYS - 1, mode: ALL, channel: ALL, queue: ALL, agent: ALL, segment: ALL, region: ALL, outcome: ALL };
export function filterRows(rows: DRow[], f: DFilters): DRow[] {
  return rows.filter((x) => (f.campaign === ALL || x.campaign === f.campaign) && x.day >= f.from && x.day <= f.to && (f.mode === ALL || x.mode === f.mode) && (f.channel === ALL || x.channel === f.channel) && (f.queue === ALL || x.queue === f.queue) && (f.agent === ALL || x.agent === f.agent) && (f.segment === ALL || x.segment === f.segment) && (f.region === ALL || x.region === f.region) && (f.outcome === ALL || x.outcome === f.outcome));
}
export const ratio = (n: number, d: number): number | null => (d > 0 ? n / d : null);
const isVoice = (x: DRow) => x.channel === "voice" && x.outcome !== "excluded";
const isHuman = (x: DRow) => x.outcome === "connected" || x.outcome === "abandoned" || x.outcome === "automated-complete";
const SUPPRESS: ExclReason[] = ["National DNC", "Internal DNC", "Opt-out", "Consent revoked"];
export interface Kpi { id: string; label: string; value: number | null; fmt: "int" | "pct" | "dec" | "sec"; derivation: string; native?: string }
export function computeKpis(rows: DRow[], days: number): Kpi[] {
  const voice = rows.filter(isVoice); const dials = voice.reduce((a, x) => a + x.attempts, 0);
  const answered = voice.filter((x) => isHuman(x) || x.outcome === "voicemail").length;
  const human = voice.filter(isHuman).length; const connected = voice.filter((x) => x.outcome === "connected");
  const assisted = voice.filter((x) => x.mode !== "agentless" && (x.outcome === "connected" || x.outcome === "abandoned"));
  const abandoned = assisted.filter((x) => x.outcome === "abandoned").length;
  const digital = rows.filter((x) => x.channel !== "voice" && x.outcome !== "excluded");
  const completed = rows.filter((x) => x.outcome === "connected" || x.outcome === "automated-complete" || x.outcome === "delivered").length;
  const excluded = rows.filter((x) => x.outcome === "excluded"); const suppressed = excluded.filter((x) => SUPPRESS.includes(x.reason!)).length;
  return [
    { id: "total", label: "Total Campaign Contacts", value: rows.length, fmt: "int", derivation: "Filtered profiles targeted", native: "Recipients targeted" },
    { id: "eligible", label: "Eligible Audience", value: rows.length - excluded.length, fmt: "int", derivation: "Targeted minus exclusions" },
    { id: "dials", label: "Dial Attempts", value: dials, fmt: "int", derivation: "Sum of voice attempts incl. retries", native: "Campaign send attempts (voice)" },
    { id: "answered", label: "Answered Calls", value: answered, fmt: "int", derivation: "Human + voicemail answers" },
    { id: "har", label: "Human Answer Rate", value: ratio(human, dials), fmt: "pct", derivation: "Human answers ÷ voice dial attempts", native: "Human answered" },
    { id: "connected", label: "Connected Calls", value: connected.length, fmt: "int", derivation: "Agent-connected only; agentless excluded", native: "Campaign contacts connected" },
    { id: "abandon", label: "Contact Abandonment Rate", value: ratio(abandoned, assisted.length), fmt: "pct", derivation: "Abandoned ÷ agent-assisted human answers", native: "Campaign contacts abandoned after X rate" },
    { id: "dpm", label: "Average Dials per Minute", value: ratio(dials, days * 8 * 60), fmt: "dec", derivation: "Voice attempts ÷ simulated 8h operating minutes", native: "Average dials per minute" },
    { id: "wait", label: "Average Wait After Customer Connection", value: ratio(connected.reduce((a, x) => a + x.waitSec, 0), connected.length), fmt: "sec", derivation: "Mean wait of connected contacts", native: "Average wait time after customer connection" },
    { id: "delivery", label: "Delivery Attempts", value: digital.length, fmt: "int", derivation: "Digital sends (SMS, email, WhatsApp, web)", native: "Delivery attempts" },
    { id: "completed", label: "Completed Contacts", value: completed, fmt: "int", derivation: "Connected + automated completes + delivered" },
    { id: "suppressed", label: "Suppressed Contacts", value: suppressed, fmt: "int", derivation: "DNC, opt-out, revocation exclusions" },
    { id: "exclusions", label: "Campaign Exclusions", value: excluded.length, fmt: "int", derivation: "All pre-attempt exclusions", native: "Campaign send exclusions" },
  ];
}
export function fmtKpi(k: Pick<Kpi, "value" | "fmt">): string {
  if (k.value === null) return "—";
  if (k.fmt === "pct") return `${(k.value * 100).toFixed(1)}%`;
  if (k.fmt === "dec") return k.value.toFixed(2);
  if (k.fmt === "sec") return `${k.value.toFixed(1)}s`;
  return Math.round(k.value).toLocaleString("en-US");
}
export function overTime(rows: DRow[], f: DFilters) {
  const out = []; for (let d = f.from; d <= f.to; d++) { const v = rows.filter((x) => x.day === d && isVoice(x)); out.push({ day: d, label: DAY_LABEL(d), attempts: v.reduce((a, x) => a + x.attempts, 0), answered: v.filter((x) => isHuman(x) || x.outcome === "voicemail").length, connected: v.filter((x) => x.outcome === "connected").length }); } return out;
}
export function byMode(rows: DRow[]) {
  return (["predictive", "progressive", "preview", "agentless"] as const).map((m) => { const v = rows.filter((x) => x.mode === m && isVoice(x)); const d = v.reduce((a, x) => a + x.attempts, 0); return { mode: m, dials: d, humanRate: ratio(v.filter(isHuman).length, d), completeRate: ratio(v.filter((x) => x.outcome === "connected" || x.outcome === "automated-complete").length, v.length) }; });
}
export function outcomes(rows: DRow[]) { const m = new Map<DOutcome, number>(); for (const x of rows) m.set(x.outcome, (m.get(x.outcome) ?? 0) + 1); return [...m.entries()].map(([k, v]) => ({ outcome: k, count: v })).sort((a, b) => b.count - a.count); }
export function agentProductivity(rows: DRow[], days = DAYS) {
  return AGENTS.map((a) => { const v = rows.filter((x) => x.agent === a); const talk = v.reduce((s, x) => s + x.talkSec, 0) / 60; const acw = v.reduce((s, x) => s + x.acwSec, 0) / 60; const shift = v.length ? Math.max(0, days) * 8 * 60 : 0; return { agent: a, connected: v.length, talkMin: talk, acwMin: acw, availMin: Math.max(0, shift - talk - acw) }; }).filter((x) => x.connected > 0);
}
export function funnel(rows: DRow[]) {
  const elig = rows.filter((x) => x.outcome !== "excluded"); const att = elig.filter((x) => x.attempts > 0);
  return [{ k: "Audience", v: rows.length }, { k: "Eligible", v: elig.length }, { k: "Attempted", v: att.length }, { k: "Answered", v: att.filter((x) => isHuman(x) || x.outcome === "voicemail" || x.outcome === "delivered").length }, { k: "Connected", v: att.filter((x) => x.outcome === "connected" || x.outcome === "automated-complete" || x.outcome === "delivered").length }, { k: "Completed", v: rows.filter((x) => x.outcome === "connected" || x.outcome === "automated-complete" || x.outcome === "delivered").length }];
}
export function channelDelivery(rows: DRow[]) {
  return (["voice", "sms", "email", "whatsapp", "web"] as const).map((c) => { const v = rows.filter((x) => x.channel === c && x.outcome !== "excluded"); const ok = c === "voice" ? v.filter((x) => isHuman(x) || x.outcome === "voicemail").length : v.filter((x) => x.outcome === "delivered").length; return { channel: c, attempts: v.length, success: ok, rate: ratio(ok, v.length), metric: c === "voice" ? "answered" : "delivered" }; });
}
export function exclusions(rows: DRow[]) { return EXCL.map((r) => ({ reason: r, count: rows.filter((x) => x.reason === r).length, suppression: SUPPRESS.includes(r) })); }
export function geography(rows: DRow[]) { return REGIONS.map(({ region, tz }) => { const v = rows.filter((x) => x.region === region); const voice = v.filter(isVoice); return { region, tz, contacts: v.length, completed: v.filter((x) => x.outcome === "connected" || x.outcome === "automated-complete" || x.outcome === "delivered").length, humanRate: ratio(voice.filter(isHuman).length, voice.reduce((a, x) => a + x.attempts, 0)) }; }); }
export function toCsv(rows: DRow[], f: DFilters): string {
  const k = computeKpis(rows, f.to - f.from + 1);
  const esc = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  const head = ["# ZCC Depot simulated outbound dashboard export - fictional demonstration data, custom-derived metrics, not AWS operational data", `# filters,${esc(JSON.stringify(f))}`, "metric,value,derivation,native_reference", ...k.map((x) => [x.label, fmtKpi(x), x.derivation, x.native ?? "custom-derived"].map(esc).join(","))];
  const body = ["", "day,campaign,mode,channel,queue,agent,segment,region,time_zone,outcome,attempts,wait_sec,exclusion_reason", ...rows.map((x) => [DAY_LABEL(x.day), x.campaign, x.mode, x.channel, x.queue, x.agent ?? "", x.segment, x.region, x.tz, x.outcome, String(x.attempts), String(x.waitSec), x.reason ?? ""].map(esc).join(","))];
  return [...head, ...body].join("\n");
}
export function options(rows: DRow[]) {
  const u = (f: (x: DRow) => string | null) => [...new Set(rows.map(f).filter((x): x is string => !!x))].sort();
  return { campaign: u((x) => x.campaign), mode: u((x) => x.mode), channel: u((x) => x.channel), queue: u((x) => x.queue), agent: u((x) => x.agent), segment: u((x) => x.segment), region: u((x) => x.region), outcome: u((x) => x.outcome) };
}
