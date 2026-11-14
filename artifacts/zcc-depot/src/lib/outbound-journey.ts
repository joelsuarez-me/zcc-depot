/** Multichannel journey canvas model + deterministic run. Native vs custom clearly labeled. */
export type JType = "start" | "send-sms" | "send-email" | "send-whatsapp" | "send-voice" | "wait" | "branch-delivery" | "check-window" | "custom-consent" | "end";
export const JMETA: Record<JType, { label: string; native: boolean; note: string }> = {
  start: { label: "Campaign starts", native: true, note: "Segment entry into the journey." },
  "send-sms": { label: "Send SMS", native: true, note: "Send communication · SMS via AWS End User Messaging origination identity." },
  "send-email": { label: "Send email", native: true, note: "Send communication · email from enabled instance email + template." },
  "send-whatsapp": { label: "Send WhatsApp", native: true, note: "Send communication · WhatsApp via End User Messaging Social." },
  "send-voice": { label: "Voice outreach", native: true, note: "Send communication · voice with claimed caller ID and flow." },
  wait: { label: "Wait for response", native: true, note: "Wait block with timeout." },
  "branch-delivery": { label: "Evaluate delivery outcome", native: true, note: "Branch on send outcome (delivered / failed)." },
  "check-window": { label: "Calling window check", native: true, note: "Communication time windows and limits applied by the campaign." },
  "custom-consent": { label: "Evaluate consent (external)", native: false, note: "Custom orchestration: Lambda / consent platform lookup." },
  end: { label: "Complete journey", native: true, note: "Exit." },
};
export interface JNode { id: string; type: JType; fallback?: string }
export const DEFAULT_JOURNEY: JNode[] = [
  { id: "n1", type: "start" }, { id: "n2", type: "send-sms" }, { id: "n3", type: "branch-delivery", fallback: "send-email" }, { id: "n4", type: "wait" },
  { id: "n5", type: "custom-consent" }, { id: "n6", type: "check-window" }, { id: "n7", type: "send-voice" }, { id: "n8", type: "end" },
];
export const FALLBACK_TYPES: JType[] = ["send-email", "send-sms", "send-whatsapp"];
export interface JScenario { smsDelivered: boolean; emailEligible: boolean; responded: boolean; consentVoice: boolean; inWindow: boolean; whatsappOptIn: boolean }
export const DEFAULT_JSCENARIO: JScenario = { smsDelivered: false, emailEligible: true, responded: false, consentVoice: true, inWindow: true, whatsappOptIn: false };
export interface JStep { nodeId: string | null; label: string; outcome: string; tone: "go" | "warn" | "stop" | "info"; native: boolean }
export function moveNode(ns: JNode[], from: number, to: number): JNode[] {
  if (from === to || from < 0 || to < 0 || from >= ns.length || to >= ns.length) return ns;
  if (ns[from].type === "start" || ns[from].type === "end" || to === 0 || to === ns.length - 1) return ns;
  const out = [...ns]; const [x] = out.splice(from, 1); out.splice(to, 0, x); return out;
}
export function validateJourney(ns: JNode[]): string[] {
  const e: string[] = [];
  if (ns[0]?.type !== "start") e.push("Journey must begin with Campaign starts.");
  if (ns[ns.length - 1]?.type !== "end") e.push("Journey must end with Complete journey.");
  if (!ns.some((n) => n.type.startsWith("send-"))) e.push("Add at least one Send communication.");
  ns.forEach((n, i) => {
    if (n.type === "branch-delivery" && !ns.slice(0, i).some((p) => p.type.startsWith("send-"))) e.push("Delivery branch must follow a send.");
    if (n.type === "branch-delivery" && n.fallback && !FALLBACK_TYPES.includes(n.fallback as JType)) e.push(`Unsupported fallback "${n.fallback}"; use email, SMS or WhatsApp.`);
  });
  return e;
}
export function runJourney(ns: JNode[], s: JScenario): JStep[] {
  const out: JStep[] = []; let lastSend: JType | null = null; let lastOk = true; let done = false;
  /** Delivery guardrails enforced on EVERY send regardless of canvas order. */
  const guard = (t: JType): string | null => t === "send-voice" ? (!s.consentVoice ? "Blocked · no voice consent" : !s.inWindow ? "Deferred · outside calling window" : null) : t === "send-whatsapp" && !s.whatsappOptIn ? "Not opted in · skipped" : null;
  const sendOk = (t: JType) => !guard(t) && (t === "send-sms" ? s.smsDelivered : t === "send-email" ? s.emailEligible : t === "send-whatsapp" ? s.whatsappOptIn : t === "send-voice");
  for (const n of ns) {
    if (done) break; const m = JMETA[n.type];
    switch (n.type) {
      case "start": out.push({ nodeId: n.id, label: m.label, outcome: "Profile entered journey", tone: "info", native: true }); break;
      case "send-sms": case "send-email": case "send-whatsapp": { const ok = sendOk(n.type); lastSend = n.type; lastOk = ok; out.push({ nodeId: n.id, label: m.label, outcome: ok ? "Delivered" : n.type === "send-whatsapp" ? "Not opted in · skipped" : "Delivery failed", tone: ok ? "go" : "stop", native: true }); break; }
      case "send-voice": { const g = guard("send-voice"); lastSend = n.type; lastOk = !g; out.push({ nodeId: n.id, label: m.label, outcome: g ?? "Eligible voice outreach initiated (simulated)", tone: g ? (s.consentVoice ? "warn" : "stop") : "go", native: true }); break; }
      case "branch-delivery": {
        if (lastOk) { out.push({ nodeId: n.id, label: m.label, outcome: `${lastSend ?? "send"} delivered · continue`, tone: "go", native: true }); break; }
        const fb = (n.fallback ?? "send-email") as JType;
        if (!FALLBACK_TYPES.includes(fb)) { out.push({ nodeId: n.id, label: m.label, outcome: "Unsupported fallback · journey stops", tone: "stop", native: true }); done = true; break; }
        const ok = sendOk(fb);
        out.push({ nodeId: n.id, label: m.label, outcome: `Failed · fallback to ${JMETA[fb].label}`, tone: "warn", native: true });
        out.push({ nodeId: null, label: `Fallback · ${JMETA[fb].label}`, outcome: ok ? "Delivered" : "Not eligible", tone: ok ? "go" : "stop", native: true }); lastOk = ok; lastSend = fb; break;
      }
      case "wait": if (s.responded) { out.push({ nodeId: n.id, label: m.label, outcome: "Customer responded · voice follow-up not required", tone: "go", native: true }); out.push({ nodeId: ns[ns.length - 1].id, label: "Complete journey", outcome: "Resolved digitally", tone: "go", native: true }); done = true; } else out.push({ nodeId: n.id, label: m.label, outcome: "No response before timeout", tone: "warn", native: true }); break;
      case "custom-consent": if (!s.consentVoice) { out.push({ nodeId: n.id, label: m.label, outcome: "No voice consent · exit", tone: "stop", native: false }); done = true; } else out.push({ nodeId: n.id, label: m.label, outcome: "Voice consent confirmed", tone: "go", native: false }); break;
      case "check-window": if (!s.inWindow) { out.push({ nodeId: n.id, label: m.label, outcome: "Outside window · deferred to next window", tone: "warn", native: true }); done = true; } else out.push({ nodeId: n.id, label: m.label, outcome: "Inside window", tone: "go", native: true }); break;
      case "end": out.push({ nodeId: n.id, label: m.label, outcome: "Journey complete", tone: "info", native: true }); break;
    }
  }
  return out;
}
