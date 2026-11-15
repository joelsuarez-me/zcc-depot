import type { SimDef, SimScenario } from "./types";

function conv(id: string, label: string, lines: [string, string][], intent: string, article: string, reply: string, summary: string): SimScenario {
  return { id, label, summary: `Sample conversation: ${label.toLowerCase()}.`, steps: [
    { stage: 0, caption: "Live transcription begins as the call connects.", panels: [{ title: "Copilot", rows: [["Transcript", "Live", "info"], ["Intent", "Listening", "muted"]] }], say: { who: "Caller", text: lines[0][1] }, log: "Live transcript started" },
    { stage: 1, caption: "Intent is detected from the conversation so far.", panels: [{ title: "Copilot", rows: [["Intent", intent, "ok"], ["Sentiment", "Neutral (sample)"]] }], say: { who: "Agent", text: lines[1][1] }, log: "Intent: " + intent },
    { stage: 2, caption: "Knowledge suggestions appear for the agent to review.", panels: [{ title: "Knowledge suggestions", rows: [["Top article", article, "info"], ["Also", "Policy overview (sample)"]] }], say: { who: "Caller", text: lines[2][1] }, log: "Knowledge suggested" },
    { stage: 3, caption: "A suggested response is offered. The agent decides whether to use it.", panels: [{ title: "Suggested response", rows: [["Draft", reply], ["Applied", "Only if the agent chooses", "warn"]] }], log: "Suggestion shown to agent" },
    { stage: 4, caption: "At call end, a summary is generated for review.", panels: [{ title: "Summary", rows: [["Summary", summary], ["Status", "Agent reviews before saving", "warn"]] }], log: "Summary drafted", status: { label: "Call ended", tone: "muted" } },
    { stage: 5, caption: "After-call work: the agent edits and saves the summary to the ticket.", panels: [{ title: "ACW", rows: [["Summary", "Saved to ticket by agent", "ok"], ["ACW time", "00:00:48 (sample)"]] }], log: "ACW complete", status: { label: "Complete", tone: "ok" } },
  ] };
}

export const assistSim: SimDef = {
  title: "Agent assist with Copilot",
  stages: ["Transcript", "Intent", "Knowledge", "Suggest", "Summary", "ACW"],
  scenarioLabel: "Sample conversation",
  scenarios: [
    conv("billing", "Billing dispute", [["c", "I was charged twice for my last order."], ["a", "I'm sorry about that, let me take a look."], ["c", "It's the order from March 3rd."]], "Duplicate charge", "Refunding a duplicate charge", "I can see the duplicate charge and will request a refund to your card.", "Customer reported a duplicate charge on 3 March order; refund requested."),
    conv("travel", "Booking change", [["c", "I need to move my reservation to next weekend."], ["a", "Happy to help with that."], ["c", "Same room type if possible."]], "Change reservation", "Changing dates on a booking", "I can move your stay to next weekend in the same room type; here is the fare difference.", "Guest asked to move booking one week later, same room type; options presented."),
    conv("tech", "Device troubleshooting", [["c", "My router keeps dropping the connection."], ["a", "Let's figure out what's happening."], ["c", "It happens every evening."]], "Connectivity issue", "Intermittent Wi-Fi troubleshooting", "Let's restart the router and check the firmware version together.", "Customer reports evening Wi-Fi drops; restart and firmware check guided."),
  ],
  boundary: ["Requires the Copilot add-on and live transcription where supported.", "Copilot suggests; it does not take autonomous actions in this demonstration. The agent approves every change."],
};
