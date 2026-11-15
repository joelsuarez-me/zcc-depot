import type { SimDef } from "./types";

export const lifecycleSim: SimDef = {
  title: "Contact lifecycle",
  stages: ["Incoming", "Flow", "Queue", "Agent", "Ticket", "Completion", "ACW", "Reporting"],
  scenarioLabel: "Contact",
  scenarios: [{ id: "one", label: "Sample contact", summary: "One fictional call traced end to end.", steps: [
    { stage: 0, caption: "Call arrives.", panels: [{ title: "Contact attributes", rows: [["contactId", "sim-91c2"], ["ani", "+1 (555) 010-4471"], ["t", "09:14:02"]] }], log: "09:14:02 INITIATED" },
    { stage: 1, caption: "Contact flow sets attributes.", panels: [{ title: "Contact attributes", rows: [["contactId", "sim-91c2"], ["intent", "billing"], ["language", "en-US"], ["t", "09:14:09"]] }], log: "09:14:09 Flow set intent=billing" },
    { stage: 2, caption: "Contact enters queue.", panels: [{ title: "Queue", rows: [["Queue", "Billing"], ["Position", "3"], ["t", "09:14:10"]] }], log: "09:14:10 QUEUED Billing" },
    { stage: 3, caption: "Agent connected.", panels: [{ title: "Agent", rows: [["Agent", "Priya N."], ["Wait", "00:01:47"], ["t", "09:15:57"]] }], log: "09:15:57 CONNECTED_TO_AGENT" },
    { stage: 4, caption: "Ticket created and fields mapped.", panels: [{ title: "Ticket fields", rows: [["Ticket", "#48402", "ok"], ["Channel", "Voice (native)"], ["Intent", "billing (configured mapping)", "info"], ["Recording link", "Pending configured post-call processing", "warn"]] }], log: "09:15:58 Ticket #48402 created" },
    { stage: 5, caption: "Call completes.", panels: [{ title: "Contact", rows: [["Disconnect", "Customer"], ["Talk time", "00:06:21"], ["t", "09:22:18"]] }], log: "09:22:18 DISCONNECTED" },
    { stage: 6, caption: "After-call work.", panels: [{ title: "ACW", rows: [["Disposition", "Billing - Resolved"], ["ACW", "00:00:54"]] }, { title: "Integration events", rows: [["CRM note", "Posted (custom integration)", "info"]] }], log: "09:23:12 ACW complete" },
    { stage: 7, caption: "Configured post-call processing makes permitted records available; delivery timing varies.", panels: [{ title: "Reporting", rows: [["Zendesk reporting", "Configured ticket / call dashboard"], ["Connect CTR", "Contact record available"], ["Recording / transcript", "Only after enabled ingestion", "info"], ["Data lake", "Separate setup required", "warn"]] }], log: "Configured post-call processing (asynchronous)", status: { label: "Lifecycle complete", tone: "ok" } },
  ] }],
  boundary: ["Native: voice channel ticket, call details on ticket where supported.", "Configured: intent and custom attributes mapped to ticket fields.", "Custom: CRM events and data lake exports."],
};
