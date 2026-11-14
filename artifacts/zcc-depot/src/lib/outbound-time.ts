/** IANA / DST aware communication-window engine using Intl only. Fictional profiles. */
export interface Zone { id: string; label: string; iana: string; x: number; y: number }
export const US_ZONES: Zone[] = [
  { id: "hi", label: "Hawaii", iana: "Pacific/Honolulu", x: 230, y: 330 },
  { id: "ak", label: "Alaska", iana: "America/Anchorage", x: 95, y: 300 },
  { id: "pt", label: "Pacific", iana: "America/Los_Angeles", x: 90, y: 140 },
  { id: "mt", label: "Mountain", iana: "America/Denver", x: 220, y: 130 },
  { id: "ct", label: "Central", iana: "America/Chicago", x: 360, y: 160 },
  { id: "et", label: "Eastern", iana: "America/New_York", x: 500, y: 140 },
];
export const zoneById = (id: string) => US_ZONES.find((z) => z.id === id);

function parts(ms: number, iana: string) {
  const f = new Intl.DateTimeFormat("en-US", { timeZone: iana, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", weekday: "short" });
  const o: Record<string, string> = {}; for (const p of f.formatToParts(new Date(ms))) o[p.type] = p.value;
  return o;
}
export function tzOffsetMin(iana: string, ms: number): number {
  const p = parts(ms, iana);
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
  return Math.round((asUtc - Math.floor(ms / 1000) * 1000) / 60000);
}
/** Local wall-clock -> UTC with explicit DST handling. Nonexistent (spring-forward gap) times shift FORWARD; ambiguous (fall-back) times take the first occurrence. */
export function localToUtcChecked(date: string, minutes: number, iana: string): { utc: number; shifted: boolean; ambiguous: boolean } {
  const [y, m, d] = date.split("-").map(Number);
  const guess = Date.UTC(y, m - 1, d, 0, 0) + minutes * 60000;
  const offs = Array.from(new Set([tzOffsetMin(iana, guess - 86400000), tzOffsetMin(iana, guess), tzOffsetMin(iana, guess + 86400000)])).sort((a, b) => b - a);
  const want = ((minutes % 1440) + 1440) % 1440;
  const matches = offs.map((o) => guess - o * 60000).filter((u) => localMinutes(u, iana) === want && localDate(u, iana) === localDateOf(y, m, d, minutes));
  if (matches.length) return { utc: Math.min(...matches), shifted: false, ambiguous: matches.length > 1 };
  const std = Math.min(...offs);
  return { utc: guess - std * 60000, shifted: true, ambiguous: false };
}
function localDateOf(y: number, m: number, d: number, minutes: number): string { const t = new Date(Date.UTC(y, m - 1, d) + Math.floor(minutes / 1440) * 86400000); return t.toISOString().slice(0, 10); }
export function localToUtc(date: string, minutes: number, iana: string): number { return localToUtcChecked(date, minutes, iana).utc; }
export function localDate(ms: number, iana: string): string { const p = parts(ms, iana); return `${p.year}-${p.month}-${p.day}`; }
export function localWeekday(ms: number, iana: string): number { return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts(ms, iana).weekday); }
export function localMinutes(ms: number, iana: string): number { const p = parts(ms, iana); return (+p.hour % 24) * 60 + +p.minute; }
export function fmtTime(ms: number, iana: string): string { return new Intl.DateTimeFormat("en-US", { timeZone: iana, hour: "numeric", minute: "2-digit" }).format(new Date(ms)); }
export function zoneAbbr(ms: number, iana: string): string { return new Intl.DateTimeFormat("en-US", { timeZone: iana, timeZoneName: "short" }).formatToParts(new Date(ms)).find((p) => p.type === "timeZoneName")?.value ?? ""; }
export function isDst(iana: string, ms: number): boolean { const y = new Date(ms).getUTCFullYear(); const jan = tzOffsetMin(iana, Date.UTC(y, 0, 15)); const jul = tzOffsetMin(iana, Date.UTC(y, 6, 15)); return jan !== jul && tzOffsetMin(iana, ms) === Math.max(jan, jul); }
export const fmtMin = (m: number) => { const h = Math.floor(m / 60) % 24; const mm = m % 60; return `${h % 12 === 0 ? 12 : h % 12}${mm ? ":" + String(mm).padStart(2, "0") : ""} ${h < 12 ? "AM" : "PM"}`; };

export interface TzContact { kind: "mobile" | "business" | "home" | "address"; iana: string | null; label: string }
export interface TzCustomer { id: string; name: string; contacts: TzContact[]; region: string }
export const TZ_CUSTOMERS: TzCustomer[] = [
  { id: "t1", name: "Lena Okafor", region: "NY", contacts: [{ kind: "mobile", iana: "America/New_York", label: "Mobile · (212) 555-0141" }] },
  { id: "t2", name: "Marcus Bell", region: "NY / CA", contacts: [{ kind: "mobile", iana: "America/New_York", label: "Mobile · (646) 555-0177" }, { kind: "business", iana: "America/Los_Angeles", label: "Business · (415) 555-0102" }] },
  { id: "t3", name: "Ruth Calloway", region: "TX", contacts: [{ kind: "home", iana: "America/Chicago", label: "Home · (512) 555-0190" }] },
  { id: "t4", name: "Dev Raman", region: "CO", contacts: [{ kind: "mobile", iana: "America/Denver", label: "Mobile · (303) 555-0118" }, { kind: "address", iana: "America/Denver", label: "Postal · 80202 US" }] },
  { id: "t5", name: "Kaia Nāone", region: "HI", contacts: [{ kind: "mobile", iana: "Pacific/Honolulu", label: "Mobile · (808) 555-0133" }] },
  { id: "t6", name: "Arlo Fenn", region: "AK", contacts: [{ kind: "home", iana: "America/Anchorage", label: "Home · (907) 555-0156" }] },
  { id: "t7", name: "Imogen Saito", region: "NY / Tokyo", contacts: [{ kind: "mobile", iana: "America/New_York", label: "Mobile · (917) 555-0124" }, { kind: "address", iana: "Asia/Tokyo", label: "Postal · 100-0005 JP" }] },
  { id: "t8", name: "Pablo Ruiz", region: "Unknown", contacts: [{ kind: "mobile", iana: null, label: "Mobile · invalid / unresolvable" }, { kind: "address", iana: null, label: "Postal · Country missing" }] },
];

export interface TzPolicy {
  dateISO: string; execUtc: number; windowStart: number; windowEnd: number; strategy: "primary" | "all";
  campaignStart: number; campaignEnd: number; campaignIana: string; days: number[]; holidays: string[];
  blackouts: { start: number; end: number; label: string }[]; regionRestrict: Record<string, { start: number; end: number }>;
}
export interface TzEval { zones: string[]; overlap: [number, number] | null; status: "eligible" | "deferred" | "excluded"; reason: string }

export function intersect(a: [number, number] | null, b: [number, number]): [number, number] | null {
  if (!a) return null; const s = Math.max(a[0], b[0]); const e = Math.min(a[1], b[1]); return s < e ? [s, e] : null;
}
export function evaluateTz(c: TzCustomer, p: TzPolicy): TzEval {
  const valid = c.contacts.map((x) => x.iana).filter((x): x is string => !!x);
  const zones = p.strategy === "primary" ? (c.contacts[0]?.iana ? [c.contacts[0].iana] : []) : Array.from(new Set(valid));
  if (!Number.isFinite(p.execUtc) || p.blackouts.some((b) => !Number.isFinite(b.start) || !Number.isFinite(b.end) || b.start >= b.end)) return { zones, overlap: null, status: "excluded", reason: "Invalid execution time or blackout policy; attempt excluded." };
  if (!zones.length) return { zones, overlap: null, status: "excluded", reason: "No valid time zone could be inferred from profile phones or addresses; profile excluded." };
  let ov: [number, number] | null = [-Infinity, Infinity];
  for (const z of zones) {
    const d = localDate(p.execUtc, z);
    const rr = p.regionRestrict[z];
    const s = Math.max(p.windowStart, rr?.start ?? 0); const e = Math.min(p.windowEnd, rr?.end ?? 1440);
    if (s >= e) return { zones, overlap: null, status: "excluded", reason: `Invalid or empty window in ${z} (start must precede end); fails closed.` };
    const a = localToUtc(d, s, z), b = localToUtc(d, e, z);
    if (!(a < b)) return { zones, overlap: null, status: "excluded", reason: `Window collapses across a DST transition in ${z}; fails closed.` };
    ov = intersect(ov, [a, b]);
  }
  if (!(p.campaignStart < p.campaignEnd)) return { zones, overlap: null, status: "excluded", reason: "Invalid campaign hours; fails closed." };
  const cd = localDate(p.execUtc, p.campaignIana);
  ov = intersect(ov, [localToUtc(cd, p.campaignStart, p.campaignIana), localToUtc(cd, p.campaignEnd, p.campaignIana)]);
  if (!ov) return { zones, overlap: null, status: "excluded", reason: zones.length > 1 ? "No overlapping eligible hours across every detected zone; skipped for this attempt." : "Recipient window and campaign hours do not overlap." };
  for (const z of zones) {
    if (!p.days.includes(localWeekday(p.execUtc, z))) return { zones, overlap: ov, status: "deferred", reason: `Local day not permitted in ${z}.` };
    if (p.holidays.includes(localDate(p.execUtc, z))) return { zones, overlap: ov, status: "deferred", reason: `Holiday exclusion in ${z}.` };
  }
  const bo = p.blackouts.find((b) => p.execUtc >= b.start && p.execUtc < b.end);
  if (bo) return { zones, overlap: ov, status: "deferred", reason: `Custom blackout: ${bo.label}.` };
  if (p.execUtc < ov[0] || p.execUtc >= ov[1]) return { zones, overlap: ov, status: "deferred", reason: "Outside the overlapping window; deferred to next eligible time." };
  return { zones, overlap: ov, status: "eligible", reason: zones.length > 1 ? "Inside the window shared by every detected zone." : "Inside recipient local window and campaign hours." };
}
