import { useSyncExternalStore } from "react";
/** Shared fictional suppression store. Pure reducer + tiny external store used by segment, compliance and dialers. */
export type Channel = "voice" | "sms" | "email" | "whatsapp" | "web";
export const CHANNELS: Channel[] = ["voice", "sms", "email", "whatsapp", "web"];
export type SupSource = "internal-dnc" | "national-dnc" | "state-dnc" | "opt-out" | "consent-revocation" | "campaign" | "cross-channel" | "import";
export const SOURCE_META: Record<SupSource, { label: string; system: string; native: boolean; removable: boolean }> = {
  "internal-dnc": { label: "Internal DNC list", system: "CRM / custom list checked via Lambda or segment filter", native: false, removable: true },
  "national-dnc": { label: "National DNC registry match", system: "Registry scrub service (third party)", native: false, removable: false },
  "state-dnc": { label: "State DNC list", system: "Registry scrub service (third party)", native: false, removable: false },
  "opt-out": { label: "Customer opt-out", system: "Consent management platform / messaging opt-out list", native: false, removable: false },
  "consent-revocation": { label: "Consent revoked", system: "Consent management platform", native: false, removable: false },
  "campaign": { label: "Campaign-specific exclusion", system: "Segment criteria (native) + campaign attribute", native: true, removable: true },
  "cross-channel": { label: "Cross-channel suppression", system: "Custom orchestration across channels", native: false, removable: true },
  "import": { label: "Imported suppression file", system: "S3 import + custom processing", native: false, removable: true },
};
export interface SupEntry { id: string; phone: string; source: SupSource; reason: string; effective: string; channels: Channel[]; campaign?: string }
export interface AuditRow { seq: number; action: "added" | "removed" | "imported" | "reevaluated" | "blocked-removal"; phone: string; source?: SupSource; note: string }
export interface SupState { entries: SupEntry[]; audit: AuditRow[]; evaluations: number; lastEvaluation: string; seq: number }
export type SupAction =
  | { type: "add"; phone: string; source: SupSource; reason: string; channels: Channel[]; campaign?: string; effective?: string }
  | { type: "remove"; id: string }
  | { type: "import"; rows: { phone: string; reason: string }[] }
  | { type: "reevaluate" } | { type: "reset" };

const SIM_DATE = "2026-11-13";
export const SEED_ENTRIES: SupEntry[] = [
  { id: "s1", phone: "+1 (646) 555-0177", source: "national-dnc", reason: "Registry match on residential number", effective: "2026-09-02", channels: ["voice"] },
  { id: "s2", phone: "+1 (512) 555-0190", source: "opt-out", reason: "Replied STOP to SMS", effective: "2026-10-21", channels: ["sms"] },
  { id: "s3", phone: "+1 (303) 555-0118", source: "internal-dnc", reason: "Requested no calls during account review", effective: "2026-11-02", channels: ["voice"] },
  { id: "s4", phone: "+1 (312) 555-0164", source: "consent-revocation", reason: "Revoked consent by text reply", effective: "2026-11-01", channels: ["voice", "sms", "email", "whatsapp", "web"] },
];
export const initialSup = (): SupState => ({ entries: SEED_ENTRIES.map((e) => ({ ...e })), audit: SEED_ENTRIES.map((e, i) => ({ seq: i + 1, action: "added", phone: e.phone, source: e.source, note: e.reason })), evaluations: 1, lastEvaluation: `${SIM_DATE} 09:00 ET`, seq: SEED_ENTRIES.length });

export function supReduce(s: SupState, a: SupAction): SupState {
  const seq = s.seq + 1;
  switch (a.type) {
    case "reset": return initialSup();
    case "add": {
      const e: SupEntry = { id: `s${seq}`, phone: a.phone, source: a.source, reason: a.reason, channels: a.source === "consent-revocation" || a.source === "cross-channel" ? [...CHANNELS] : a.channels, campaign: a.campaign, effective: a.effective ?? SIM_DATE };
      return { ...s, seq, entries: [...s.entries, e], audit: [...s.audit, { seq, action: "added", phone: a.phone, source: a.source, note: a.reason }] };
    }
    case "remove": {
      const e = s.entries.find((x) => x.id === a.id); if (!e) return s;
      if (!SOURCE_META[e.source].removable) return { ...s, seq, audit: [...s.audit, { seq, action: "blocked-removal", phone: e.phone, source: e.source, note: `${SOURCE_META[e.source].label} cannot be removed here` }] };
      return { ...s, seq, entries: s.entries.filter((x) => x.id !== a.id), audit: [...s.audit, { seq, action: "removed", phone: e.phone, source: e.source, note: "Removed where permitted by policy" }] };
    }
    case "import": {
      let n = seq; const add = a.rows.map((r) => ({ id: `s${n++}`, phone: r.phone, source: "import" as SupSource, reason: r.reason, channels: ["voice", "sms"] as Channel[], effective: SIM_DATE }));
      return { ...s, seq: n, entries: [...s.entries, ...add], audit: [...s.audit, { seq: n, action: "imported", phone: `${add.length} rows`, source: "import", note: "suppression-2026-11-13.csv" }] };
    }
    case "reevaluate": return { ...s, seq, evaluations: s.evaluations + 1, lastEvaluation: `${SIM_DATE} 09:${String(Math.min(59, s.evaluations * 7)).padStart(2, "0")} ET`, audit: [...s.audit, { seq, action: "reevaluated", phone: "all", note: "Campaign eligibility recomputed" }] };
  }
}
export function suppressionFor(s: SupState, phone: string, channel: Channel, campaign?: string): SupEntry | undefined {
  return s.entries.find((e) => e.phone === phone && e.channels.includes(channel) && (!e.campaign || e.campaign === campaign));
}
export const isRevoked = (s: SupState, phone: string) => s.entries.some((e) => e.phone === phone && e.source === "consent-revocation");

let state = initialSup(); const subs = new Set<() => void>();
export const supStore = {
  get: () => state,
  dispatch(a: SupAction) { state = supReduce(state, a); subs.forEach((f) => f()); },
  subscribe(f: () => void) { subs.add(f); return () => { subs.delete(f); }; },
};
export function useSuppression() { return useSyncExternalStore(supStore.subscribe, supStore.get, supStore.get); }
