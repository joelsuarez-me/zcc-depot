import { suppressionFor, isRevoked, type Channel, type SupState } from "./outbound-suppression";
/** Educational toy policy engine. NOT a legal compliance determination. */
export type Layer = "native" | "custom" | "org" | "legal";
export const LAYER_LABEL: Record<Layer, string> = { native: "Native AWS configuration", custom: "Custom suppression / consent integration", org: "Organization-defined policy", legal: "Requires legal counsel review" };
export interface CContact { id: string; letter: string; name: string; phone: string; line: "wireless" | "residential"; state: string; localHour: number; weekday: number; consent: "express-written" | "express" | "none"; attempts7d: number; hoursSinceLast: number; channel: Channel; purpose: "informational" | "telemarketing"; campaign: string; inCampaignSegment: boolean; note: string }
export const COMPLIANCE_CONTACTS: CContact[] = [
  { id: "ca", letter: "A", name: "Amara Whitfield", phone: "+1 (614) 555-0101", line: "wireless", state: "OH", localHour: 11, weekday: 3, consent: "express-written", attempts7d: 1, hoursSinceLast: 70, channel: "voice", purpose: "informational", campaign: "Policy renewal", inCampaignSegment: true, note: "Valid consent, not suppressed, inside hours" },
  { id: "cb", letter: "B", name: "Bruno Castellanos", phone: "+1 (646) 555-0177", line: "residential", state: "NY", localHour: 13, weekday: 3, consent: "express", attempts7d: 0, hoursSinceLast: 400, channel: "voice", purpose: "telemarketing", campaign: "Policy renewal", inCampaignSegment: true, note: "National DNC registry match" },
  { id: "cc", letter: "C", name: "Celia Marsh", phone: "+1 (415) 555-0138", line: "wireless", state: "CA", localHour: 7.5, weekday: 3, consent: "express-written", attempts7d: 0, hoursSinceLast: 300, channel: "voice", purpose: "informational", campaign: "Policy renewal", inCampaignSegment: true, note: "Outside permitted local hours" },
  { id: "cd", letter: "D", name: "Darius Nkemelu", phone: "+1 (312) 555-0164", line: "wireless", state: "IL", localHour: 15, weekday: 3, consent: "express-written", attempts7d: 0, hoursSinceLast: 200, channel: "voice", purpose: "informational", campaign: "Policy renewal", inCampaignSegment: true, note: "Consent revoked by text reply" },
  { id: "ce", letter: "E", name: "Elodie Brandt", phone: "+1 (720) 555-0122", line: "residential", state: "CO", localHour: 10, weekday: 3, consent: "express", attempts7d: 4, hoursSinceLast: 20, channel: "voice", purpose: "informational", campaign: "Policy renewal", inCampaignSegment: true, note: "Frequency limit exceeded" },
];
export const SEED_REVOCATION_PHONE = "+1 (312) 555-0164";
export interface CPolicy { windowStart: number; windowEnd: number; weekends: boolean; maxAttempts7d: number; coolingHours: number; frequencyAction: "defer" | "exclude"; requireWrittenForAutomated: boolean; stateRules: boolean; holidayToday: boolean }
export const DEFAULT_CPOLICY: CPolicy = { windowStart: 9, windowEnd: 20, weekends: false, maxAttempts7d: 3, coolingHours: 24, frequencyAction: "defer", requireWrittenForAutomated: true, stateRules: true, holidayToday: false };
/** Example only: an org-modelled stricter window for some states. Not a statement of any state's law. */
export const STATE_EXAMPLE_WINDOWS: Record<string, [number, number]> = { CO: [9, 19], IL: [9, 19] };
export type GateStatus = "pass" | "defer" | "block" | "skip";
export interface Gate { id: string; label: string; status: GateStatus; reason: string; layer: Layer }
export interface CResult { gates: Gate[]; final: "Dial" | "Defer" | "Suppress"; tone: "go" | "warn" | "stop" }
export const GATE_ORDER = ["consent", "dnc", "window", "frequency", "channel", "campaign"] as const;

