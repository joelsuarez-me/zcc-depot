import { rng } from "./outbound-dialer";
import { suppressionFor, type SupState } from "./outbound-suppression";
/** 10,000 deterministic fictional profiles plus segment filter/sort engine. */
export type Tier = "Platinum" | "Gold" | "Silver" | "Standard";
export interface Profile {
  id: number; name: string; phone: string; tier: Tier; region: "Northeast" | "Southeast" | "Midwest" | "Southwest" | "West" | "Pacific";
  tz: "et" | "ct" | "mt" | "pt" | "ak" | "hi" | null; status: "Active" | "Lapsed" | "Closed"; product: "Auto" | "Home" | "Life" | "Bundle";
  prevPurchase: boolean; renewalDays: number; lastContactDays: number; language: "English" | "Spanish" | "French" | "Vietnamese";
  consent: "express-written" | "express" | "none" | "revoked"; stage: "Onboarding" | "Growth" | "Renewal" | "At risk"; registry: boolean; value: number;
}
const FIRST = ["Lena", "Marcus", "Ruth", "Dev", "Kaia", "Arlo", "Imogen", "Pablo", "Noor", "Tobias", "Wren", "Celine", "Joaquin", "Hana", "Silas", "Ines", "Rafael", "Odette", "Kwame", "Yara"];
const LAST = ["Okafor", "Bell", "Calloway", "Raman", "Naone", "Fenn", "Saito", "Ruiz", "Haddad", "Lindqvist", "Ashby", "Moreau", "Vega", "Mori", "Brandt", "Duarte", "Kovac", "Pryce", "Mensah", "Farouk"];
const REG_TZ: Record<Profile["region"], Profile["tz"][]> = { Northeast: ["et"], Southeast: ["et", "ct"], Midwest: ["ct", "et"], Southwest: ["mt", "ct"], West: ["pt", "mt"], Pacific: ["ak", "hi", "pt"] };
const pick = <T,>(r: () => number, xs: readonly T[], w?: number[]): T => { if (!w) return xs[Math.floor(r() * xs.length)]; const t = w.reduce((a, b) => a + b, 0); let x = r() * t; for (let i = 0; i < xs.length; i++) { x -= w[i]; if (x < 0) return xs[i]; } return xs[xs.length - 1]; };

let cache: Profile[] | null = null;
export function generateProfiles(n = 10000): Profile[] {
  if (cache && n === 10000) return cache;
  const r = rng(20261113); const out: Profile[] = [];
  for (let i = 0; i < n; i++) {
    const region = pick(r, ["Northeast", "Southeast", "Midwest", "Southwest", "West", "Pacific"] as const, [26, 22, 19, 13, 15, 5]);
    const tz = r() < 0.012 ? null : pick(r, REG_TZ[region]);
    out.push({
      id: i + 1, name: `${FIRST[i % 20]} ${LAST[Math.floor(i / 20) % 20]}`, phone: `+1 (${200 + (i % 700)}) 555-${String(1000 + Math.floor(i / 7)).slice(-4)}`,
      tier: pick(r, ["Platinum", "Gold", "Silver", "Standard"] as const, [8, 22, 35, 35]), region, tz,
      status: pick(r, ["Active", "Lapsed", "Closed"] as const, [68, 22, 10]), product: pick(r, ["Auto", "Home", "Life", "Bundle"] as const, [36, 28, 14, 22]),
      prevPurchase: r() < 0.57, renewalDays: Math.floor(r() * 365), lastContactDays: Math.floor(r() * 180),
      language: pick(r, ["English", "Spanish", "French", "Vietnamese"] as const, [74, 18, 4, 4]), consent: pick(r, ["express-written", "express", "none", "revoked"] as const, [41, 36, 19, 4]),
      stage: pick(r, ["Onboarding", "Growth", "Renewal", "At risk"] as const, [12, 38, 34, 16]), registry: r() < 0.071, value: Math.round(400 + r() * 9600),
    });
  }
  if (n === 10000) cache = out;
  return out;
}

/** Fixed simulated local hours (campaign execution 2:15 PM ET, 2026-11-13). */
export const SIM_LOCAL_HOUR: Record<NonNullable<Profile["tz"]>, number> = { et: 14.25, ct: 13.25, mt: 12.25, pt: 11.25, ak: 10.25, hi: 9.25 };

