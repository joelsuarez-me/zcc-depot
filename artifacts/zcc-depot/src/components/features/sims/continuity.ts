import type { SimDef, SimScenario, Tone } from "./types";

function c(id: string, label: string, trigger: string, detect: string, alt: string, altTone: Tone, caller: string): SimScenario {
  return { id, label, summary: trigger, steps: [
    { stage: 0, caption: "Normal operation on the primary route.", panels: [{ title: "Route health", rows: [["Primary queue", "Healthy", "ok"], ["Wait", "00:42 (sample)"]] }], log: "Steady state", status: { label: "Normal", tone: "ok" } },
    { stage: 1, caption: trigger, panels: [{ title: "Route health", rows: [["Condition", detect, "bad"]] }], log: "Condition detected", status: { label: "Degraded", tone: "bad" } },
    { stage: 2, caption: "The contact flow evaluates its configured fallback branch.", panels: [{ title: "Decision", rows: [["Branch", alt, altTone], ["Type", "Flow-level fallback, not regional DR"]] }], log: "Fallback branch selected" },
    { stage: 3, caption: "The caller experiences the alternate path.", panels: [{ title: "Caller experience", rows: [["Result", caller]] }], log: "Alternate path served", status: { label: "Fallback active", tone: "warn" } },
    { stage: 4, caption: "Condition clears and normal routing resumes per flow logic.", panels: [{ title: "Route health", rows: [["Primary queue", "Healthy", "ok"], ["Fallback", "Inactive", "muted"]] }], log: "Recovered", status: { label: "Recovered", tone: "ok" } },
  ] };
}

export const continuitySim: SimDef = {
  title: "Business continuity routing",
  stages: ["Normal", "Detect", "Decide", "Alternate", "Recover"],
  scenarioLabel: "Condition",
  scenarios: [
    c("route", "Primary route failure", "The primary queue is unavailable.", "Queue unavailable", "Overflow to Secondary Support queue", "warn", "Connected to secondary team"),
    c("api", "API timeout", "A routing data lookup times out.", "Lookup timeout 3s", "Default routing without enrichment", "warn", "Routed to general queue; agent asks for details"),
    c("agents", "Agents unavailable", "No staffed agents in the target queue.", "0 agents available", "Offer a configured queued callback", "info", "Callback offered; queue order depends on priorities"),
    c("volume", "Unexpected volume", "Inbound volume spikes beyond plan.", "Queue wait over threshold", "Play status message + offer configured self-service", "info", "Hears outage message; supported self-service option offered"),
  ],
  boundary: ["Fallback branches are configured in Amazon Connect contact flows.", "Regional disaster recovery and telephony failover are separate architectures with their own setup; nothing here implies automatic DR."],
};
