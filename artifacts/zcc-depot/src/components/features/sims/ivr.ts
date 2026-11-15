import type { SimDef, SimStep } from "./types";

const start: SimStep[] = [
  { stage: 0, caption: "The caller states the reason for calling in natural language.", panels: [{ title: "Bot", rows: [["Provider", "Amazon Lex (AWS-configured)", "info"], ["Locale", "en-US"]] }], say: { who: "Caller", text: "Where is my order? It was supposed to arrive yesterday." }, log: "Utterance captured" },
  { stage: 1, caption: "Amazon Lex classifies the intent and fills the order number slot.", panels: [{ title: "Intent", rows: [["Intent", "CheckOrderStatus", "ok"], ["Confidence", "0.91 (sample)"], ["Slot: orderNumber", "HP-77-3150"]] }], say: { who: "Bot", text: "I can help. Is the order number HP-77-3150?" }, log: "Intent CheckOrderStatus" },
];

export const ivrSim: SimDef = {
  title: "Conversational IVR order status",
  stages: ["Utterance", "Intent", "Lookup", "Outcome", "Handoff"],
  scenarioLabel: "Path",
  scenarios: [
    { id: "self", label: "Self-service", summary: "Lookup succeeds and the caller is answered without an agent.", steps: [...start,
      { stage: 2, caption: "A Lambda looks up the order in a fictional order system.", panels: [{ title: "Lookup", rows: [["Order", "HP-77-3150"], ["Status", "Out for delivery", "ok"], ["ETA", "Today by 8 pm"]] }], log: "Order lookup 200 OK" },
      { stage: 3, caption: "The bot answers and confirms the caller is done.", panels: [{ title: "Outcome", rows: [["Result", "Contained in self-service", "ok"], ["Agent needed", "No"]] }], say: { who: "Bot", text: "Your order is out for delivery and due today by 8 pm. Anything else?" }, log: "Self-service complete", status: { label: "Contained", tone: "ok" } },
    ] },
    { id: "agent", label: "Agent escalation", summary: "Caller asks for a person; context travels with the call.", steps: [...start,
      { stage: 2, caption: "The order is found but marked as a delivery exception.", panels: [{ title: "Lookup", rows: [["Order", "HP-77-3150"], ["Status", "Delivery exception", "warn"]] }], log: "Order lookup 200 OK (exception)" },
      { stage: 3, caption: "The caller asks for an agent.", panels: [{ title: "Outcome", rows: [["Result", "Escalate to agent", "warn"], ["Queue", "Orders - Exceptions"]] }], say: { who: "Caller", text: "Can I talk to someone about this?" }, log: "Escalation requested" },
      { stage: 4, caption: "Intent, slot and lookup result are passed as contact attributes for the agent.", panels: [{ title: "Context handoff", rows: [["intent", "CheckOrderStatus"], ["orderNumber", "HP-77-3150"], ["orderStatus", "Delivery exception"], ["Shown in workspace", "Via configured attribute mapping", "info"]] }], log: "Attributes handed to agent", status: { label: "With agent", tone: "info" } },
    ] },
    { id: "fail", label: "Lookup failure", summary: "The order system errors; the flow falls back to an agent with partial context.", steps: [...start,
      { stage: 2, caption: "The lookup Lambda returns an error.", panels: [{ title: "Lookup", rows: [["Order", "HP-77-3150"], ["Status", "Error 503 (simulated)", "bad"]] }], log: "Order lookup failed", status: { label: "Lookup error", tone: "bad" } },
      { stage: 3, caption: "The bot apologises and offers an agent rather than guessing.", panels: [{ title: "Outcome", rows: [["Result", "Error branch to agent", "warn"]] }], say: { who: "Bot", text: "I can't reach order details right now. Let me connect you with someone." }, log: "Error branch" },
      { stage: 4, caption: "Partial context is handed off and flagged.", panels: [{ title: "Context handoff", rows: [["intent", "CheckOrderStatus"], ["orderNumber", "HP-77-3150"], ["lookupStatus", "failed", "bad"]] }], log: "Partial context handed off", status: { label: "With agent", tone: "info" } },
    ] },
  ],
  boundary: ["Amazon Lex bot, intents and Lambda are configured in the customer's AWS account.", "This is not Zendesk AI agents for voice and should not be presented as a native Zendesk capability."],
};