export type FilterId = "active" | "renewal" | "consent" | "window" | "suppression" | "tier" | "region" | "language" | "stage" | "product" | "prevPurchase" | "lastContact";
export interface Filter { id: FilterId; on: boolean; value?: string | number }
export const FILTER_LABEL: Record<FilterId, string> = { active: "Active customers", renewal: "Renewal eligible", consent: "Consent eligible", window: "Within communication window", suppression: "Eligible after suppression", tier: "Customer tier", region: "Geographic region", language: "Language preference", stage: "Lifecycle stage", product: "Product ownership", prevPurchase: "Previous purchase", lastContact: "Last contact over N days" };
export const DEFAULT_FILTERS: Filter[] = [
  { id: "active", on: true }, { id: "renewal", on: true, value: 120 }, { id: "consent", on: true, value: "voice" }, { id: "window", on: true, value: 9 }, { id: "suppression", on: true },
  { id: "tier", on: false, value: "Gold" }, { id: "region", on: false, value: "Northeast" }, { id: "language", on: false, value: "English" }, { id: "stage", on: false, value: "Renewal" }, { id: "product", on: false, value: "Auto" }, { id: "prevPurchase", on: false }, { id: "lastContact", on: false, value: 14 },
];
export function predicate(f: Filter, sup: SupState | null): (p: Profile) => boolean {
  switch (f.id) {
    case "active": return (p) => p.status === "Active";
    case "renewal": return (p) => p.renewalDays <= Number(f.value ?? 90);
    case "consent": return (p) => (f.value === "marketing" ? p.consent === "express-written" : p.consent === "express-written" || p.consent === "express");
    case "window": { const s = Number(f.value ?? 9); return (p) => !!p.tz && SIM_LOCAL_HOUR[p.tz] >= s && SIM_LOCAL_HOUR[p.tz] < 20; }
    case "suppression": return (p) => !p.registry && p.consent !== "revoked" && !(sup && suppressionFor(sup, p.phone, "voice"));
    case "tier": return (p) => p.tier === f.value;
    case "region": return (p) => p.region === f.value;
    case "language": return (p) => p.language === f.value;
    case "stage": return (p) => p.stage === f.value;
    case "product": return (p) => p.product === f.value;
    case "prevPurchase": return (p) => p.prevPurchase;
    case "lastContact": return (p) => p.lastContactDays >= Number(f.value ?? 14);
  }
}
export interface FunnelStep { id: FilterId | "all"; label: string; count: number; removed: number }
export function runSegment(profiles: Profile[], filters: Filter[], sup: SupState | null): { steps: FunnelStep[]; result: Profile[] } {
  let cur = profiles; const steps: FunnelStep[] = [{ id: "all", label: "Total customers", count: cur.length, removed: 0 }];
  for (const f of filters) { if (!f.on) continue; const next = cur.filter(predicate(f, sup)); steps.push({ id: f.id, label: FILTER_LABEL[f.id], count: next.length, removed: cur.length - next.length }); cur = next; }
  return { steps, result: cur };
}
export type SortKey = "renewalDays" | "value" | "lastContactDays" | "tier" | "name" | "region" | "stage" | "language" | "product" | "id";
export const SORT_KEYS: SortKey[] = ["renewalDays", "value", "lastContactDays", "tier", "name", "region", "stage", "language", "product", "id"];
export const MAX_SORT_KEYS = 10;
const TIER_RANK: Record<Tier, number> = { Platinum: 0, Gold: 1, Silver: 2, Standard: 3 };
export function validateSort(keys: { key: SortKey; dir: "asc" | "desc" }[], channel: string): string | null {
  if (keys.length > MAX_SORT_KEYS) return `Sorted segments support up to ${MAX_SORT_KEYS} attributes.`;
  if (keys.length && channel !== "voice") return "Sorted segments apply to voice campaigns only.";
  return null;
}
export function sortProfiles(ps: Profile[], keys: { key: SortKey; dir: "asc" | "desc" }[]): Profile[] {
  return [...ps].sort((a, b) => { for (const k of keys) { const av = k.key === "tier" ? TIER_RANK[a.tier] : a[k.key]; const bv = k.key === "tier" ? TIER_RANK[b.tier] : b[k.key]; if (av !== bv) { const c = av! < bv! ? -1 : 1; return k.dir === "asc" ? c : -c; } } return a.id - b.id; });
}
/** Illustrative: submission order vs connection order (answers decide who connects first). */
export function connectionOrder(ps: Profile[], answerPct = 35): { submitted: number; connected: number | null; p: Profile }[] {
  const r = rng(ps.length + answerPct); let n = 0;
  return ps.map((p, i) => { const ans = r() < answerPct / 100; const delay = Math.floor(r() * 4); return { submitted: i + 1, connected: ans ? 0 : null, p, delay }; })
    .map((x) => x).sort((a, b) => (a.connected === null ? 1 : 0) - (b.connected === null ? 1 : 0) || (a.delay + a.submitted / 3) - (b.delay + b.submitted / 3))
    .map((x) => ({ submitted: x.submitted, connected: x.connected === null ? null : ++n, p: x.p }));
}
/** Count of the first `n` campaign-list profiles that are not dialable (registry, revoked consent, or shared store voice suppression). */
export function suppressedInList(profiles: Profile[], n: number, sup: SupState | null): number {
  const pass = predicate({ id: "suppression", on: true }, sup); let k = 0;
  for (let i = 0; i < Math.min(n, profiles.length); i++) if (!pass(profiles[i])) k++;
  return k;
}