export function evaluateCompliance(c: CContact, p: CPolicy, sup: SupState): CResult {
  const g: Gate[] = [];
  const revoked = isRevoked(sup, c.phone) || !!suppressionFor(sup, c.phone, c.channel)?.source.match(/revocation/);
  if (revoked) g.push({ id: "consent", label: "Consent review", status: "block", reason: "Consent revoked in shared suppression store", layer: "custom" });
  else if (c.consent === "none") g.push({ id: "consent", label: "Consent review", status: "block", reason: "No consent record for this channel", layer: "custom" });
  else if (p.requireWrittenForAutomated && c.purpose === "telemarketing" && c.consent !== "express-written") g.push({ id: "consent", label: "Consent review", status: "block", reason: "Org policy: written consent required for automated telemarketing", layer: "org" });
  else g.push({ id: "consent", label: "Consent review", status: "pass", reason: `${c.consent} consent on record`, layer: "custom" });
  const s = suppressionFor(sup, c.phone, c.channel, c.campaign);
  g.push(s ? { id: "dnc", label: "DNC suppression", status: "block", reason: `${s.source} · ${s.reason}`, layer: "custom" } : { id: "dnc", label: "DNC suppression", status: "pass", reason: "No match in shared suppression store", layer: "custom" });
  let [ws, we] = [p.windowStart, p.windowEnd];
  if (p.stateRules && STATE_EXAMPLE_WINDOWS[c.state]) [ws, we] = [Math.max(ws, STATE_EXAMPLE_WINDOWS[c.state][0]), Math.min(we, STATE_EXAMPLE_WINDOWS[c.state][1])];
  const weekend = c.weekday === 0 || c.weekday === 6;
  if (p.holidayToday) g.push({ id: "window", label: "Communication window", status: "defer", reason: "Holiday exclusion", layer: "native" });
  else if (weekend && !p.weekends) g.push({ id: "window", label: "Communication window", status: "defer", reason: "Weekend rule", layer: "native" });
  else if (c.localHour < ws || c.localHour >= we) g.push({ id: "window", label: "Communication window", status: "defer", reason: `Local ${c.localHour}h outside ${ws}–${we}h`, layer: "native" });
  else g.push({ id: "window", label: "Communication window", status: "pass", reason: `Local ${c.localHour}h inside ${ws}–${we}h`, layer: "native" });
  if (c.attempts7d >= p.maxAttempts7d) g.push({ id: "frequency", label: "Frequency limits", status: p.frequencyAction === "defer" ? "defer" : "block", reason: `${c.attempts7d} attempts in 7 days ≥ limit ${p.maxAttempts7d}`, layer: "native" });
  else if (c.hoursSinceLast < p.coolingHours) g.push({ id: "frequency", label: "Frequency limits", status: "defer", reason: `Cooling-off ${p.coolingHours}h not elapsed`, layer: "org" });
  else g.push({ id: "frequency", label: "Frequency limits", status: "pass", reason: `${c.attempts7d}/${p.maxAttempts7d} attempts`, layer: "native" });
  g.push({ id: "channel", label: "Channel eligibility", status: "pass", reason: `${c.channel} configured with claimed caller ID`, layer: "native" });
  g.push(c.inCampaignSegment ? { id: "campaign", label: "Campaign eligibility", status: "pass", reason: "In campaign segment", layer: "native" } : { id: "campaign", label: "Campaign eligibility", status: "block", reason: "Not in segment", layer: "native" });
  let stopped = false;
  for (const x of g) { if (stopped) { x.status = "skip"; continue; } if (x.status === "block" || x.status === "defer") stopped = true; }
  const first = g.find((x) => x.status === "block" || x.status === "defer");
  const final = !first ? "Dial" : first.status === "block" ? "Suppress" : "Defer";
  return { gates: g, final, tone: final === "Dial" ? "go" : final === "Defer" ? "warn" : "stop" };
}
export interface RegFlag { body: "FCC · TCPA" | "FTC · Telemarketing Sales Rule" | "State requirements"; flags: string[]; source: string }
/** Independent review prompts per authority. Never a verdict. */
export function regulatoryQualification(c: CContact): RegFlag[] {
  const fcc: string[] = []; const ftc: string[] = []; const st: string[] = [];
  if (c.line === "wireless") fcc.push("Wireless number: automated or prerecorded calls and texts raise heightened consent considerations.");
  else fcc.push("Residential line: prerecorded/artificial voice rules and consent considerations apply differently.");
  fcc.push(`Consent on record: ${c.consent}. Validate scope, record and revocation handling.`);
  if (c.purpose === "telemarketing") { ftc.push("Telemarketing purpose: TSR DNC, calling-time and abandonment provisions may apply depending on the business and call type."); }
  else ftc.push("Informational purpose: TSR applicability depends on business and call type; do not assume an exemption.");
  ftc.push("Abandonment: monitor answered-and-unconnected calls when using predictive pacing.");
  st.push(`State ${c.state}: confirm state DNC lists, calling hours and any registration requirements.`);
  if (STATE_EXAMPLE_WINDOWS[c.state]) st.push("This lab models a stricter example window here as an organization policy illustration.");
  return [
    { body: "FCC · TCPA", flags: fcc, source: "https://www.fcc.gov/enforcement/areas/unwanted-communications" },
    { body: "FTC · Telemarketing Sales Rule", flags: ftc, source: "https://www.ftc.gov/business-guidance/resources/complying-telemarketing-sales-rule" },
    { body: "State requirements", flags: st, source: "https://www.fcc.gov/enforcement/areas/unwanted-communications" },
  ];
}
export const DISCLAIMER = "Educational simulation only. AWS configuration controls do not independently establish TCPA or other regulatory compliance. Organizations must validate applicable laws, consent, suppression procedures, and dialing practices with qualified legal counsel.";
